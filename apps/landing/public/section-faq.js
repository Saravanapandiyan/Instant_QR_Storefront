// Section 7: FAQ (#faq). Accordion, one answer open at a time. Inserted after the order-safety section.
// Answers only state what the product does today, plus owner-confirmed policy (low-credit warning, ~5 min setup).
(() => {
  const anchor = document.getElementById('secure-orders') || document.getElementById('features');
  if (!anchor || document.getElementById('faq')) return;

  const CONTACT_EMAIL = 'support@instadine.app'; // PLACEHOLDER: replace with the real support address

  const QA = [
    ['What counts as an order?',
      'One order is one confirmed checkout from a table, however many dishes are in it. It uses a single credit only when your staff accept it. Rejected or cancelled orders are free.'],
    ['What happens when my credits run out?',
      'We warn you early, well before you reach zero, and new orders keep coming in. Top up from your dashboard in a minute. Packs start at ₹500 for 500 orders and credits never expire.'],
    ['Do my guests need to download an app?',
      'No. Guests scan the QR on their table with the phone camera and order in the browser. Nothing to install, no sign-up.'],
    ['Do I need special hardware or a POS?',
      'No. Live Orders runs in the browser on any phone, tablet or computer you already have. No POS, no rented tablets.'],
    ['Can I print tickets for the kitchen?',
      'Yes. Print any order as a receipt on a 58 mm or 80 mm thermal printer, straight from Live Orders on a device that can print to it.'],
    ['Can guests pay by card or online?',
      'Guests pay at the counter today via cash or UPI. In-app UPI and card payments are coming soon.'],
    ['Can I run more than one branch?',
      'Yes. Add every outlet to one account. Each branch gets its own QR codes, its own stock and its own live orders.'],
    ['How long does setup take?',
      'About five minutes. Add your dishes and prices, print your table QRs and you are live. Your first 100 orders are free.'],
  ];

  const item = ([q, a], i) => `
        <div class="fq-item${i === 0 ? ' is-open' : ''}">
          <h3><button type="button" class="fq-q" id="fq-q${i}" aria-expanded="${i === 0}" aria-controls="fq-a${i}">
            <span>${q}</span><i aria-hidden="true"></i>
          </button></h3>
          <div class="fq-a" id="fq-a${i}" role="region" aria-labelledby="fq-q${i}"><div><p>${a}</p></div></div>
        </div>`;

  const html = `
  <section class="fq" id="faq" aria-labelledby="fq-h">
    <div class="fq-in">
      <div class="fq-side">
        <h2 class="fq-h2" id="fq-h">Questions<br>owners ask.</h2>
        <p class="fq-lead">Straight answers about pricing, setup and running service.</p>
        ${CONTACT_EMAIL ? `<p class="fq-contact">Still unsure? <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>` : ''}
        <a class="fq-cta" href="/sign-up?start=free-orders">Claim 100 free orders →</a>
      </div>
      <div class="fq-list">${QA.map(item).join('')}</div>
    </div>
  </section>`;
  anchor.insertAdjacentHTML('afterend', html);

  const sec = document.getElementById('faq');
  const items = [...sec.querySelectorAll('.fq-item')];
  const set = (el, open) => {
    el.classList.toggle('is-open', open);
    el.querySelector('.fq-q').setAttribute('aria-expanded', String(open));
  };
  items.forEach((el) => el.querySelector('.fq-q').addEventListener('click', () => {
    const open = !el.classList.contains('is-open');
    items.forEach((o) => set(o, o === el && open));
  }));

  // reveal once
  sec.classList.add('rv-on');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { sec.classList.add('is-in'); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { sec.classList.add('is-in'); io.disconnect(); } }, { rootMargin: '0px 0px -15% 0px' });
  io.observe(sec);
})();
