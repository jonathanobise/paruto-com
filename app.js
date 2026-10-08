/* paruto.com — progressive enhancement only; the page reads fine without this file. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  root.classList.add('js-ready');

  /* ---- nav: compact while scrolled, mobile menu, active section ---- */
  const nav = $('#nav');
  const toggle = $('.nav__toggle');
  const menu = $('#menu');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
  };
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); } });

  const links = $$('.nav__links a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('is-active', a.hash === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['companies', 'products', 'mark', 'contact'].forEach(id => spy.observe(document.getElementById(id)));

  /* ---- hero: scroll progress + pointer tilt on the mark ---- */
  const hero = $('.hero');
  const heroInner = $('.hero__inner');
  const manifesto = $('[data-words]');

  // Split the manifesto into words; <em> stays whole so its gold gradient survives.
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

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    nav.classList.toggle('is-compact', y > 40);
    if (reduce) return;

    const p = Math.min(Math.max(y / (hero.offsetHeight - vh * .3), 0), 1);
    heroInner.parentElement.style.setProperty('--p', p.toFixed(4));

    const r = manifesto.getBoundingClientRect();
    const t = Math.min(Math.max((vh * .82 - r.top) / (r.height + vh * .25), 0), 1);
    const lit = Math.round(t * units.length);
    units.forEach((u, i) => u.classList.toggle('on', i < lit));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (!reduce && matchMedia('(pointer: fine)').matches) {
    const mark = $('.hero__mark svg');
    hero.addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      mark.style.setProperty('--tx', (x * 28).toFixed(2) + 'deg');
      mark.style.setProperty('--ty', (-y * 28).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', () => { mark.style.setProperty('--tx', '0deg'); mark.style.setProperty('--ty', '0deg'); });
  }

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---- spotlight that follows the pointer on tiles ---- */
  $$('[data-spot]').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---- music equaliser bars ---- */
  const eq = $('.viz--eq');
  if (eq) {
    const n = 28;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('b');
      const env = Math.sin((i / (n - 1)) * Math.PI) * .7 + .3; // taller in the middle
      b.style.setProperty('--h', (env * (.55 + Math.random() * .45)).toFixed(2));
      b.style.setProperty('--lo', (env * (.08 + Math.random() * .2)).toFixed(2));
      b.style.setProperty('--d', (.6 + Math.random() * .9).toFixed(2) + 's');
      b.style.setProperty('--dl', (-Math.random() * 2).toFixed(2) + 's');
      eq.append(b);
    }
  }

  /* ---- products rail ---- */
  const rail = $('#rail');
  const btns = $$('[data-rail]');
  const step = () => (rail.querySelector('.card')?.offsetWidth || 600) + 20;
  btns.forEach(b => b.addEventListener('click', () => rail.scrollBy({ left: step() * +b.dataset.rail, behavior: reduce ? 'auto' : 'smooth' })));
  const syncRail = () => {
    btns[0].disabled = rail.scrollLeft < 8;
    btns[1].disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
  };
  rail.addEventListener('scroll', syncRail, { passive: true });
  addEventListener('resize', syncRail);
  syncRail();

  /* ---- the mark: trace the symbol outline, then fill ---- */
  const stroke = $('.mark__stroke');
  const pd = document.getElementById('pd');
  if (stroke && pd.getTotalLength) stroke.style.setProperty('--len', Math.ceil(pd.getTotalLength()));

  $('#year').textContent = new Date().getFullYear();
})();
