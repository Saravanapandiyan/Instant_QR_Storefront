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

async function main() {
  console.log('Updating demo details on AppKodes Store...');
  const res = await callMcp('store_save_product', {
    fields: {
      slug: 'instant-qr-storefront',
      demoUrl: 'https://ordzo.appkodes.in/',
      demo: {
        url: 'https://ordzo.appkodes.in/',
        reset: 'every hour',
        channels: [
          {
            kind: 'web',
            title: 'Customer Storefront',
            detail: 'Live digital dining menu & contactless order placement',
            href: 'https://ordzo.appkodes.in/r/ananda-non-veg-theppakulam',
          },
          {
            kind: 'web',
            title: 'Restaurant Owner Portal',
            detail: 'Multi-branch stock availability, live orders & receipts',
            href: 'https://ordzo.appkodes.in/owner',
          },
          {
            kind: 'web',
            title: 'Super Admin Control Plane',
            detail: 'Platform administration, revenue analytics & restaurant onboarding',
            href: 'https://ordzo.appkodes.in/admin',
          },
        ],
        logins: [
          {
            role: 'Super Admin',
            username: 'admin@ordzo.com',
            password: '123456',
            url: 'https://ordzo.appkodes.in/admin',
            note: 'Platform Administrator (Full Control Plane access)',
          },
          {
            role: 'Restaurant Owner',
            username: 'owner@ordzo.com',
            password: '123456',
            url: 'https://ordzo.appkodes.in/owner',
            note: 'Restaurant Administrator (Branch & Menu Management)',
          },
          {
            role: 'Branch Staff',
            username: 'staff@ordzo.com',
            password: '123456',
            url: 'https://ordzo.appkodes.in/owner',
            note: 'Branch Operations (Live Kitchen & Cashier Terminal)',
          },
        ],
      },
    },
  });

  console.log('Update result:', JSON.stringify(res, null, 2));

  console.log('\nFetching updated product from store...');
  const product = await callMcp('store_get_product', { slug: 'instant-qr-storefront' });
  console.log('Updated product demo logins:');
  console.log(JSON.stringify(product.demo, null, 2));
}

main().catch(console.error);
