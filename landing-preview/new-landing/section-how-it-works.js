// Section 3: "Live in 5 minutes" — the owner's setup in three steps, inserted after the Guest view section.
// Step 2/3 mini-UIs mirror apps/owner (Storefront QR Studio, Live Orders). Step 1 (AI menu import) is designed in the same style.
(() => {
  const anchor = document.querySelector('.sx-wrap');
  if (!anchor) return;

  // small QR-looking SVG (finder patterns + seeded modules), teal like the QR Studio default theme
  const qr = (seed) => {
    const n = 17, out = [];
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const fz = (x, y) => (x < 6 && y < 6) || (x > n - 7 && y < 6) || (x < 6 && y > n - 7);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fz(x, y) && rnd() < 0.48) out.push(`M${x} ${y}h1v1h-1z`);
    const f = (x, y) => `<rect x="${x + .5}" y="${y + .5}" width="4" height="4" fill="none" stroke="#0F766E"/><rect x="${x + 1.5}" y="${y + 1.5}" width="2" height="2" fill="#0F766E"/>`;
    return `<svg viewBox="0 0 ${n} ${n}"><path fill="#0F766E" d="${out.join('')}"/>${f(0, 0)}${f(n - 5, 0)}${f(0, n - 5)}</svg>`;
  };
  const menuRow = (name, price, cls) => `<div class="hw-chip ${cls}"><span>${name}</span><b>${price}</b></div>`;
  const html = `
  <section class="hw" id="how-it-works" aria-labelledby="hw-h">
    <div class="hw-in">
      <div class="hw-head">
        <span class="hw-eyebrow">How it works</span>
        <h2 class="hw-h2" id="hw-h">Live in 5 minutes.<br>No training, no hardware.</h2>
        <p class="hw-lead">Three steps from a paper menu to orders on your counter. Most restaurants are taking QR orders the same day.</p>
      </div>
      <div class="hw-track" aria-hidden="true"><span class="hw-fill"></span></div>
      <ol class="hw-steps">
        <li class="hw-step">
          <div class="hw-top"><span class="hw-n">1</span><span class="hw-time">~2 min</span></div>
          <h3>Snap your menu</h3>
          <p>Upload a photo or PDF of your menu. AI reads it and builds your digital menu with categories and prices.</p>
          <div class="hw-art hw-a1" aria-hidden="true">
            <div class="hw-paper"><i class="w60"></i><i class="w80"></i><i class="w70"></i><i class="w50"></i><i class="w80"></i><i class="w60"></i><span class="hw-scan"></span></div>
            <div class="hw-out">
              <div class="hw-out-h"><span>✦ AI menu import</span><b>3 dishes found</b></div>
              ${menuRow('Chicken Wings', '$4', 'c1')}${menuRow('Prawn Curry &amp; Rice', '$12', 'c2')}${menuRow('Fresh Lime Soda', '$3', 'c3')}
            </div>
          </div>
        </li>
        <li class="hw-step">
          <div class="hw-top"><span class="hw-n">2</span><span class="hw-time">~2 min</span></div>
          <h3>Print your table QRs</h3>
          <p>Every table gets its own QR in your colours, with your logo in the centre. Print it as a table stand or sticker.</p>
          <div class="hw-art hw-a2" aria-hidden="true">
            <div class="hw-studio-h"><b>Storefront QR Studio</b><span>Tables 1–12</span></div>
            <div class="hw-studio">
              <div class="hw-opts"><small>Color Theme</small><div class="hw-dots"><i style="background:#0F766E"></i><i style="background:#E8735A"></i><i style="background:#18181b"></i></div>
                <small>Center Emblem</small><div class="hw-emb"><img src="assets/img/sea-breeze-logo.svg" alt="" width="20" height="20"> Your logo</div>
                <small>Table Stand Format</small><div class="hw-fmt">Tent card · A6</div></div>
              <div class="hw-qrs">${[1, 2, 3, 4, 5, 6].map((n) => `<div class="hw-qr q${n}">${qr(n * 37 + 11)}<b>T${n}</b></div>`).join('')}</div>
            </div>
            <div class="hw-dl"><span>Image (.PNG)</span><span class="on">Download all ↓</span></div>
          </div>
        </li>
        <li class="hw-step">
          <div class="hw-top"><span class="hw-n">3</span><span class="hw-time">instant</span></div>
          <h3>Orders reach your counter</h3>
          <p>Every order lands on your Live Orders screen with the table number. Accept it, cook, serve. That's it.</p>
          <div class="hw-art hw-a3" aria-hidden="true">
            <div class="hw-lo-h"><b>Live Orders</b><span class="hw-live">● Live</span></div>
            <div class="hw-tabs"><span class="t-new">New <i>1</i></span><span class="t-kit">Kitchen</span><span>Ready</span></div>
            <div class="hw-order">
              <div class="hw-oh"><b>Order #A1042</b><span>Table 4</span></div>
              <div class="hw-ol"><span>2x Chicken Wings</span><b>$8</b></div>
              <div class="hw-note">Customer Note: Extra spicy</div>
              <div class="hw-ol"><span>1x Prawn Curry &amp; Rice</span><b>$12</b></div>
              <div class="hw-of"><span class="hw-cash">Cash Pending</span><b>Total Bill $20</b></div>
              <div class="hw-btn"><span class="a">Accept Order</span><span class="b">✓ Sent to Kitchen</span></div>
            </div>
          </div>
        </li>
      </ol>
      <div class="hw-cta"><a href="/sign-up?start=menu-upload">Upload your menu, live in 5 min →</a><span>100 free orders · no card needed</span></div>
    </div>
  </section>`;
  anchor.insertAdjacentHTML('afterend', html);

  // scroll-linked: progress line fills and steps rise in one after another
  const sec = document.getElementById('how-it-works');
  const fill = sec.querySelector('.hw-fill');
  const steps = [...sec.querySelectorAll('.hw-step')];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = -1, queued = false;
  const update = () => {
    const r = sec.getBoundingClientRect(), vh = innerHeight;
    const p = reduce ? 1 : Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9)));
    const q = Math.round(p * 1000) / 1000;
    if (q === last) return;
    last = q;
    fill.style.transform = `scaleX(${Math.min(1, Math.max(0, (q - 0.25) / 0.6))})`;
    steps.forEach((s, i) => {
      const k = reduce ? 1 : Math.min(1, Math.max(0, (q - 0.18 - i * 0.12) / 0.3));
      const e = 1 - Math.pow(1 - k, 3);
      s.style.opacity = String(e);
      s.style.transform = e === 1 ? '' : `translateY(${(1 - e) * 36}px)`;
    });
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
