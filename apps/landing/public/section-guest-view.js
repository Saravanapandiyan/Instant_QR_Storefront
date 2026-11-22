// Section 2: "What your guests see". Inserted right after the hero, in place of the old "Trusted by" logo strip.
(() => {
  const main = document.querySelector('main');
  if (!main) return;
  const hero = main.querySelector(':scope > section');
  const trusted = [...main.querySelectorAll(':scope > section')].find((s) => /Trusted by/i.test(s.textContent));
  if (trusted) trusted.style.display = 'none';

  const item = (name, desc, price, color, sold) =>
    `<div class="sx-item${sold ? ' sold' : ''}"><span class="sx-thumb" style="background:${color}"></span><div><b>${name}</b><span>${desc} · ${price}${sold ? '<span class="sx-tag">Sold out</span>' : ''}</span></div><span class="sx-add">${sold ? '–' : '+'}</span></div>`;
  const D = `
  <section class="sx-sec" id="guest-view" aria-labelledby="sx-d-h"><div class="sx-in sx-demo">
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
  wrap.innerHTML = D;
  hero.after(wrap);
})();
