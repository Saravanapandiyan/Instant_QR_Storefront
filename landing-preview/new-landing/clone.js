// Re-implements the minimal client-side behaviour that was stripped with the Next.js bundle.
(() => {
  const header = document.querySelector('header');
  const main = document.querySelector('main');

  // 1. Desktop nav links (client-rendered on the original)
  const left = header.querySelector('.flex.min-w-0.items-center.gap-8');
  if (left && !left.querySelector('nav')) {
    left.insertAdjacentHTML(
      'beforeend',
      `<nav class="clone-nav" aria-label="Primary">
        <a href="#" class="clone-nav-item">Product <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5l3 3 3-3"/></svg></a>
        <a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a>
      </nav>`
    );
  }

  // 2. Header: scrolled state + light/dark text depending on the section under it
  const sections = [...main.querySelectorAll(':scope > section, :scope > div')];
  const isDark = (el) => {
    const m = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
    if (!m) return false;
    const [r, g, b, a = 1] = m.map(Number);
    return +a > 0.5 && (r * 299 + g * 587 + b * 114) / 1000 < 110;
  };
  // Header state with hysteresis: switch to the white "scrolled" bar only past 48px and back only under 12px,
  // so small trackpad jitter near the top can't toggle it (that toggling read as the top area blinking).
  // Attributes/styles are written only when they actually change.
  const logo = header.querySelector('img');
  let scrolled = scrollY > 48;
  const setAttr = (k, v) => { if (header.dataset[k] !== v) header.dataset[k] = v; };
  const sync = () => {
    const y0 = scrollY;
    if (!scrolled && y0 > 48) scrolled = true;
    else if (scrolled && y0 < 12) scrolled = false;
    setAttr('scrolled', String(scrolled));
    let textDark = false;                       // white bar showing -> dark text
    if (!scrolled) {
      const y = header.offsetHeight / 2;
      const under = sections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
      textDark = !under || under === sections[0] || isDark(under) ||
        [...under.querySelectorAll(':scope > *')].some((c) => { const r = c.getBoundingClientRect(); return r.top <= y && r.bottom > y && isDark(c); });
    }
    setAttr('darkBg', String(textDark));
    const f = textDark ? 'brightness(0) invert(1)' : 'none';
    if (logo && logo.style.filter !== f) logo.style.filter = f;
  };
  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; sync(); }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  sync();

  // 3. Reveal-on-scroll for elements the original animated in (opacity:0 + small translate)
  const hidden = [...document.querySelectorAll('[style*="opacity:0"][style*="translateY"]')];
  hidden.forEach((el) => { el.style.transition = 'opacity .5s ease-out, transform .5s ease-out'; });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const i = hidden.indexOf(el) % 4;
      setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'none'; }, i * 90);
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  hidden.forEach((el) => io.observe(el));

  // 4. Static stand-ins for the Mapbox maps
  const pin = (x, y, red) => `<span class="clone-pin${red ? ' red' : ''}" style="left:${x}%;top:${y}%"><svg width="14" height="14" viewBox="0 0 16 16" fill="#fff"><path d="M9 0L2 9h5l-1 7 7-9H8z"/></svg></span>`;
  // Restaurant floor plan on the right of the hero (replaces the EV station pins)
  const hero = main.querySelector('section');
  if (hero) hero.insertAdjacentHTML('afterbegin',
    '<div class="clone-ocean" aria-hidden="true"></div>' +
    '<div class="clone-site" aria-hidden="true"><img class="clone-scene" src="beach-scene-static.webp" alt="" width="1728" height="2160" decoding="async" fetchpriority="high">' +
    '<div class="clone-scene clone-scene-anim" role="img" aria-label="Open-air beach restaurant on the shore: guests scan a table QR, the order reaches the kitchen and is served"></div></div>');
  // Animated layer is inlined (not an <img>) so the browser only repaints the small regions that move,
  // instead of re-rasterising the whole illustration every frame.
  const animHost = document.querySelector('.clone-scene-anim');
  if (animHost) fetch('beach-scene-anim.svg').then((r) => r.text()).then((svg) => {
    animHost.innerHTML = svg;
    const el = animHost.querySelector('svg');
    if (el) {
      el.setAttribute('preserveAspectRatio', 'xMaxYMid slice'); el.setAttribute('width', '100%'); el.setAttribute('height', '100%'); el.setAttribute('aria-hidden', 'true');
      // Only animate while the scene is on screen; nothing runs once the visitor scrolls past the hero.
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const setRunning = (on) => { if (on && !reduce) el.unpauseAnimations(); else el.pauseAnimations(); animHost.classList.toggle('is-paused', !on || reduce); };
      setRunning(true);
      new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0 }).observe(animHost);
    }
  }).catch(() => {});

  const geo = [...main.querySelectorAll('section')].find((s) => /Geospatial intelligence/.test(s.innerText));
  const panel = geo && [...geo.querySelectorAll('div')].filter((d) => d.offsetHeight > 400 && d.offsetWidth > 700).pop();
  if (panel) {
    panel.classList.add('clone-geomap');
    panel.insertAdjacentHTML('afterbegin', [[22,30],[35,52],[48,40],[60,62],[30,72],[72,35],[55,25],[44,78]].map(([x, y]) => pin(x, y, false)).join(''));
  }
})();
