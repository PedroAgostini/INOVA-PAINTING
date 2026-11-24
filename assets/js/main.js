(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* header + mobile menu */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menuBtn = $('.menu-btn'), mnav = $('#mnav');
  const setMenu = open => { mnav.hidden = !open; menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  menuBtn.addEventListener('click', () => setMenu(mnav.hidden));
  $$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); menuBtn.focus(); } });

  /* active nav link */
  const links = $$('.nav a');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['services', 'work', 'reviews', 'about', 'process'].forEach(id => { const el = document.getElementById(id); el && io.observe(el); });

  /* services tabs */
  const items = $$('.svc-item'), imgs = $$('.svc-media img'), tags = $$('.svc-tags');
  let activeService = 'Interior Painting';
  const selectSvc = i => {
    items.forEach((b, j) => { b.classList.toggle('is-active', j === i); b.setAttribute('aria-selected', j === i); b.tabIndex = j === i ? 0 : -1; });
    imgs.forEach((im, j) => im.classList.toggle('is-on', j === i));
    tags.forEach((t, j) => t.hidden = j !== i);
    activeService = items[i].dataset.service;
  };
  items.forEach((b, i) => {
    b.addEventListener('click', () => selectSvc(i));
    b.addEventListener('mouseenter', () => matchMedia('(hover:hover)').matches && selectSvc(i));
    b.addEventListener('keydown', e => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); const n = (i + k + items.length) % items.length; selectSvc(n); items[n].focus(); }
    });
  });
  const select = $('#service-select');
  $('[data-service-cta]')?.addEventListener('click', () => { select.value = activeService; });

  /* before / after paint reveal */
  const rv = $('[data-reveal]');
  if (rv) {
    const before = $('.reveal-before', rv), cv = $('.reveal-canvas', rv), ctx = cv.getContext('2d');
    const mask = document.createElement('canvas'), mctx = mask.getContext('2d');
    const img = new Image(); img.src = before.currentSrc || before.src;
    let w = 0, h = 0, dpr = 1, ready = false, last = null;
    const size = () => {
      const r = rv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
      const old = document.createElement('canvas'); old.width = mask.width; old.height = mask.height; if (mask.width) old.getContext('2d').drawImage(mask, 0, 0);
      w = r.width; h = r.height; cv.width = mask.width = w * dpr; cv.height = mask.height = h * dpr;
      if (old.width) mctx.drawImage(old, 0, 0, mask.width, mask.height); draw();
    };
    const draw = () => {
      if (!ready) return;
      const W = cv.width, H = cv.height, s = Math.max(W / img.width, H / img.height), iw = img.width * s, ih = img.height * s;
      ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
      ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0);
    };
    const dab = (x, y, r) => {
      const g = mctx.createRadialGradient(x, y, r * .35, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g; mctx.beginPath(); mctx.arc(x, y, r, 0, Math.PI * 2); mctx.fill();
    };
    const stroke = (x, y) => {
      const r = Math.max(w, h) * .085 * dpr; x *= dpr; y *= dpr;
      if (last) { const d = Math.hypot(x - last.x, y - last.y), n = Math.ceil(d / (r * .25)); for (let i = 1; i <= n; i++) dab(last.x + (x - last.x) * i / n, last.y + (y - last.y) * i / n, r); }
      else dab(x, y, r);
      last = { x, y }; draw();
    };
    const roller = (to, dur, cb) => { // a vertical roller pass sweeping left → right
      const t0 = performance.now(), from = rv._rollX || 0;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3), x = (from + (to - from) * e) * mask.width;
        const g = mctx.createLinearGradient(x - 60 * dpr, 0, x, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        mctx.fillStyle = '#000'; mctx.fillRect(0, 0, Math.max(0, x - 60 * dpr), mask.height); mctx.fillStyle = g; mctx.fillRect(x - 60 * dpr, 0, 60 * dpr, mask.height);
        rv._rollX = from + (to - from) * e; draw(); if (p < 1) requestAnimationFrame(step); else cb && cb();
      };
      requestAnimationFrame(step);
    };
    img.onload = () => { ready = true; size(); };
    new ResizeObserver(() => ready && size()).observe(rv);
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    rv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) stroke(...pos(e)); });
    rv.addEventListener('pointerdown', e => { last = null; stroke(...pos(e)); });
    rv.addEventListener('pointerleave', () => last = null);
    $('[data-reveal-all]', rv).addEventListener('click', e => { e.stopPropagation(); rv._rollX = 0; roller(1.08, reduce ? 1 : 900); });
    $('[data-reveal-reset]', rv).addEventListener('click', e => { e.stopPropagation(); mctx.clearRect(0, 0, mask.width, mask.height); rv._rollX = 0; draw(); });
    new IntersectionObserver((es, o) => es.forEach(en => { if (en.isIntersecting && ready) { roller(.55, reduce ? 1 : 1600); o.disconnect(); } }), { threshold: .5 }).observe(rv);
  }

  /* campaign attribution: keep UTM / click ids from the landing page for the whole session */
  const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];
  try {
    const q = new URLSearchParams(location.search), found = {};
    ATTR_KEYS.forEach(k => { if (q.get(k)) found[k] = q.get(k); });
    if (Object.keys(found).length) sessionStorage.setItem('inova-attr', JSON.stringify({ ...found, landing_page: location.href }));
  } catch (e) {}
  const attribution = () => { try { return JSON.parse(sessionStorage.getItem('inova-attr') || '{}'); } catch (e) { return {}; } };

  /* service-area ZIPs: tag leads with town and whether they fall inside the area */
  const AREA_ZIPS = { '02053': 'Medway', '02038': 'Franklin', '02054': 'Millis', '01746': 'Holliston', '01757': 'Milford', '02019': 'Bellingham',
    '02056': 'Norfolk', '01748': 'Hopkinton', '01721': 'Ashland', '01770': 'Sherborn', '02081': 'Walpole', '02071': 'Walpole', '01760': 'Natick' };
  const zipArea = z => { const k = String(z || '').slice(0, 5), town = AREA_ZIPS[k]; return { town: town || null, in_service_area: !!town }; };

  /* quote form */
  const form = $('#quote-form');
  if (form) {
    const body = $('.form-body', form), done = $('.form-done', form), err = $('.form-error', form), btn = $('button[type=submit]', form), lbl = $('.lbl', btn);
    const check = f => { const ok = f.checkValidity(); f.closest('.field')?.classList.toggle('invalid', !ok); return ok; };
    /* input masks: US phone (XXX) XXX-XXXX, tidy email / name / town */
    const phone = form.querySelector('[name=phone]');
    const digitsOf = v => { let d = v.replace(/\D/g, ''); if (d.length > 10 && d[0] === '1') d = d.slice(1); return d.slice(0, 10); };
    const fmtPhone = d => !d ? '' : d.length < 4 ? '(' + d : d.length < 7 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    if (phone) {
      phone.addEventListener('input', e => {
        const el = e.target, caret = el.selectionStart ?? el.value.length;
        const before = el.value.slice(0, caret).replace(/\D/g, '').length;
        const d = digitsOf(el.value), out = fmtPhone(d);
        if (out === el.value) return;
        el.value = out;
        let pos = 0, seen = 0;
        while (pos < out.length && seen < before) { if (/\d/.test(out[pos])) seen++; pos++; }
        if (e.inputType && e.inputType.startsWith('delete') && pos < out.length && !/\d/.test(out[pos - 1] || '')) pos = Math.max(0, pos);
        try { el.setSelectionRange(pos, pos); } catch (x) {}
      });
      phone.addEventListener('paste', () => requestAnimationFrame(() => { phone.value = fmtPhone(digitsOf(phone.value)); }));
    }
    const tidy = (name, fn) => { const el = form.querySelector(`[name=${name}]`); el && el.addEventListener('blur', () => { el.value = fn(el.value); }); };
    tidy('email', v => v.trim().toLowerCase());
    tidy('name', v => v.replace(/\s+/g, ' ').trim());
    const zip = form.querySelector('[name=zip]');
    if (zip) zip.addEventListener('input', () => {
      const out = zip.value.replace(/\D/g, '').slice(0, 5);
      if (out !== zip.value) zip.value = out;
    });

    $$('input,select', form).forEach(f => f.addEventListener('blur', () => f.value && check(f)));
    $$('input,select', form).forEach(f => f.addEventListener('input', () => f.closest('.field.invalid') && check(f)));
    form.addEventListener('submit', async e => {
      e.preventDefault(); err.hidden = true;
      const fields = $$('input:not([type=hidden]):not(.hp),select', form); const bad = fields.filter(f => !check(f));
      if (bad.length) { bad[0].focus(); return; }
      btn.disabled = true; lbl.textContent = 'Sending…';
      try {
        const data = new FormData(form);
        const lead = {
          form_id: form.dataset.formId || 'form01',
          source: location.hostname,
          page: location.href,
          referrer: document.referrer || null,
          name: data.get('name'), phone: data.get('phone'), phone_e164: '+1' + String(data.get('phone') || '').replace(/\D/g, '').slice(-10), email: data.get('email') || null,
          zip: data.get('zip'), ...zipArea(data.get('zip')), service: data.get('service'), message: data.get('message') || null,
          ...attribution(),
          submitted_at: new Date().toISOString()
        };
        const toWeb3 = data.get('access_key') && data.get('access_key') !== 'YOUR_WEB3FORMS_ACCESS_KEY'
          ? fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
              .then(r => r.json()).then(r => { if (!r.success) throw new Error(r.message); })
          : Promise.reject(new Error('Web3Forms key missing'));
        const toHook = form.dataset.webhook
          ? fetch(form.dataset.webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead), keepalive: true })
              .then(r => { if (!r.ok) throw new Error('Webhook ' + r.status); })
          : Promise.reject(new Error('Webhook missing'));
        const results = await Promise.allSettled([toWeb3, toHook]);
        results.forEach((r, i) => r.status === 'rejected' && console.warn('[Inova] lead delivery failed:', ['Web3Forms', 'Webhook'][i], r.reason));
        if (!results.some(r => r.status === 'fulfilled')) throw new Error('No delivery channel succeeded');
        body.hidden = true; done.hidden = false; done.focus();
        window.gtag?.('event', 'generate_lead', { service: lead.service, form_id: lead.form_id });
        window.fbq?.('track', 'Lead', { content_name: lead.service });
      } catch (x) { err.hidden = false; lbl.textContent = 'Send My Quote Request'; btn.disabled = false; }
    });
  }

  /* split headings into masked words */
  $$('[data-split]').forEach(el => {
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return; if (/^\s+$/.test(t)) { frag.append(' '); return; }
          const m = document.createElement('span'); m.className = 'wm'; const i = document.createElement('span'); i.className = 'wi'; i.textContent = t; m.append(i); frag.append(m);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) walk(c);
    });
    el.setAttribute('aria-label', el.textContent.trim()); walk(el);
    $$('.wm', el).forEach(m => m.setAttribute('aria-hidden', 'true'));
  });

  /* motion */
  const start = () => {
    if (!window.gsap || reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      const lenis = new Lenis({ lerp: .11 });
      lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href'); const t = id.length > 1 && $(id); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -80, duration: 1.4 }); } }));
    }
    const ease = 'expo.out';
    // hero: the room comes into focus, then the words rise
    const hero = $('.hero');
    const tl = gsap.timeline({ defaults: { ease } });
    tl.from('.frame-bg img', { scale: 1.18, filter: 'blur(10px) saturate(.22) contrast(1.04) brightness(.98)', duration: 2.4 })
      .from('.hero-title .wi', { yPercent: 115, duration: 1.3, stagger: .045 }, .25)
      .from($$('[data-fade]', hero), { y: 26, opacity: 0, filter: 'blur(6px)', duration: 1.2, stagger: .12 }, .7)
      .from('.laurels li', { scale: .85, opacity: 0, duration: 1, stagger: .1 }, 1.1);
    gsap.to('.frame-bg img', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    if (matchMedia('(min-width: 901px)').matches) gsap.to('.hero-in', { y: -80, opacity: .15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    // headings
    $$('[data-split]').forEach(h => { if (hero.contains(h)) return;
      gsap.from($$('.wi', h), { yPercent: 115, duration: 1.2, ease, stagger: .05, scrollTrigger: { trigger: h, start: 'top 86%' } }); });
    // fades
    $$('[data-fade]').forEach(el => { if (hero.contains(el)) return;
      gsap.from(el, { y: 30, opacity: 0, duration: 1.1, ease, scrollTrigger: { trigger: el, start: 'top 90%' } }); });
    // signature: roller-pass wipe on photographs
    $$('[data-wipe]').forEach((f, i) => {
      gsap.fromTo(f, { clipPath: 'inset(0 100% 0 0 round 24px)' }, { clipPath: 'inset(0 0% 0 0 round 24px)', duration: 1.5, ease: 'expo.inOut', delay: (i % 4) * .08, scrollTrigger: { trigger: f, start: 'top 85%' } });
      gsap.from($('img', f), { scale: 1.25, duration: 2, ease, scrollTrigger: { trigger: f, start: 'top 85%' } });
    });
    gsap.from('.svc-media', { clipPath: 'inset(0 100% 0 0 round 24px)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.svc', start: 'top 75%' } });
    gsap.from('.svc-item', { x: -30, opacity: 0, duration: 1, ease, stagger: .08, scrollTrigger: { trigger: '.svc', start: 'top 75%' } });
    gsap.from('.steps-line', { scaleX: 0, transformOrigin: 'left center', ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 60%', scrub: true } });
    gsap.from('.step-n', { scale: 0, duration: .9, ease: 'back.out(2)', stagger: .2, scrollTrigger: { trigger: '.steps', start: 'top 75%' } });
    gsap.from('.why', { clipPath: 'inset(8% 6% 8% 6% round 48px)', ease: 'none', scrollTrigger: { trigger: '.why-wrap', start: 'top bottom', end: 'top 30%', scrub: true } });
    gsap.from('.marquee-track', { opacity: 0, duration: 1.2, delay: .8 });
  };
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
})();

/* thumbnail carousel: spring + drag (port of framer-thumbnail-carousel) */
(() => {
  const root = document.querySelector('[data-carousel]'); if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const main = root.querySelector('.tc-main'), track = root.querySelector('.tc-track');
  const slides = [...root.querySelectorAll('.tc-slide')], prev = root.querySelector('.tc-prev'), next = root.querySelector('.tc-next');
  const count = root.querySelector('.tc-count'), strip = root.querySelector('.tc-thumbs'), stripIn = root.querySelector('.tc-thumbs-in');
  const FULL = 120, COLLAPSED = 35, GAP = 4, MARGIN = 2, last = slides.length - 1;
  let index = 0, x = 0, v = 0, raf = 0, drag = null;

  const thumbs = slides.map((s, i) => {
    const im = s.querySelector('img'), b = document.createElement('button');
    b.type = 'button'; b.className = 'tc-thumb'; b.setAttribute('aria-label', `Show photo ${i + 1}: ${im.alt}`);
    const thumbnail = document.createElement('img');
    thumbnail.src = im.dataset.thumb || im.src;
    thumbnail.alt = ''; thumbnail.loading = 'lazy'; thumbnail.decoding = 'async';
    thumbnail.width = 240; thumbnail.height = 160;
    b.append(thumbnail);
    b.addEventListener('click', () => go(i)); stripIn.append(b); return b;
  });

  const W = () => main.offsetWidth || 1;
  const paint = () => { track.style.transform = `translate3d(${x}px,0,0)`; };
  const spring = () => {
    cancelAnimationFrame(raf);
    const target = -index * W();
    if (reduce) { x = target; v = 0; paint(); return; }
    let t0 = performance.now();
    const step = now => {
      const dt = Math.min(.032, (now - t0) / 1000); t0 = now;
      const a = -300 * (x - target) - 30 * v; v += a * dt; x += v * dt; paint();
      if (Math.abs(x - target) > .5 || Math.abs(v) > 5) raf = requestAnimationFrame(step); else { x = target; v = 0; paint(); }
    };
    raf = requestAnimationFrame(step);
  };
  const sync = () => {
    prev.disabled = index === 0; next.disabled = index === last;
    count.textContent = `${index + 1} / ${slides.length}`;
    slides.forEach((s, i) => s.setAttribute('aria-hidden', i !== index));
    thumbs.forEach((t, i) => { t.classList.toggle('is-active', i === index); t.setAttribute('aria-current', i === index); });
    const left = index * (COLLAPSED + GAP) + MARGIN - (strip.offsetWidth / 2 - FULL / 2);
    strip.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
  };
  const go = i => { index = Math.max(0, Math.min(last, i)); sync(); spring(); };

  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  main.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); } if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); } });

  main.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || e.button !== 0) return;
    cancelAnimationFrame(raf);
    drag = { x0: e.clientX, y0: e.clientY, base: x, t: performance.now(), lx: e.clientX, vx: 0, locked: false, id: e.pointerId };
  });
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.locked) { if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) { drag = null; return; } if (Math.abs(dx) < 6) return; drag.locked = true; main.classList.add('dragging'); main.setPointerCapture?.(e.pointerId); }
    const now = performance.now(), dt = Math.max(1, now - drag.t); drag.vx = (e.clientX - drag.lx) / dt * 1000; drag.lx = e.clientX; drag.t = now;
    let nx = drag.base + dx; const min = -last * W();
    if (nx > 0) nx *= .2; else if (nx < min) nx = min + (nx - min) * .2; // dragElastic 0.2
    x = nx; paint();
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; main.classList.remove('dragging'); if (!d.locked) return;
    const offset = e.clientX - d.x0; let n = index;
    if (Math.abs(d.vx) > 500) n = d.vx > 0 ? index - 1 : index + 1;
    else if (Math.abs(offset) > W() * .3) n = offset > 0 ? index - 1 : index + 1;
    v = d.vx; go(n);
  };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  new ResizeObserver(() => { x = -index * W(); paint(); }).observe(main);
  sync();
})();

/* service area map (Leaflet, lazy-loaded) */
(() => {
  const el = document.getElementById('area-map'); if (!el) return;
  const btns = [...document.querySelectorAll('.area-list [data-town]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HQ = [42.1417, -71.3967];
  const miles = (a, b) => { const R = 3958.8, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  btns.forEach(b => { if (b.dataset.town === 'Medway') return; const d = miles(HQ, [+b.dataset.lat, +b.dataset.lng]);
    b.insertAdjacentHTML('beforeend', `<span class="mi">${Math.max(1, Math.round(d))} mi</span>`); });
  const curve = (a, b, bend = .18) => { // gentle arc from a to b
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
    const c = [mx - dy * bend, my + dx * bend], pts = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24, u = 1 - t; pts.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
    return pts;
  };
  const init = () => {
    const small = matchMedia('(max-width: 900px)').matches;
    const map = L.map(el, { center: HQ, zoom: 11, scrollWheelZoom: false, zoomControl: false, dragging: !small, tap: false });
    L.control.zoom({ position: small ? 'topright' : 'bottomright' }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16, attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors' }).addTo(map);
    [[32187, '20 mi'], [16093, '10 mi']].forEach(([r, label], i) => {
      L.circle(HQ, { radius: r, color: '#7FB6DD', weight: 1.5, opacity: .7, dashArray: '4 8', fillColor: '#2F7EB7', fillOpacity: i ? .1 : .06, interactive: false }).addTo(map);
      const top = [HQ[0] + r / 111320, HQ[1]];
      L.marker(top, { interactive: false, keyboard: false, icon: L.divIcon({ className: '', html: `<div class="ring-label">${label}</div>`, iconSize: [0, 0] }) }).addTo(map);
    });
    const pins = {};
    btns.forEach((b, i) => {
      const t = b.dataset.town, ll = [+b.dataset.lat, +b.dataset.lng];
      if (t === 'Medway') {
        pins[t] = L.marker(ll, { zIndexOffset: 1000, title: 'Inova Painting Corp headquarters, Medway', icon: L.divIcon({ className: '', iconSize: [0, 0],
          html: '<div class="hq-pin"><div class="hq-dot"><img src="assets/img/ICONE-W.svg" alt=""></div><b>Inova HQ</b></div>' }) }).addTo(map);
      } else {
        L.polyline(curve(HQ, ll, i % 2 ? .16 : -.16), { color: '#9ACBEB', weight: 1.6, opacity: .85, className: 'route', interactive: false }).addTo(map);
        pins[t] = L.marker(ll, { title: t, icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="town-pin" style="transition-delay:${i * 60}ms"><i></i><b>${t}</b></div>` }) }).addTo(map);
      }
      const hot = on => { b.classList.toggle('is-hot', on); pins[t].getElement()?.querySelector('.town-pin')?.classList.toggle('is-hot', on); };
      const fly = () => map.flyTo(ll, 13, { duration: reduce ? 0 : 1.2 });
      b.addEventListener('mouseenter', () => hot(true)); b.addEventListener('mouseleave', () => hot(false));
      b.addEventListener('focus', () => hot(true)); b.addEventListener('blur', () => hot(false));
      b.addEventListener('click', fly);
      pins[t].on('mouseover', () => hot(true)).on('mouseout', () => hot(false)).on('click', () => { if (small) { el.querySelectorAll('.town-pin.show').forEach(x => x.classList.remove('show')); pins[t].getElement()?.querySelector('.town-pin')?.classList.add('show'); return; } fly(); b.focus({ preventScroll: true }); });
    });
    const bounds = L.latLngBounds(btns.map(b => [+b.dataset.lat, +b.dataset.lng]));
    const fit = () => map.fitBounds(bounds, { paddingTopLeft: [innerWidth > 900 ? Math.min(470, el.offsetWidth * .42) : 24, innerWidth > 900 ? 50 : 30], paddingBottomRight: [innerWidth > 900 ? 50 : 24, innerWidth > 900 ? 50 : 70] });
    fit(); addEventListener('resize', () => { clearTimeout(fit.t); fit.t = setTimeout(() => { map.invalidateSize(); fit(); }, 200); });
    requestAnimationFrame(() => setTimeout(() => el.classList.add('is-in'), 150));
  };
  const load = () => {
    if (window.L) return init();
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.onload = init; document.head.append(s);
  };
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); load(); } }, { rootMargin: '400px' }).observe(el);
})();

/* watermark parallax */
addEventListener('load', () => {
  if (!window.gsap || !window.ScrollTrigger || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.wm-bg').forEach(sec => gsap.fromTo(sec, { '--wm-y': '-60px' }, { '--wm-y': '60px', ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.from('.ft-wm', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.ft', start: 'top 85%' } });
});

/* services auto-rotate, synced to the progress bar */
(() => {
  const svc = document.querySelector('.svc'); if (!svc || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const items = [...svc.querySelectorAll('.svc-item')];
  new IntersectionObserver(([e]) => svc.classList.toggle('running', e.isIntersecting), { threshold: .35 }).observe(svc);
  svc.addEventListener('animationend', e => {
    if (e.animationName !== 'svcProg' || svc.classList.contains('manual')) return;
    const i = items.findIndex(b => b.classList.contains('is-active'));
    items[(i + 1) % items.length].click();
  });
  svc.addEventListener('click', e => { if (e.isTrusted && e.target.closest('.svc-item')) svc.classList.add('manual'); });
  svc.addEventListener('pointerenter', () => svc.classList.add('paused'));
  svc.addEventListener('pointerleave', () => svc.classList.remove('paused'));
  svc.addEventListener('focusin', () => svc.classList.add('paused'));
  svc.addEventListener('focusout', () => svc.classList.remove('paused'));
})();

/* no orphans: glue the last two words of every text block with a non-breaking space */
(() => {
  const sel = 'h1,h2,h3,h4,p,li,figcaption,summary,small,.svc-desc,.svc-name,.laurels strong,.tc-slide figcaption';
  document.querySelectorAll('[data-split]').forEach(el => {
    const ws = [...el.querySelectorAll('.wm')], a = ws[ws.length - 2], b = ws[ws.length - 1];
    if (!a || !b || a.parentNode !== b.parentNode) return;
    const g = document.createElement('span'); g.style.whiteSpace = 'nowrap'; a.before(g);
    let n = a; while (n) { const nx = n.nextSibling; g.append(n); if (n === b) break; n = nx; }
  });
  document.querySelectorAll(sel).forEach(el => {
    if (el.closest('.marquee,.leaflet-container,.font-test') || el.hasAttribute('data-split')) return;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    if ((el.textContent.trim().match(/\s+/g) || []).length < 2) return; // 1–2 words: nothing to glue
    for (let i = nodes.length - 1; i >= 0; i--) {
      const t = nodes[i].nodeValue, trimmed = t.replace(/\s+$/, '');
      const k = trimmed.lastIndexOf(' ');
      if (k > -1) { nodes[i].nodeValue = trimmed.slice(0, k) + '\u00A0' + trimmed.slice(k + 1) + t.slice(trimmed.length); break; }
      if (/^\s+$/.test(t) && i > 0 && i < nodes.length - 1) { nodes[i].nodeValue = '\u00A0'; break; }
    }
  });
})();

/* services: swipeable cards on mobile, built from the desktop markup */
(() => {
  const svc = document.querySelector('.svc'); if (!svc) return;
  const items = [...svc.querySelectorAll('.svc-item')], imgs = [...svc.querySelectorAll('.svc-media img')], tags = [...svc.querySelectorAll('.svc-tags')];
  const wrap = document.createElement('div'); wrap.className = 'svc-mobile';
  const track = document.createElement('div'); track.className = 'svc-cards';
  items.forEach((b, i) => {
    const card = document.createElement('article'); card.className = 'svc-card';
    const chips = [...(tags[i]?.querySelectorAll('li') || [])].map(li => `<li>${li.innerHTML}</li>`).join('');
    const nb = t => t.replace(/(\w)-(\w)/g, '$1‑$2');
    const photo = imgs[i].cloneNode(false);
    photo.removeAttribute('class');
    photo.sizes = '(max-width: 600px) 86vw, 80vw';
    photo.loading = 'lazy'; photo.decoding = 'async';
    card.innerHTML = `<figure class="svc-card-fig">${photo.outerHTML}<figcaption><h3>${b.querySelector('.svc-name').textContent}</h3></figcaption></figure>
      <div class="svc-card-b"><p>${nb(b.querySelector('.svc-desc').textContent)}</p>
      <ul class="svc-card-tags">${chips}</ul>
      <a class="btn btn-blue btn-full" href="#quote" data-svc-pick="${b.dataset.service}">Book This Service <svg class="ic"><use href="#i-arrow"/></svg></a></div>`;
    track.append(card);
  });
  const dots = document.createElement('div'); dots.className = 'svc-dots';
  dots.innerHTML = items.map((b, i) => `<button type="button" aria-label="Show ${b.dataset.service}"${i ? '' : ' aria-current="true"'}></button>`).join('');
  const nav = document.createElement('div'); nav.className = 'svc-nav';
  nav.innerHTML = '<button type="button" class="svc-prev" aria-label="Previous service"><svg class="ic"><use href="#i-left"/></svg></button>';
  nav.append(dots);
  nav.insertAdjacentHTML('beforeend', '<button type="button" class="svc-next" aria-label="Next service"><svg class="ic"><use href="#i-right"/></svg></button>');
  wrap.append(track, nav); svc.after(wrap);
  const cards = [...track.children], btns = [...dots.children];
  const go = i => { i = Math.max(0, Math.min(cards.length - 1, i)); track.scrollTo({ left: cards[i].offsetLeft - (track.clientWidth - cards[i].offsetWidth) / 2, behavior: 'smooth' }); };
  const cur = () => Math.max(0, btns.findIndex(d => d.hasAttribute('aria-current')));
  nav.querySelector('.svc-prev').addEventListener('click', () => go(cur() - 1));
  nav.querySelector('.svc-next').addEventListener('click', () => go(cur() + 1));
  btns.forEach((d, i) => d.addEventListener('click', () => track.scrollTo({ left: cards[i].offsetLeft - (track.clientWidth - cards[i].offsetWidth) / 2, behavior: 'smooth' })));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.intersectionRatio > .6) { const k = cards.indexOf(e.target); btns.forEach((d, j) => d.toggleAttribute('aria-current', k === j)); } }), { root: track, threshold: [.6] });
  cards.forEach(c => io.observe(c));
  track.addEventListener('click', e => { const a = e.target.closest('[data-svc-pick]'); if (a) { const s = document.getElementById('service-select'); if (s) s.value = a.dataset.svcPick; } });
})();

/* reviews carousel */
(() => {
  const root = document.querySelector('[data-rv]'); if (!root) return;
  const track = root.querySelector('.rv-track'), bar = root.querySelector('.rv-progress span');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step = () => { const c = track.querySelector('.rv-card'); if (!c) return 300; const gap = parseFloat(getComputedStyle(track).gap) || 18; const per = Math.max(1, Math.floor((track.clientWidth + gap) / (c.offsetWidth + gap)) - (innerWidth > 700 ? 0 : 0)); return per * (c.offsetWidth + gap); };
  const max = () => track.scrollWidth - track.clientWidth;
  const move = dir => { if (dir > 0 && track.scrollLeft >= max() - 4) track.scrollTo({ left: 0 }); else track.scrollBy({ left: dir * step() }); };
  root.querySelector('.rv-prev').addEventListener('click', () => { stop(); move(-1); });
  root.querySelector('.rv-next').addEventListener('click', () => { stop(); move(1); });
  const prog = () => { const vis = track.clientWidth / track.scrollWidth; bar.style.width = Math.max(8, (vis + (1 - vis) * (track.scrollLeft / (max() || 1))) * 100) + '%'; };
  track.addEventListener('scroll', prog, { passive: true }); addEventListener('resize', prog); prog();
  const clampCheck = () => root.querySelectorAll('.rv-card').forEach(c => { const t = c.querySelector('.rv-text'), b = c.querySelector('.rv-more'); if (!c.classList.contains('open')) b.hidden = t.scrollHeight <= t.clientHeight + 2; });
  root.addEventListener('click', e => { const b = e.target.closest('.rv-more'); if (!b) return; stop(); const c = b.closest('.rv-card'); c.classList.toggle('open'); b.textContent = c.classList.contains('open') ? 'Show less' : 'Read more'; });
  if (document.fonts) document.fonts.ready.then(clampCheck); clampCheck(); addEventListener('resize', clampCheck);
  let timer = 0, stopped = reduce, paused = false, visible = false;
  const tick = () => { if (!stopped && !paused && visible) move(1); };
  const stop = () => { stopped = true; clearInterval(timer); };
  ['pointerenter', 'focusin', 'touchstart'].forEach(ev => root.addEventListener(ev, () => paused = true, { passive: true }));
  ['pointerleave', 'focusout'].forEach(ev => root.addEventListener(ev, () => paused = false));
  track.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stop(); }, { passive: true });
  track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { stop(); move(1); } if (e.key === 'ArrowLeft') { stop(); move(-1); } });
  new IntersectionObserver(([e]) => visible = e.isIntersecting, { threshold: .3 }).observe(root);
  if (!reduce) timer = setInterval(tick, 5000);
})();
