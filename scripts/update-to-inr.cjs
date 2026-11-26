const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      count++;
    } else {
      console.warn(`[WARN] Not found in ${filePath}:`, from.substring(0, 50));
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath} (${count} replacements)`);
}

// 1. landing-preview/new-landing/index.html
replaceInFile('landing-preview/new-landing/index.html', [
  ['aria-label="Pricing: packs from $5 for 500 order credits that never expire"', 'aria-label="Pricing: packs from ₹500 for 500 order credits that never expire"'],
  ['Packs start at $5 for 500 credits that never expire', 'Packs start at ₹500 for 500 credits that never expire'],
  ['1<span style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-weight:700;margin-left:1px">¢</span> per order', '₹1 per order']
]);

// 2. landing-preview/new-landing/section-pricing.js
replaceInFile('landing-preview/new-landing/section-pricing.js', [
  ['const SUB = 49;', 'const SUB = 2999;'],
  ['<p class="pr-p">$${price}</p><p class="pr-sub">${orders.toLocaleString()} orders</p>', '<p class="pr-p">₹${price.toLocaleString(\'en-IN\')}</p><p class="pr-sub">${orders.toLocaleString(\'en-IN\')} orders</p>'],
  ['<ul><li>1¢ per order</li><li>Never expire</li></ul>', '<ul><li>₹1 per order</li><li>Never expire</li></ul>'],
  ['<h2 class="pr-h2" id="pr-h">$49 a month,<br>or 1¢ an order?</h2>', '<h2 class="pr-h2" id="pr-h">₹2,999 a month,<br>or ₹1 an order?</h2>'],
  ['<span>Your cost</span><b id="pr-us">$12<small>/mo</small></b>', '<span>Your cost</span><b id="pr-us">₹1,200<small>/mo</small></b>'],
  ['You save <b>$444</b> a year vs an example $${SUB}/mo plan', 'You save <b>₹21,588</b> a year vs an example ₹${SUB.toLocaleString(\'en-IN\')}/mo plan'],
  ['<h3>Free start</h3><p class="pr-p">$0</p><p class="pr-sub">100 orders to try it</p>', '<h3>Free start</h3><p class="pr-p">₹0</p><p class="pr-sub">100 orders to try it</p>'],
  ["${plan('Starter', 5, 500)}", "${plan('Starter', 500, 500)}"],
  ["${plan('Regular', 20, 2000, true)}", "${plan('Regular', 2000, 2000, true)}"],
  ["${plan('Busy', 50, 5000)}", "${plan('Busy', 5000, 5000)}"],
  ["${tick('Pay cash at the counter (online payments soon)')}", "${tick('Pay cash or UPI at the counter (online payments soon)')}"],
  ["const money = (n) => '$' + Math.round(n).toLocaleString();", "const money = (n) => '₹' + Math.round(n).toLocaleString('en-IN');"],
  ['const n = +range.value, us = n * 0.01, diff = (SUB - us) * 12, over = diff < 0;', 'const n = +range.value, us = n * 1, diff = (SUB - us) * 12, over = diff < 0;'],
  ['out.orders.textContent = n.toLocaleString();', "out.orders.textContent = n.toLocaleString('en-IN');"],
  ['vs an example $${SUB}/mo plan', "vs an example ₹${SUB.toLocaleString('en-IN')}/mo plan"]
]);

// 3. landing-preview/new-landing/section-guest-view.js
replaceInFile('landing-preview/new-landing/section-guest-view.js', [
  ['<b>${name}</b><small>${desc}</small><em>$${price}</em>', '<b>${name}</b><small>${desc}</small><em>₹${price}</em>'],
  ['<div class="sxa-li"><span><i>2x</i> Chicken Wings<small>Note: Extra spicy</small></span><b>$8</b></div>', '<div class="sxa-li"><span><i>2x</i> Chicken Wings<small>Note: Extra spicy</small></span><b>₹480</b></div>'],
  ['<div class="sxa-li"><span><i>1x</i> Prawn Curry &amp; Rice</span><b>$12</b></div>', '<div class="sxa-li"><span><i>1x</i> Prawn Curry &amp; Rice</span><b>₹380</b></div>'],
  ['<div class="sxa-tot"><span>Total Due</span><b>$20</b></div>', '<div class="sxa-tot"><span>Total Due</span><b>₹860</b></div>'],
  ['<span class="ic">$</span><div><b>Payment Confirmed</b>', '<span class="ic">₹</span><div><b>Payment Confirmed</b>'],
  ['<span class="ic">$</span><div><b>Pay Cash at Counter</b><small>Please pay $20 in cash at the cashier desk.</small></div>', '<span class="ic">₹</span><div><b>Pay Cash at Counter</b><small>Please pay ₹860 in cash or UPI at the cashier desk.</small></div>'],
  ["dish('Chicken Wings', 'Honey glaze, ranch dip', 4, 'url(assets/img/dishes/chicken-wings.webp) center/cover'", "dish('Chicken Wings', 'Honey glaze, ranch dip', 240, 'url(assets/img/dishes/chicken-wings.webp) center/cover'"],
  ["dish('Prawn Curry & Rice', 'Coastal spices, steamed rice', 12, 'url(assets/img/dishes/prawn-curry.webp) center/cover'", "dish('Prawn Curry & Rice', 'Coastal spices, steamed rice', 380, 'url(assets/img/dishes/prawn-curry.webp) center/cover'"],
  ["dish('Grilled Fish Fillet', 'Today’s catch', 9, 'url(assets/img/dishes/grilled-fish.webp) center/cover'", "dish('Grilled Fish Fillet', 'Today’s catch', 320, 'url(assets/img/dishes/grilled-fish.webp) center/cover'"],
  ['<div class="sxa-cartbar"><b>3 items • $20</b><span>View cart →</span></div>', '<div class="sxa-cartbar"><b>3 items • ₹860</b><span>View cart →</span></div>'],
  ['<small>$4 each</small><em>Note: Extra spicy</em></div><span class="sxa-stp2"><i>−</i>2<i>+</i></span><b>$8</b>', '<small>₹240 each</small><em>Note: Extra spicy</em></div><span class="sxa-stp2"><i>−</i>2<i>+</i></span><b>₹480</b>'],
  ['<small>$12 each</small></div><span class="sxa-stp2"><i>−</i>1<i>+</i></span><b>$12</b>', '<small>₹380 each</small></div><span class="sxa-stp2"><i>−</i>1<i>+</i></span><b>₹380</b>'],
  ['<div class="sxa-bill"><div><span>Subtotal</span><span>$20</span></div><div class="tot"><span>Total Due</span><span>$20</span></div></div>', '<div class="sxa-bill"><div><span>Subtotal</span><span>₹860</span></div><div class="tot"><span>Total Due</span><span>₹860</span></div></div>'],
  ['<div class="sxa-paybtn"><span class="a">Pay Cash on Counter • $20</span>', '<div class="sxa-paybtn"><span class="a">Pay Cash on Counter • ₹860</span>']
]);

// 4. landing-preview/new-landing/section-how-it-works.js
replaceInFile('landing-preview/new-landing/section-how-it-works.js', [
  ["${menuRow('Chicken Wings', '$4', 'c1')}${menuRow('Prawn Curry &amp; Rice', '$12', 'c2')}${menuRow('Fresh Lime Soda', '$3', 'c3')}", "${menuRow('Chicken Wings', '₹240', 'c1')}${menuRow('Prawn Curry &amp; Rice', '₹380', 'c2')}${menuRow('Fresh Lime Soda', '₹80', 'c3')}"],
  ['<div class="hw-ol"><span>2x Chicken Wings</span><b>$8</b></div>', '<div class="hw-ol"><span>2x Chicken Wings</span><b>₹480</b></div>'],
  ['<div class="hw-ol"><span>1x Prawn Curry &amp; Rice</span><b>$12</b></div>', '<div class="hw-ol"><span>1x Prawn Curry &amp; Rice</span><b>₹380</b></div>'],
  ['<div class="hw-of"><span class="hw-cash">Cash Pending</span><b>Total Bill $20</b></div>', '<div class="hw-of"><span class="hw-cash">Cash Pending</span><b>Total Bill ₹860</b></div>']
]);

// 5. landing-preview/new-landing/section-secure.js
replaceInFile('landing-preview/new-landing/section-secure.js', [
  ["['Rejected orders cost $0', 'Only confirmed orders use a credit.']", "['Rejected orders cost ₹0', 'Only confirmed orders use a credit.']"]
]);

// 6. landing-preview/new-landing/section-faq.js
replaceInFile('landing-preview/new-landing/section-faq.js', [
  ['Packs start at $5 for 500 orders and credits never expire.', 'Packs start at ₹500 for 500 orders and credits never expire.'],
  ['Guests pay at the counter today. Card and wallet payments in the app are coming soon.', 'Guests pay at the counter today via cash or UPI. In-app UPI and card payments are coming soon.']
]);

console.log('Done updating landing-preview files!');
