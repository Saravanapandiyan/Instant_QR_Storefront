// Section 6: "You only pay for orders you accept." — order safety as a credit ledger. Built only from what the
// product does today: orders arrive Pending and need staff approval, only confirmed orders use a credit,
// one-tap cancel, ordering can be paused per branch, staff roles limit who can accept/cancel. Inserted after Features.
(() => {
  const anchor = document.getElementById('features') || document.getElementById('pricing');
  if (!anchor) return;

  const FACTS = [
    ['Pending until accepted', 'Nothing reaches the kitchen until your counter says yes.'],
    ['Rejected orders cost ₹0', 'Only confirmed orders use a credit.'],
    ['Pause ordering anytime', 'Turn QR ordering off for a branch in one tap.'],
    ['Roles decide who can accept', 'Manager, Cashier and Kitchen logins.'],
  ];
  const ROWS = [
    ['12:31', '#A1051 · Table 3', 'ok', 'Accepted', '−1', '481'],
    ['12:34', '#A1052 · Table 99', 'bad', 'Rejected', '0', '481'],
    ['12:40', '#A1053 · Table 5', 'ok', 'Accepted', '−1', '480'],
    ['12:41', '#A1054 · Table 5', 'bad', 'Cancelled', '0', '480'],
    ['12:52', 'Ordering paused · kitchen full', 'note', '', '—', '480'],
    ['13:05', '#A1055 · Table 8', 'ok', 'Accepted', '−1', '479'],
  ];
  const row = ([t, what, cls, status, d, bal]) => cls === 'note'
    ? `<tr class="is-note"><td>${t}</td><td colspan="2">${what}</td><td>${d}</td><td>${bal}</td></tr>`
    : `<tr><td>${t}</td><td>${what}</td><td class="${cls}">${status}</td><td>${d}</td><td>${bal}</td></tr>`;

  const html = `
  <section class="sc" id="secure-orders" aria-labelledby="sc-h">
    <div class="sc-in">
      <div class="sc-copy">
        <h2 class="sc-h2" id="sc-h">You only pay for<br>orders you accept.</h2>
        <p class="sc-lead">Every QR order waits for your staff. Rejected, cancelled or paused never touches your credits.</p>
        <ul class="sc-facts">${FACTS.map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join('')}</ul>
      </div>
      <div class="sc-rcpt" aria-hidden="true">
        <div class="sc-rcpt-h"><b>Credit ledger</b><span>Sea Breeze Café · Today</span></div>
        <table><tbody>${ROWS.map(row).join('')}</tbody></table>
        <div class="sc-rcpt-f"><span>2 orders didn't cost you anything</span><b>Balance 479</b></div>
      </div>
    </div>
  </section>`;
  anchor.insertAdjacentHTML('afterend', html);

  const sec = document.getElementById('secure-orders');
  // pause the ledger loop while off screen
  const vis = new IntersectionObserver(([e]) => sec.classList.toggle('is-off', !e.isIntersecting), { rootMargin: '200px 0px' });
  vis.observe(sec);
  // reveal once
  sec.classList.add('rv-on');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { sec.classList.add('is-in'); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { sec.classList.add('is-in'); io.disconnect(); } }, { rootMargin: '0px 0px -15% 0px' });
  io.observe(sec);
})();
