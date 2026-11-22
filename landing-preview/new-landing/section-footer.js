// Footer: closing CTA + links + giant wordmark. Appended after <main>. Links only point at real targets
// (on-page sections and the existing /sign-up, /sign-in routes used by the header).
(() => {
  const main = document.querySelector('main');
  if (!main || document.getElementById('site-footer')) return;
  const year = new Date().getFullYear();
  const col = (title, links) => `<nav class="fo-col" aria-label="${title}"><p>${title}</p>${links.map(([t, h]) => `<a href="${h}">${t}</a>`).join('')}</nav>`;

  const html = `
  <footer class="fo" id="site-footer">
    <div class="fo-in">
      <div class="fo-cta">
        <div>
          <h2 class="fo-h">Your first 100 orders<br>are on us.</h2>
          <p class="fo-sub">Set up in minutes. No card, no contract, no monthly fee.</p>
        </div>
        <div class="fo-btns">
          <a class="fo-btn is-main" href="/sign-up?start=free-orders">Claim 100 free orders →</a>
          <a class="fo-btn" href="#pricing">See pricing</a>
        </div>
      </div>
      <div class="fo-grid">
        <div class="fo-brand">
          <a class="fo-logo" href="#" aria-label="InstaDine home"><img src="assets/img/qr-mark.svg" alt="" width="28" height="28"><b>InstaDine</b></a>
          <p>QR table ordering for small restaurants. Guests scan, order and pay. You cook.</p>
          <span class="fo-pill">1¢ per order · No monthly fees</span>
        </div>
        ${col('Product', [['How it works', '#how-it-works'], ['Pricing', '#pricing'], ['Features', '#features'], ['Order safety', '#secure-orders'], ['FAQ', '#faq']])}
        ${col('Account', [['Create account', '/sign-up'], ['Log in', '/sign-in'], ['Claim 100 free orders', '/sign-up?start=free-orders']])}
      </div>
      <div class="fo-bottom">
        <span>© ${year} InstaDine · Made for small restaurants · Powered by <a class="fo-by" href="https://www.hitasoft.com" target="_blank" rel="noopener">Hitasoft</a></span>
        <a href="#" class="fo-top">Back to top ↑</a>
      </div>
    </div>
    <div class="fo-word" aria-hidden="true">InstaDine</div>
  </footer>`;
  main.insertAdjacentHTML('afterend', html);

  const top = document.querySelector('#site-footer .fo-top');
  top.addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
})();
