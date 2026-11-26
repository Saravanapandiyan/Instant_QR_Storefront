// Section 2: "What your guests see". Inserted right after the hero, in place of the old "Trusted by" logo strip.
(() => {
  const main = document.querySelector('main');
  if (!main) return;
  const hero = main.querySelector(':scope > section');
  const trusted = [...main.querySelectorAll(':scope > section')].find((s) => /Trusted by/i.test(s.textContent));
  if (trusted) trusted.style.display = 'none';

  // Phone screens mirror apps/customer (StorefrontPage, checkout sheet, OrderTrackingModal); brand colour = InstaDine teal.
  const veg = (v = true) => `<span class="sxa-veg ${v ? '' : 'nv'}"><i></i></span>`;
  const dish = (name, desc, price, img, opts = {}) => `
    <div class="sxa-dish${opts.sold ? ' sold' : ''}">
      <div class="sxa-dish-t">
        <div class="sxa-row">${veg(opts.veg !== false)}${opts.best ? '<span class="sxa-best">BEST SELLING</span>' : ''}</div>
        <b>${name}</b><small>${desc}</small><em>₹${price}</em>
      </div>
      <div class="sxa-img" style="background:${img}">
        ${opts.sold ? '<span class="sxa-sold">SOLD OUT</span>' : opts.qty ? `<span class="sxa-step"><i>−</i>${opts.qty}<i>+</i></span>` : '<span class="sxa-addbtn">ADD</span>'}
      </div>
    </div>`;
  const steps = (cur) => {
    const S = [['Order Placed', 'Sent to restaurant', '◷'], ['In Kitchen', 'Chef is cooking', '♨'], ['Ready', 'Ready to serve', '◫'], ['Completed', 'Enjoy your meal!', '✓']];
    return `<div class="sxa-steps">${S.map(([l, s, ic], i) => {
      const st = i < cur ? 'done' : i === cur ? 'cur' : 'up';
      return `<div class="sxa-stp ${st}"><span>${st === 'done' ? '✓' : ic}</span><b>${l}</b><small>${s}</small></div>`;
    }).join('')}</div>`;
  };
  const trackHead = `<div class="sxa-th"><div><div class="sxa-thr"><b>Order #A1042</b><span class="sxa-tag">Table 4</span></div><small>Sea Breeze Café (Beach Road)</small></div><span class="sxa-x">✕</span></div>`;
  const dishesOrdered = `<div class="sxa-lbl">DISHES ORDERED</div>
    <div class="sxa-box"><div class="sxa-li"><span><i>2x</i> Chicken Wings<small>Note: Extra spicy</small></span><b>₹480</b></div>
      <div class="sxa-li"><span><i>1x</i> Prawn Curry &amp; Rice</span><b>₹380</b></div>
      <div class="sxa-tot"><span>Total Due</span><b>₹860</b></div></div>`;
  const cash = (paid) => paid
    ? '<div class="sxa-cash paid"><span class="ic">₹</span><div><b>Payment Confirmed</b><small>Cash received by cashier. Thank you!</small></div><span class="pill">PAID</span></div>'
    : '<div class="sxa-cash"><span class="ic">₹</span><div><b>Pay Cash at Counter</b><small>Please pay ₹860 in cash or UPI at the cashier desk.</small></div><span class="pill">PENDING CASH</span></div>';
  // A QR-looking 21x21 grid (finder patterns + deterministic modules) for the table stand.
  const qrSvg = () => {
    const n = 21, cells = [];
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const finder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      if (rnd() < 0.5) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    }
    const f = (x, y) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" fill="none" stroke="#111" stroke-width="1"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    return `<svg viewBox="-1 -1 23 23" aria-hidden="true"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/><g fill="#111">${cells.join('')}${f(0, 0)}${f(n - 7, 0)}${f(0, n - 7)}</g></svg>`;
  };
  const D = `
  <section class="sx-sec" id="guest-view" aria-labelledby="sx-d-h"><div class="sx-in sx-demo">
    <div>
      <span class="sx-eyebrow">What your guests see</span>
      <h2 class="sx-h2" id="sx-d-h">A beautiful menu on every phone. Orders on your counter.</h2>
      <p class="sx-lead">Guests scan the table QR and get your menu in your brand colours, with photos, prices and live "sold out" tags. When they order, it lands in your kitchen instantly, already tagged with the table number.</p>
      <a class="sx-cta" href="/sign-up?start=menu-upload">See your menu live in 5 min →</a>
    </div>
    <div class="sx-pair" aria-hidden="true">
      <div class="sx-stand"><div class="sx-stand-card"><div class="sx-stand-top">SCAN TO ORDER</div><div class="sx-stand-qr">${qrSvg()}</div><b>Table 4</b><small>Powered by InstaDine</small></div><div class="sx-stand-base"></div></div>
      <span class="sx-noapp"><i>✓</i>No App</span>
      <div class="sx-phone"><div class="sx-screen sxa">
        <div class="sx-scr sx-s0 sxa-cam">
          <div class="sxa-cam-hint">Point at the table QR</div>
          <div class="sxa-cam-view">
            <div class="sxa-cam-card"><div class="sxa-cam-top">SCAN TO ORDER</div><div class="sxa-cam-qr">${qrSvg()}</div><b>Table 4</b></div>
            <span class="sxa-cam-c tl"></span><span class="sxa-cam-c tr"></span><span class="sxa-cam-c bl"></span><span class="sxa-cam-c br"></span>
            <span class="sxa-cam-line"></span>
          </div>
          <div class="sxa-cam-found"><img class="dot" src="assets/img/sea-breeze-logo.svg" alt="" width="34" height="34"><div><b>Sea Breeze Café</b><small>Open menu · instadine.app</small></div><span class="go">›</span></div>
          <div class="sxa-cam-shutter"><i></i></div>
        </div>
        <div class="sx-scr sx-s1">
          <div class="sxa-brand"><img class="sxa-logo" src="assets/img/sea-breeze-logo.svg" alt="" width="30" height="30"><div><b>Sea Breeze Café</b><small>Beach Road, Goa</small></div><span class="sxa-ico">⌗</span><span class="sxa-ico">≣</span></div>
          <div class="sxa-search">⌕&nbsp; Search dishes</div>
          <div class="sxa-pills"><i class="on">All</i><i>Starters</i><i>Mains</i><i>Drinks</i></div>
          <div class="sxa-sec"><b>Starters</b><small>6 dishes</small></div>
          ${dish('Chicken Wings', 'Honey glaze, ranch dip', 240, 'url(assets/img/dishes/chicken-wings.webp) center/cover', { veg: false, best: true, qty: 2 })}
          ${dish('Prawn Curry & Rice', 'Coastal spices, steamed rice', 380, 'url(assets/img/dishes/prawn-curry.webp) center/cover', { veg: false, qty: 1 })}
          ${dish('Grilled Fish Fillet', 'Today’s catch', 320, 'url(assets/img/dishes/grilled-fish.webp) center/cover', { veg: false, sold: true })}
          <div class="sxa-cartbar"><b>3 items • ₹860</b><span>View cart →</span></div>
        </div>
        <div class="sx-scr sx-s2 sxa-sheetwrap">
          <div class="sxa-sheet">
            <div class="sxa-sh"><b>Review Order</b><span class="sxa-x">✕</span></div>
            <div class="sxa-lblrow"><b>Your Dishes (3)</b><small>Tap dish to customize</small></div>
            <div class="sxa-box">
              <div class="sxa-ci">${veg(false)}<div><b>Chicken Wings</b><small>₹240 each</small><em>Note: Extra spicy</em></div><span class="sxa-stp2"><i>−</i>2<i>+</i></span><b>₹480</b></div>
              <div class="sxa-ci">${veg(false)}<div><b>Prawn Curry &amp; Rice</b><small>₹380 each</small></div><span class="sxa-stp2"><i>−</i>1<i>+</i></span><b>₹380</b></div>
            </div>
            <div class="sxa-lbl2">Payment Method</div>
            <div class="sxa-pay"><span><b>Cash on Counter</b> <i>Default</i></span><small>Pay at cashier counter</small></div>
            <div class="sxa-bill"><div><span>Subtotal</span><span>₹860</span></div><div class="tot"><span>Total Due</span><span>₹860</span></div></div>
            <div class="sxa-paybtn"><span class="a">Pay Cash on Counter • ₹860</span><span class="b"><i class="sxa-spin"></i> Placing order...</span></div>
          </div>
        </div>
        <div class="sx-scr sx-s3 sxa-track">${trackHead}${steps(0)}${cash(false)}${dishesOrdered}</div>
        <div class="sx-scr sx-s4 sxa-track">${trackHead}${steps(1)}${cash(false)}${dishesOrdered}</div>
        <div class="sx-scr sx-s5 sxa-track">${trackHead}${steps(3)}${cash(true)}${dishesOrdered}
          <div class="sxa-foot"><span>↻ Update Status</span><span class="more">Order More</span><span class="done">Done</span></div></div>
      </div></div>
    </div>
  </div></section>`;

  const wrap = document.createElement('div');
  wrap.className = 'sx-wrap';
  wrap.innerHTML = D;
  hero.after(wrap);

  // Scroll-linked reveal: each piece eases in as the section scrolls into view (and reverses on the way up).
  // [selector, start, end, dx, dy, scaleFrom] - start/end are section-progress points (0 = just entering, 1 = settled).
  const sec = wrap.querySelector('#guest-view');
  const parts = [
    ['.sx-pair .sx-phone', 0.00, 0.45, 0, 48, 0.97],
    ['.sx-pair .sx-stand', 0.10, 0.55, -60, 24, 0.96],
    ['.sx-pair .sx-noapp', 0.30, 0.65, 0, 14, 0.9],
    ['.sx-eyebrow', 0.10, 0.45, 0, 18, 1],
    ['.sx-h2', 0.15, 0.55, 0, 24, 1],
    ['.sx-lead', 0.22, 0.62, 0, 24, 1],
    ['.sx-cta', 0.30, 0.70, 0, 18, 1],
  ].map(([q, a, b, dx, dy, s0]) => ({ el: sec.querySelector(q), a, b, dx, dy, s0, last: -1 })).filter((p) => p.el);
  parts.forEach((p) => p.el.classList.add('sx-rv'));
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const update = () => {
    const r = sec.getBoundingClientRect(), vh = innerHeight;
    const prog = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));   // 0 when the section top hits the bottom edge
    for (const p of parts) {
      const k = reduce ? 1 : ease(Math.min(1, Math.max(0, (prog - p.a) / (p.b - p.a))));
      const q = Math.round(k * 1000) / 1000;
      if (q === p.last) continue;                                        // write only when it changes
      p.last = q;
      p.el.style.opacity = String(q);
      p.el.style.transform = q === 1 ? '' : `translate(${(1 - q) * p.dx}px, ${(1 - q) * p.dy}px) scale(${p.s0 + (1 - p.s0) * q})`;
    }
  };
  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
