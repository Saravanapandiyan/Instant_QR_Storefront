import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.resolve('screens');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });

    // 1. Fetch Owner Auth Token
    console.log('Authenticating owner...');
    let authData = null;
    try {
      const authRes = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@yopmail.com', password: 'Password123!' }),
      });
      authData = await authRes.json();
    } catch (e) {
      console.warn('Could not auto-login owner:', e.message);
    }

    // 2. Customer Storefront Menu (1600x1000)
    console.log('Capturing: 01_customer_storefront_menu.png...');
    await page.goto('http://localhost:5174/r/ananda-non-veg-theppakulam', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, '01_customer_storefront_menu.png'), type: 'png' });

    // 3. Customer Landing Page (1600x1000)
    console.log('Capturing: 02_customer_landing_qr.png...');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, '02_customer_landing_qr.png'), type: 'png' });

    // 4. Restaurant Owner Dashboard (1600x1000)
    console.log('Capturing: 03_owner_dashboard.png...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 30000 });
    if (authData && authData.accessToken) {
      await page.evaluate((auth) => {
        const payload = {
          state: {
            user: auth.user,
            token: auth.accessToken,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem('instant-qr-owner-auth', JSON.stringify(payload));
        localStorage.setItem('activeRestaurantId', 'c7093d5d-30fc-45b9-97a3-06087377d576');
        localStorage.setItem('activeBranchId', 'de8718fe-8eed-4c2a-9731-719126c65a46');
      }, authData);
      await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, '03_owner_dashboard.png'), type: 'png' });

      // 5. Owner Orders Page (1600x1000)
      console.log('Capturing: 04_owner_orders.png...');
      await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, '04_owner_orders.png'), type: 'png' });

      // 6. Owner Restaurants / Menu Management (1600x1000)
      console.log('Capturing: 05_owner_restaurants.png...');
      await page.goto('http://localhost:5173/restaurants', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, '05_owner_restaurants.png'), type: 'png' });
    }

    // 7. Platform Admin Portal (1600x1000)
    console.log('Capturing: 06_admin_portal.png...');
    let adminAuthData = null;
    try {
      const adminAuthRes = await fetch('http://localhost:3000/api/v1/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@instantqr.io', password: 'Admin@123' }),
      });
      adminAuthData = await adminAuthRes.json();
    } catch (e) {
      console.warn('Could not auto-login super admin:', e.message);
    }

    await page.goto('http://localhost:5175/login', { waitUntil: 'networkidle2', timeout: 30000 });
    if (adminAuthData && adminAuthData.accessToken) {
      await page.evaluate((auth) => {
        const payload = {
          state: {
            user: auth.user,
            token: auth.accessToken,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem('instant-qr-admin-auth', JSON.stringify(payload));
      }, adminAuthData);
      await page.goto('http://localhost:5175/', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
    }
    await page.screenshot({ path: path.join(OUT_DIR, '06_admin_portal.png'), type: 'png' });

    // 8. 16:9 Hero Thumbnail (1600x900)
    console.log('Capturing: thumbnail_hero.png (16:9)...');
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
    await page.goto('http://localhost:5174/r/ananda-non-veg-theppakulam', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, 'thumbnail_hero.png'), type: 'png' });

    // 9. Square Icon (512x512)
    console.log('Copying high-resolution app_icon.png (512x512)...');
    fs.copyFileSync(path.resolve('apps/customer/public/icons/pwa-512x512.png'), path.join(OUT_DIR, 'app_icon.png'));

    console.log('✅ All screenshots and thumbnail successfully captured in screens/!');
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Error during screen capture:', err);
  process.exit(1);
});
