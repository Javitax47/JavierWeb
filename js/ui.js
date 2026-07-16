
function initHero() {
  const tl = document.getElementById('hero-tagline');
  if (tl) {
    const lang = document.documentElement.dataset.lang || 'es';
    const n = 0;   // slogan unico (antes rotaba 0-2 al azar)
    tl.dataset.variant = String(n);
    const v = tl.getAttribute('data-' + lang + '-' + n);
    if (v) tl.innerHTML = v;
  }
  const NOISE = '▓░▒█▐▌│┤╡╢╣╗╝┐└┴┬├─┼═╬ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$';
  function compileEl(el) {
    if (el.dataset.compiled) return; el.dataset.compiled = '1';
    const orig = el.textContent, len = orig.length;
    const dur = +(el.dataset.compileDur || 380);
    const delay = +(el.dataset.compileDelay || 0);
    el.style.opacity = '1';
    const useTypewriter = Math.random() < 0.5;
    function run() {
      if (useTypewriter) {
        let i = 0;
        const interval = Math.max(5, (dur * 0.6) / len);
        el.textContent = '█';
        function step() {
          if (i >= len) { el.textContent = orig; return; }
          i++; el.textContent = orig.slice(0, i) + '█';
          setTimeout(step, interval + (Math.random() * interval * 0.4));
        }
        step();
      } else {
        const slowDur = dur * 1.6;
        const t0 = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - t0) / dur);
          const resolved = Math.floor(Math.pow(p, 0.55) * len);
          if (p >= 1) { el.textContent = orig; return; }
          let s = '';
          for (let i = 0; i < len; i++) s += (i < resolved || final[i] === ' ') ? final[i] : NOISE[Math.floor(Math.random() * NOISE.length)];
          el.textContent = s;
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    }
    if (delay > 0) setTimeout(run, delay); else run();
  }
  const cio = new IntersectionObserver(entries => entries.forEach(e => { if (!e.isIntersecting) return; compileEl(e.target); cio.unobserve(e.target); }), { threshold: 0.15 });
  document.querySelectorAll('[data-compile]').forEach(el => { el.style.opacity = '0'; cio.observe(el); });
  window.__rearm_compile = function (el) {
    delete el.dataset.compiled; el.style.opacity = '0'; el.classList.remove('compile-done'); cio.observe(el);
  };

  initWaveform();
  initAccordion();

  // Bota el primer proyecto expandido por defecto inmediatamente
  const defaultPanel = document.querySelector('.project-item.is-expanded .proj-panel');
  if (defaultPanel) {
    defaultPanel.classList.add('booted');
    initVis(defaultPanel);
    if (typeof initMediaMosaic === 'function') {
      try { initMediaMosaic(defaultPanel); } catch (e) { }
    }
  }

  const pio = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const panel = e.target;
    const item = panel.closest('.project-item');
    if (item && !item.classList.contains('is-expanded')) return;
    const fill = panel.querySelector('.proj-boot-fill');
    if (fill) { requestAnimationFrame(() => { fill.style.width = '100%'; }); }
    setTimeout(() => {
      panel.classList.add('booted');
      initVis(panel);
      if (typeof initMediaMosaic === 'function') {
        try { initMediaMosaic(panel); } catch (err) { console.warn('[media-mosaic] init failed', err); }
      }
    }, 440);
    pio.unobserve(panel);
  }), { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.proj-panel').forEach(p => pio.observe(p));
}

function initAccordion() {
  const items = document.querySelectorAll('.project-item');
  items.forEach(item => {
    const row = item.querySelector('.project-row');
    const wrap = item.querySelector('.project-details-wrap');
    const content = item.querySelector('.project-details-content');
    if (!row || !wrap || !content) return;

    row.addEventListener('mousemove', (e) => {
      const rect = row.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      item.style.setProperty('--mouse-x', `${x}%`);
      item.style.setProperty('--mouse-y', `${y}%`);
    });

    row.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = item.classList.contains('is-expanded');

      let activeItem = null;
      items.forEach(otherItem => {
        if (otherItem.classList.contains('is-expanded')) {
          activeItem = otherItem;
        }
      });

      if (!isExpanded) {
        const headerOffset = 90; // altura de la cabecera fija
        let targetY = item.offsetTop - headerOffset;

        // si el activo esta arriba del pulsado, al colapsarlo su hueco desplaza la posicion real hacia arriba
        if (activeItem && activeItem !== item) {
          if (activeItem.offsetTop < item.offsetTop) {
            const activeWrap = activeItem.querySelector('.project-details-wrap');
            if (activeWrap) {
              targetY -= activeWrap.scrollHeight;
            }
          }
        }

        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }

      items.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('is-expanded')) {
          const otherWrap = otherItem.querySelector('.project-details-wrap');
          if (otherWrap) {
            otherWrap.style.overflow = 'hidden';
            otherWrap.style.height = otherWrap.scrollHeight + 'px';
            requestAnimationFrame(() => {
              otherWrap.style.height = '0px';
            });
          }
          otherItem.classList.remove('is-expanded');
          otherItem.querySelector('.project-row')?.setAttribute('aria-expanded', 'false');
          // destruye el mosaico al colapsar: si no, sigue con scheduler/listeners activos fuera de vista
          const otherPanel = otherItem.querySelector('.proj-panel');
          if (otherPanel && otherPanel.__mosaicCtrl) {
            try { otherPanel.__mosaicCtrl.destroy(); } catch (err) { }
          }
        }
      });

      if (isExpanded) {
        wrap.style.overflow = 'hidden';
        wrap.style.height = wrap.scrollHeight + 'px';
        requestAnimationFrame(() => {
          wrap.style.height = '0px';
        });
        item.classList.remove('is-expanded');
        row.setAttribute('aria-expanded', 'false');
        const panel = item.querySelector('.proj-panel');
        if (panel && panel.__mosaicCtrl) {
          try { panel.__mosaicCtrl.destroy(); } catch (err) { }
        }
      } else {
        wrap.style.overflow = 'hidden';
        wrap.style.height = '0px';
        requestAnimationFrame(() => {
          wrap.style.height = content.scrollHeight + 'px';
        });

        setTimeout(() => {
          wrap.style.height = 'auto';
          wrap.style.overflow = 'visible'; // visible solo al terminar: si no, el zoom de foco del mosaico se recorta

          const panel = item.querySelector('.proj-panel');
          if (panel) {
            panel.classList.add('booted');
            const fill = panel.querySelector('.proj-boot-fill');
            if (fill) { fill.style.width = '100%'; }
            initVis(panel);
            if (typeof initMediaMosaic === 'function') {
              try { initMediaMosaic(panel); } catch (err) { }
            }
          }
          if (typeof computeAnchors === 'function') {
            computeAnchors();
          }
        }, 450); // sincronizado con la duracion de la transicion CSS
        item.classList.add('is-expanded');
        row.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* canvas visualizations */
function initVis(panel) {
  const proj = panel.dataset.proj;
  const canvas = panel.querySelector('.proj-canvas');
  if (!canvas) return;
  if (canvas._visAbort) canvas._visAbort();
  let aborted = false;
  canvas._visAbort = () => { aborted = true; };
  const vis = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  // CSS pixels usados por el dibujo; el backing store se escala por DPR para nitidez en móvil
  let CW = 400, CH = 84;
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    CW = Math.max(1, vis.clientWidth || 400);
    CH = Math.max(1, vis.clientHeight || 84);
    canvas.width = Math.round(CW * dpr);
    canvas.height = Math.round(CH * dpr);
    canvas.style.width = CW + 'px';
    canvas.style.height = CH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  new ResizeObserver(resize).observe(vis);
  const panelCS = getComputedStyle(panel);
  const MONO_FAMILY = panelCS.getPropertyValue('--mono') || "'JetBrains Mono', ui-monospace, Menlo, monospace";
  function readRGB(name, fallback) {
    const v = panelCS.getPropertyValue(name).trim(); return v || fallback;
  }
  const RGB_CARD = readRGB('--canvas-card', '24, 27, 36');
  const RGB_CELL = readRGB('--canvas-cell', '31, 35, 48');
  const RGB_TRAIL = readRGB('--canvas-trail', '11, 12, 16');
  const RGB_STAR = readRGB('--canvas-star', '236, 230, 214');

  let isHover = false, hovT = 0, mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
  function pointAt(clientX, clientY) {
    const rect = vis.getBoundingClientRect();
    tmx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    tmy = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  }
  vis.addEventListener('mouseenter', () => isHover = true);
  vis.addEventListener('mouseleave', () => { isHover = false; tmx = 0.5; tmy = 0.5; });
  vis.addEventListener('mousemove', e => pointAt(e.clientX, e.clientY));
  // Soporte táctil: el toque/arrastre actúa como hover para reaccionar en móvil
  vis.addEventListener('touchstart', e => { isHover = true; if (e.touches[0]) pointAt(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  vis.addEventListener('touchmove', e => { isHover = true; if (e.touches[0]) pointAt(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  vis.addEventListener('touchend', () => { isHover = false; tmx = 0.5; tmy = 0.5; }, { passive: true });

  function runRender(drawFn) {
    let isVisible = true, isPlaying = false, lastT = 0;
    const MIN_INTERVAL = 1000 / 50;
    function start() {
      if (!isVisible || isPlaying || aborted) return;
      isPlaying = true;
      requestAnimationFrame(function loop(now) {
        if (!isVisible || aborted) { isPlaying = false; return; }
        if (now - lastT >= MIN_INTERVAL) { lastT = now; drawFn(now); }
        requestAnimationFrame(loop);
      });
    }
    start();
    const io = new IntersectionObserver(e => {
      isVisible = e[0].isIntersecting; if (isVisible) start();
    }, { threshold: 0 });
    io.observe(vis);
  }

  if (proj === 'gw') {
    // Espiral de fusión binaria + chirp con estela de fotones
    let ph = 0, sep = 1;
    const photons = [];
    let animState = 'inspiral'; // Estados: 'inspiral', 'merger', 'fadein'
    let mergerTimer = 0;
    let fadeVal = 1; // Controla la opacidad de los cuerpos durante las transiciones

    runRender(function draw() {
      hovT += (isHover ? 0.08 : -0.05); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.1; my += (tmy - my) * 0.1;
      const W = CW, H = CH, cx = W / 2, cy = H / 2;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.22)';
      ctx.fillRect(0, 0, W, H);

      const speed = 0.04 + hovT * 0.06;

      // maquina de estados de la fusion
      if (animState === 'inspiral') {
        sep -= speed * 0.012 * (1 + (1 - sep) * 4);
        ph += speed * (1 + (1 - sep) * 3);
        fadeVal = 1;

        if (sep <= 0.06) {
          animState = 'merger';
          mergerTimer = 0;
        }
      } else if (animState === 'merger') {
        sep = 0.06; // Se mantienen unidos en el centro
        ph += speed * 4; // Rotación remanente rápida en el núcleo
        mergerTimer++;

        // Tras unos instantes de la colisión, desvanecemos el cuerpo resultante
        if (mergerTimer > 16) {
          fadeVal = Math.max(0, fadeVal - 0.08);
        }
        if (fadeVal <= 0) {
          animState = 'fadein';
          sep = 1; // Reseteamos la separación a la órbita de inicio (ocultos)
        }
      } else if (animState === 'fadein') {
        ph += speed;
        fadeVal = Math.min(1, fadeVal + 0.06); // Reaparecen de forma gradual
        if (fadeVal >= 1) {
          animState = 'inspiral';
        }
      }

      const r = sep * Math.min(W, H) * 0.34;

      // Onda gravitacional cuadrupolar concéntrica
      for (let k = 0; k < 4; k++) {
        const rw = ((ph * 24 + k * 60) % (Math.max(W, H)));
        ctx.strokeStyle = 'rgba(180,156,255,' + (0.18 * (1 - rw / Math.max(W, H))) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, rw, rw * 0.62, ph * 0.3, 0, Math.PI * 2); ctx.stroke();
      }

      // Dos cuerpos compactos orbitando
      const bodies = [
        { a: ph, col: '122,223,200', m: 1.0 },
        { a: ph + Math.PI, col: '180,156,255', m: 0.78 }
      ];
      bodies.forEach(b => {
        const bx = cx + Math.cos(b.a) * r * b.m;
        const by = cy + Math.sin(b.a) * r * 0.62 * b.m;

        // Emitimos fotones de estela únicamente durante la aproximación activa
        if (Math.random() < 0.6 && animState === 'inspiral') {
          photons.push({ x: bx, y: by, life: 1, col: b.col });
        }

        const g = ctx.createRadialGradient(bx, by, 0, bx, by, 10 + (1 - sep) * 14);
        g.addColorStop(0, 'rgba(' + b.col + ',' + (0.95 * fadeVal) + ')');
        g.addColorStop(1, 'rgba(' + b.col + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(bx, by, 10 + (1 - sep) * 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(' + b.col + ',' + fadeVal + ')';
        ctx.beginPath(); ctx.arc(bx, by, 2.6 + (1 - sep) * 3, 0, Math.PI * 2); ctx.fill();
      });

      // Estela de fotones desprendidos (continúan desvaneciéndose de forma natural)
      for (let i = photons.length - 1; i >= 0; i--) {
        const p = photons[i]; p.life -= 0.03;
        if (p.life <= 0) { photons.splice(i, 1); continue; }
        ctx.fillStyle = 'rgba(' + p.col + ',' + (p.life * 0.5) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.life * 2, 0, Math.PI * 2); ctx.fill();
      }

      // Flash en la fusión (basado de manera dinámica en el estado y temporizador)
      let flashAmt = 0;
      if (animState === 'inspiral' && sep < 0.14) {
        flashAmt = (0.14 - sep) / 0.14;
      } else if (animState === 'merger') {
        flashAmt = Math.max(0, 1 - mergerTimer / 12);
      }
      if (flashAmt > 0) {
        ctx.fillStyle = 'rgba(236,230,214,' + (flashAmt * 0.5) + ')';
        ctx.beginPath(); ctx.arc(cx, cy, flashAmt * 38, 0, Math.PI * 2); ctx.fill();
      }
    });
  } else if (proj === 'nltl') {
    // Solitones en línea de transmisión; el cursor inyecta y empuja un pulso
    let ph = 0;
    let userPulse = null; // pulso controlado por el puntero
    runRender(function draw() {
      hovT += (isHover ? 0.05 : -0.04); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.14; my += (tmy - my) * 0.14;
      const W = CW, H = CH, mid = H / 2;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.28)';
      ctx.fillRect(0, 0, W, H);

      const span = W * 1.4;
      ph += (1.6 + hovT * 1.4) * (W / 400);

      // Amplitudes redimensionadas para que no desborden los límites del lienzo
      const ampBase = (H * 0.18) + my * (H * 0.08);
      const sA = (ph % span) - W * 0.2;
      const sB = W - ((ph * 0.8 % span) - W * 0.2);
      if (hovT > 0.1) userPulse = mx * W; else if (userPulse !== null) userPulse = null;

      const stages = Math.max(28, Math.round(W / 9)), dx = W / (stages - 1);
      const wid = Math.max(14, W * 0.06);
      const pts = [];
      for (let i = 0; i < stages; i++) {
        const x = i * dx;
        // Coeficientes reducidos (0.65 y 0.85) para un comportamiento armónico al superponerse
        let e = ampBase / Math.cosh((x - sA) / wid) + (ampBase * 0.65) / Math.cosh((x - sB) / (wid * 0.85));
        if (userPulse !== null) e += (ampBase * 0.85) / Math.cosh((x - userPulse) / (wid * 0.7));
        pts.push({ x, y: mid - e, e });
      }

      ctx.strokeStyle = 'rgba(122,223,200,0.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();

      ctx.beginPath();
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.lineTo(W, mid); ctx.lineTo(0, mid); ctx.closePath();
      const fg = ctx.createLinearGradient(0, 0, 0, mid);
      fg.addColorStop(0, 'rgba(122,223,200,0.3)');
      fg.addColorStop(1, 'rgba(122,223,200,0)');
      ctx.fillStyle = fg; ctx.fill();

      ctx.beginPath();
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = 'rgba(122,223,200,0.95)'; ctx.lineWidth = 1.8; ctx.stroke();

      pts.forEach((p, i) => {
        if (i % 2) return;
        const on = Math.min(1, p.e / ampBase);
        ctx.fillStyle = on > 0.25 ? 'rgba(180,156,255,' + (0.4 + on * 0.6) + ')' : 'rgba(255,255,255,0.14)';
        ctx.beginPath(); ctx.arc(p.x, mid, 1.4 + on * 3.5, 0, Math.PI * 2); ctx.fill();
      });

      if (userPulse !== null) {
        ctx.fillStyle = 'rgba(122,223,200,0.7)'; ctx.font = '8px ' + MONO_FAMILY;
        ctx.fillText('INYECCIÓN', userPulse + 6, mid - ampBase - 4);
      }
    });
  } else if (proj === 'concrete') {
    // Transformer por capas. Tokens eligen ruta distinta en cada salto;
    // el cursor sesga el enrutado hacia el nodo más cercano (atención).
    const layers = [
      [{ n: 'INPUT', c: '#6fb2f0' }],
      [{ n: 'CTX', c: '#b49cff' }, { n: 'MEM', c: '#7adfc8' }, { n: 'POS', c: '#6fb2f0' }],
      [{ n: 'GBNF', c: '#ff90a8' }, { n: 'EMO', c: '#e8a838' }, { n: 'LOGIC', c: '#7adfc8' }],
      [{ n: 'AST', c: '#7adfc8' }]
    ];
    const nodes = [];
    layers.forEach((col, ci) => col.forEach((nd, ri) => nodes.push({
      name: nd.n, color: nd.c, layer: ci,
      x: 0.08 + ci * (0.84 / (layers.length - 1)),
      y: (ri + 1) / (col.length + 1)
    })));
    const lastLayer = layers.length - 1;
    const tokens = [];
    function pickNext(fromLayer, W, H) {
      const cands = nodes.filter(n => n.layer === fromLayer + 1);
      if (!cands.length) return null;
      // Peso por cercanía al cursor para enrutado interactivo
      let total = 0;
      const weights = cands.map(c => {
        const d = Math.hypot(mx * W - c.x * W, my * H - c.y * H);
        const w = 1 + (hovT * 6) * Math.max(0, 1 - d / 120);
        total += w; return w;
      });
      let r = Math.random() * total;
      for (let k = 0; k < cands.length; k++) { r -= weights[k]; if (r <= 0) return cands[k]; }
      return cands[cands.length - 1];
    }
    runRender(function draw() {
      hovT += (isHover ? 0.05 : -0.04); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.1; my += (tmy - my) * 0.1;
      const W = CW, H = CH;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.3)';
      ctx.fillRect(0, 0, W, H);

      nodes.forEach(a => nodes.forEach(b => {
        if (b.layer !== a.layer + 1) return;
        const ax = a.x * W, ay = a.y * H, bx = b.x * W, by = b.y * H;
        const dm = Math.hypot(mx * W - (ax + bx) / 2, my * H - (ay + by) / 2);
        const hot = Math.max(0, 1 - dm / 90) * hovT;
        ctx.strokeStyle = 'rgba(122,223,200,' + (0.05 + hot * 0.5) + ')';
        ctx.lineWidth = 0.6 + hot * 1.8;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }));

      // Nuevos tokens desde la entrada
      if (Math.random() < 0.14 + hovT * 0.16) {
        const src = nodes.find(n => n.layer === 0);
        tokens.push({ from: src, to: pickNext(0, W, H), t: 0, color: src.color });
      }
      for (let i = tokens.length - 1; i >= 0; i--) {
        const tk = tokens[i];
        if (!tk.to) { tokens.splice(i, 1); continue; }
        tk.t += 0.018 + hovT * 0.012;
        const e = tk.t < 1 ? tk.t : 1;
        const px = (tk.from.x + (tk.to.x - tk.from.x) * e) * W;
        const py = (tk.from.y + (tk.to.y - tk.from.y) * e) * H;
        ctx.fillStyle = tk.color;
        ctx.beginPath(); ctx.arc(px, py, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = tk.color.replace(')', ',0.3)').replace('#', 'rgba(');
        if (tk.t >= 1) {
          if (tk.to.layer >= lastLayer) { tokens.splice(i, 1); continue; }
          // En cada nodo recalcula una ruta NUEVA (no fija)
          tk.from = tk.to; tk.to = pickNext(tk.to.layer, W, H); tk.t = 0; tk.color = tk.from.color;
        }
      }
      if (tokens.length > 50) tokens.splice(0, tokens.length - 50);

      nodes.forEach(n => {
        const nx = n.x * W, ny = n.y * H;
        const glow = Math.max(0, 1 - Math.hypot(mx * W - nx, my * H - ny) / 80) * hovT;
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, 16 + glow * 14);
        g.addColorStop(0, n.color); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.35 + glow * 0.55; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(nx, ny, 16 + glow * 14, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = n.color;
        ctx.beginPath(); ctx.arc(nx, ny, 4 + glow * 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '7px ' + MONO_FAMILY; ctx.textAlign = 'center';
        ctx.fillText(n.name, nx, ny - 10);
        if (glow > 0.3) {
          ctx.fillStyle = 'rgba(122,223,200,0.95)';
          ctx.fillText('W:' + (glow * 0.99).toFixed(2), nx, ny + 15);
        }
      });
      ctx.textAlign = 'left';
    });
  } else if (proj === 'physdeck') {
    // Haz horizontal de izquierda a derecha que se ramifica en cascada;
    // columnas centelladoras al borde derecho. El cursor desvía el haz.
    function mkP(x, y, vx, vy, depth) { return { x, y, vx, vy, life: 1, depth }; }
    let particles = [];
    const flashes = [];
    const SEGS = 6;
    runRender(function draw() {
      hovT += (isHover ? 0.04 : -0.03); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.08; my += (tmy - my) * 0.08;
      const W = CW, H = CH;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.2)';
      ctx.fillRect(0, 0, W, H);

      // Columnas detectoras verticales al borde derecho
      const segH = H / SEGS;
      for (let s = 0; s < SEGS; s++) {
        ctx.strokeStyle = 'rgba(111,178,240,0.12)';
        ctx.strokeRect(W - 9, s * segH + 1, 7, segH - 2);
      }

      // Inyectar primarios desde la izquierda
      if (particles.length < 3 || Math.random() < 0.03) {
        const sy = 0.2 + Math.random() * 0.6;
        particles.push(mkP(0, sy, 0.006 + Math.random() * 0.003, (Math.random() - 0.5) * 0.0015, 0));
      }

      const lx = mx * W, ly = my * H;

      // Dibujar indicador holográfico de la lente magnética cuando el cursor esté presente
      if (hovT > 0.15) {
        ctx.strokeStyle = 'rgba(255,144,168,' + (0.35 * hovT) + ')';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.arc(lx, ly, 15, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,144,168,0.12)';
        ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fill();
      }

      const next = [];
      particles.forEach(p => {
        const px = p.x * W;
        const py = p.y * H;
        const dx = px - lx;
        const dy = py - ly;
        const distToLens = Math.hypot(dx, dy);

        let pull = 0;
        // Campo magnético concentrado en torno al cursor (deflexión más marcada)
        if (hovT > 0.1 && distToLens < 75) {
          const force = (1 - distToLens / 75) * 0.08; // Fuerza de atracción incrementada para un giro cerrado
          pull = (my - p.y) * force;
        } else {
          // Curvatura ambiental débil a larga distancia
          pull = (my - p.y) * 0.00015 * hovT;
        }

        // Límites de la velocidad vertical aumentados para curvas pronunciadas
        p.vy = Math.max(-0.032, Math.min(0.032, (p.vy + pull) * 0.91));
        const ox = p.x, oy = p.y;
        p.x += p.vx; p.y += p.vy;

        if (p.x >= 1.0) {
          const seg = Math.floor(Math.max(0, Math.min(0.999, p.y)) * SEGS);
          flashes.push({ x: W - 5, y: (seg + 0.5) * segH, life: 1, col: '122,223,200' });
          return;
        }
        if (p.y < -0.05 || p.y > 1.05) return;

        const col = p.depth === 0 ? '255,144,168' : p.depth === 1 ? '111,178,240' : '122,223,200';
        ctx.strokeStyle = 'rgba(' + col + ',' + (0.55 + 0.3 / (p.depth + 1)) + ')';
        ctx.lineWidth = Math.max(0.6, 1.8 - p.depth * 0.4);
        ctx.beginPath(); ctx.moveTo(ox * W, oy * H); ctx.lineTo(p.x * W, p.y * H); ctx.stroke();

        if (Math.random() < (0.008 + hovT * 0.012) && p.depth < 3 && particles.length + next.length < 70) {
          for (let k = 0; k < 2; k++) {
            const spread = (Math.random() - 0.5) * 0.012;
            next.push(mkP(p.x, p.y, p.vx * (0.9 + Math.random() * 0.08), p.vy + spread, p.depth + 1));
          }
          return;
        }
        next.push(p);
      });
      particles = next;

      // Render de los destellos en el detector derecho
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i]; f.life -= 0.06;
        if (f.life <= 0) { flashes.splice(i, 1); continue; }
        const col = f.col || '122,223,200';
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 14 * f.life + 4);
        g.addColorStop(0, 'rgba(' + col + ',' + f.life + ')');
        g.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, 14 * f.life + 4, 0, Math.PI * 2); ctx.fill();
      }
    });
  } else if (proj === 'mineralia') {
    // Catálogo de minerales: estantería de muestras facetadas que se desplaza;
    // el cursor inspecciona/amplía la muestra bajo él (ficha emergente).
    const MINS = [
      { n: 'CUARZO', c: '236,230,214', s: 6 }, { n: 'AMATISTA', c: '180,156,255', s: 6 },
      { n: 'ESMERALDA', c: '97,208,149', s: 6 }, { n: 'RUBÍ', c: '255,110,126', s: 8 },
      { n: 'ZAFIRO', c: '111,178,240', s: 8 }, { n: 'CITRINO', c: '232,168,56', s: 6 },
      { n: 'TURMALINA', c: '122,223,200', s: 9 }, { n: 'PIRITA', c: '210,190,120', s: 4 },
      { n: 'GRANATE', c: '255,144,168', s: 12 }, { n: 'FLUORITA', c: '150,200,255', s: 8 }
    ];
    function facet(cx, cy, rad, sides, rot, c, alpha) {
      // Gema facetada: polígono exterior + facetas internas
      ctx.beginPath();
      for (let k = 0; k <= sides; k++) {
        const a = rot + k * (Math.PI * 2 / sides);
        const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
        k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const g = ctx.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad);
      g.addColorStop(0, 'rgba(' + c + ',' + alpha + ')');
      g.addColorStop(1, 'rgba(' + c + ',' + (alpha * 0.35) + ')');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(' + c + ',' + Math.min(1, alpha + 0.3) + ')'; ctx.lineWidth = 1; ctx.stroke();
      // facetas
      ctx.strokeStyle = 'rgba(255,255,255,' + (alpha * 0.3) + ')'; ctx.lineWidth = 0.6;
      for (let k = 0; k < sides; k++) {
        const a = rot + k * (Math.PI * 2 / sides);
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); ctx.stroke();
      }
    }
    let scroll = 0, ph = 0;
    runRender(function draw() {
      hovT += (isHover ? 0.08 : -0.05); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.15; my += (tmy - my) * 0.15;
      const W = CW, H = CH;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.3)';
      ctx.fillRect(0, 0, W, H);
      ph += 0.01;

      const cellW = Math.max(58, Math.min(86, W * 0.16));
      const cycle = cellW * MINS.length;
      // hover: el cursor desplaza la estantería; en reposo, auto-scroll lento
      if (hovT > 0.1) scroll += (mx - 0.5) * 4; else scroll += 0.35;
      scroll = ((scroll % cycle) + cycle) % cycle;
      const cy = H / 2;

      let hovered = null;
      const startK = -1, endK = Math.ceil(W / cycle) + 1;
      for (let k = startK; k <= endK; k++)
        for (let i = 0; i < MINS.length; i++) {
          const cx = i * cellW + k * cycle - scroll + cellW / 2;
          if (cx < -cellW || cx > W + cellW) continue;
          const m = MINS[i];
          const near = Math.max(0, 1 - Math.abs(mx * W - cx) / (cellW * 0.7)) * hovT;
          if (near > 0.5 && (!hovered || near > hovered.near)) hovered = { m, cx, near };
          // celda contenedora
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.06 + near * 0.2) + ')';
          ctx.strokeRect(cx - cellW / 2 + 3, cy - H * 0.36, cellW - 6, H * 0.72);
          // gema rotando suavemente, crece con el hover
          const rad = H * 0.2 * (1 + near * 0.35);
          facet(cx, cy - H * 0.06, rad, m.s, ph + i, m.c, 0.55 + near * 0.45);
          // código de muestra
          ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + near * 0.45) + ')';
          ctx.font = '7px ' + MONO_FAMILY; ctx.textAlign = 'center';
          ctx.fillText('#' + String(i + 1).padStart(2, '0'), cx, cy + H * 0.3);
        }

      // Ficha emergente de la muestra inspeccionada
      if (hovered) {
        const { m, cx } = hovered;
        const bw = 96, bh = 24; let bx = cx - bw / 2;
        bx = Math.max(4, Math.min(W - bw - 4, bx));
        ctx.fillStyle = 'rgba(11,12,16,0.92)';
        ctx.strokeStyle = 'rgba(' + m.c + ',0.7)'; ctx.lineWidth = 1;
        roundRect(ctx, bx, 4, bw, bh, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(' + m.c + ',1)'; ctx.font = 'bold 9px ' + MONO_FAMILY;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(m.n, bx + 7, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '7px ' + MONO_FAMILY;
        ctx.fillText('Mohs ' + m.s + '.0 · muestra cert.', bx + 7, 22);
        ctx.textBaseline = 'alphabetic';
      }
      ctx.textAlign = 'left';
    });
  } else if (proj === 'soundtrack') {
    // Carrusel coverflow con ecualizador vivo en la card enfocada
    const CARDS = ['ELDEN RING', 'CHRONO TRIGGER', 'HALO 3', 'WIND WAKER', 'NIER: AUTOMATA', 'STAFF ROLL', 'FORTRESS'];
    let scroll = 0, ph = 0, score = 142;
    const totalCards = CARDS.length;
    const BARS = 9;
    runRender(function draw() {
      hovT += (isHover ? 0.08 : -0.05); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.15;
      const W = CW, H = CH, cy = H / 2;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.28)';
      ctx.fillRect(0, 0, W, H);
      ph += 0.08 + hovT * 0.06;

      const cardW = Math.min(120, W * 0.15), cardH = H * 0.7;
      const gap = 16, stride = cardW + gap, cycle = stride * totalCards;
      if (isHover) scroll = (mx - 0.5) * cycle; else scroll += 0.55 * (1 + hovT * 0.6);
      const startK = -Math.ceil(W / cycle) - 1, endK = Math.ceil(W / cycle) + 1;

      // Dibujar de fuera hacia el centro para apilamiento correcto
      const draws = [];
      for (let k = startK; k <= endK; k++)
        for (let i = 0; i < totalCards; i++) {
          const cx = (i * stride + k * cycle) - scroll + W / 2;
          if (cx < -cardW * 2 || cx > W + cardW * 2) continue;
          draws.push({ cx, i, focus: Math.max(0, 1 - Math.abs(cx - W / 2) / (W * 0.5)) });
        }
      draws.sort((a, b) => a.focus - b.focus);

      draws.forEach(({ cx, i, focus }) => {
        const scale = 0.72 + focus * 0.4;
        const w = cardW * scale, h = cardH * scale;
        ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = 0.3 + focus * 0.7;
        const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        grad.addColorStop(0, 'rgba(' + RGB_CARD + ',0.98)');
        grad.addColorStop(1, 'rgba(20,16,24,0.98)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = 'rgba(255,144,168,' + (0.25 + focus * 0.6) + ')';
        ctx.lineWidth = 1.25;
        roundRect(ctx, -w / 2, -h / 2, w, h, 5); ctx.fill(); ctx.stroke();

        if (focus > 0.55) {
          // Ecualizador animado
          const bw = w * 0.7, bx0 = -bw / 2, bgap = bw / BARS;
          for (let b = 0; b < BARS; b++) {
            const amp = (0.3 + 0.7 * Math.abs(Math.sin(ph + b * 0.7 + i))) * h * 0.22;
            ctx.fillStyle = 'rgba(122,223,200,' + (0.4 + focus * 0.5) + ')';
            ctx.fillRect(bx0 + b * bgap + 1, -h * 0.05 - amp, bgap - 2, amp);
          }
          ctx.fillStyle = 'rgba(' + RGB_STAR + ',' + (focus * 0.85) + ')';
          ctx.font = Math.round(w * 0.11) + 'px ' + MONO_FAMILY;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(CARDS[i], 0, h * 0.22);
          ctx.fillStyle = 'rgba(255,144,168,' + (focus * 0.6) + ')';
          ctx.font = Math.round(w * 0.09) + 'px ' + MONO_FAMILY;
          ctx.fillText('#' + Math.max(1, score - i) + ' ★', 0, h * 0.38);
        } else {
          ctx.fillStyle = 'rgba(255,144,168,0.45)';
          ctx.font = 'bold ' + Math.round(w * 0.26) + 'px ' + MONO_FAMILY;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('♫', 0, 0);
        }
        ctx.restore();
      });

      ctx.strokeStyle = 'rgba(255,144,168,0.3)';
      ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(W / 2, 4); ctx.lineTo(W / 2, H - 4); ctx.stroke();
      ctx.setLineDash([]);
    });
  } else if (proj === 'solver') {
    // Pozo gravitacional: el agujero negro sigue el cursor y vuelve al centro
    // de forma SUAVE al salir (interpolación de mx/my, sin teletransporte).
    let ph = 0;
    const orbs = Array.from({ length: 18 }, () => ({
      a: Math.random() * Math.PI * 2, r: 18 + Math.random() * 70, sp: 0.01 + Math.random() * 0.02
    }));
    runRender(function draw() {
      hovT += (isHover ? 0.08 : -0.05); hovT = Math.max(0, Math.min(1, hovT));
      // mx/my ya hacen lerp hacia 0.5 al soltar -> sin salto brusco
      mx += (tmx - mx) * 0.1; my += (tmy - my) * 0.1;
      const W = CW, H = CH;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.3)';
      ctx.fillRect(0, 0, W, H);
      ph += 0.02;
      const fx = mx * W, fy = my * H;
      const mass = (Math.min(W, H) * 0.18) * (0.45 + hovT * 0.55);

      function warp(x0, y0) {
        const dist = Math.hypot(x0 - fx, y0 - fy);
        const pull = (mass * 14) / (dist + 14);
        const ang = Math.atan2(y0 - fy, x0 - fx);
        return [x0 - Math.cos(ang) * pull, y0 - Math.sin(ang) * pull];
      }

      const rows = 6, cols = Math.max(14, Math.round(W / 26));
      ctx.strokeStyle = 'rgba(122,223,200,' + (0.12 + hovT * 0.1) + ')'; ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const [x, y] = warp((c / cols) * W, (r / rows) * H);
          c === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        for (let r = 0; r <= rows; r++) {
          const [x, y] = warp((c / cols) * W, (r / rows) * H);
          r === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.save(); ctx.translate(fx, fy);
      for (let k = 3; k >= 1; k--) {
        ctx.strokeStyle = 'rgba(255,110,126,' + (0.12 * k) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, mass * 0.7 * k, mass * 0.22 * k, ph * 0.3, 0, Math.PI * 2); ctx.stroke();
      }
      orbs.forEach(o => {
        o.a += o.sp * (1 + hovT * 1.5); o.r -= 0.1 + 0.25 * hovT;
        if (o.r < 12) o.r = Math.min(W, H) * 0.45;
        const ox = Math.cos(o.a) * o.r, oy = Math.sin(o.a) * o.r * 0.32;
        ctx.fillStyle = 'rgba(122,223,200,' + (0.5 + hovT * 0.4) + ')';
        ctx.beginPath(); ctx.arc(ox, oy, 1.6, 0, Math.PI * 2); ctx.fill();
      });
      const g = ctx.createRadialGradient(0, 0, mass * 0.3, 0, 0, mass);
      g.addColorStop(0, '#000'); g.addColorStop(0.7, '#000');
      g.addColorStop(1, 'rgba(122,223,200,0.4)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, mass * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  } else if (proj === 'trappist') {
    // Sistema planetario centrado; el cursor selecciona un planeta, resalta su
    // órbita, lo amplía y muestra su ficha (periodo / temperatura).
    let ph = 0;
    const planets = [
      { name: 'TRAPPIST-1b', c: '#ff90a8', per: '1.51 d', temp: '400 K' },
      { name: 'TRAPPIST-1c', c: '#6fb2f0', per: '2.42 d', temp: '342 K' },
      { name: 'TRAPPIST-1d', c: '#7adfc8', per: '4.05 d', temp: '288 K' },
      { name: 'TRAPPIST-1e', c: '#b49cff', per: '6.10 d', temp: '251 K' }
    ];
    runRender(function draw() {
      hovT += (isHover ? 0.06 : -0.05); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.12; my += (tmy - my) * 0.12;
      const W = CW, H = CH, cx = W / 2, cy = H / 2;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.3)';
      ctx.fillRect(0, 0, W, H);
      ph += 0.006 + hovT * 0.004;

      const orbits = [W * 0.12, W * 0.22, W * 0.33, W * 0.44];
      const ry = H * 0.4;

      const P = planets.map((pl, idx) => {
        const theta = ph * (4 - idx) * 0.7;
        return {
          idx, theta, r: orbits[idx],
          x: cx + Math.cos(theta) * orbits[idx],
          y: cy + Math.sin(theta) * ry
        };
      });

      // Selección mejorada: Evalúa la distancia a la órbita (elipse) en el ángulo del cursor
      let sel = -1, md = Infinity;
      if (hovT > 0.1) {
        const theta = Math.atan2(my * H - cy, mx * W - cx);
        orbits.forEach((r, idx) => {
          const ex = cx + Math.cos(theta) * r;
          const ey = cy + Math.sin(theta) * ry;
          const d = Math.hypot(mx * W - ex, my * H - ey);
          if (d < md) {
            md = d;
            sel = idx;
          }
        });
        // Desactiva si el cursor está demasiado alejado de la órbita (tolerancia de 24px)
        if (md > 24) sel = -1;
      }

      // Órbitas (resalta la seleccionada de manera estática y nítida)
      orbits.forEach((r, idx) => {
        ctx.strokeStyle = idx === sel ? planets[idx].c + 'aa' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = idx === sel ? 1.6 : 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, r, ry, 0, 0, Math.PI * 2); ctx.stroke();
      });

      // Estrella central
      const sr = 16 + Math.sin(ph * 2) * 2;
      const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr);
      sg.addColorStop(0, '#fff1c0'); sg.addColorStop(0.5, '#e8a838'); sg.addColorStop(1, 'rgba(232,168,56,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, sr, 0, Math.PI * 2); ctx.fill();

      // Planetas y sus estelas
      P.forEach(p => {
        ctx.strokeStyle = planets[p.idx].c + '55'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let t = 0; t < 0.6; t += 0.1) {
          const th = p.theta - t; const tx = cx + Math.cos(th) * p.r, ty = cy + Math.sin(th) * ry;
          t === 0 ? ctx.moveTo(tx, ty) : ctx.lineTo(tx, ty);
        }
        ctx.stroke();
        const on = p.idx === sel;
        if (on) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
          g.addColorStop(0, planets[p.idx].c); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = planets[p.idx].c;
        ctx.beginPath(); ctx.arc(p.x, p.y, on ? 5 : 3, 0, Math.PI * 2); ctx.fill();
      });

      // Ficha emergente informativa
      if (sel >= 0) {
        const pl = planets[sel];
        const bw = 120, bh = 30; let bx = mx * W + 10;
        bx = Math.max(4, Math.min(W - bw - 4, bx));
        let by = my * H - bh - 8; if (by < 4) by = my * H + 12;
        ctx.fillStyle = 'rgba(11,12,16,0.92)';
        ctx.strokeStyle = pl.c; ctx.lineWidth = 1;
        roundRect(ctx, bx, by, bw, bh, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = pl.c; ctx.font = 'bold 9px ' + MONO_FAMILY;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(pl.name, bx + 8, by + 10);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '7px ' + MONO_FAMILY;
        ctx.fillText('Periodo ' + pl.per + ' · T_eq ' + pl.temp, bx + 8, by + 21);
        ctx.textBaseline = 'alphabetic';
      }
      ctx.textAlign = 'left';
    });
  } else if (proj === 'environ') {
    // Campo de difusión de polución (heatmap) con sensores y sonda AQI
    let ph = 0;
    const stations = [
      { x: 0.15, y: 0.4, val: 32 }, { x: 0.38, y: 0.65, val: 60 },
      { x: 0.55, y: 0.3, val: 88 }, { x: 0.75, y: 0.6, val: 44 },
      { x: 0.90, y: 0.45, val: 68 }
    ];
    const GX = 22, GY = 8;
    function aqiAt(nx, ny, t) {
      let v = 0;
      stations.forEach((s, idx) => {
        const fl = 1 + Math.sin(t + idx) * 0.12;
        const d2 = Math.pow((nx - s.x) * 2.2, 2) + Math.pow((ny - s.y) * 2.2, 2);
        v += s.val * fl * Math.exp(-d2 * 3);
      });
      return v;
    }
    function heat(v) {
      const t = Math.max(0, Math.min(1, v / 90));
      if (t < 0.5) return [Math.round(111 - t * 28), Math.round(178 + t * 60), Math.round(240 - t * 140)];
      const u = (t - 0.5) * 2;
      return [Math.round(97 + u * 158), Math.round(208 - u * 64), Math.round(149 - u * 81)];
    }
    runRender(function draw() {
      hovT += (isHover ? 0.08 : -0.05); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.1; my += (tmy - my) * 0.1;
      const W = CW, H = CH;
      ctx.clearRect(0, 0, W, H);
      ph += 0.03;
      const cw = W / GX, ch = H / GY;

      for (let gy = 0; gy < GY; gy++)
        for (let gx = 0; gx < GX; gx++) {
          const v = aqiAt((gx + 0.5) / GX, (gy + 0.5) / GY, ph);
          const [r, g, b] = heat(v);
          ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.12 + Math.min(0.5, v / 160)) + ')';
          ctx.fillRect(gx * cw, gy * ch, cw + 1, ch + 1);
        }

      // Sensores pulsantes
      stations.forEach((s, idx) => {
        const sx = s.x * W, sy = s.y * H;
        const pulse = 4 + Math.abs(Math.sin(ph + idx)) * 3;
        ctx.strokeStyle = s.val > 70 ? 'rgba(232,168,56,0.6)' : 'rgba(111,178,240,0.6)';
        ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx, sy, pulse + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = s.val > 70 ? '#e8a838' : '#6fb2f0';
        ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '7px ' + MONO_FAMILY;
        ctx.fillText('S' + (idx + 1), sx - 5, sy - 8);
      });

      // Sonda AQI en el cursor
      if (hovT > 0.1) {
        const px = mx * W, py = my * H;
        const v = aqiAt(mx, my, ph);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(11,12,16,0.9)';
        ctx.strokeStyle = 'rgba(97,208,149,0.6)';
        const tw = 92; let tx = px + 10; if (tx + tw > W) tx = px - tw - 10;
        let ty = py - 22; if (ty < 0) ty = py + 10;
        roundRect(ctx, tx, ty, tw, 16, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#61d095'; ctx.font = '8px ' + MONO_FAMILY;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('AQI: ' + v.toFixed(0) + ' PPM', tx + 6, ty + 8);
      }
    });
  } else if (proj === 'mev') {
    const pools = [
      { name: 'WETH', bal: '42.5 ETH', c: '#6fb2f0' }, { name: 'USDC', bal: '150K', c: '#7adfc8' },
      { name: 'USDT', bal: '150K', c: '#61d095' }, { name: 'AERO', bal: '320K', c: '#b49cff' },
      { name: 'DAI', bal: '88K', c: '#e8a838' }, { name: 'WBTC', bal: '3.1 BTC', c: '#ff90a8' }
    ];
    const N = pools.length;
    const prices = pools.map(() => 0.5);
    const packets = [];
    let ph = 0;
    runRender(function draw() {
      hovT += (isHover ? 0.08 : -0.05); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.1; my += (tmy - my) * 0.1;
      const W = CW, H = CH, cy = H / 2;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.3)';
      ctx.fillRect(0, 0, W, H);
      ph += 0.02;

      // Posiciones en fila (aprovecha el ancho), con leve onda vertical
      const padX = W * 0.08, span = W - padX * 2;
      const pos = pools.map((_, i) => ({
        x: padX + (N === 1 ? 0 : span * i / (N - 1)),
        y: cy + Math.sin(ph + i * 0.9) * H * 0.14
      }));
      pools.forEach((_, i) => { prices[i] += (Math.sin(ph * 1.3 + i * 2) * 0.5 + 0.5 - prices[i]) * 0.05; });

      // Nodo objetivo: el más cercano al cursor (define inicio del ciclo)
      let active = 0, md = Infinity;
      pos.forEach((p, idx) => { const d = Math.hypot(mx * W - p.x, my * H - p.y); if (d < md) { md = d; active = idx; } });
      const startIdx = hovT > 0.1 ? active : 0;

      // Aristas curvas entre pools consecutivos del ciclo
      function edge(i) { return [pos[i], pos[(i + 1) % N]]; }
      for (let i = 0; i < N; i++) {
        const [a, b] = edge(i);
        const my2 = (a.y + b.y) / 2 + (i % 2 ? -1 : 1) * H * 0.16;
        ctx.strokeStyle = 'rgba(97,208,149,' + (0.18 + hovT * 0.32) + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, my2, b.x, b.y); ctx.stroke();
      }

      // Lanzar paquetes de capital (varios a la vez)
      if (Math.random() < 0.06 + hovT * 0.12) packets.push({ seg: startIdx, t: 0, hops: 0 });
      const PXPS = (1.6 + hovT * 1.6) * (W / 400); // velocidad lineal CONSTANTE en px/frame
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i];
        const [a, b] = edge(pk.seg);
        const my2 = (a.y + b.y) / 2 + (pk.seg % 2 ? -1 : 1) * H * 0.16;
        // Longitud aproximada de la curva: así la arista larga de cierre no parpadea
        const segLen = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y) + Math.abs(my2 - (a.y + b.y) / 2) * 0.6);
        pk.t += PXPS / segLen;
        if (pk.t >= 1) { pk.t = 0; pk.seg = (pk.seg + 1) % N; pk.hops++; if (pk.hops >= N) { packets.splice(i, 1); continue; } }
        const t = pk.t, it = 1 - t;
        const px = it * it * a.x + 2 * it * t * (a.x + b.x) / 2 + t * t * b.x;
        const py = it * it * a.y + 2 * it * t * my2 + t * t * b.y;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 7);
        g.addColorStop(0, 'rgba(97,208,149,0.95)'); g.addColorStop(1, 'rgba(97,208,149,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
      }
      if (packets.length > 60) packets.splice(0, packets.length - 60);

      // Nodos de pool con barra de precio
      pos.forEach((p, idx) => {
        const on = idx === active && hovT > 0.1;
        const rad = on ? H * 0.2 : H * 0.15;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad + 8);
        g.addColorStop(0, pools[idx].c); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = on ? 0.6 : 0.35; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad + 8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = on ? '#fff' : pools[idx].c;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0b0c10'; ctx.font = 'bold ' + Math.round(rad * 0.6) + 'px ' + MONO_FAMILY;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pools[idx].name, p.x, p.y);
        // mini barra de precio
        const bw = rad * 1.8, bh = 3;
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(p.x - bw / 2, p.y + rad + 5, bw, bh);
        ctx.fillStyle = pools[idx].c; ctx.fillRect(p.x - bw / 2, p.y + rad + 5, bw * prices[idx], bh);
        if (on) {
          ctx.fillStyle = pools[idx].c; ctx.font = '8px ' + MONO_FAMILY;
          ctx.fillText(pools[idx].bal, p.x, p.y - rad - 8);
        }
      });

      ctx.fillStyle = 'rgba(97,208,149,0.7)'; ctx.font = '9px ' + MONO_FAMILY;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    });
  } else if (proj === 'diophantus') {
    // Curva elíptica Y² = X³ + aX + b con red de puntos racionales y suma geométrica
    let ph = 0;
    runRender(function draw() {
      hovT += (isHover ? 0.08 : -0.05); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.15; my += (tmy - my) * 0.15;
      const W = CW, H = CH, mid = H / 2, ox = W / 2;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.3)';
      ctx.fillRect(0, 0, W, H);
      ph += 0.008;
      // Escala vertical comprimida para que toda la curva quepa pese a la poca altura
      const sx = W / 6, sy = H / 6;

      // Retícula cartesiana
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let gx = ox % sx; gx < W; gx += sx) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = mid % sy; gy < H; gy += sy) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();

      // El eje Y del cursor controla 'a' en un rango AMPLIO y visible (-4..+2),
      // mezclado con una leve animación de fondo. Así el movimiento vertical se nota.
      const aTarget = hovT > 0.05 ? (-4 + (1 - my) * 6) : (-1.6 + Math.sin(ph) * 0.6);
      const a = aTarget;
      const b = 1.4;
      const fx = v => ((v) * sx) + ox;
      const fy = v => mid - v * sy;
      const Y2 = X => X * X * X + a * X + b;

      // Guía horizontal que sigue el cursor para evidenciar el control vertical
      if (hovT > 0.05) {
        ctx.strokeStyle = 'rgba(122,223,200,' + (0.15 + hovT * 0.2) + ')'; ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]); ctx.beginPath();
        ctx.moveTo(0, my * H); ctx.lineTo(W, my * H); ctx.stroke(); ctx.setLineDash([]);
      }

      // Dibujar ambas ramas (±√) con glow
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(180,156,255,0.9)';
      for (const sign of [1, -1]) {
        ctx.beginPath(); let started = false;
        for (let X = -3; X <= 3; X += 0.02) {
          const y2 = Y2(X);
          if (y2 < 0) { started = false; continue; }
          const Y = sign * Math.sqrt(y2);
          const px = fx(X), py = fy(Y);
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Puntos racionales enteros (donde Y² es cuadrado perfecto cercano)
      ctx.fillStyle = '#ff90a8';
      for (let X = -3; X <= 3; X += 0.5) {
        const y2 = Y2(X); if (y2 < 0) continue;
        const Y = Math.sqrt(y2);
        const pulse = 2.5 + Math.abs(Math.sin(ph * 3 + X)) * 1.5;
        [Y, -Y].forEach(yy => {
          ctx.beginPath(); ctx.arc(fx(X), fy(yy), pulse, 0, Math.PI * 2); ctx.fill();
        });
      }

      // Suma de puntos P+Q (línea secante interactiva)
      if (hovT > 0.1) {
        const X = (mx * W - ox) / sx;
        const y2 = Y2(X);
        if (y2 >= 0) {
          const Y = Math.sqrt(y2), px = fx(X), py = fy(Y);
          ctx.strokeStyle = 'rgba(122,223,200,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#7adfc8';
          ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = 'rgba(11,12,16,0.9)';
          ctx.strokeStyle = 'rgba(122,223,200,0.6)';
          const lw = 110; let lx = px + 8; if (lx + lw > W) lx = px - lw - 8;
          let ly = py - 20; if (ly < 0) ly = py + 8;
          roundRect(ctx, lx, ly, lw, 14, 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#7adfc8'; ctx.font = '7px ' + MONO_FAMILY;
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('P(' + X.toFixed(2) + ', ' + Y.toFixed(2) + ')', lx + 6, ly + 7);
        }
      }
    });
  } else if (proj === 'garagewash') {
    // Casco sucio: manchas orgánicas que el chorro va disolviendo.
    // El cursor apunta la boquilla; el HUD mide la cobertura restante.
    const blobs = [], drops = [], mist = [], confetti = [];
    const CONF_COLS = ['#4fc3e8', '#a8e4f6', '#7adfc8', '#f2c14e', '#e8825f', '#e9f4f8'];
    let initialLoad = 0, ph = 0, doneHold = 0, respawnT = -1;

    // Sube por todo el ancho: el canvas es una tira (~13:1), así que dos cañones
    // en las esquinas dejarían el centro vacío. Velocidad derivada del ápice
    // deseado en fracción de H, si no en un canvas bajo se sale todo por arriba.
    function popConfetti(W, H) {
      const gA = H * 0.0006;
      for (let i = 0; i < 90; i++) {
        const apex = H * (0.35 + Math.random() * 0.5);
        confetti.push({
          x: W * (0.04 + Math.random() * 0.92),
          y: H + 3 + Math.random() * 34, // arrancan bajo el borde: entran escalonados
          vx: (Math.random() - 0.5) * 1.6,
          vy: -Math.sqrt(2 * gA * apex),
          g: gA,
          w: 2 + Math.random() * 3, h: 3.5 + Math.random() * 3,
          rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.26,
          sw: Math.random() * Math.PI * 2,
          a: 1,
          c: CONF_COLS[(Math.random() * CONF_COLS.length) | 0]
        });
      }
    }

    // Las manchas nacen transparentes y suben hasta aMax con un retardo propio,
    // así el reinicio del ciclo se ve como la marea volviendo y no como un corte.
    function seedDirt() {
      blobs.length = 0;
      for (let i = 0; i < 58; i++) {
        const n = 7 + ((Math.random() * 4) | 0);
        const pts = [];
        for (let j = 0; j < n; j++) pts.push(0.6 + Math.random() * 0.55);
        blobs.push({
          x: 0.02 + Math.random() * 0.96,
          y: 0.1 + Math.random() * 0.8,
          r: 6 + Math.random() * 12,
          a: 0,
          aMax: 0.5 + Math.random() * 0.5,
          delay: Math.random() * 55,
          pts
        });
      }
      initialLoad = 0;
      for (const b of blobs) initialLoad += b.aMax * b.r * b.r;
      respawnT = 0;
    }
    seedDirt();

    // Contorno irregular cerrado: curvas entre puntos medios para que no se vea el polígono
    function blobPath(cx, cy, r, pts) {
      const n = pts.length;
      const vx = i => cx + Math.cos((i % n) / n * Math.PI * 2) * r * pts[i % n];
      const vy = i => cy + Math.sin((i % n) / n * Math.PI * 2) * r * pts[i % n] * 0.7;
      ctx.beginPath();
      ctx.moveTo((vx(0) + vx(1)) / 2, (vy(0) + vy(1)) / 2);
      for (let i = 1; i <= n; i++) {
        ctx.quadraticCurveTo(vx(i), vy(i), (vx(i) + vx(i + 1)) / 2, (vy(i) + vy(i + 1)) / 2);
      }
      ctx.closePath();
    }

    runRender(function draw() {
      hovT += (isHover ? 0.06 : -0.04); hovT = Math.max(0, Math.min(1, hovT));
      mx += (tmx - mx) * 0.07; my += (tmy - my) * 0.07;
      const W = CW, H = CH;
      ctx.fillStyle = 'rgba(' + RGB_TRAIL + ',0.3)';
      ctx.fillRect(0, 0, W, H);
      ph += 0.011;

      // Chapa mojada: brillo vertical y líneas de agua que ondulan
      const sheen = ctx.createLinearGradient(0, 0, 0, H);
      sheen.addColorStop(0, 'rgba(' + RGB_CARD + ',0.5)');
      sheen.addColorStop(0.55, 'rgba(' + RGB_CELL + ',0.22)');
      sheen.addColorStop(1, 'rgba(' + RGB_CARD + ',0.55)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(79,195,232,0.07)'; ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 10) {
          const y = H * (0.28 + k * 0.24) + Math.sin(x * 0.011 + ph * 1.6 + k * 2) * 3.5;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Rampa de reaparición. Se corta por tiempo y no esperando a que todas
      // lleguen a aMax: si no, el chorro que ya está limpiando la mantendría viva.
      if (respawnT >= 0) {
        respawnT++;
        for (const b of blobs) {
          if (respawnT > b.delay && b.a < b.aMax) b.a = Math.min(b.aMax, b.a + 0.013);
        }
        if (respawnT > 145) respawnT = -1;
      }

      const nx = 7, ny = H - 4;
      const tx = hovT > 0.05 ? mx * W : (0.5 + Math.sin(ph * 0.9) * 0.4) * W;
      const ty = hovT > 0.05 ? my * H : (0.45 + Math.sin(ph * 2.1) * 0.28) * H;
      const jetR = 9 + hovT * 4;

      // El chorro come alpha y radio de las manchas que alcanza
      for (const b of blobs) {
        if (b.a <= 0.02) continue;
        const d = Math.hypot(b.x * W - tx, (b.y * H - ty) * 1.25);
        if (d < jetR + b.r) {
          const bite = (1 - d / (jetR + b.r)) * 0.04;
          b.a = Math.max(0, b.a - bite);
          b.r = Math.max(1.5, b.r - bite * 2);
        }
      }

      // Relleno plano en dos capas: más barato que un gradiente por mancha y por
      // frame, y el contorno irregular ya da el aspecto orgánico.
      for (const b of blobs) {
        if (b.a <= 0.02) continue;
        const cx = b.x * W, cy = b.y * H;
        blobPath(cx, cy, b.r, b.pts);
        ctx.fillStyle = 'rgba(94,72,40,' + (b.a * 0.6) + ')';
        ctx.fill();
        blobPath(cx, cy - b.r * 0.12, b.r * 0.66, b.pts);
        ctx.fillStyle = 'rgba(142,108,60,' + (b.a * 0.75) + ')';
        ctx.fill();
      }

      let load = 0;
      for (const b of blobs) load += b.a * b.r * b.r;
      const clean = initialLoad > 0 ? 1 - load / initialLoad : 1;

      // Gotas en parábola. Cada una lleva su propia dispersión para que el chorro
      // abra en cono al llegar y no se vea una única línea recta.
      if (drops.length < 60) drops.push({
        t: 0,
        off: (Math.random() - 0.5) * 2.4,
        jx: (Math.random() - 0.5) * 16,
        jy: (Math.random() - 0.5) * 10,
        spd: 0.017 + Math.random() * 0.01,
        w: 0.6 + Math.random() * 0.8
      });
      ctx.lineCap = 'round';
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.t += d.spd;
        const gx = tx + d.jx, gy = ty + d.jy;
        if (d.t >= 1) {
          drops.splice(i, 1);
          if (mist.length < 70) mist.push({ x: gx, y: gy, vx: (Math.random() - 0.5) * 0.55, vy: -0.12 - Math.random() * 0.3, a: 0.45 + Math.random() * 0.25, r: 0.8 + Math.random() * 1.8 });
          continue;
        }
        const arcOf = t => Math.sin(t * Math.PI) * (14 + d.off * 8);
        const t2 = Math.min(1, d.t + 0.014);
        ctx.strokeStyle = 'rgba(79,195,232,' + (0.4 - d.t * 0.15) + ')';
        ctx.lineWidth = d.w;
        ctx.beginPath();
        ctx.moveTo(nx + (gx - nx) * d.t, ny + (gy - ny) * d.t - arcOf(d.t));
        ctx.lineTo(nx + (gx - nx) * t2, ny + (gy - ny) * t2 - arcOf(t2));
        ctx.stroke();
      }

      // Bruma que sale del impacto y se posa
      for (let i = mist.length - 1; i >= 0; i--) {
        const m = mist[i];
        m.x += m.vx; m.y += m.vy; m.vy += 0.011; m.a -= 0.009;
        if (m.a <= 0) { mist.splice(i, 1); continue; }
        ctx.fillStyle = 'rgba(168,228,246,' + (m.a * 0.5) + ')';
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      }

      const g2 = ctx.createRadialGradient(tx, ty, 0, tx, ty, jetR * 1.7);
      g2.addColorStop(0, 'rgba(168,228,246,0.34)');
      g2.addColorStop(0.5, 'rgba(79,195,232,0.15)');
      g2.addColorStop(1, 'rgba(79,195,232,0)');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(tx, ty, jetR * 1.7, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(' + RGB_STAR + ',0.5)';
      ctx.beginPath(); ctx.arc(nx, ny, 2.2, 0, Math.PI * 2); ctx.fill();

      const bw = 54, bx = W - bw - 8, by = 7;
      ctx.fillStyle = 'rgba(' + RGB_CELL + ',0.9)';
      roundRect(ctx, bx, by, bw, 5, 2); ctx.fill();
      ctx.fillStyle = '#4fc3e8';
      roundRect(ctx, bx, by, Math.max(2, bw * clean), 5, 2); ctx.fill();
      ctx.fillStyle = '#4fc3e8'; ctx.font = '7px ' + MONO_FAMILY;
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText((clean * 100).toFixed(0) + '% CLEAN', bx + bw, by + 8);

      // Al llegar al umbral: confeti, un respiro, y a ensuciarse otra vez.
      // Tras seedDirt respawnT vuelve a 0, así que la rama de arriba corta el
      // contador y no hay doble ráfaga.
      if (respawnT >= 0 || clean <= 0.99) {
        doneHold = 0;
      } else {
        if (doneHold === 0) popConfetti(W, H);
        if (++doneHold > 90) {
          doneHold = 0;
          seedDirt();
        }
      }

      // Papelillos: cos(sw) estrecha el ancho para simular el giro sobre su eje
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.vy += c.g; c.vx *= 0.995;
        c.x += c.vx; c.y += c.vy;
        c.rot += c.vr; c.sw += 0.14;
        if (c.vy > 0) c.a -= 0.007;
        if (c.a <= 0 || (c.vy > 0 && c.y > H + 40)) { confetti.splice(i, 1); continue; }
        const sx = 0.1 + Math.abs(Math.cos(c.sw)) * 0.9;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.globalAlpha = c.a;
        ctx.fillStyle = c.c;
        ctx.fillRect(-c.w * sx / 2, -c.h / 2, c.w * sx, c.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    });
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

(function setupGwMetrics() {
  const freqEl = document.getElementById('gw-freq');
  const snrEl = document.getElementById('gw-snr');
  const dtEl = document.getElementById('gw-dt');
  if (!freqEl) return;
  let t = 0;
  setInterval(() => {
    t += 0.04;
    const phase = (Math.sin(t * 0.7) + 1) / 2;
    freqEl.textContent = (35 + phase * 115).toFixed(0) + ' Hz';
    snrEl.textContent = (7.8 + phase * 0.9).toFixed(1);
    dtEl.textContent = '+' + (0.45 - phase * 0.4).toFixed(2) + ' s';
  }, 80);
})();

(function setupHudScroll() {
  const hudThumb = document.getElementById('hud-scroll-thumb');
  const hudVal = document.getElementById('hud-scroll-val');
  if (!hudThumb || !hudVal) return;

  let scrollTicking = false, isBottom = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const st = window.pageYOffset || document.documentElement.scrollTop;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        let p = maxScroll > 0 ? st / maxScroll : 0;
        p = Math.max(0, Math.min(1, p));
        hudThumb.style.transform = `translateY(calc(${p} * (100vh - 60px)))`;
        if (p >= 0.99) {
          hudVal.innerHTML = '↑'; hudVal.style.fontSize = '16px';
          hudThumb.classList.add('pointer'); isBottom = true;
        } else {
          hudVal.innerHTML = ''; hudThumb.classList.remove('pointer'); isBottom = false;
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  let isDragging = false, hasDragged = false, startY = 0, startScrollTop = 0;

  function startDrag(clientY) {
    isDragging = true; hasDragged = false; startY = clientY;
    startScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.userSelect = 'none'; document.body.style.cursor = 'ns-resize';
    hudThumb.style.cursor = 'grabbing';
    document.documentElement.style.scrollBehavior = 'auto';
  }
  function doDrag(clientY) {
    if (!isDragging) return;
    const dy = clientY - startY;
    if (Math.abs(dy) > 2) hasDragged = true;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const trackHeight = window.innerHeight - 60;
    if (trackHeight <= 0) return;
    const dp = dy / trackHeight;
    const startP = maxScroll > 0 ? startScrollTop / maxScroll : 0;
    let targetP = Math.max(0, Math.min(1, startP + dp));
    window.scrollTo(0, targetP * maxScroll);
  }
  function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.userSelect = ''; document.body.style.cursor = '';
    hudThumb.style.cursor = '';
    document.documentElement.style.scrollBehavior = '';
  }

  hudThumb.addEventListener('mousedown', (e) => { if (e.button !== 0) return; startDrag(e.clientY); e.preventDefault(); e.stopPropagation(); });
  hudThumb.addEventListener('touchstart', (e) => { if (e.touches.length !== 1) return; startDrag(e.touches[0].clientY); e.preventDefault(); e.stopPropagation(); }, { passive: false });
  document.addEventListener('mousemove', (e) => { doDrag(e.clientY); });
  document.addEventListener('touchmove', (e) => { if (!isDragging) return; doDrag(e.touches[0].clientY); if (e.cancelable) e.preventDefault(); }, { passive: false });
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
  hudThumb.addEventListener('click', (e) => {
    if (hasDragged) { e.preventDefault(); e.stopPropagation(); return; }
    if (isBottom) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();