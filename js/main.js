/* ============ БорщБар — скрипты ============ */
(function () {
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- фон: пятна света, орнамент, искры ---------- */
  const fx = document.createElement('div');
  fx.className = 'bg-fx';
  fx.setAttribute('aria-hidden', 'true');
  fx.innerHTML = '<i class="orb o1"></i><i class="orb o2"></i><i class="orb o3"></i><i class="pattern"></i><canvas class="embers"></canvas>';
  body.prepend(fx);
  const prog = document.createElement('div');
  prog.className = 'progress';
  body.appendChild(prog);

  /* ---------- загрузка и переходы ---------- */
  const ready = () => {
    if (body.classList.contains('is-loaded')) return;
    body.classList.add('is-loaded');
    document.dispatchEvent(new Event('bb:loaded'));
  };
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(ready);
  window.addEventListener('pageshow', (e) => { if (e.persisted) { body.classList.remove('is-leaving'); ready(); } });

  const curtain = document.querySelector('.curtain');
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || a.target === '_blank' || /^https?:/.test(href)) return;
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      body.classList.remove('menu-open');
      if (curtain) { curtain.classList.add('from-bottom'); void curtain.offsetWidth; curtain.classList.remove('from-bottom'); }
      body.classList.add('is-leaving');
      setTimeout(() => { window.location.href = href; }, reduce ? 0 : 620);
    });
  });

  /* ---------- шапка + прогресс ---------- */
  const header = document.querySelector('.header');
  const onScroll = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 30);
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  const burger = document.querySelector('.burger');
  if (burger) burger.addEventListener('click', () => body.classList.toggle('menu-open'));

  /* ---------- курсор ---------- */
  const cursor = document.querySelector('.cursor');
  if (cursor && fine) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      cx += (tx - cx) * .22; cy += (ty - cy) * .22;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, .dish, .shot, .set').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  }

  /* ---------- заголовки по словам ---------- */
  document.querySelectorAll('.h-1, .h-2').forEach((h) => {
    if (h.closest('.hero__title')) return;
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('dot')) walk(n);
        else if (n.nodeType === 1) n.style.setProperty('--i', i++);
      });
    };
    walk(h);
    h.classList.remove('reveal');
    h.classList.add('split');
  });

  /* ---------- появление при скролле ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count, t0 = performance.now(), dur = 1800;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      en.target.querySelectorAll('[data-count]').forEach(countUp);
      if (en.target.dataset.count) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .img-reveal, .split, .orn').forEach((el) => io.observe(el));

  /* ---------- параллакс картинок ---------- */
  const para = [...document.querySelectorAll('[data-parallax], [data-speed]')];
  if (para.length && !reduce) {
    const tick = () => {
      para.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        if (el.dataset.speed) el.style.transform = `translateY(${(p * -100 * el.dataset.speed).toFixed(2)}%) scale(1.25)`;
        else el.style.transform = `translateY(${p * -12}%)`;
      });
    };
    tick();
    window.addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true });
  }

  /* ---------- магнитные кнопки и наклон карточек ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.btn').forEach((b) => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
    document.querySelectorAll('.dish, .set').forEach((c) => {
      const t = c.querySelector('.dish__img') || c;
      c.addEventListener('mousemove', (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        t.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
        t.style.setProperty('--gx', `${(x + .5) * 100}%`); t.style.setProperty('--gy', `${(y + .5) * 100}%`);
      });
      c.addEventListener('mouseleave', () => { t.style.transform = ''; });
    });
  }

  /* ---------- вкладки меню ---------- */
  const tabs = document.querySelectorAll('.tabs a');
  if (tabs.length) {
    const map = new Map();
    tabs.forEach((t) => { const s = document.querySelector(t.getAttribute('href')); if (s) map.set(s, t); });
    const tio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        tabs.forEach((t) => t.classList.remove('is-active'));
        const t = map.get(en.target);
        t.classList.add('is-active');
        t.parentElement.scrollTo({ left: t.offsetLeft - t.parentElement.clientWidth / 2 + t.clientWidth / 2, behavior: 'smooth' });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, s) => tio.observe(s));
  }

  /* ---------- открыто сейчас (Новосибирск UTC+7) ---------- */
  document.querySelectorAll('.open-now').forEach((el) => {
    const h = (new Date().getUTCHours() + 7) % 24;
    const open = h >= 12 && h < 23;
    el.classList.toggle('is-closed', !open);
    el.querySelector('span').textContent = open ? 'Сейчас открыто · до 23:00' : 'Сейчас закрыто · откроемся в 12:00';
  });

  /* ---------- искры на фоне ---------- */
  const ec = fx.querySelector('.embers');
  if (ec && !reduce) {
    const ctx = ec.getContext('2d');
    let W, H;
    const rs = () => { const d = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; ec.width = W * d; ec.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    rs(); window.addEventListener('resize', rs);
    const mk = (init) => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: .6 + Math.random() * 1.8, v: .15 + Math.random() * .45, ph: Math.random() * 6.28, a: .25 + Math.random() * .55, hue: Math.random() > .5 ? '255,120,70' : '216,166,87' });
    const ps = Array.from({ length: innerWidth < 700 ? 22 : 46 }, () => mk(true));
    (function loop() {
      if (!document.hidden) {
        ctx.clearRect(0, 0, W, H);
        ps.forEach((p, i) => {
          p.y -= p.v; p.ph += .015; p.x += Math.sin(p.ph) * .3;
          if (p.y < -10) ps[i] = mk(false);
          const fl = .6 + .4 * Math.sin(p.ph * 3);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28);
          ctx.fillStyle = `rgba(${p.hue},${p.a * fl})`;
          ctx.shadowBlur = 8; ctx.shadowColor = `rgba(${p.hue},.8)`;
          ctx.fill();
        });
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- силуэт тайги в hero ---------- */
  const taiga = document.querySelector('svg.taiga');
  if (taiga) {
    let s = 3; const rr = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const rows = [{ y: 260, h: [80, 150], n: 34, c: 'rgba(242,232,218,.05)' }, { y: 260, h: [40, 95], n: 46, c: 'rgba(242,232,218,.08)' }];
    rows.forEach((row) => {
      let d = '';
      for (let i = 0; i < row.n; i++) {
        const x = (i + rr() * .6) * (1600 / row.n), h = row.h[0] + rr() * (row.h[1] - row.h[0]), w = h * .32;
        const tiers = 4 + Math.floor(rr() * 2);
        const T = (k) => row.y - h + (h * k) / tiers, Wk = (k) => (w * k) / tiers;
        const pts = [[x, row.y - h]];
        for (let k = 1; k <= tiers; k++) { pts.push([x + Wk(k), T(k)]); if (k < tiers) pts.push([x + Wk(k) * .45, T(k)]); }
        for (let k = tiers; k >= 1; k--) { pts.push([x - Wk(k), T(k)]); if (k > 1) pts.push([x - Wk(k - 1) * .45, T(k - 1)]); }
        d += 'M' + pts.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L') + ' Z ';
      }
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', row.c); p.setAttribute('stroke-width', '1.2');
      taiga.appendChild(p);
    });
  }

  /* ============ БОРЩ: укроп, перец, параллакс, пар ============ */
  const visual = document.querySelector('.hero__visual');
  if (!visual) return;
  const NS = 'http://www.w3.org/2000/svg';
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

  // укроп: тонкие нитевидные листья
  const dill = document.getElementById('dill');
  const greens = ['#24481a', '#2f5e1f', '#3d7324', '#4a8229'];
  const sprig = (x, y, len, ang, scale) => {
    const g = el('g', { class: 'dill' }, dill);
    const inner = el('g', { transform: `translate(${x} ${y}) rotate(${ang}) scale(${scale})` }, g);
    el('path', { d: `M0 0 Q4 ${-len * .5} 0 ${-len}`, stroke: '#3a6a22', 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round' }, inner);
    const branches = 6 + Math.floor(rnd() * 3);
    for (let b = 0; b < branches; b++) {
      const t = .15 + (b / branches) * .85, by = -len * t, bx = 4 * 2 * t * (1 - t) * .5;
      const side = b % 2 ? 1 : -1, bl = (1 - t * .6) * 22;
      const ex = bx + side * bl, ey = by - bl * .5;
      el('path', { d: `M${bx} ${by} Q${(bx + ex) / 2} ${by - 2} ${ex} ${ey}`, stroke: '#3a6a22', 'stroke-width': .9, fill: 'none' }, inner);
      const leaves = 4 + Math.floor(rnd() * 3);
      for (let k = 0; k < leaves; k++) {
        const u = .3 + (k / leaves) * .7, px = bx + (ex - bx) * u, py = by + (ey - by) * u;
        const la = (side > 0 ? -40 : 220) + (rnd() - .5) * 90, ll = 6 + rnd() * 9;
        const lx = px + Math.cos(la * Math.PI / 180) * ll, ly = py + Math.sin(la * Math.PI / 180) * ll;
        el('path', { d: `M${px.toFixed(1)} ${py.toFixed(1)} Q${((px + lx) / 2 + 1.5).toFixed(1)} ${((py + ly) / 2 - 1.5).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)}`, stroke: greens[Math.floor(rnd() * 4)], 'stroke-width': 1.1 + rnd() * .6, fill: 'none', 'stroke-linecap': 'round' }, inner);
      }
    }
  };
  if (dill) {
    sprig(386, 392, 64, -38, 1.05);
    sprig(416, 396, 58, 34, 1);
    sprig(400, 380, 50, 2, .95);
    sprig(296, 488, 44, -125, .85);
    sprig(522, 322, 38, 62, .8);
  }

  // перец и крошки вокруг тарелки
  const specks = document.getElementById('specks');
  if (specks) for (let i = 0; i < 150; i++) {
    const a = rnd() * Math.PI * 2, r = 305 + Math.pow(rnd(), 1.6) * 110;
    const dark = rnd() > .45;
    el('circle', { cx: 400 + Math.cos(a) * r, cy: 400 + Math.sin(a) * r * .95, r: dark ? .8 + rnd() * 2.2 : .5 + rnd() * 1.3, fill: dark ? '#2a1d17' : 'rgba(242,232,218,.55)', opacity: .5 + rnd() * .5 }, specks);
  }

  // параллакс и наклон
  const layers = visual.querySelectorAll('[data-depth]');
  let mx = 0, my = 0, ex = 0, ey = 0;
  if (!reduce) {
    window.addEventListener('mousemove', (e) => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2; });
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      mx = Math.max(-1, Math.min(1, e.gamma / 30)); my = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
    });
  }

  // пар
  const cvs = visual.querySelector('canvas.steam');
  const ctx = cvs.getContext('2d');
  let W, H;
  const resize = () => { const d = Math.min(devicePixelRatio || 1, 2); W = cvs.clientWidth; H = cvs.clientHeight; cvs.width = W * d; cvs.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  resize(); window.addEventListener('resize', resize);
  const puff = document.createElement('canvas'); puff.width = puff.height = 128;
  const pc = puff.getContext('2d'); const grd = pc.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,248,240,.55)'); grd.addColorStop(.45, 'rgba(255,240,230,.18)'); grd.addColorStop(1, 'rgba(255,240,230,0)');
  pc.fillStyle = grd; pc.fillRect(0, 0, 128, 128);
  const parts = [];
  const spawn = (init) => {
    const bx = W * .5, by = H * (.6 / 1.1);
    const a = Math.random() * Math.PI * 2, r = Math.random() * W * .18;
    return { x: bx + Math.cos(a) * r, y: by + Math.sin(a) * r * .8, vy: -(.25 + Math.random() * .45), vx: (Math.random() - .5) * .2, s: 30 + Math.random() * 50, life: init ? Math.random() : 0, ph: Math.random() * 6.28, spd: .0025 + Math.random() * .003 };
  };
  for (let i = 0; i < (innerWidth < 700 ? 26 : 42); i++) parts.push(spawn(true));
  let started = false, t0 = performance.now(), onScreen = true;
  document.addEventListener('bb:loaded', () => setTimeout(() => { started = true; }, reduce ? 0 : 1800));
  new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; }).observe(visual);

  (function frame(now) {
    const dt = Math.min(50, now - t0) / 16.67; t0 = now;
    if (onScreen) {
      ex += (mx - ex) * .06; ey += (my - ey) * .06;
      visual.style.transform = `perspective(1400px) rotateX(${(-ey * 8).toFixed(2)}deg) rotateY(${(ex * 10).toFixed(2)}deg)`;
      layers.forEach((l) => { const d = +l.dataset.depth; l.style.transform = `translate(${(ex * d * 18).toFixed(2)}px, ${(ey * d * 18).toFixed(2)}px)`; });
      ctx.clearRect(0, 0, W, H);
      if (started && !reduce) {
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          p.life += p.spd * dt;
          if (p.life >= 1) { parts[i] = spawn(false); continue; }
          p.ph += .02 * dt;
          p.x += (p.vx + Math.sin(p.ph) * .35 + ex * .15) * dt; p.y += p.vy * dt;
          const size = p.s * (1 + p.life * 2.2);
          ctx.globalAlpha = Math.sin(p.life * Math.PI) * .2;
          ctx.drawImage(puff, p.x - size / 2, p.y - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
      }
    }
    requestAnimationFrame(frame);
  })(t0);
})();
