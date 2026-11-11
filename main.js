(() => {
  // Every game on the page comes from data/games.json, which Pages CMS edits (see .pages.yml).
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Image paths may be saved as "assets/x.webp" or "/assets/x.webp"; both must work under /website/ on GitHub Pages.
  const src = (p) => esc(String(p || '').trim().replace(/^\.?\/+/, ''));
  const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const list = (v) => (Array.isArray(v) ? v : []);
  let showGameFor = () => {};  // replaced once the spotlight is built

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

  // ---------- Nav: light up the link for the section on screen ----------
  // The current section is the last one whose top has passed just below the nav. At the very bottom of
  // the page it's the last section, since the final one may be too short to reach the top.
  const navItems = [...links.querySelectorAll('a[href^="#"]')]
    .map((a) => ({ a, el: a.getAttribute('href') === '#top' ? document.body : document.querySelector(a.getAttribute('href')) }))
    .filter((x) => x.el);
  let spyQueued = false;
  let spyFrozen = false;
  const setCurrent = (cur) => {
    navItems.forEach((x) => {
      const on = x === cur;
      x.a.classList.toggle('is-current', on);
      if (on) x.a.setAttribute('aria-current', 'true'); else x.a.removeAttribute('aria-current');
    });
  };
  const spy = () => {
    spyQueued = false;
    if (spyFrozen) return;
    const line = nav.offsetHeight + window.innerHeight * 0.25;
    const shown = navItems.filter((x) => !x.a.hidden && (x.el === document.body || x.el.offsetParent !== null));
    let cur = shown[0];
    shown.forEach((x) => { if (x.el !== document.body && x.el.getBoundingClientRect().top <= line) cur = x; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      cur = shown.reduce((last, x) => (x.el.getBoundingClientRect().top < window.innerHeight ? x : last), cur);
    }
    setCurrent(cur);
  };
  // While a link click scrolls the page, the highlight jumps straight to where it's going and stays
  // there, instead of flicking through every section on the way. It follows the page again once the
  // scroll stops, or as soon as you scroll yourself.
  let thawTimer = 0, thawMax = 0;
  const thaw = () => {
    if (!spyFrozen) return;
    spyFrozen = false;
    clearTimeout(thawTimer); clearTimeout(thawMax);
    queueSpy();
  };
  const freezeSpyOn = (hash) => {
    const item = navItems.find((x) => x.a.getAttribute('href') === hash);
    if (item) setCurrent(item);
    spyFrozen = true;
    clearTimeout(thawTimer); clearTimeout(thawMax);
    thawTimer = setTimeout(thaw, 200);   // in case the page doesn't need to move at all
    thawMax = setTimeout(thaw, 2500);    // never stay frozen for long
  };
  window.addEventListener('scroll', () => {
    if (spyFrozen) { clearTimeout(thawTimer); thawTimer = setTimeout(thaw, 140); }
  }, { passive: true });
  window.addEventListener('scrollend', thaw);
  ['wheel', 'touchstart', 'keydown'].forEach((t) => window.addEventListener(t, thaw, { passive: true }));
  // Hover: a link lights up once the mouse rests on it for a moment, so sweeping across the menu from
  // Home to Partners doesn't flash Games, Studio and Spotlight on the way. While a link is hovered the
  // current one goes dark; leaving the menu brings it back.
  const HOVER_DELAY = 110;
  let hoverTimer = 0;
  const setHover = (a) => {
    links.querySelectorAll('a.is-hover').forEach((x) => { if (x !== a) x.classList.remove('is-hover'); });
    if (a) a.classList.add('is-hover');
    links.classList.toggle('hovering', !!a);
  };
  links.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const a = e.target.closest('a');
    if (!a || a.classList.contains('is-hover')) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => setHover(a), HOVER_DELAY);
  });
  links.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    const a = e.target.closest('a');
    // Left a link for empty space inside the menu: stop waiting on it, but keep whatever is lit.
    if (a && !a.contains(e.relatedTarget)) clearTimeout(hoverTimer);
  });
  links.addEventListener('pointerleave', () => { clearTimeout(hoverTimer); setHover(null); });
  // A click lights the clicked link straight away.
  links.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a && links.classList.contains('hovering')) { clearTimeout(hoverTimer); setHover(a); }
  });

  const queueSpy = () => { if (!spyQueued) { spyQueued = true; requestAnimationFrame(spy); } };
  window.addEventListener('scroll', queueSpy, { passive: true });
  window.addEventListener('resize', queueSpy);
  // Sections change height once the games load, so check again then.
  new ResizeObserver(queueSpy).observe(document.body);
  spy();

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
    freezeSpyOn(hash === '#' ? '#top' : hash);
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

  // ---------- Everything built from the game data ----------
  const start = (data) => {
    const games = list(data.games)
      .filter((g) => g && g.title)
      .map((g) => ({ ...g, slug: slugify(g.slug || g.title) }));
    const hasDetails = (g) => list(g.symbols).length || list(g.bonuses).length || list(g.modes).length;
    const bySlug = (slug) => games.find((g) => g.slug === slug);

    // ----- Counts and names in the hero, ticker and stats -----
    const n = games.filter((g) => g.status !== 'released').length;
    const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    document.querySelectorAll('[data-production]').forEach((el) => {
      el.textContent = `${WORDS[n] || n} ${n === 1 ? 'title is' : 'titles are'}`;
    });
    document.querySelectorAll('[data-count-games]').forEach((el) => { el.textContent = n; });
    const track = document.getElementById('tickerTrack');
    if (track) {
      const one = [
        '<span>FEMBOTS</span>',
        `<b>${n} ${n === 1 ? 'game' : 'games'} in production</b>`,
        ...games.map((g) => `<span>${esc(g.title)}</span>`),
        '<b>Built on Engine</b>', '<b>Played on Stake</b>',
      ].join('');
      track.innerHTML = one + one;
      startTicker(track);
    }

    // ----- Spotlight card (also the top of the pop-up) -----
    const DETAILS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="out-a" d="M14 4h6v6M20 4l-6 6"/><path class="out-b" d="M10 20H4v-6M4 20l6-6"/></svg>';
    const tagHTML = (g) => (g.status === 'released'
      ? '<span class="tag tag-live">Out now</span>'
      : `<span class="tag tag-soon">${esc(g.release || 'Coming soon')}</span>`);
    const spotCard = (g, { id = false, button = false, eager = false } = {}) => {
      const lazy = eager ? '' : ' loading="lazy"';
      const chips = list(g.chips).filter((c) => c && (c.value || c.label));
      const steps = list(g.steps).filter((st) => st && (st.title || st.text));
      return `
      <article class="spot-card"${id ? ` id="${esc(g.slug)}"` : ''}>
        <div class="spot-art">${g.cover ? `<img src="${src(g.cover)}" alt="${esc(g.coverAlt)}"${lazy} />` : ''}</div>
        <div class="spot-body">
          ${tagHTML(g)}
          ${g.logo ? `<img class="spot-logo" src="${src(g.logo)}" alt="${esc(g.title)}"${lazy} />` : `<h3 class="spot-logo">${esc(g.title)}</h3>`}
          ${g.lead || g.blurb ? `<p class="spot-lead">${esc(g.lead || g.blurb)}</p>` : ''}
          ${chips.length ? `<ul class="stat-chips">${chips.map((c) => `<li><b>${esc(c.value)}</b><span>${esc(c.label)}</span></li>`).join('')}</ul>` : ''}
          ${steps.length ? `<ol class="mini-steps">${steps.map((st) => `<li><b>${esc(st.title)}</b> ${esc(st.text)}</li>`).join('')}</ol>` : ''}
          ${button && hasDetails(g) ? `<button class="details-btn" type="button" data-details="${esc(g.slug)}" aria-label="Full game details" title="Full game details">${DETAILS_ICON}</button>` : ''}
        </div>
      </article>`;
    };

    // ----- Full details: symbols, bonus rounds and game modes -----
    const detailsHTML = (g) => {
      const symbols = list(g.symbols).filter((x) => x && (x.name || x.image));
      const bonuses = list(g.bonuses).filter((x) => x && (x.name || x.text));
      const modes = list(g.modes).filter((x) => x && x.name);
      const bonusCol = bonuses.length ? `
        <div>
          <h3 class="sub">Bonus rounds</h3>
          <div class="bonus-list">${bonuses.map((b) => `
            <article class="bonus${b.highlight ? ' bonus-hidden' : ''}">
              <div class="bonus-seals"><b>${esc(b.trigger)}</b><span>${esc(b.triggerLabel)}</span></div>
              <div><h4>${esc(b.name)}</h4><p>${esc(b.text)}</p></div>
            </article>`).join('')}
          </div>
          ${g.bonusNote ? `<p class="fine">${esc(g.bonusNote)}</p>` : ''}
        </div>` : '';
      const fine = g.finePrint ? `<p class="fine">${esc(g.finePrint)}</p>` : '';
      const modesCol = modes.length ? `
        <div>
          <h3 class="sub">Game modes</h3>
          <table class="modes">
            <thead><tr><th>Mode</th><th>Cost</th></tr></thead>
            <tbody>${modes.map((m) => `<tr><td>${esc(m.name)}${m.note ? ` <small>${esc(m.note)}</small>` : ''}</td><td>${esc(m.cost)}</td></tr>`).join('')}</tbody>
          </table>
          ${fine}
        </div>` : (fine ? `<div>${fine}</div>` : '');
      return `
        ${symbols.length ? `<h3 class="sub">The symbols</h3>
        <ul class="symbols">${symbols.map((x) => `<li${x.special ? ' class="special"' : ''}>${x.image ? `<img src="${src(x.image)}" alt="" />` : ''}<span>${esc(x.name)}</span><small>${esc(x.pay)}</small></li>`).join('')}</ul>` : ''}
        ${bonusCol || modesCol ? `<div class="two-col">${bonusCol}${modesCol}</div>` : ''}`;
    };

    // ----- Spotlight: one game at a time -----
    // Only games marked "In review" show here. The arrows step through them, wrapping round at the ends;
    // with none, the section and its nav link hide.
    const stack = document.getElementById('spotStack');
    if (stack) {
      stack.innerHTML = games.filter((g) => g.inReview)
        .map((g) => `<div class="spot-game" data-game="${esc(g.slug)}">${spotCard(g, { id: true, button: true })}</div>`).join('');
    }
    const gamePanels = stack ? [...stack.querySelectorAll('.spot-game')] : [];
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
    showGameFor = (el, animate) => {
      const panel = el.closest && el.closest('.spot-game');
      if (panel) showGame(panel.dataset.game, animate);
    };
    if (spotNav) spotNav.querySelectorAll('.spot-arrow').forEach((btn) => {
      btn.addEventListener('click', () => { const d = Number(btn.dataset.dir); showIndex(spotIndex + d, d); });
    });
    showIndex(0);

    // ----- Game details pop-up -----
    // Opened from a game card or a spotlight "Full game details" button: the game's spotlight card, then its details.
    const modal = document.getElementById('gameModal');
    const modalBody = modal && modal.querySelector('.modal-body');
    let lastFocus = null;
    const openDetails = (slug, fromKey = false) => {
      const game = bySlug(slug);
      if (!modal || !game || !hasDetails(game)) return;
      modalBody.innerHTML = spotCard(game, { eager: true }) + detailsHTML(game);
      modal.setAttribute('aria-label', `${game.title} details`);
      modal.querySelector('.modal-title').innerHTML = `<b>${esc(game.title)}</b> &middot; Game details`;
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
      if (btn && modal && !modal.contains(btn)) openDetails(btn.dataset.details);
    });
    document.addEventListener('keydown', (e) => {
      const el = e.target.closest && e.target.closest('.game-card[data-details]');
      if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetails(el.dataset.details, true); }
    });

    // ----- Games grid -----
    const grid = document.getElementById('gameGrid');
    const empty = document.getElementById('gamesEmpty');
    const card = (g) => {
      const live = g.status === 'released';
      const details = hasDetails(g);
      const link = live && g.playUrl
        ? `<a href="${esc(g.playUrl)}" target="_blank" rel="noopener">Play now →</a>`
        : details ? '<span class="card-more">Game details →</span>' : '';
      const facts = [
        g.rtp && `<div><dt>RTP</dt><dd>${esc(g.rtp)}</dd></div>`,
        g.maxWin && `<div><dt>Max win</dt><dd>${esc(g.maxWin)}</dd></div>`,
        g.grid && `<div><dt>Grid</dt><dd>${esc(g.grid)}</dd></div>`,
      ].filter(Boolean).join('');
      return `
        <article class="game-card${g.cover ? '' : ' no-cover'}" data-status="${esc(g.status)}" tabindex="0"${details ? ` data-details="${esc(g.slug)}" role="button" aria-label="${esc(g.title)} details"` : ''}>
          ${g.cover ? `<img class="cover" src="${src(g.cover)}" alt="" loading="lazy" />` : ''}
          ${tagHTML(g)}
          ${g.logo ? `<img class="card-logo" src="${src(g.logo)}" alt="${esc(g.title)}" loading="lazy" />` : `<h3 class="card-logo">${esc(g.title)}</h3>`}
          <div class="card-info">
            ${facts ? `<dl>${facts}</dl>` : ''}
            ${g.blurb ? `<p>${esc(g.blurb)}</p>` : ''}
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
      const shown = filter === 'all' ? games : games.filter((g) => g.status === filter);
      grid.innerHTML = shown.map(card).join('');
      grid.querySelectorAll('.card-info, .card-logo').forEach((el) => infoSize.observe(el));
      empty.hidden = shown.length > 0;
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
    if (grid) render('all');

    // ----- Contact email (only if set) -----
    const emailBtn = document.getElementById('contactEmail');
    if (data.contactEmail && emailBtn) {
      emailBtn.href = `mailto:${String(data.contactEmail).trim()}`;
      emailBtn.hidden = false;
    }

    // A link straight to a game (such as .../#noble-seal) has something to land on now.
    if (location.hash.length > 1) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) { showGameFor(target, false); target.scrollIntoView(); }
    }
  };

  // ---------- Ticker ----------
  // The track scrolls left by half its width, then jumps back, so each half must be at least as wide
  // as the screen or a gap shows before the jump. Repeat the items until it is, and stretch the
  // duration with it so the speed stays the same.
  function startTicker(track) {
    const items = [...track.children].slice(0, track.children.length / 2).map((el) => el.cloneNode(true));
    if (!items.length) return;
    const SECONDS_PER_COPY = 30;
    const fill = () => {
      const copies = track.children.length / items.length;
      const copyW = track.getBoundingClientRect().width / copies;
      if (!copyW) return;
      const need = Math.max(1, Math.ceil(track.parentElement.clientWidth / copyW));
      if (need * 2 === copies) return;
      const nodes = [];
      for (let i = 0; i < need * 2; i++) items.forEach((el) => nodes.push(el.cloneNode(true)));
      track.replaceChildren(...nodes);
      track.style.animationDuration = `${SECONDS_PER_COPY * need}s`;
    };
    fill();
    if (document.fonts) document.fonts.ready.then(fill);
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fill, 150); });
  }

  // no-cache: the browser checks for a newer file on each visit, so CMS edits show up once Pages redeploys.
  fetch('data/games.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(`data/games.json: ${r.status}`); return r.json(); })
    .catch((err) => { console.error('Could not load the games', err); return { games: [] }; })
    .then(start);

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
