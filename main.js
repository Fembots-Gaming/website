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
    if (target) showGameFor(target, false);  // a link to a game's details switches the spotlight to that game
    // The nav loses 12px of padding once the page scrolls, so aim for its scrolled height.
    const navH = nav.classList.contains('scrolled') ? nav.offsetHeight : nav.offsetHeight - 12;
    const top = target ? target.getBoundingClientRect().top + window.scrollY - navH : 0;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', hash === '#top' ? location.pathname + location.search : hash);
    setMenu(false);
  });

  // ---------- Spotlight: one game at a time ----------
  // The arrows step through the games, wrapping round at the ends.
  // Only games marked inReview in games.js show here; with none, the section and its nav link hide.
  const inReview = new Set(games.filter((g) => g.inReview).map((g) => g.slug));
  const gamePanels = [...document.querySelectorAll('.spot-game')].filter((p) => inReview.has(p.dataset.game) || (p.classList.add('off'), false));
  const spotlight = document.getElementById('spotlight');
  const spotNav = document.querySelector('.spot-nav');
  const spotCount = spotNav && spotNav.querySelector('.spot-count');
  if (spotlight && !gamePanels.length) {
    spotlight.hidden = true;
    document.querySelectorAll('a[href="#spotlight"]').forEach((a) => { a.hidden = true; });
  }
  if (spotNav && gamePanels.length < 2) spotNav.hidden = true;
  let spotIndex = 0;
  const showIndex = (i, dir = 0) => {
    if (!gamePanels.length) return;
    spotIndex = (i + gamePanels.length) % gamePanels.length;
    const panel = gamePanels[spotIndex];
    const changed = panel.classList.contains('is-hidden');
    // The others stay in the layout (so the box keeps the tallest game's height) but invisible and unfocusable.
    gamePanels.forEach((p) => {
      const off = p !== panel;
      p.classList.toggle('is-hidden', off);
      p.inert = off;
      p.setAttribute('aria-hidden', String(off));
    });
    if (spotCount) spotCount.innerHTML = `<b>${spotIndex + 1}</b> / <span>${gamePanels.length}</span>`;
    if (changed && dir && !reduceMotion.matches) {
      panel.animate({ opacity: [0, 1], transform: [`translateX(${dir * 40}px)`, 'none'] }, { duration: 420, easing: 'cubic-bezier(.2, .8, .2, 1)' });
    }
  };
  const showGame = (slug, animate = true) => {
    const i = gamePanels.findIndex((p) => p.dataset.game === slug);
    if (i >= 0) showIndex(i, animate ? 1 : 0);
  };
  // Switches to the game that contains an element, such as a "#noble-seal" link's target.
  function showGameFor(el, animate) {
    const panel = el.closest && el.closest('.spot-game');
    if (panel) showGame(panel.dataset.game, animate);
  }
  if (spotNav) spotNav.querySelectorAll('.spot-arrow').forEach((btn) => {
    btn.addEventListener('click', () => { const d = Number(btn.dataset.dir); showIndex(spotIndex + d, d); });
  });
  showIndex(0);

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

  // ---------- Ticker ----------
  // The track scrolls left by half its width, then jumps back, so each half must be at least as wide
  // as the screen or a gap shows before the jump. Repeat the items until it is, and stretch the
  // duration with it so the speed stays the same.
  const track = document.querySelector('.ticker-track');
  if (track) {
    const items = [...track.children].slice(0, track.children.length / 2).map((n) => n.cloneNode(true));
    const SECONDS_PER_COPY = 30;
    let reps = 0;
    const fill = () => {
      const copies = track.children.length / items.length;
      const copyW = track.getBoundingClientRect().width / copies;
      if (!copyW) return;
      const need = Math.max(1, Math.ceil(track.parentElement.clientWidth / copyW));
      if (need * 2 === copies) return;
      reps = need;
      const nodes = [];
      for (let i = 0; i < reps * 2; i++) items.forEach((n) => nodes.push(n.cloneNode(true)));
      track.replaceChildren(...nodes);
      track.style.animationDuration = `${SECONDS_PER_COPY * reps}s`;
    };
    fill();
    if (document.fonts) document.fonts.ready.then(fill);
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fill, 150); });
  }

  // ---------- Game details pop-up ----------
  // Opened from a game card or a spotlight "Full game details" button. It shows the game's spotlight card
  // (art, logo, stats) and then the full details from its <template id="details-SLUG">.
  const modal = document.getElementById('gameModal');
  const modalBody = modal && modal.querySelector('.modal-body');
  const hasDetails = (slug) => !!document.getElementById(`details-${slug}`);
  let lastFocus = null;
  const openDetails = (slug, fromKey = false) => {
    const tpl = document.getElementById(`details-${slug}`);
    if (!modal || !tpl) return;
    const head = document.getElementById(slug);
    modalBody.replaceChildren();
    if (head) {
      const card = head.cloneNode(true);
      card.removeAttribute('id');
      card.querySelectorAll('[data-details]').forEach((b) => b.remove());  // the pop-up is already open
      card.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
      modalBody.append(card);
    }
    modalBody.append(tpl.content.cloneNode(true));
    const game = games.find((g) => g.slug === slug);
    modal.setAttribute('aria-label', `${game ? game.title : 'Game'} details`);
    modal.querySelector('.modal-title').innerHTML = `<b>${esc(game ? game.title : 'Game')}</b> &middot; Game details`;
    // Focus goes back to the card only for keyboard users; after a click it would leave the card's info panel up.
    lastFocus = fromKey ? document.activeElement : null;
    modal.showModal();
    modal.scrollTop = 0;
    if (!reduceMotion.matches) {
      modal.animate({ opacity: [0, 1], transform: ['translateY(24px) scale(.97)', 'none'] }, { duration: 380, easing: 'cubic-bezier(.2, .8, .2, 1)' });
      [...modalBody.children].forEach((el, i) => el.animate({ opacity: [0, 1], transform: ['translateY(14px)', 'none'] },
        { duration: 420, delay: 90 + i * 60, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'backwards' }));
      modalBody.querySelectorAll('.symbols li').forEach((li, i) => li.animate({ opacity: [0, 1], transform: ['translateY(18px) scale(.92)', 'none'] },
        { duration: 420, delay: 220 + i * 55, easing: 'cubic-bezier(.3, 1.4, .5, 1)', fill: 'backwards' }));
    }
  };
  const closeDetails = () => {
    if (!modal || !modal.open) return;
    if (reduceMotion.matches) { modal.close(); return; }
    const anim = modal.animate({ opacity: [1, 0], transform: ['none', 'translateY(16px) scale(.98)'] }, { duration: 200, easing: 'ease-in' });
    anim.onfinish = () => modal.close();
  };
  if (modal) {
    modal.querySelector('.modal-close').addEventListener('click', closeDetails);
    // A click on the dimmed backdrop (the dialog itself, outside its content) closes it.
    modal.addEventListener('click', (e) => { if (e.target === modal) closeDetails(); });
    modal.addEventListener('cancel', (e) => { e.preventDefault(); closeDetails(); });
    modal.addEventListener('close', () => {
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-details]');
    if (btn && !modal.contains(btn)) openDetails(btn.dataset.details);
  });
  document.addEventListener('keydown', (e) => {
    const card = e.target.closest && e.target.closest('.game-card[data-details]');
    if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetails(card.dataset.details, true); }
  });

  // ---------- Games grid ----------
  const grid = document.getElementById('gameGrid');
  const empty = document.getElementById('gamesEmpty');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const card = (g) => {
    const live = g.status === 'released';
    const link = live && g.playUrl
      ? `<a href="${esc(g.playUrl)}" target="_blank" rel="noopener">Play now →</a>`
      : hasDetails(g.slug)
        ? '<span class="card-more">Game details →</span>'
        : '';
    const facts = [
      g.rtp && `<div><dt>RTP</dt><dd>${esc(g.rtp)}</dd></div>`,
      g.maxWin && `<div><dt>Max win</dt><dd>${esc(g.maxWin)}</dd></div>`,
      g.grid && `<div><dt>Grid</dt><dd>${esc(g.grid)}</dd></div>`,
    ].filter(Boolean).join('');
    return `
      <article class="game-card${g.cover ? '' : ' no-cover'}" data-status="${esc(g.status)}" tabindex="0"${hasDetails(g.slug) ? ` data-details="${esc(g.slug)}" role="button" aria-label="${esc(g.title)} details"` : ''}>
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

  // Each card's info panel and logo heights, so CSS can place the logo clear of the panel (see .card-logo).
  const infoSize = new ResizeObserver((entries) => {
    entries.forEach((e) => {
      const el = e.target;
      el.closest('.game-card').style.setProperty(el.classList.contains('card-info') ? '--info-h' : '--logo-h', `${Math.ceil(el.offsetHeight)}px`);
    });
  });
  const render = (filter) => {
    const list = filter === 'all' ? games : games.filter((g) => g.status === filter);
    // A "next game" teaser keeps a short catalogue from looking empty.
    const lab = filter !== 'released' && games.length < 3
      ? `<div class="lab-card"><img src="assets/robot.svg" alt="" /><b>Next game</b><p>Something new is being built in the lab.</p></div>`
      : '';
    grid.innerHTML = list.map(card).join('') + lab;
    grid.querySelectorAll('.game-card').forEach((c) => {
      c.querySelectorAll('.card-info, .card-logo').forEach((el) => infoSize.observe(el));
    });
    empty.hidden = list.length > 0;
  };

  document.querySelectorAll('[data-count]').forEach((el) => {
    const f = el.dataset.count;
    el.textContent = f === 'all' ? games.length : games.filter((g) => g.status === f).length;
  });
  document.querySelectorAll('.filter[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter[data-filter]').forEach((b) => {
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
