// Section 4: "$49 a month, or 1¢ an order?" — cost slider + plan cards. Inserted after the How it works section.
(() => {
  const anchor = document.getElementById('how-it-works') || document.querySelector('.sx-wrap');
  if (!anchor) return;

  const SUB = 49; // example monthly QR-menu plan used for the comparison
  const plan = (name, price, orders, mid) => `
        <article class="pr-plan${mid ? ' is-mid' : ''}">
          <h3>${name}</h3><p class="pr-p">$${price}</p><p class="pr-sub">${orders.toLocaleString()} orders</p>
          <ul><li>1¢ per order</li><li>Never expire</li></ul>
          <span class="pr-later">Top up after you start</span>
        </article>`;
  const tick = (t) => `<li><i aria-hidden="true">✓</i>${t}</li>`;

  const html = `
  <section class="pr" id="pricing" aria-labelledby="pr-h">
    <div class="pr-in">
      <div class="pr-head">
        <span class="pr-eyebrow">Pricing</span>
        <h2 class="pr-h2" id="pr-h">$49 a month,<br>or 1¢ an order?</h2>
        <p class="pr-lead">Subscriptions charge you on slow days too. InstaDine only uses a credit when an order is confirmed and paid.</p>
      </div>
      <div class="pr-bar pr-rv">
        <div class="pr-sl">
          <div class="pr-sl-h"><label for="pr-range">Orders a month</label><output id="pr-orders">1,200</output></div>
          <input id="pr-range" class="pr-range" type="range" min="100" max="6000" step="50" value="1200" aria-describedby="pr-note">
          <div class="pr-scale"><span>100</span><span>3,000</span><span>6,000</span></div>
        </div>
        <div class="pr-out" aria-live="polite">
          <span>Your cost</span><b id="pr-us">$12<small>/mo</small></b>
          <span class="pr-save" id="pr-save">You save <b>$444</b> a year vs an example $${SUB}/mo plan</span>
        </div>
      </div>
      <div class="pr-cards pr-rv">
        <article class="pr-plan is-free">
          <h3>Free start</h3><p class="pr-p">$0</p><p class="pr-sub">100 orders to try it</p>
          <ul><li>Full menu, QR codes and live orders</li><li>No card needed</li></ul>
          <a class="pr-cta" href="/sign-up?start=free-orders">Claim 100 free orders →</a>
        </article>
        ${plan('Starter', 5, 500)}
        ${plan('Regular', 20, 2000, true)}
        ${plan('Busy', 50, 5000)}
      </div>
      <p class="pr-note" id="pr-note">Only confirmed orders use a credit. Cancelled or test orders are free.</p>
      <ul class="pr-ticks pr-rv">
        ${tick('No monthly fee')}${tick('No hardware to buy')}${tick('0% commission on food sales')}${tick('Pay cash at the counter (online payments soon)')}
      </ul>
    </div>
  </section>`;
  anchor.insertAdjacentHTML('afterend', html);

  const sec = document.getElementById('pricing');
  const range = sec.querySelector('#pr-range');
  const out = { orders: sec.querySelector('#pr-orders'), us: sec.querySelector('#pr-us'), save: sec.querySelector('#pr-save') };
  const money = (n) => '$' + Math.round(n).toLocaleString();
  const render = () => {
    const n = +range.value, us = n * 0.01, diff = (SUB - us) * 12, over = diff < 0;
    out.orders.textContent = n.toLocaleString();
    out.us.innerHTML = money(us) + '<small>/mo</small>';
    out.save.innerHTML = over
      ? `A flat plan is cheaper at this volume (by <b>${money(-diff)}</b> a year)`
      : `You save <b>${money(diff)}</b> a year vs an example $${SUB}/mo plan`;
    sec.classList.toggle('is-over', over);
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
