/* paruto.com — progressive enhancement only; the page reads fine without this file. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  root.classList.add('js-ready');

  /* ---- appearance: Dark / Light, remembered per device; "Auto" follows the system setting ---- */
  const themeBtn = $('#theme-btn');
  const seg = $('.seg');
  const segBtns = $$('button', seg);
  const sysLight = matchMedia('(prefers-color-scheme: light)');
  const metaTheme = $('#theme-color');
  const resolve = pref => pref === 'auto' ? (sysLight.matches ? 'light' : 'dark') : pref;
  const paint = pref => {
    const theme = resolve(pref);
    root.dataset.theme = theme;
    root.dataset.themePref = pref;
    metaTheme.content = theme === 'light' ? '#F5F3EF' : '#080808';
    themeBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark appearance' : 'Switch to light appearance');
    segBtns.forEach((b, i) => {
      const on = b.dataset.pref === pref;
      b.setAttribute('aria-checked', on);
      b.tabIndex = on ? 0 : -1;
      if (on) seg.style.setProperty('--i', i);
    });
  };
  const setPref = (pref, origin) => {
    try { pref === 'auto' ? localStorage.removeItem('paruto-theme') : localStorage.setItem('paruto-theme', pref); } catch (e) {}
    if (resolve(pref) === root.dataset.theme || reduce || !document.startViewTransition) { paint(pref); return; }
    // circular reveal growing from the control that was pressed
    const r = origin ? origin.getBoundingClientRect() : null;
    const x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : 0;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => paint(pref)).ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.32,.72,0,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(() => {}); // the browser may skip the transition (hidden tab, rapid toggles); the theme is applied regardless
  };
  paint(root.dataset.themePref || 'auto');
  themeBtn.addEventListener('click', () => setPref(root.dataset.theme === 'light' ? 'dark' : 'light', themeBtn));
  segBtns.forEach(b => b.addEventListener('click', () => setPref(b.dataset.pref, b)));
  seg.addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = (segBtns.findIndex(b => b.dataset.pref === root.dataset.themePref) + step + segBtns.length) % segBtns.length;
    setPref(segBtns[i].dataset.pref, segBtns[i]);
    segBtns[i].focus();
  });
  sysLight.addEventListener('change', () => { if (root.dataset.themePref === 'auto') setPref('auto'); });

  /* ---- nav: mobile menu ---- */
  const nav = $('#nav');
  const toggle = $('.nav__toggle');
  const menu = $('#menu');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    if (open) menu.querySelector('a').focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); } });

  /* ---- nav: sliding selection capsule follows the section in view ---- */
  const links = $$('.nav__links a');
  const pill = $('.nav__pill');
  let current = null;
  const placePill = () => {
    const a = links.find(l => l.hash === '#' + current);
    if (!a || !a.offsetWidth) { pill.classList.remove('on'); return; }
    pill.style.setProperty('--px', a.offsetLeft + 'px');
    pill.style.setProperty('--pw', a.offsetWidth + 'px');
    pill.classList.add('on');
  };
  const setCurrent = id => {
    current = id;
    links.forEach(a => a.hash === '#' + id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
    placePill();
  };
  const sections = ['companies', 'products', 'mark', 'contact'].map(id => document.getElementById(id));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) setCurrent(en.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---- Liquid Glass: specular highlight tracks the pointer ---- */
  if (finePointer) $$('.glass, .glass-clear').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--gy', (e.clientY - r.top) + 'px');
  }));

  /* ---- manifesto: split into words; <em> stays whole so its gradient survives ---- */
  const hero = $('.hero');
  const heroSticky = $('.hero__sticky');
  const manifesto = $('[data-words]');
  const units = [];
  [...manifesto.childNodes].forEach(node => {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const s = document.createElement('span');
        s.className = 'w'; s.textContent = part;
        frag.append(s); units.push(s);
      });
      node.replaceWith(frag);
    } else units.push(node);
  });

  /* ---- scroll: edge effect, nav compact/minimise, hero progress, manifesto ---- */
  let ticking = false, lastY = scrollY, wasTop = null;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight, dy = y - lastY;
    const top = y < 24;
    if (top !== wasTop) { root.classList.toggle('is-scrolled', !top); wasTop = top; }
    nav.classList.toggle('is-compact', !top);
    // minimise while travelling down past the hero; restore as soon as the person scrolls back up
    if (Math.abs(dy) > 6) {
      const min = dy > 0 && y > vh * .9 && menu.hidden;
      if (min !== nav.classList.contains('is-min')) {
        nav.classList.toggle('is-min', min);
        setTimeout(placePill, 720);
      }
      lastY = y;
    }
    if (y < vh * .9) nav.classList.remove('is-min');
    if (reduce) return;

    // hero progress: 0 at the top, 1 when the pinned hero releases (hero-gl.js uses the same measure)
    const span = hero.offsetHeight - vh;
    const p = span > 0 ? Math.min(Math.max(y / span, 0), 1) : 0;
    heroSticky.style.setProperty('--p', p.toFixed(4));

    const r = manifesto.getBoundingClientRect();
    const t = Math.min(Math.max((vh * .82 - r.top) / (r.height + vh * .25), 0), 1);
    const lit = Math.round(t * units.length);
    units.forEach((u, i) => u.classList.toggle('on', i < lit));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', () => { onScroll(); placePill(); });
  onScroll();
  document.fonts?.ready.then(placePill);

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---- ambient loops only run while visible ---- */
  const idle = new IntersectionObserver(entries => {
    entries.forEach(en => en.target.classList.toggle('is-idle', !en.isIntersecting));
  });
  $$('[data-ambient]').forEach(el => idle.observe(el));
  document.addEventListener('visibilitychange', () => root.classList.toggle('is-idle', document.hidden));

  /* ---- spotlight on content tiles ---- */
  if (finePointer) $$('[data-spot]').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---- ventures ticker: two rows drifting in opposite directions; scroll speed pushes them along ---- */
  const rows = $$('.ticker__row');
  if (rows.length) {
    const words = [['Media', ''], ['Music', 'serif'], ['Capital', 'ghost'], ['Technology', ''], ['Media', 'ghost'], ['Music', ''], ['Capital', 'serif'], ['Technology', 'ghost']];
    const mark = '<svg class="ticker__mark" viewBox="-24 -24 413 395"><use class="pd" href="#pd" fill="url(#gold)"/></svg>';
    rows.forEach((row, ri) => {
      const set = (ri ? words.slice(4).concat(words.slice(0, 4)) : words)
        .map(([w, k]) => `<span class="ticker__word${k ? ' ticker__word--' + k : ''}">${w}</span>${mark}`).join('');
      row.firstElementChild.innerHTML = set + set;   // two copies so the loop is seamless
    });
    if (!reduce) {
      const state = rows.map(r => ({ el: r.firstElementChild, dir: +r.dataset.speed, x: 0, w: 0 }));
      const measure = () => state.forEach(st => { st.w = st.el.scrollWidth / 2; });
      measure();
      addEventListener('resize', measure);
      document.fonts?.ready.then(measure);
      let lastScroll = scrollY, vel = 0, on = false, tickRaf = 0;
      const step = () => {
        tickRaf = 0;
        const dy = scrollY - lastScroll; lastScroll = scrollY;
        vel += (dy - vel) * .12;                      // smoothed scroll velocity (px/frame)
        const push = 1 + Math.min(Math.abs(vel) * .35, 14);
        const sign = vel < -0.5 ? -1 : 1;             // scrolling up reverses the drift
        const skew = Math.max(-8, Math.min(8, vel * -.25));
        state.forEach(st => {
          if (!st.w) return;
          st.x -= .55 * push * st.dir * sign;
          st.x = ((st.x % st.w) + st.w) % st.w;       // wrap into [0, w)
          st.el.style.setProperty('--x', (-st.x).toFixed(2) + 'px');
          st.el.style.setProperty('--skew', skew.toFixed(2) + 'deg');
        });
        if (on && !document.hidden) tickRaf = requestAnimationFrame(step);
      };
      new IntersectionObserver(([en]) => {
        on = en.isIntersecting;
        if (on && !tickRaf) { lastScroll = scrollY; tickRaf = requestAnimationFrame(step); }
      }).observe($('.ticker'));
      document.addEventListener('visibilitychange', () => { if (on && !document.hidden && !tickRaf) tickRaf = requestAnimationFrame(step); });
    }
  }

  /* ---- music equaliser bars ---- */
  const eq = $('.viz--eq');
  if (eq) {
    const n = 28;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('b');
      const env = Math.sin((i / (n - 1)) * Math.PI) * .7 + .3; // taller in the middle
      b.style.setProperty('--h', (env * (.55 + Math.random() * .45)).toFixed(2));
      b.style.setProperty('--lo', (env * (.08 + Math.random() * .2)).toFixed(2));
      b.style.setProperty('--d', (.7 + Math.random() * .9).toFixed(2) + 's');
      b.style.setProperty('--dl', (-Math.random() * 2).toFixed(2) + 's');
      eq.append(b);
    }
  }

  /* ---- products rail: paddles, page control, arrow keys ---- */
  const rail = $('#rail');
  const cards = $$('.card', rail);
  const btns = $$('[data-rail]');
  const dots = $('#dots');
  const behavior = reduce ? 'auto' : 'smooth';
  const goTo = i => {
    const c = cards[Math.max(0, Math.min(cards.length - 1, i))];
    rail.scrollTo({ left: c.offsetLeft - cards[0].offsetLeft, behavior });
  };
  const nearest = () => {
    const x = rail.scrollLeft + cards[0].offsetLeft;
    let best = 0, d = Infinity;
    cards.forEach((c, i) => { const dd = Math.abs(c.offsetLeft - x); if (dd < d) { d = dd; best = i; } });
    // at the end of the scroll range, the last card is current even if it can't snap to the start
    if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8) best = cards.length - 1;
    return best;
  };
  cards.forEach((c, i) => {
    const name = c.querySelector('.card__title')?.textContent.trim() || `Item ${i + 1}`;
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Show ${name}`);
    b.addEventListener('click', () => goTo(i));
    dots.append(b);
  });
  const dotBtns = $$('button', dots);
  btns.forEach(b => b.addEventListener('click', () => goTo(nearest() + +b.dataset.rail)));
  rail.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(nearest() + (e.key === 'ArrowRight' ? 1 : -1)); }
  });
  const syncRail = () => {
    const i = nearest();
    // depth: cards ease back and dim as they move off the leading edge
    const lead = rail.getBoundingClientRect().left + parseFloat(getComputedStyle(rail).paddingLeft);
    if (!reduce) cards.forEach(c => {
      const d = Math.abs(c.getBoundingClientRect().left - lead) / c.offsetWidth;
      c.style.setProperty('--k', Math.min(d, 1).toFixed(3));
    });
    btns[0].disabled = rail.scrollLeft < 8;
    btns[1].disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
    dotBtns.forEach((d, j) => j === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current'));
  };
  let railTick = false;
  rail.addEventListener('scroll', () => { if (!railTick) { railTick = true; requestAnimationFrame(() => { railTick = false; syncRail(); }); } }, { passive: true });
  addEventListener('resize', syncRail);
  syncRail();

  /* ---- companies as scroll chapters (wide screens, motion allowed); the bento grid otherwise ---- */
  const chapters = $('.chapters');
  if (chapters) {
    const tiles = $$('.bento > .tile', chapters);
    const index = $('.chapters__index', chapters);
    tiles.forEach((t, i) => index.insertAdjacentHTML('beforeend',
      `<li><button type="button"><span class="chapters__num">${String(i + 1).padStart(2, '0')}</span>` +
      `<span class="chapters__name">${t.dataset.name}</span><span class="chapters__bar" aria-hidden="true"><i></i></span></button></li>`));
    const idxBtns = $$('button', index);
    chapters.style.setProperty('--n', tiles.length);
    // large chapter numeral above the index; the new number rolls up as the old one leaves
    index.insertAdjacentHTML('afterbegin', '<li class="chapters__big" aria-hidden="true"><span>01</span></li>');
    const big = $('.chapters__big', index);
    const roll = (i, dir) => {
      [...big.children].slice(0, -1).forEach(n => n.remove());   // drop anything still leaving from a previous roll
      const old = big.lastElementChild, next = document.createElement('span');
      old.style.cssText = '';
      next.textContent = String(i + 1).padStart(2, '0');
      next.className = dir > 0 ? 'in' : 'out';
      next.style.cssText = 'position:absolute;top:0;left:0';
      big.style.position = 'relative';
      big.append(next);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        old.className = dir > 0 ? 'out' : 'in';
        next.className = '';
      }));
      setTimeout(() => { if (old.isConnected) old.remove(); if (big.lastElementChild === next) next.style.cssText = ''; }, 750);
    };
    const wide = matchMedia('(min-width: 1001px)');
    let on = false, active = -1;
    const span = () => chapters.offsetHeight - innerHeight;
    const topOf = i => chapters.getBoundingClientRect().top + scrollY + span() * (i + .08) / tiles.length;
    const sync = () => {
      if (!on) return;
      const s = span();
      const q = s > 0 ? Math.min(Math.max(-chapters.getBoundingClientRect().top / s, 0), .9999) : 0;
      const i = Math.floor(q * tiles.length);
      index.style.setProperty('--sub', (q * tiles.length - i).toFixed(3));
      if (i === active) return;
      if (active >= 0) roll(i, i > active ? 1 : -1);
      else big.firstElementChild.textContent = String(i + 1).padStart(2, '0');
      active = i;
      tiles.forEach((t, j) => { t.classList.toggle('is-active', j === i); t.classList.toggle('is-past', j < i); });
      idxBtns.forEach((b, j) => j === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current'));
    };
    const setMode = () => {
      on = wide.matches && !reduce;
      root.classList.toggle('chapters-on', on);
      active = -1;
      if (!on) tiles.forEach(t => t.classList.remove('is-active', 'is-past'));
      sync();
    };
    idxBtns.forEach((b, i) => b.addEventListener('click', () => scrollTo({ top: topOf(i), behavior: 'smooth' })));
    // keyboard: tabbing into a chapter that isn't showing brings it on stage
    tiles.forEach((t, i) => t.addEventListener('focusin', () => { if (on && i !== active) scrollTo({ top: topOf(i), behavior: 'auto' }); }));
    let chTick = false;
    addEventListener('scroll', () => { if (!chTick) { chTick = true; requestAnimationFrame(() => { chTick = false; sync(); }); } }, { passive: true });
    addEventListener('resize', sync);
    wide.addEventListener('change', setMode);
    setMode();
  }

  /* ---- the mark: trace the symbol outline, then fill ---- */
  const stroke = $('.mark__stroke');
  const pd = document.getElementById('pd');
  if (stroke && pd.getTotalLength) stroke.style.setProperty('--len', Math.ceil(pd.getTotalLength()));

  $('#year').textContent = new Date().getFullYear();
})();
