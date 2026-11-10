(() => {
  const data = window.FEMBOTS || { studio: {}, games: [] };
  const games = data.games || [];

  // ---------- Nav: solid on scroll, mobile menu ----------
  const nav = document.querySelector('.nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    links.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // ---------- Smooth scroll for every in-page link ----------
  // Lands each section just below the fixed nav; "#top" goes all the way up.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const hash = a.getAttribute('href');
    const target = hash === '#top' || hash === '#' ? null : document.querySelector(hash);
    if (hash !== '#top' && hash !== '#' && !target) return;
    e.preventDefault();
    // The nav loses 12px of padding once the page scrolls, so aim for its scrolled height.
    const navH = nav.classList.contains('scrolled') ? nav.offsetHeight : nav.offsetHeight - 12;
    const top = target ? target.getBoundingClientRect().top + window.scrollY - navH : 0;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', hash === '#top' ? location.pathname + location.search : hash);
    setMenu(false);
  });

  // ---------- Hero robot: the eye follows the mouse, blinks, and looks around when the mouse is still ----------
  const bot = document.getElementById('heroBot');
  if (bot) {
    const pupil = bot.querySelector('.hero-pupil');
    const lid = bot.querySelector('.hero-lid');
    const MAX_X = 10, MAX_UP = 10, MAX_DOWN = 10;   // how far the pupil can travel, in logo units (same as Midnight Broker)
    const s = { tx: 0, ty: 0, x: 0, y: 0 };
    let lastMove = -1e9, wanderAt = 0, blinkAt = -1e9, blinkTwice = false, nextBlink = 2500, raf = 0;

    const look = (px, py) => {
      const r = bot.getBoundingClientRect();
      const k = r.height / 180;                                   // viewBox is 6 0 188 180
      const ex = r.left + (100 - 6) * k, ey = r.top + (108 - 0) * k;
      const dx = px - ex, dy = py - ey;
      const dist = Math.hypot(dx, dy) || 1, reach = Math.min(1, dist / 320);
      s.tx = (dx / dist) * reach * MAX_X;
      s.ty = (dy / dist) * reach * (dy < 0 ? MAX_UP : MAX_DOWN);
      lastMove = performance.now();
    };
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') look(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('pointerdown', (e) => look(e.clientX, e.clientY), { passive: true });

    const frame = (t) => {
      raf = requestAnimationFrame(frame);
      const motion = !reduceMotion.matches;
      if (motion && t - lastMove > 2500 && t > wanderAt) {
        const a = Math.random() * Math.PI * 2, m = Math.random() < .25 ? 0 : .4 + Math.random() * .6;
        s.tx = Math.cos(a) * MAX_X * m;
        s.ty = Math.sin(a) * (Math.sin(a) < 0 ? MAX_UP : MAX_DOWN) * m;
        wanderAt = t + 900 + Math.random() * 1800;
      }
      s.x += (s.tx - s.x) * .18; s.y += (s.ty - s.y) * .18;
      pupil.setAttribute('transform', `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)})`);

      if (t > nextBlink) { blinkAt = t; blinkTwice = Math.random() < .2; nextBlink = t + 2200 + Math.random() * 3800; }
      const bt = t - blinkAt;
      let drop = 0;
      if (bt < 200) drop = 46 * Math.sin(Math.PI * bt / 200);
      else if (blinkTwice && bt > 280 && bt < 480) drop = 46 * Math.sin(Math.PI * (bt - 280) / 200);
      lid.setAttribute('transform', `translate(0 ${drop.toFixed(2)})`);
    };

    // Only animate while the robot is on screen.
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !raf) raf = requestAnimationFrame(frame);
      else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
    }).observe(bot);
  }

  // ---------- Games grid ----------
  const grid = document.getElementById('gameGrid');
  const empty = document.getElementById('gamesEmpty');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const card = (g) => {
    const live = g.status === 'released';
    const link = live && g.playUrl
      ? `<a href="${esc(g.playUrl)}" target="_blank" rel="noopener">Play now →</a>`
      : g.detailsAnchor !== false
        ? `<a href="#${esc(g.slug)}">Game details →</a>`
        : '';
    const facts = [
      g.rtp && `<div><dt>RTP</dt><dd>${esc(g.rtp)}</dd></div>`,
      g.maxWin && `<div><dt>Max win</dt><dd>${esc(g.maxWin)}</dd></div>`,
      g.grid && `<div><dt>Grid</dt><dd>${esc(g.grid)}</dd></div>`,
    ].filter(Boolean).join('');
    return `
      <article class="game-card${g.cover ? '' : ' no-cover'}" data-status="${esc(g.status)}" tabindex="0">
        ${g.cover ? `<img class="cover" src="${esc(g.cover)}" alt="" loading="lazy" />` : ''}
        <span class="tag ${live ? 'tag-live' : 'tag-soon'}">${live ? 'Out now' : esc(g.release || 'Coming soon')}</span>
        ${g.logo ? `<img class="card-logo" src="${esc(g.logo)}" alt="${esc(g.title)}" loading="lazy" />` : `<h3 class="card-logo">${esc(g.title)}</h3>`}
        <div class="card-info">
          ${facts ? `<dl>${facts}</dl>` : ''}
          <p>${esc(g.blurb)}</p>
          ${link}
        </div>
      </article>`;
  };

  const render = (filter) => {
    const list = filter === 'all' ? games : games.filter((g) => g.status === filter);
    // A "next game" teaser keeps a short catalogue from looking empty.
    const lab = filter !== 'released' && games.length < 3
      ? `<div class="lab-card"><img src="assets/robot.svg" alt="" /><b>Next game</b><p>Something new is being built in the lab.</p></div>`
      : '';
    grid.innerHTML = list.map(card).join('') + lab;
    empty.hidden = list.length > 0;
  };

  document.querySelectorAll('[data-count]').forEach((el) => {
    const f = el.dataset.count;
    el.textContent = f === 'all' ? games.length : games.filter((g) => g.status === f).length;
  });
  document.querySelectorAll('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      render(btn.dataset.filter);
    });
  });
  render('all');

  // ---------- Contact email (only if set in games.js) ----------
  const email = data.studio && data.studio.contactEmail;
  const emailBtn = document.getElementById('contactEmail');
  if (email && emailBtn) {
    emailBtn.href = `mailto:${email}`;
    emailBtn.hidden = false;
  }

  // ---------- Reveal on scroll ----------
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });
  } else {
    els.forEach((el) => el.classList.add('in'));
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
