// Section 5: "Everything a small restaurant needs." — bento grid of real apps/owner features. Inserted after Pricing.
(() => {
  const anchor = document.getElementById('pricing') || document.getElementById('how-it-works');
  if (!anchor) return;

  const img = (f) => `assets/img/dishes/${f}.webp`;

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

  // tour order: the daily essentials first
  const FEATURES = [
    { title: 'Live orders', text: 'Every order appears instantly with its table number. Move it from New to Kitchen to Ready in one tap.', art: orders,
      nav: 'orders', page: 'Live Orders', sub: 'Orders update in real time' },
    { title: 'Your menu, your way', text: 'Photos, prices and best-seller tags. Ran out of fish? Mark it sold out in one tap and guests see it instantly.', art: menu,
      nav: 'menu', page: 'Digital Menu', sub: 'Dishes, prices and availability' },
    { title: 'Your brand', text: 'Pick a colour theme and add your logo. Guests see your restaurant, not ours.', art: theme,
      nav: 'rest', page: 'Storefront Theme', sub: 'How guests see your menu' },
    { title: 'Cash or online', text: 'Guests pay at the counter today. Card and wallet payments are on the way.', art: pay,
      nav: 'pay', page: 'Payment Settings', sub: 'Accepted Payment Methods' },
    { title: 'Staff logins', text: 'Give the counter, the kitchen and your manager their own login with just the access they need.', art: staff,
      nav: 'staff', page: 'Staff & Roles', sub: 'Who can see and do what' },
    { title: 'More than one branch', text: 'Run every outlet from one account. Each branch has its own QR codes and its own stock.', art: branches,
      nav: 'branch', page: 'Branches & Outlets', sub: 'Stock and QR codes per outlet' },
  ];

  // owner-app sidebar (mirrors apps/owner navigation.config.ts) with lucide-style icons
  const sv = (d) => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    grid: sv('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
    clip: sv('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>'),
    utensils: sv('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'),
    store: sv('<path d="M2 7l2-4h16l2 4M4 7v13h16V7M2 7h20M9 20v-6h6v6"/>'),
    menu: sv('<path d="M16 2 2 16M3 3l7 7M14 14l7 7M17 2l5 5-3 3-5-5z"/>'),
    users: sv('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
    card: sv('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    bell: sv('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
  };
  const NAV_GROUPS = [
    ['Operate', [['overview', 'Overview', 'grid'], ['orders', 'Live Orders', 'clip']]],
    ['Manage', [['rest', 'Restaurants', 'utensils'], ['branch', 'Branches', 'store'], ['menu', 'Digital Menu', 'menu'], ['staff', 'Staff & Roles', 'users']]],
    ['Billing', [['pay', 'Payment Settings', 'card']]],
  ];

  const html = `
  <section class="ft" id="features" aria-labelledby="ft-h">
    <div class="ft-in">
      <div class="ft-head">
        <span class="ft-eyebrow">Features</span>
        <h2 class="ft-h2" id="ft-h">All you need.<br>Nothing you don't.</h2>
        <p class="ft-lead">One dashboard for the counter, the kitchen and you.</p>
      </div>
      <div class="ft-tour ft-rv">
        <div class="ft-tour-list" role="tablist" aria-label="Features">
          ${FEATURES.map((f, i) => `
          <button type="button" role="tab" class="ft-tab" id="ft-tab-${i}" aria-controls="ft-pane-${i}" aria-selected="${i === 0}">
            <span class="ft-tab-t">${f.title}</span>
            <span class="ft-tab-d"><span>${f.text}</span></span>
            <i class="ft-tab-bar"><i></i></i>
          </button>`).join('')}
        </div>
        <div class="ft-stage">
          <div class="ft-tablet" aria-hidden="true"><i class="ft-cam"></i>
            <div class="ft-app">
              <aside class="ft-side">
                <div class="ft-side-logo"><img src="assets/img/qr-mark.svg" alt="" width="18" height="18"><b>InstaDine</b></div>
                ${NAV_GROUPS.map(([g, items]) => `<p class="ft-side-g">${g}</p>${items.map(([k, label, icon]) => `<span class="ft-nav" data-k="${k}">${ICON[icon]}<em>${label}</em>${k === 'orders' ? '<i class="ft-live"></i>' : ''}</span>`).join('')}`).join('')}
              </aside>
              <div class="ft-app-r">
                <header class="ft-top">
                  <span class="ft-crumb">Sea Breeze Café <i>/</i> <b class="ft-crumb-page">Live Orders</b></span>
                  <span class="ft-top-r"><span class="ft-branch">Beach Road ▾</span><span class="ft-bell">${ICON.bell}</span><span class="ft-av">SB</span></span>
                </header>
                <div class="ft-main">
                  ${FEATURES.map((f, i) => `<div class="ft-pane${i === 0 ? ' is-on' : ''}" id="ft-pane-${i}" role="tabpanel" aria-labelledby="ft-tab-${i}" data-nav="${f.nav}" data-page="${f.page}">
                    <div class="ft-page-h"><h4>${f.page}</h4><small>${f.sub}</small></div>
                    <div class="ft-art">${f.art}</div>
                  </div>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
  anchor.insertAdjacentHTML('afterend', html);

  const sec = document.getElementById('features');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // product tour: auto-advance every 6s until the visitor picks a tab
  const tour = sec.querySelector('.ft-tour');
  const tabs = [...sec.querySelectorAll('.ft-tab')], panes = [...sec.querySelectorAll('.ft-pane')];
  const navs = [...sec.querySelectorAll('.ft-nav')], crumb = sec.querySelector('.ft-crumb-page');
  let cur = 0, auto = !reduce, timer = null;
  const go = (n) => {
    cur = n;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === n)); t.tabIndex = k === n ? 0 : -1; t.classList.remove('is-run'); });
    panes.forEach((p, k) => p.classList.toggle('is-on', k === n));
    navs.forEach((el) => el.classList.toggle('is-on', el.dataset.k === panes[n].dataset.nav));
    crumb.textContent = panes[n].dataset.page;
    if (auto) { void tabs[n].offsetWidth; tabs[n].classList.add('is-run'); }
  };
  const stopAuto = () => { auto = false; clearInterval(timer); tour.classList.add('is-manual'); };
  tabs.forEach((t, k) => {
    t.addEventListener('click', () => { stopAuto(); go(k); });
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault(); stopAuto();
      const n = (k + d + tabs.length) % tabs.length; go(n); tabs[n].focus();
    });
  });
  go(0);
  if (auto) timer = setInterval(() => { if (auto && !sec.classList.contains('is-off')) go((cur + 1) % tabs.length); }, 6000);

  // pause the looping mocks (and the tour) while the section is off screen
  const vis = new IntersectionObserver(([e]) => sec.classList.toggle('is-off', !e.isIntersecting), { rootMargin: '200px 0px' });
  vis.observe(sec);

  // reveal once on scroll into view
  const parts = [...sec.querySelectorAll('.ft-rv')];
  sec.classList.add('rv-on');
  if (!('IntersectionObserver' in window) || reduce) { parts.forEach((p) => p.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  parts.forEach((p) => io.observe(p));
})();
