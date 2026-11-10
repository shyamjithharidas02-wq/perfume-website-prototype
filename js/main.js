/* =========================================================
   CASSIE PERFUMES — Interactions
   ========================================================= */
(() => {
  'use strict';

  document.documentElement.classList.remove('no-js');
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header + back-to-top ---------- */
  const header = $('#header');
  const toTop = $('#toTop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    toTop.classList.toggle('is-visible', y > 700);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));

  /* ---------- Mobile navigation ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('menu-open') && !nav.contains(e.target) && !burger.contains(e.target)) setMenu(false);
  });
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // Dropdown toggles (tap to expand on mobile / keyboard)
  $$('.nav__toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const li = btn.closest('.has-dropdown');
      const open = !li.classList.contains('is-open');
      $$('.has-dropdown.is-open').forEach((o) => { o.classList.remove('is-open'); $('.nav__toggle', o).setAttribute('aria-expanded', 'false'); });
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Search panel ---------- */
  const searchPanel = $('#searchPanel');
  $('#searchOpen').addEventListener('click', () => {
    searchPanel.hidden = !searchPanel.hidden;
    if (!searchPanel.hidden) $('input', searchPanel).focus();
  });
  $('#searchClose').addEventListener('click', () => { searchPanel.hidden = true; });

  /* ---------- Active nav link on scroll ---------- */
  const navLinks = $$('.nav__link[href^="#"]');
  const sectionsForNav = navLinks.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionsForNav.forEach((s) => navObserver.observe(s));
  }

  /* ---------- Hero carousel ---------- */
  const hero = $('.hero');
  const slides = $$('.hero__slide', hero);
  const SLIDE_MS = 7000;
  let current = 0;
  let timer = null;
  let paused = false;

  function goTo(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, n) => {
      const on = n === current;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', String(!on));
      // keep links in hidden slides out of the tab order
      $$('a, button', s).forEach((el) => (on ? el.removeAttribute('tabindex') : el.setAttribute('tabindex', '-1')));
    });
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!reducedMotion && !paused) timer = setTimeout(() => goTo(current + 1), SLIDE_MS);
  }
  function setPaused(p) {
    paused = p;
    hero.classList.toggle('is-paused', p);
    if (p) clearTimeout(timer); else goTo(current); // resume restarts the current slide's timer cleanly
  }

  $$('.hero__arrow', hero).forEach((b) => b.addEventListener('click', () => goTo(current + Number(b.dataset.dir))));
  hero.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goTo(current + 1);
    if (e.key === 'ArrowLeft') goTo(current - 1);
  });
  // pause while the visitor is reading / interacting (desktop hover only)
  if (window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mouseenter', () => setPaused(true));
    hero.addEventListener('mouseleave', () => setPaused(false));
  }
  // pause when the tab is hidden
  document.addEventListener('visibilitychange', () => (document.hidden ? clearTimeout(timer) : schedule()));
  // swipe
  let touchX = null;
  hero.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
  goTo(0);

  /* ---------- Accordion ---------- */
  $$('.accordion__trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion__item');
      const open = !item.classList.contains('is-open');
      $$('.accordion__item', item.parentElement).forEach((i) => {
        i.classList.remove('is-open');
        $('.accordion__trigger', i).setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Product filter ---------- */
  const filterBtns = $$('.filter__btn');
  const products = $$('.product-card');
  filterBtns.forEach((btn) => btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
    const f = btn.dataset.filter;
    products.forEach((p) => {
      const show = f === 'all' || p.dataset.cat === f;
      p.classList.toggle('is-hidden', !show);
      if (show) p.classList.add('is-visible');
    });
  }));

  /* ---------- Reveal on scroll + counters ---------- */
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    if (reducedMotion) { el.textContent = target; return; }
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // Stagger siblings within grids
        const siblings = $$(':scope > .reveal', el.parentElement);
        el.style.transitionDelay = `${Math.max(0, siblings.indexOf(el)) * 90}ms`;
        el.classList.add('is-visible');
        // Once revealed, hand transitions back to the component's own hover styles
        setTimeout(() => { el.classList.remove('reveal'); el.style.transitionDelay = ''; }, 1100 + siblings.indexOf(el) * 90);
        $$('[data-count]', el).forEach(animateCount);
        obs.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach((el) => revealObserver.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('is-visible'));
    $$('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
  }

  /* ---------- Story parallax ---------- */
  const storyBg = $('.story__bg');
  if (storyBg && !reducedMotion) {
    const story = $('.story');
    let ticking = false;
    const parallax = () => {
      const r = story.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        storyBg.style.transform = `translate3d(0, ${progress * -60}px, 0)`;
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(parallax); ticking = true; } }, { passive: true });
    parallax();
  }

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
