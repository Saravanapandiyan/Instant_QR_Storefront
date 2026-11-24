import { execSync } from 'child_process';
import path from 'path';

const TOKEN = 'djixcck9CvalbX2iG1yg+wqggPta/o8dVH8thtRPIt2AbXAKhl9Oacfn5N1P4xPj';
const STORE_MCP_URL = 'https://store.appkodes.com/api/store-mcp';

async function callMcp(name, args) {
  const res = await fetch(STORE_MCP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name, arguments: args },
      id: Date.now(),
    }),
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  const text = json.result.content[0].text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function uploadFile(filePath) {
  console.log(`Requesting upload URL for ${filePath}...`);
  const req = await callMcp('store_request_image_upload', {
    contentType: 'image/png',
    path: filePath,
  });

  console.log(`Executing upload curl for ${filePath}...`);
  // Run curl command and capture stdout JSON
  const output = execSync(req.curl, { encoding: 'utf8' });
  const parsed = JSON.parse(output.trim());
  console.log(`Uploaded! Public URL: ${parsed.url}`);
  return parsed.url;
}

async function main() {
  console.log('=== Uploading Store Listing Images ===');

  // 1. Hero Thumbnail
  const thumbnailUrl = await uploadFile('screens/thumbnail_hero.png');

  // 2. App Icon
  const iconUrl = await uploadFile('screens/app_icon.png');

  // 3. Screenshots
  const screens = [
    {
      file: 'screens/01_customer_storefront_menu.png',
      caption: 'Customer Storefront - Live Dining Menu & Food Categories',
      side: 'User side',
    },
    {
      file: 'screens/02_customer_landing_qr.png',
      caption: 'Instant Table QR Code Scanning & Dine-in Entry',
      side: 'User side',
    },
    {
      file: 'screens/03_owner_dashboard.png',
      caption: 'Restaurant Owner Dashboard - Sales & Revenue Analytics',
      side: 'Admin side',
    },
    {
      file: 'screens/04_owner_orders.png',
      caption: 'Live Dine-In Orders & Kitchen Dispatch Console',
      side: 'Admin side',
    },
    {
      file: 'screens/05_owner_restaurants.png',
      caption: 'Multi-Branch Catalog, Pricing & Stock Management',
      side: 'Admin side',
    },
    {
      file: 'screens/06_admin_portal.png',
      caption: 'Platform Administration & Multi-Tenant Restaurant Overview',
      side: 'Admin side',
    },
  ];

  const screenshotsPayload = [];
  for (const s of screens) {
    const url = await uploadFile(s.file);
    screenshotsPayload.push({
      src: url,
      caption: s.caption,
      side: s.side,
    });
  }

  console.log('\n=== Updating Product on AppKodes Store ===');
  const updateRes = await callMcp('store_save_product', {
    fields: {
      slug: 'instant-qr-storefront',
      name: 'OrdZo',
      tagline: 'In-Store Multi-Restaurant QR Ordering & Digital Storefront Platform',
      summary: 'OrdZo is a comprehensive, mobile-first in-store digital dining and ordering solution. Diners scan table QR codes to browse branded live digital menus, customize dishes, and place orders with instant status tracking, while restaurant owners manage multi-branch menus, inventory, staff, and payments in real time.',
      thumbnail: thumbnailUrl,
      icon: iconUrl,
      screenshots: screenshotsPayload,
    },
  });

  console.log('Update result:', updateRes);
  console.log('🎉 Successfully attached thumbnail, icon, screenshots, and updated name to OrdZo on AppKodes Store!');
}

main().catch((err) => {
  console.error('Failed to upload images:', err);
  process.exit(1);
});
