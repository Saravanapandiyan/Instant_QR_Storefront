// Re-implements the minimal client-side behaviour that was stripped with the Next.js bundle.
(() => {
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  if (!main) return;

  // Helper for safe child element traversal (works in older browsers without :scope)
  const getChildren = (el) => {
    if (!el) return [];
    if (el.children) return Array.prototype.slice.call(el.children);
    return Array.prototype.slice.call(el.childNodes).filter((n) => n.nodeType === 1);
  };

  // 1. Desktop nav links (client-rendered on the original)
  if (header) {
    const left = header.querySelector('.flex.min-w-0.items-center.gap-8');
    if (left && !left.querySelector('nav')) {
      left.insertAdjacentHTML(
        'beforeend',
        '<nav class="clone-nav" aria-label="Primary">' +
          '<a href="#" class="clone-nav-item">Product <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5l3 3 3-3"/></svg></a>' +
          '<a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a>' +
        '</nav>'
      );
    }
  }

  // 2. Header: scrolled state + light/dark text depending on the section under it
  if (header) {
    const sections = getChildren(main).filter((el) => {
      const tag = el.tagName ? el.tagName.toLowerCase() : '';
      return tag === 'section' || tag === 'div';
    });

    const isDark = (el) => {
      try {
        const bg = window.getComputedStyle ? getComputedStyle(el).backgroundColor : '';
        const m = bg.match(/\d+(\.\d+)?/g);
        if (!m) return false;
        const [r, g, b, a = 1] = m.map(Number);
        return +a > 0.5 && (r * 299 + g * 587 + b * 114) / 1000 < 110;
      } catch (e) {
        return false;
      }
    };

    const logo = header.querySelector('img');
    const scrollYPos = () =>
      typeof window.pageYOffset !== 'undefined'
        ? window.pageYOffset
        : (document.documentElement || document.body).scrollTop || 0;

    let scrolled = scrollYPos() > 48;
    const setAttr = (k, v) => {
      try {
        if (header.dataset) {
          if (header.dataset[k] !== v) header.dataset[k] = v;
        } else {
          header.setAttribute('data-' + k, v);
        }
      } catch (e) {}
    };

    const sync = () => {
      try {
        const y0 = scrollYPos();
        if (!scrolled && y0 > 48) scrolled = true;
        else if (scrolled && y0 < 12) scrolled = false;
        setAttr('scrolled', String(scrolled));
        let textDark = false;
        if (!scrolled) {
          const y = (header.offsetHeight || 60) / 2;
          let under = null;
          for (let i = 0; i < sections.length; i++) {
            const s = sections[i];
            const r = s.getBoundingClientRect();
            if (r.top <= y && r.bottom > y) {
              under = s;
              break;
            }
          }
          textDark =
            !under ||
            under === sections[0] ||
            isDark(under) ||
            getChildren(under).some((c) => {
              const r = c.getBoundingClientRect();
              return r.top <= y && r.bottom > y && isDark(c);
            });
        }
        setAttr('darkBg', String(textDark));
        const f = textDark ? 'brightness(0) invert(1)' : 'none';
        if (logo && logo.style && logo.style.filter !== f) logo.style.filter = f;
      } catch (e) {}
    };

    let queued = false;
    const onScroll = () => {
      if (!queued) {
        queued = true;
        const raf = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
        raf(() => {
          queued = false;
          sync();
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    sync();
  }

  // 3. Reveal-on-scroll for elements the original animated in (opacity:0 + small translate)
  try {
    const hidden = Array.prototype.slice.call(
      document.querySelectorAll('[style*="opacity:0"][style*="translateY"]')
    );
    hidden.forEach((el) => {
      el.style.transition = 'opacity .5s ease-out, transform .5s ease-out, -webkit-transform .5s ease-out';
    });
    if (typeof window.IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const i = hidden.indexOf(el) % 4;
            setTimeout(() => {
              el.style.opacity = '1';
              el.style.transform = 'none';
              el.style.webkitTransform = 'none';
            }, i * 90);
            io.unobserve(el);
          });
        },
        { threshold: 0.15 }
      );
      hidden.forEach((el) => io.observe(el));
    } else {
      // Fallback for browsers without IntersectionObserver: reveal immediately
      hidden.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.webkitTransform = 'none';
      });
    }
  } catch (e) {}

  // 4. Beach-restaurant scene on the right of the hero
  try {
    const hero = main.querySelector('section');
    if (hero) {
      if (!hero.querySelector('.clone-site')) {
        hero.insertAdjacentHTML(
          'afterbegin',
          '<div class="clone-ocean" aria-hidden="true"></div>' +
          '<div class="clone-site" aria-hidden="true">' +
            '<picture class="clone-scene">' +
              '<source srcset="beach-scene-static.webp" type="image/webp">' +
              '<img class="clone-scene" src="beach-scene-static.png" alt="" width="1728" height="2160" decoding="async">' +
            '</picture>' +
            '<div class="clone-scene clone-scene-anim" role="img" aria-label="Open-air beach restaurant on the shore: guests scan a table QR, the order reaches the kitchen and is served"></div>' +
          '</div>'
        );
      }

      const animHost = document.querySelector('.clone-scene-anim');
      if (animHost) {
        // Robust fetch with XMLHttpRequest fallback for older browsers
        const loadSvg = (url, callback) => {
          if (typeof window.fetch === 'function') {
            fetch(url)
              .then((r) => {
                if (!r.ok) throw new Error('Network error');
                return r.text();
              })
              .then(callback)
              .catch(() => loadSvgXhr(url, callback));
          } else {
            loadSvgXhr(url, callback);
          }
        };

        const loadSvgXhr = (url, callback) => {
          try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 0) {
                callback(xhr.responseText);
              }
            };
            xhr.onerror = () => {};
            xhr.send();
          } catch (e) {}
        };

        loadSvg('beach-scene-anim.svg', (svgText) => {
          try {
            animHost.innerHTML = svgText;
            const el = animHost.querySelector('svg');
            if (!el) return;

            el.setAttribute('preserveAspectRatio', 'xMaxYMid slice');
            el.setAttribute('width', '100%');
            el.setAttribute('height', '100%');
            el.setAttribute('aria-hidden', 'true');

            // Ensure SVG SMIL animations play continuously without pausing
            try {
              if (typeof el.setCurrentTime === 'function') el.setCurrentTime(0);
            } catch (e) {}
            try {
              if (typeof el.unpauseAnimations === 'function') el.unpauseAnimations();
            } catch (e) {}
          } catch (e) {}
        });
      }
    }
  } catch (e) {}
})();
