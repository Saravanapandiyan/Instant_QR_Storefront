// Section 5: "Everything a small restaurant needs." — bento grid of real apps/owner features. Inserted after Pricing.
(() => {
  const anchor = document.getElementById('pricing') || document.getElementById('how-it-works');
  if (!anchor) return;

  const img = (f) => `assets/img/dishes/${f}.webp`;
  const tile = (cls, title, text, art) => `
        <article class="ft-tile ${cls}">
          <div class="ft-art" aria-hidden="true">${art}</div>
          <h3>${title}</h3>
          <p>${text}</p>
        </article>`;

  // 1 · Live orders: a ticket travels New -> Kitchen -> Ready
  const tk = (id, t, items) => `<div class="ft-tk"><div><b>#${id}</b><span>${t}</span></div><small>${items}</small></div>`;
  const orders = `
    <div class="ft-kb">
      <div class="ft-col"><h4>New <i>1</i></h4>${tk('A1043', 'Table 2', '1x Fresh Lime Soda')}</div>
      <div class="ft-col"><h4>Kitchen</h4>${tk('A1040', 'Table 7', '2x Prawn Curry &amp; Rice')}</div>
      <div class="ft-col"><h4>Ready</h4>${tk('A1038', 'Table 1', '1x Grilled Fish Fillet')}</div>
      <div class="ft-move">${tk('A1042', 'Table 4', '2x Chicken Wings')}</div>
    </div>`;

  // 2 · Menu: availability toggles, one dish flips to sold out
  const dish = (f, n, p, extra = '') => `<div class="ft-dish ${extra}"><img src="${img(f)}" alt="" width="40" height="40" loading="lazy"><div><b>${n}</b><span>${p}</span></div><em class="ft-so">Sold out</em><span class="ft-sw"><i></i></span></div>`;
  const menu = `
    <div class="ft-menu">
      ${dish('chicken-wings', 'Chicken Wings <u>BEST SELLING</u>', '$4')}
      ${dish('grilled-fish', 'Grilled Fish Fillet', '$9', 'is-flip')}
      ${dish('prawn-curry', 'Prawn Curry &amp; Rice', '$12')}
    </div>`;

  // 3 · Theme: storefront header cycles through presets
  const theme = `
    <div class="ft-th">
      <div class="ft-th-ph"><div class="ft-th-hd"><img src="assets/img/sea-breeze-logo.svg" alt="" width="22" height="22"><b>Sea Breeze Café</b></div>
        <div class="ft-th-pills"><i></i><i></i><i></i></div><div class="ft-th-row"></div><div class="ft-th-row"></div><div class="ft-th-cta"></div></div>
      <div class="ft-th-sw"><i></i><i></i><i></i><i></i></div>
    </div>`;

  // 4 · Payments: cash live, online coming soon
  const pay = `
    <div class="ft-pay">
      <div class="ft-pay-row is-on"><span class="ft-pay-ic">$</span><div><b>Cash on Counter</b><small>Staff confirms, order goes to kitchen</small></div><span class="ft-on">On</span></div>
      <div class="ft-pay-row"><span class="ft-pay-ic">▭</span><div><b>Card &amp; wallets</b><small>Online payments</small></div><span class="ft-soon">Coming soon</span></div>
    </div>`;

  // 5 · Staff roles
  const st = (ini, n, role, cls) => `<div class="ft-st"><span class="ft-av ${cls}">${ini}</span><b>${n}</b><span class="ft-role ${cls}">${role}</span></div>`;
  const staff = `<div class="ft-staff">${st('M', 'Front desk', 'Manager', 'r-m')}${st('C', 'Counter', 'Cashier', 'r-c')}${st('K', 'Kitchen', 'Kitchen', 'r-k')}</div>`;

  // 6 · Branches: dish x outlet stock matrix
  const cell = (on, flip) => `<td><span class="ft-dot${on ? ' is-on' : ''}${flip ? ' is-flip' : ''}"></span></td>`;
  const branches = `
    <table class="ft-mx">
      <thead><tr><th></th><th>Beach Road</th><th>Old Town</th><th>Marina</th></tr></thead>
      <tbody>
        <tr><th>Chicken Wings</th>${cell(1)}${cell(1)}${cell(1)}</tr>
        <tr><th>Grilled Fish Fillet</th>${cell(1)}${cell(1, 1)}${cell(0)}</tr>
        <tr><th>Prawn Curry &amp; Rice</th>${cell(1)}${cell(1)}${cell(1)}</tr>
      </tbody>
    </table>`;

  const html = `
  <section class="ft" id="features" aria-labelledby="ft-h">
    <div class="ft-in">
      <div class="ft-head">
        <span class="ft-eyebrow">Features</span>
        <h2 class="ft-h2" id="ft-h">Everything a small restaurant needs.<br>Nothing it doesn't.</h2>
        <p class="ft-lead">One simple dashboard for the counter, the kitchen and the owner. No POS, no tablets to rent, no setup visit.</p>
      </div>
      <div class="ft-grid">
        ${tile('ft-w ft-t1', 'Live orders', 'Every order appears instantly with its table number. Move it from New to Kitchen to Ready in one tap.', orders)}
        ${tile('ft-t2', 'Your brand', 'Pick a colour theme and add your logo. Guests see your restaurant, not ours.', theme)}
        ${tile('ft-t3', 'Cash or online', 'Guests pay at the counter today. Card and wallet payments are on the way.', pay)}
        ${tile('ft-w ft-t4', 'Your menu, your way', 'Photos, prices and best-seller tags. Ran out of fish? Mark it sold out in one tap and guests see it instantly.', menu)}
        ${tile('ft-t5', 'Staff logins', 'Give the counter, the kitchen and your manager their own login with just the access they need.', staff)}
        ${tile('ft-w ft-t6', 'More than one branch', 'Run every outlet from one account. Each branch has its own QR codes and its own stock.', branches)}
      </div>
    </div>
  </section>`;
  anchor.insertAdjacentHTML('afterend', html);

  const sec = document.getElementById('features');
  const tiles = [...sec.querySelectorAll('.ft-tile')];
  sec.classList.add('rv-on');
  tiles.forEach((t, i) => t.style.setProperty('--d', `${(i % 3) * 0.08}s`));
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tiles.forEach((t) => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  tiles.forEach((t) => io.observe(t));

  // pause the looping mocks while the section is off screen
  const vis = new IntersectionObserver(([e]) => sec.classList.toggle('is-off', !e.isIntersecting), { rootMargin: '200px 0px' });
  vis.observe(sec);
})();
