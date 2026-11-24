#!/usr/bin/env bash
# AppKodes Store: Unattended setup script for OrdZo
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "=== Setting up OrdZo in $APP_DIR ==="

# 1. Ensure Node.js (v20+), Corepack and pnpm are installed
if ! command -v node >/dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
  echo "Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

corepack enable 2>/dev/null || true
corepack prepare pnpm@latest --activate 2>/dev/null || npm install -g pnpm

# 2. Ensure PostgreSQL is installed locally if not already installed
if ! command -v psql >/dev/null; then
  echo "Installing PostgreSQL..."
  apt-get update -y && apt-get install -y postgresql postgresql-contrib
  systemctl start postgresql
  systemctl enable postgresql
fi

# 3. Create database and user if not exists
DB_NAME="${DB_NAME:-instant_qr_db}"
DB_USER="${DB_USER:-qr_admin}"
DB_PASS="${DB_PASS:-$(openssl rand -hex 16 2>/dev/null || head -c 16 /dev/urandom | xxd -p)}"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASS}'; ALTER USER ${DB_USER} CREATEDB;"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

# 4. Generate apps/api/.env if missing
if [ ! -f "apps/api/.env" ]; then
  echo "Creating apps/api/.env from template..."
  JWT_SECRET="$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p)"
  
  cat <<EOF > apps/api/.env
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
PORT=3000
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="7d"
LICENSE_KEY="${LICENCE:-}"
APP_DOMAIN="${DOMAIN:-ordzo.appkodes.in}"
STORE_API_URL="https://store.appkodes.com"
EOF
fi

# 5. Install dependencies and build
echo "Installing project dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo "Running database schema migrations..."
pnpm --filter api exec prisma db push

echo "Building applications..."
pnpm build:all

# 6. Seed demo catalog if database is fresh
if [ -f "apps/api/prisma/instant_qr_db.sql" ]; then
  echo "Checking database catalog..."
  PROD_COUNT=$(PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT count(*) FROM products;" 2>/dev/null || echo 0)
  if [ "${PROD_COUNT:-0}" -eq 0 ] 2>/dev/null; then
    echo "Importing complete OrdZo demo catalog (117 dishes, 20 categories, 4 branches)..."
    PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" < apps/api/prisma/instant_qr_db.sql 2>/dev/null || true
  fi
fi

# 7. Start API via PM2 process manager
if command -v npm >/dev/null; then
  if ! command -v pm2 >/dev/null; then
    npm install -g pm2
  fi
  pm2 delete ordzo-api 2>/dev/null || true
  if [ -f "apps/api/dist/src/main.js" ]; then
    pm2 start apps/api/dist/src/main.js --name "ordzo-api"
  elif [ -f "apps/api/dist/main.js" ]; then
    pm2 start apps/api/dist/main.js --name "ordzo-api"
  fi
  pm2 save 2>/dev/null || true
fi

# 8. Configure Nginx virtual host if nginx is installed
if command -v nginx >/dev/null; then
  echo "Configuring Nginx reverse proxy..."
  NGINX_CONF="/etc/nginx/sites-available/ordzo.conf"
  DOMAIN_NAME="${DOMAIN:-ordzo.appkodes.in}"
  cat <<NGINX_EOF > "$NGINX_CONF"
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    # Customer Storefront (Root)
    location / {
        root ${APP_DIR}/apps/customer/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Restaurant Owner Portal
    location /owner {
        alias ${APP_DIR}/apps/owner/dist;
        try_files \$uri \$uri/ /owner/index.html;
    }

    # Admin Control Plane
    location /admin {
        alias ${APP_DIR}/apps/admin/dist;
        try_files \$uri \$uri/ /admin/index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static Media Proxy
    location /uploads {
        proxy_pass http://127.0.0.1:3000/uploads;
    }
}
NGINX_EOF
  mkdir -p /etc/nginx/sites-enabled
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/ordzo.conf
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
fi

echo "Setup completed successfully."
