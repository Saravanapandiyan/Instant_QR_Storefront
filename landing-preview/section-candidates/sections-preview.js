// Section 2 candidates (A-D) with a review switcher. Inserted right after the hero, replacing the
// "Trusted by" logo strip while reviewing. Delete this file (and its CSS) once a section is chosen.
(() => {
  const main = document.querySelector('main');
  if (!main) return;
  const hero = main.querySelector(':scope > section');
  const trusted = [...main.querySelectorAll(':scope > section')].find((s) => /Trusted by/i.test(s.textContent));
  if (trusted) trusted.style.display = 'none';

  const qr = (x, y, s = 1, c = '#0c0c09') =>
    `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><rect width="22" height="22" rx="3" fill="none" stroke="${c}" stroke-width="4"/><rect x="7" y="7" width="8" height="8" rx="1.5"/>` +
    `<rect x="34" width="22" height="22" rx="3" fill="none" stroke="${c}" stroke-width="4"/><rect x="41" y="7" width="8" height="8" rx="1.5"/>` +
    `<rect y="34" width="22" height="22" rx="3" fill="none" stroke="${c}" stroke-width="4"/><rect x="7" y="41" width="8" height="8" rx="1.5"/>` +
    `<rect x="34" y="34" width="7" height="7" rx="1"/><rect x="45" y="34" width="11" height="7" rx="1"/><rect x="34" y="45" width="11" height="11" rx="1"/><rect x="49" y="49" width="7" height="7" rx="1"/></g>`;

  const A = `
  <section class="sx-sec" data-v="A" aria-labelledby="sx-a-h"><div class="sx-in">
    <span class="sx-eyebrow">How it works</span>
    <h2 class="sx-h2" id="sx-a-h">Live in 5 minutes. Three steps, no training.</h2>
    <p class="sx-lead">Snap your menu, print your table QRs, and start taking orders the same day. No app for guests to install and no extra hardware for you.</p>
    <div class="sx-steps">
      <div class="sx-step"><span class="sx-step-n"></span><span class="sx-step-time">~2 min</span>
        <h3>Snap your menu</h3><p>Upload a photo or PDF. AI reads it and builds your digital menu with categories and prices.</p>
        <div class="sx-step-art"><svg width="220" height="150" viewBox="0 0 220 150" fill="none"><rect x="50" y="10" width="120" height="130" rx="10" fill="#F6F3EC" stroke="#e7e3da"/>
          <rect x="66" y="28" width="60" height="8" rx="4" fill="#0c0c09"/><rect x="66" y="48" width="88" height="6" rx="3" fill="#cfc9bb"/><rect x="66" y="62" width="70" height="6" rx="3" fill="#cfc9bb"/><rect x="66" y="82" width="88" height="6" rx="3" fill="#cfc9bb"/><rect x="66" y="96" width="60" height="6" rx="3" fill="#cfc9bb"/><rect x="66" y="110" width="80" height="6" rx="3" fill="#cfc9bb"/>
          <rect class="sx-scan-line" x="56" y="36" width="108" height="3" rx="1.5" fill="#14B8A6"/><path d="M44 30V18a6 6 0 016-6h12M176 30V18a6 6 0 00-6-6h-12M44 120v12a6 6 0 006 6h12M176 120v12a6 6 0 01-6 6h-12" stroke="#0F766E" stroke-width="4" stroke-linecap="round"/></svg></div></div>
      <div class="sx-step"><span class="sx-step-n"></span><span class="sx-step-time">~2 min</span>
        <h3>Print your table QRs</h3><p>Every table gets its own QR in your brand colours, ready to print as table stands or stickers.</p>
        <div class="sx-step-art"><svg width="220" height="150" viewBox="0 0 220 150" fill="none"><path d="M70 130L84 30h52l14 100z" fill="#F6F3EC" stroke="#e7e3da" stroke-width="2"/>
          ${qr(82, 46, 1, '#0F766E')}<rect x="88" y="112" width="44" height="6" rx="3" fill="#0c0c09"/><rect x="60" y="130" width="100" height="8" rx="4" fill="#c99a62"/></svg></div></div>
      <div class="sx-step"><span class="sx-step-n"></span><span class="sx-step-time">instant</span>
        <h3>Orders hit your kitchen</h3><p>Guests scan and order from their phone. Your kitchen is notified the moment an order is placed.</p>
        <div class="sx-step-art"><svg width="220" height="150" viewBox="0 0 220 150" fill="none"><circle class="sx-ring" cx="110" cy="70" r="40" stroke="#14B8A6" stroke-width="4"/>
          <circle cx="110" cy="70" r="32" fill="#0F766E"/><path d="M96 80h28l-4-6V64a10 10 0 00-20 0v10z" fill="#fff"/><circle cx="110" cy="85" r="3.5" fill="#fff"/>
          <rect x="62" y="118" width="96" height="22" rx="11" fill="#E6F4F1"/><text x="110" y="133" text-anchor="middle" font-size="12" font-weight="700" fill="#0F766E" font-family="inherit">New order · Table 4</text></svg></div></div>
    </div>
    <a class="sx-cta" href="/sign-up?start=menu-upload">Upload your menu →</a>
  </div></section>`;

  const chaos = [
    ['Where is the waiter?', 'Table 7 · 8 min', '-120px,-60px', '-6deg', '120px,60px', 'left:8%;top:12%'],
    ['Wrong order', 'Paneer, not chicken', '80px,-80px', '5deg', '-90px,70px', 'right:8%;top:16%', 'red'],
    ['Sticky paper menu', 'Prices crossed out', '-100px,40px', '4deg', '110px,-30px', 'left:6%;top:44%'],
    ['Missed order', 'Table 3 forgot to tell', '120px,30px', '-5deg', '-120px,-20px', 'right:6%;top:46%', 'red'],
    ['Bill mix-up', 'Table 2 got Table 5’s bill', '-60px,90px', '3deg', '60px,-90px', 'left:22%;bottom:10%'],
  ].map(([t, s, xy0, r, cxy, pos, cls]) => {
    const [x0, y0] = xy0.split(','), [cx, cy] = cxy.split(',');
    return `<div class="sx-chaos ${cls || ''}" style="${pos};--x0:${x0};--y0:${y0};--r:${r};--cx:${cx};--cy:${cy}">${t}<small>${s}</small></div>`;
  }).join('');
  const B = `
  <section class="sx-sec" data-v="B" aria-labelledby="sx-b-h"><div class="sx-in sx-why">
    <div>
      <span class="sx-eyebrow">Why InstaDine</span>
      <h2 class="sx-h2" id="sx-b-h">Your guests are waiting. Your waiter is running.</h2>
      <p class="sx-lead">Small restaurants lose time and orders to the same problems every day. One QR on each table fixes all of them.</p>
      <ul>
        <li><span><b>Guests order the moment they sit.</b> No waving, no waiting for a menu.</span></li>
        <li><span><b>Orders go straight to the kitchen.</b> Nothing lost between table and counter.</span></li>
        <li><span><b>Every order is tied to its table.</b> No more bill mix-ups.</span></li>
        <li><span><b>Change prices or mark dishes sold out instantly.</b> No reprinting menus.</span></li>
      </ul>
    </div>
    <div class="sx-stage" aria-hidden="true">${chaos}
      <div class="sx-calm"><svg width="84" height="84" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0F766E"/>${qr(10, 10, .78, '#fff')}</svg>
        <strong>One QR per table</strong><span>Scan, order, done.</span><span class="sx-ok">✓ Order sent to kitchen</span></div>
    </div>
  </div></section>`;

  const C = `
  <section class="sx-sec sx-price" data-v="C" aria-labelledby="sx-c-h"><div class="sx-in">
    <span class="sx-eyebrow">Pricing that fits small restaurants</span>
    <h2 class="sx-h2" id="sx-c-h">$49 a month, or 1¢ an order?</h2>
    <p class="sx-lead">Most ordering systems charge a fixed monthly fee whether you sell 5 orders or 500. With InstaDine you only pay for confirmed orders.</p>
    <div class="sx-cmp">
      <div class="sx-card them"><h4>Typical POS / ordering subscription</h4><div class="sx-big">$49<small> / month</small></div>
        <ul><li>Same price on slow days and off-season</li><li>Premium features locked behind higher tiers</li><li>Long contracts and setup fees</li></ul></div>
      <div class="sx-card us"><h4>InstaDine prepaid credits</h4><div class="sx-big"><span data-sx-cost>$13</span><small> / month</small></div>
        <ul><li>1 confirmed order = 1 credit, from 0.4¢ to 1¢</li><li>Fake or abandoned orders cost nothing</li><li>Credits never expire, every feature included</li></ul></div>
    </div>
    <div class="sx-slider"><label for="sx-orders">Your orders per day</label><input id="sx-orders" type="range" min="10" max="300" step="5" value="70"><output for="sx-orders" data-sx-out>70 orders / day</output></div>
    <p class="sx-save">You save about <b data-sx-save>$36</b> every month (Pro pack, 0.6¢ per order).</p>
    <a class="sx-cta" href="/sign-up">Claim 100 free orders →</a>
  </div></section>`;

  const item = (name, desc, price, color, sold) =>
    `<div class="sx-item${sold ? ' sold' : ''}"><span class="sx-thumb" style="background:${color}"></span><div><b>${name}${sold ? '<span class="sx-tag">Sold out</span>' : ''}</b><span>${desc} · ${price}</span></div><span class="sx-add">${sold ? '–' : '+'}</span></div>`;
  const D = `
  <section class="sx-sec" data-v="D" aria-labelledby="sx-d-h"><div class="sx-in sx-demo">
    <div>
      <span class="sx-eyebrow">What your guests see</span>
      <h2 class="sx-h2" id="sx-d-h">A beautiful menu on every phone. Orders on your counter.</h2>
      <p class="sx-lead">Guests scan the table QR and get your menu in your brand colours, with photos, prices and live "sold out" tags. When they order, it lands in your kitchen instantly, already tagged with the table number.</p>
      <a class="sx-cta" href="/sign-up?start=menu-upload">See your menu live in 5 min →</a>
    </div>
    <div class="sx-pair" aria-hidden="true">
      <div class="sx-phone"><div class="sx-screen">
        <div class="sx-bar"><b>Sea Breeze Café</b><span>Table 4 · Scan to order</span></div>
        <div class="sx-tabs"><i class="on">Starters</i><i>Mains</i><i>Drinks</i></div>
        ${item('Masala Fries', 'Crispy, spicy', '$4', 'linear-gradient(135deg,#f4c27a,#d98a3a)')}
        ${item('Grilled Prawns', 'Garlic butter', '$12', 'linear-gradient(135deg,#f6a58a,#d9533b)')}
        ${item('Fresh Lime Soda', 'Sweet or salted', '$3', 'linear-gradient(135deg,#c9f2d9,#6cc48f)')}
        ${item('Fish Tacos', 'Today’s catch', '$9', 'linear-gradient(135deg,#e9d8b4,#b9945c)', true)}
        <div class="sx-cart"><span>2 items · $16</span><span>Place order →</span></div>
      </div></div>
      <div class="sx-ticket"><div class="hd"><b>Table 4</b><span>just now</span></div><span class="new">NEW ORDER</span>
        <ol><li>Masala Fries</li><li>Grilled Prawns</li></ol><div class="ft"><span>Accept</span><b>$16.00</b></div></div>
    </div>
  </div></section>`;

  const wrap = document.createElement('div');
  wrap.className = 'sx-wrap';
  wrap.innerHTML = A + B + C + D;
  hero.after(wrap);

  // C: live savings calculator (Pro pack 0.6c/order vs a $49 subscription, 30-day month)
  const range = wrap.querySelector('#sx-orders');
  const calc = () => {
    const n = +range.value, cost = Math.round(n * 30 * 0.006);
    wrap.querySelector('[data-sx-out]').textContent = `${n} orders / day`;
    wrap.querySelector('[data-sx-cost]').textContent = `$${cost}`;
    const save = 49 - cost;
    wrap.querySelector('[data-sx-save]').textContent = save > 0 ? `$${save}` : '$0';
  };
  range.addEventListener('input', calc); calc();

  // review switcher
  const names = { A: 'How it works', B: 'Why InstaDine', C: '1¢ vs subscription', D: 'Guest view' };
  const sw = document.createElement('div');
  sw.className = 'sx-switch'; sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', 'Preview section 2');
  sw.innerHTML = '<span>Section 2</span>' + Object.keys(names).map((k) => `<button type="button" data-k="${k}" title="${names[k]}">${k} · ${names[k]}</button>`).join('');
  document.body.appendChild(sw);
  const show = (k, scroll) => {
    wrap.querySelectorAll('.sx-sec').forEach((s) => s.classList.toggle('is-on', s.dataset.v === k));
    sw.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
    try { localStorage.setItem('sx-variant', k); } catch {}
    if (scroll) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  sw.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(b.dataset.k, true); });
  let k0 = 'B'; try { k0 = localStorage.getItem('sx-variant') || 'B'; } catch {}
  show(names[k0] ? k0 : 'B', false);
})();
