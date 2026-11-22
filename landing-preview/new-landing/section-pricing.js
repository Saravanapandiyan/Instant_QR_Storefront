// Section 4: "$49 a month, or 1¢ an order?" — savings slider + credit packs. Inserted after the How it works section.
(() => {
  const anchor = document.getElementById('how-it-works') || document.querySelector('.sx-wrap');
  if (!anchor) return;

  const SUB = 49; // typical monthly QR-menu subscription used for the comparison
  const pack = (name, credits, price, tag) => `
          <div class="pr-pack${tag ? ' is-pick' : ''}">
            ${tag ? `<span class="pr-tag">${tag}</span>` : ''}
            <div><b>${name}</b><small>${credits.toLocaleString()} orders · never expire</small></div>
            <div class="pr-price">$${price}<small>1¢ / order</small></div>
          </div>`;
  const tick = (t) => `<li><i aria-hidden="true">✓</i>${t}</li>`;

  const html = `
  <section class="pr" id="pricing" aria-labelledby="pr-h">
    <div class="pr-in">
      <div class="pr-head">
        <span class="pr-eyebrow">Pricing</span>
        <h2 class="pr-h2" id="pr-h">$49 a month,<br>or 1¢ an order?</h2>
        <p class="pr-lead">Subscriptions charge you on slow days too. InstaDine only uses a credit when an order is confirmed and paid.</p>
      </div>
      <div class="pr-grid">
        <div class="pr-calc pr-rv">
          <div class="pr-calc-h">
            <label for="pr-range">Orders a month</label>
            <output id="pr-orders">1,200</output>
          </div>
          <input id="pr-range" class="pr-range" type="range" min="100" max="6000" step="50" value="1200" aria-describedby="pr-note">
          <div class="pr-scale"><span>100</span><span>3,000</span><span>6,000</span></div>
          <div class="pr-bars">
            <div class="pr-bar"><span>A $${SUB}/mo QR menu plan <small>(example)</small></span><b>$${SUB}<small>/mo</small></b><i class="pr-fill pr-fill-sub" style="--w:1"></i></div>
            <div class="pr-bar is-us"><span>InstaDine at 1¢ an order</span><b id="pr-us">$12<small>/mo</small></b><i class="pr-fill pr-fill-us" id="pr-us-fill"></i></div>
          </div>
          <div class="pr-save" aria-live="polite">
            <div class="pr-save-l">
              <span class="pr-save-k">You save</span>
              <div class="pr-save-v"><strong id="pr-save">$444</strong><span>/ year</span></div>
              <small id="pr-vs">vs an example $${SUB}/mo plan</small>
            </div>
            <span class="pr-save-pct"><b id="pr-pct">76%</b><span>less</span></span>
          </div>
          <p class="pr-note" id="pr-note">Only confirmed orders use a credit. Cancelled or test orders are free.</p>
        </div>
        <div class="pr-packs pr-rv">
          <div class="pr-free"><b>Start with 100 free orders</b><span>No card needed</span></div>
          ${pack('Starter', 500, 5)}
          ${pack('Regular', 2000, 20)}
          ${pack('Busy', 5000, 50)}
          <a class="pr-cta" href="/sign-up?start=free-orders">Claim 100 free orders →</a>
        </div>
      </div>
      <ul class="pr-ticks pr-rv">
        ${tick('No monthly fee')}${tick('No hardware to buy')}${tick('0% commission on food sales')}${tick('Pay cash at the counter (online payments soon)')}
      </ul>
    </div>
  </section>`;
  anchor.insertAdjacentHTML('afterend', html);

  const sec = document.getElementById('pricing');
  const range = sec.querySelector('#pr-range');
  const out = { orders: sec.querySelector('#pr-orders'), us: sec.querySelector('#pr-us'), fill: sec.querySelector('#pr-us-fill'), save: sec.querySelector('#pr-save'), pct: sec.querySelector('#pr-pct'), box: sec.querySelector('.pr-save'), k: sec.querySelector('.pr-save-k'), less: sec.querySelector('.pr-save-pct span') };
  const money = (n) => '$' + Math.round(n).toLocaleString();
  const render = () => {
    const n = +range.value;
    const us = n * 0.01;
    out.orders.textContent = n.toLocaleString();
    out.us.innerHTML = money(us) + '<small>/mo</small>';
    out.fill.style.setProperty('--w', String(Math.min(1, us / SUB)));
    const diff = (SUB - us) * 12, over = diff < 0;
    out.box.classList.toggle('is-over', over);
    out.k.textContent = over ? 'A flat plan is cheaper here' : 'You save';
    out.save.textContent = money(Math.abs(diff));
    out.pct.textContent = Math.abs(Math.round((1 - us / SUB) * 100)) + '%';
    out.less.textContent = over ? 'more' : 'less';
    out.box.classList.remove('is-bump'); void out.box.offsetWidth; out.box.classList.add('is-bump');
    range.style.setProperty('--p', String((n - +range.min) / (+range.max - +range.min)));
  };
  range.addEventListener('input', render);
  render();

  // reveal once on scroll into view
  const parts = [...sec.querySelectorAll('.pr-rv')];
  sec.classList.add('rv-on');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    parts.forEach((p) => p.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  parts.forEach((p) => io.observe(p));
})();
