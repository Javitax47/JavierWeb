'use strict';

let globalMouseX = -1;
let globalMouseY = -1;
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', function (e) {
    globalMouseX = e.clientX;
    globalMouseY = e.clientY;
  }, { passive: true });
}

const MOSAIC_COLS = 6;
const MOSAIC_ROWS = 6;

function freezeLayout(layout) {
  if (layout && Array.isArray(layout.cells)) {
    layout.cells.forEach(function (c) { Object.freeze(c); });
    Object.freeze(layout.cells);
  }
  return Object.freeze(layout);
}

const MOSAIC_LAYOUTS = {
  2: {
    cols: MOSAIC_COLS, rows: MOSAIC_ROWS,
    cells: [
      { col: 1, colSpan: 4, row: 1, rowSpan: 6, featured: true }, // 24
      { col: 5, colSpan: 2, row: 1, rowSpan: 6 }                  // 12
    ]
  },

  3: {
    cols: MOSAIC_COLS, rows: MOSAIC_ROWS,
    cells: [
      { col: 1, colSpan: 4, row: 1, rowSpan: 4, featured: true }, // 16
      { col: 5, colSpan: 2, row: 1, rowSpan: 6 },                 // 12
      { col: 1, colSpan: 4, row: 5, rowSpan: 2 }                  //  8
    ]
  },

  4: {
    cols: MOSAIC_COLS, rows: MOSAIC_ROWS,
    cells: [
      { col: 1, colSpan: 4, row: 1, rowSpan: 4, featured: true }, // 16
      { col: 5, colSpan: 2, row: 1, rowSpan: 3 },                 //  6
      { col: 5, colSpan: 2, row: 4, rowSpan: 3 },                 //  6
      { col: 1, colSpan: 4, row: 5, rowSpan: 2 }                  //  8
    ]
  },

  5: {
    cols: MOSAIC_COLS, rows: MOSAIC_ROWS,
    cells: [
      { col: 1, colSpan: 4, row: 1, rowSpan: 4, featured: true }, // 16
      { col: 5, colSpan: 2, row: 1, rowSpan: 2 },                 //  4
      { col: 5, colSpan: 2, row: 3, rowSpan: 2 },                 //  4
      { col: 5, colSpan: 2, row: 5, rowSpan: 2 },                 //  4
      { col: 1, colSpan: 4, row: 5, rowSpan: 2 }                  //  8
    ]
  },

  6: {
    cols: MOSAIC_COLS, rows: MOSAIC_ROWS,
    cells: [
      { col: 1, colSpan: 3, row: 1, rowSpan: 4, featured: true }, // 12
      { col: 4, colSpan: 3, row: 1, rowSpan: 2 },                 //  6
      { col: 4, colSpan: 2, row: 3, rowSpan: 2 },                 //  4
      { col: 6, colSpan: 1, row: 3, rowSpan: 2 },                 //  2 (estrecha)
      { col: 1, colSpan: 2, row: 5, rowSpan: 2 },                 //  4
      { col: 3, colSpan: 4, row: 5, rowSpan: 2 }                  //  8 (panoramica)
    ]
  }
};
Object.keys(MOSAIC_LAYOUTS).forEach(function (k) { freezeLayout(MOSAIC_LAYOUTS[k]); });
Object.freeze(MOSAIC_LAYOUTS);

function singleCellLayout() {
  return freezeLayout({
    cols: MOSAIC_COLS, rows: MOSAIC_ROWS,
    cells: [{ col: 1, colSpan: MOSAIC_COLS, row: 1, rowSpan: MOSAIC_ROWS, featured: true }]
  });
}

function generateFallbackLayout(n) {
  const cells = [{ col: 1, colSpan: MOSAIC_COLS, row: 1, rowSpan: MOSAIC_ROWS }];

  while (cells.length < n) {
    // Seleccionar el rectangulo de mayor area; desempate: fila menor, luego columna menor.
    let pick = 0;
    for (let i = 1; i < cells.length; i++) {
      const a = cells[i];
      const b = cells[pick];
      const areaA = a.colSpan * a.rowSpan;
      const areaB = b.colSpan * b.rowSpan;
      if (areaA > areaB ||
        (areaA === areaB && (a.row < b.row || (a.row === b.row && a.col < b.col)))) {
        pick = i;
      }
    }

    const r = cells[pick];
    let first;
    let second;

    if (r.colSpan >= r.rowSpan && r.colSpan >= 2) {
      // Division vertical (corta columnas) por la mitad.
      const left = Math.floor(r.colSpan / 2);
      first = { col: r.col, colSpan: left, row: r.row, rowSpan: r.rowSpan };
      second = { col: r.col + left, colSpan: r.colSpan - left, row: r.row, rowSpan: r.rowSpan };
    } else if (r.rowSpan >= 2) {
      // Division horizontal (corta filas) por la mitad.
      const top = Math.floor(r.rowSpan / 2);
      first = { col: r.col, colSpan: r.colSpan, row: r.row, rowSpan: top };
      second = { col: r.col, colSpan: r.colSpan, row: r.row + top, rowSpan: r.rowSpan - top };
    } else {
      // Rectangulo 1x1 indivisible: imposible para n<=36. Guarda anti-bucle.
      break;
    }

    cells.splice(pick, 1, first, second);
  }

  // Marcar la celda de mayor area como "featured" (primer maximo, determinista).
  let featuredIdx = 0;
  for (let i = 1; i < cells.length; i++) {
    if (cells[i].colSpan * cells[i].rowSpan > cells[featuredIdx].colSpan * cells[featuredIdx].rowSpan) {
      featuredIdx = i;
    }
  }
  if (cells[featuredIdx]) { cells[featuredIdx].featured = true; }

  return freezeLayout({ cols: MOSAIC_COLS, rows: MOSAIC_ROWS, cells: cells });
}

function getLayout(n) {
  let count = Math.floor(Number(n));
  if (!Number.isFinite(count) || count < 1) { count = 1; }
  if (count === 1) { return singleCellLayout(); }
  if (count <= 6) { return MOSAIC_LAYOUTS[count]; }
  return generateFallbackLayout(count);
}

function normalizeIndex(i, n) {
  const size = Math.floor(Number(n));
  if (!Number.isFinite(size) || size < 1) { return 0; }
  let idx = Math.floor(Number(i));
  if (!Number.isFinite(idx)) { return 0; }
  return ((idx % size) + size) % size;
}

function nextIndex(i, n) {
  return normalizeIndex(Math.floor(Number(i)) + 1, n);
}

function prevIndex(i, n) {
  return normalizeIndex(Math.floor(Number(i)) - 1, n);
}

const MOSAIC_TIMING = Object.freeze({
  DWELL: 3200,        // ms que una pieza permanece enfocada antes de derivar
  FOCUS_TRANS: 520,   // ms de la transicion de expansion (coincide con CSS)
  RESUME_DELAY: 900,  // ms de gracia tras mouseleave antes de reanudar AUTO
  STAGGER: 70,        // ms de escalonado al construir tiles (entrada)
  HOVER_INTENT: 90    // ms de gracia antes de confirmar un cambio de hover (evita
  // parpadeo cuando una pieza vecina crece por encima del cursor)
});

function canAuto(s) {
  return !!s.panelVisible && !!s.docVisible && !s.reducedMotion && !s.pinned;
}

function recomputeMode(s) {
  if (!s.panelVisible) { return 'PAUSED_OFFSCREEN'; }
  if (!s.docVisible) { return 'PAUSED_HIDDEN'; }
  if (s.reducedMotion) { return 'STATIC_RM'; }
  if (s.pinned) { return 'USER_FOCUS'; }
  return 'AUTO';
}

function reduce(state, action) {
  const n = state.n;
  const type = action && action.type;

  switch (type) {
    case 'drift': {
      // Tick de la deriva automatica: solo avanza el foco en modo AUTO.
      if (state.mode !== 'AUTO') { return state; }
      return Object.assign({}, state, { focusIndex: nextIndex(state.focusIndex, n) });
    }

    case 'hover':
    case 'focus': {
      // Control manual: fija el foco solicitado y pausa la deriva (USER_FOCUS).
      return Object.assign({}, state, {
        focusIndex: normalizeIndex(action.index, n),
        mode: 'USER_FOCUS'
      });
    }

    case 'key': {
      // Teclado: avance/retroceso con wrap (dir) o indice ya resuelto (index).
      let idx;
      if (action.dir === 'next') { idx = nextIndex(state.focusIndex, n); }
      else if (action.dir === 'prev') { idx = prevIndex(state.focusIndex, n); }
      else if (action.index != null) { idx = normalizeIndex(action.index, n); }
      else { idx = normalizeIndex(state.focusIndex, n); }
      return Object.assign({}, state, { focusIndex: idx, mode: 'USER_FOCUS' });
    }

    case 'click': {
      // Toggle de pin: re-click sobre la MISMA Pieza des-fija; otra Pieza fija.
      const idx = normalizeIndex(action.index, n);
      const pinned = (state.focusIndex === idx) ? !state.pinned : true;
      return Object.assign({}, state, { focusIndex: idx, pinned: pinned, mode: 'USER_FOCUS' });
    }

    case 'mouseleave':
    case 'blur': {
      // Salida del usuario: el pin ignora la reanudacion (queda en USER_FOCUS);
      // si no esta fijado, entra en la gracia de reanudacion (RESUMING).
      const mode = state.pinned ? 'USER_FOCUS' : 'RESUMING';
      if (mode === state.mode) { return state; }
      return Object.assign({}, state, { mode: mode });
    }

    case 'resume': {
      // Gracia transcurrida: vuelve a AUTO si procede, si no, modo en reposo.
      return Object.assign({}, state, { mode: recomputeMode(state) });
    }

    case 'offscreen': {
      const next = Object.assign({}, state, { panelVisible: false, mode: 'PAUSED_OFFSCREEN' });
      return next;
    }

    case 'onscreen': {
      const next = Object.assign({}, state, { panelVisible: true });
      next.mode = recomputeMode(next);
      return next;
    }

    case 'hide': {
      const next = Object.assign({}, state, { docVisible: false, mode: 'PAUSED_HIDDEN' });
      return next;
    }

    case 'show': {
      const next = Object.assign({}, state, { docVisible: true });
      next.mode = recomputeMode(next);
      return next;
    }

    case 'setRM': {
      const next = Object.assign({}, state, { reducedMotion: !!action.value });
      next.mode = recomputeMode(next);
      return next;
    }

    default:
      // Accion desconocida: no-op (estado inalterado).
      return state;
  }
}

function computeFocusClasses(n, focusIndex) {
  const size = Math.floor(Number(n));
  if (!Number.isFinite(size) || size < 1) { return []; }
  const focus = normalizeIndex(focusIndex, size);
  const out = new Array(size);
  for (let i = 0; i < size; i++) {
    out[i] = (i === focus) ? 'is-focus' : 'is-ambient';
  }
  return out;
}

/** Normaliza un tipo de medio arbitrario a uno conocido (fallback 'image'). */
function normalizeMediaType(type) {
  return (type === 'gif' || type === 'video') ? type : 'image';
}

/** True si un medio tiene un `src` string no vacio (Req 8.6 / 5.1). */
function hasValidSrc(item) {
  return !!item && typeof item.src === 'string' && item.src.trim() !== '';
}

function planMosaic(items, layout) {
  const list = Array.isArray(items) ? items : [];
  const cells = (layout && Array.isArray(layout.cells)) ? layout.cells : [];

  /** @type {Array<{item:*, srcIndex:number}>} */
  const valid = [];
  /** @type {SkippedItem[]} */
  const skipped = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (hasValidSrc(item)) { valid.push({ item: item, srcIndex: i }); }
    else { skipped.push({ index: i, item: item }); }
  }

  const classes = computeFocusClasses(valid.length, 0);

  /** @type {TileDescriptor[]} */
  const tiles = valid.map(function (entry, p) {
    const item = entry.item;
    const type = normalizeMediaType(item.type);
    const poster = (typeof item.poster === 'string' && item.poster.trim() !== '') ? item.poster : undefined;
    const imgSrc = (type === 'video') ? (poster || '') : item.src;
    const cell = cells[p]
      ? { col: cells[p].col, colSpan: cells[p].colSpan, row: cells[p].row, rowSpan: cells[p].rowSpan, featured: !!cells[p].featured }
      : null;
    return {
      idx: p,
      srcIndex: entry.srcIndex,
      type: type,
      src: item.src,
      poster: poster,
      imgSrc: imgSrc,
      focus: (typeof item.focus === 'string' && item.focus.trim() !== '') ? item.focus : undefined,
      scale: (typeof item.scale === 'number' && item.scale > 0) ? item.scale : undefined,
      captionEs: item.captionEs,
      captionEn: item.captionEn,
      cell: cell,
      classes: [classes[p]]
    };
  });

  return { tiles: tiles, skipped: skipped };
}

/* Helpers de presentacion compartidos por buildMosaic ───────────── */

/** Rellena un numero a 2 digitos (p. ej. 1 -> "01"). */
function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Etiqueta corta del tipo para el lector HUD .mo-type (IMG/GIF/VID). */
function typeLabel(type) {
  if (type === 'gif') { return 'GIF'; }
  if (type === 'video') { return 'VID'; }
  return 'IMG';
}

/** Texto del badge para video/gif (▶ GIF / ▶ VID); '' para imagen. */
function badgeText(type) {
  if (type === 'gif') { return '\u25B6 GIF'; }
  if (type === 'video') { return '\u25B6 VID'; }
  return '';
}

function computeFocusScale(cell, cols, rows) {
  const MIN = 1.15;
  const K = 0.72;
  if (!cell || !cols || !rows) { return 1.3; }
  const area = (cell.colSpan * cell.rowSpan) / (cols * rows);
  if (!(area > 0)) { return 1.3; }
  const raw = K / Math.sqrt(area);
  const s = Math.max(MIN, raw);
  return Math.round(s * 1000) / 1000;
}

function resolveAlt(d, proj, lang) {
  const caption = (lang === 'en') ? d.captionEn : d.captionEs;
  if (typeof caption === 'string' && caption.trim() !== '') { return caption; }
  return (proj || 'media') + ' \u00B7 ' + pad2(d.idx + 1);
}

function clearMosaicDom(vis) {
  const selectors = ['.proj-mosaic', '.mosaic-readout', '.mosaic-modedot', '.mosaic-live'];
  selectors.forEach(function (sel) {
    const nodes = vis.querySelectorAll ? vis.querySelectorAll(sel) : [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node && node.parentNode) { node.parentNode.removeChild(node); }
    }
  });
}

function buildMosaic(vis, items, layout, opts) {
  if (typeof document === 'undefined') { return null; }
  if (!vis) { return null; }
  opts = opts || {};

  const plan = planMosaic(items, layout);

  // Req 8.6: advertir (una vez por medio) de los omitidos por falta de src.
  plan.skipped.forEach(function (s) {
    console.warn('[media-mosaic] medio omitido por falta de "src" (indice ' + s.index + ')', s.item);
  });

  if (plan.tiles.length === 0) { return null; }

  // Resolucion robusta de proyecto e idioma.
  const panel = (typeof vis.closest === 'function') ? vis.closest('[data-proj]') : null;
  const proj = opts.proj
    || (panel && panel.dataset && panel.dataset.proj)
    || '';
  const docEl = document.documentElement;
  const lang = opts.lang
    || (docEl && docEl.dataset && docEl.dataset.lang)
    || 'es';

  // Re-hidratacion idempotente: descartar cualquier mosaico previo.
  clearMosaicDom(vis);

  // Contenedor .proj-mosaic
  const mosaic = document.createElement('div');
  mosaic.className = 'proj-mosaic';
  mosaic.setAttribute('data-mosaic', '');
  mosaic.setAttribute('data-count', String(plan.tiles.length));
  mosaic.setAttribute('role', 'group');
  mosaic.setAttribute('aria-label', opts.groupLabel || 'Galer\u00EDa del proyecto');
  mosaic.setAttribute('aria-roledescription', 'mosaico de medios');

  /** @type {HTMLButtonElement[]} */
  const tiles = plan.tiles.map(function (d) {
    const isFocus = d.classes[0] === 'is-focus';

    const btn = document.createElement('button');
    btn.className = 'mosaic-tile ' + (d.classes[0] || 'is-ambient');
    btn.type = 'button';
    btn.setAttribute('data-idx', String(d.idx));
    btn.setAttribute('data-type', d.type);
    btn.setAttribute('aria-pressed', isFocus ? 'true' : 'false');

    // Geometria por custom properties (sin selectores por indice en CSS).
    if (d.cell) {
      btn.style.setProperty('--col', String(d.cell.col));
      btn.style.setProperty('--col-span', String(d.cell.colSpan));
      btn.style.setProperty('--row', String(d.cell.row));
      btn.style.setProperty('--row-span', String(d.cell.rowSpan));
      const cols = (layout && layout.cols) || 6;
      const rows = (layout && layout.rows) || 6;
      const focusScale = (typeof d.scale === 'number') ? d.scale : computeFocusScale(d.cell, cols, rows);
      btn.style.setProperty('--focus-scale', String(focusScale));
      const touchesLeft = d.cell.col === 1;
      const touchesRight = (d.cell.col + d.cell.colSpan - 1) === cols;
      const touchesTop = d.cell.row === 1;
      const touchesBottom = (d.cell.row + d.cell.rowSpan - 1) === rows;
      const ox = (touchesLeft && !touchesRight) ? '0%' : (touchesRight && !touchesLeft) ? '100%' : '50%';
      const oy = (touchesTop && !touchesBottom) ? '0%' : (touchesBottom && !touchesTop) ? '100%' : '50%';
      btn.style.setProperty('--focus-origin', ox + ' ' + oy);
      const justifyContent = (ox === '0%') ? 'flex-start' : (ox === '100%') ? 'flex-end' : 'center';
      const alignItems = (oy === '0%') ? 'flex-start' : (oy === '100%') ? 'flex-end' : 'center';
      btn.style.setProperty('--focus-justify', justifyContent);
      btn.style.setProperty('--focus-align', alignItems);
    }

    const frame = document.createElement('span');
    frame.className = 'mosaic-frame';

    const img = document.createElement('img');
    // 'loaded' solo si hay algo que mostrar YA: para video sin poster (el
    // manifiesto nunca declara uno) d.imgSrc queda vacio, y marcar 'loaded'
    // sin src deja un <img> visible sin nada que pintar -> icono de archivo
    // roto del navegador hasta que el <video> real cargue.
    img.className = (isFocus && d.imgSrc) ? 'mosaic-media loaded' : 'mosaic-media';
    img.setAttribute('loading', 'lazy');
    img.setAttribute('alt', resolveAlt(d, proj, lang));
    if (d.imgSrc) {
      img.setAttribute(isFocus ? 'src' : 'data-src', d.imgSrc);
    }
    frame.appendChild(img);

    // Badge de tipo para gif/video.
    if (d.type === 'gif' || d.type === 'video') {
      const badge = document.createElement('span');
      badge.className = 'mosaic-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = badgeText(d.type);
      frame.appendChild(badge);
    }

    btn.appendChild(frame);
    mosaic.appendChild(btn);
    return btn;
  });

  // Lector HUD .mosaic-readout (indice 01 / total / tipo del foco inicial).
  const readout = document.createElement('div');
  readout.className = 'mosaic-readout';
  readout.setAttribute('aria-hidden', 'true');
  const moIdx = document.createElement('span'); moIdx.className = 'mo-idx'; moIdx.textContent = '01';
  const moSep = document.createElement('span'); moSep.className = 'mo-sep'; moSep.textContent = '/';
  const moTotal = document.createElement('span'); moTotal.className = 'mo-total'; moTotal.textContent = pad2(plan.tiles.length);
  const moType = document.createElement('span'); moType.className = 'mo-type'; moType.textContent = typeLabel(plan.tiles[0].type);
  readout.appendChild(moIdx);
  readout.appendChild(moSep);
  readout.appendChild(moTotal);
  readout.appendChild(moType);

  // Indicador de modo (auto/pausa).
  const modedot = document.createElement('span');
  modedot.className = 'mosaic-modedot';
  modedot.setAttribute('aria-hidden', 'true');
  modedot.setAttribute('data-mode', 'auto');

  // Region viva para lectores de pantalla (Req 7.5).
  const live = document.createElement('p');
  live.className = 'mosaic-live sr-only';
  live.setAttribute('aria-live', 'polite');

  vis.appendChild(mosaic);
  vis.appendChild(readout);
  vis.appendChild(modedot);
  vis.appendChild(live);

  return { mosaic: mosaic, tiles: tiles, readout: readout, modedot: modedot, live: live };
}

/** Devuelve la funcion matchMedia disponible, o null fuera de navegador. */
function getMatchMedia() {
  if (typeof matchMedia !== 'undefined') { return matchMedia; }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia.bind(window);
  }
  return null;
}

/** Lee el snapshot actual de prefers-reduced-motion (false si no hay soporte). */
function readReducedMotion() {
  try {
    const mm = getMatchMedia();
    if (mm) { const q = mm('(prefers-reduced-motion: reduce)'); return !!(q && q.matches); }
  } catch (e) { /* ignore */ }
  return false;
}

/** Idioma activo del documento ('es'|'en'); 'es' por defecto/fuera de navegador. */
function currentLang() {
  if (typeof document === 'undefined') { return 'es'; }
  const docEl = document.documentElement;
  return (docEl && docEl.dataset && docEl.dataset.lang) || 'es';
}

function safeGetManifest(proj) {
  try {
    if (typeof getManifest === 'function') { return getManifest(proj) || []; }
  } catch (e) { /* ignore */ }
  try {
    if (typeof PROJECT_MEDIA !== 'undefined' && PROJECT_MEDIA &&
      Object.prototype.hasOwnProperty.call(PROJECT_MEDIA, proj)) {
      return PROJECT_MEDIA[proj] || [];
    }
  } catch (e) { /* ignore */ }
  return [];
}

/** Palabra de tipo de medio para anuncios aria-live, segun idioma. */
function typeWordFor(type, lang) {
  if (lang === 'en') {
    if (type === 'gif') { return 'gif'; }
    if (type === 'video') { return 'video'; }
    return 'image';
  }
  if (type === 'gif') { return 'gif'; }
  if (type === 'video') { return 'v\u00EDdeo'; }
  return 'imagen';
}

function ensureVideoEl(tile, item) {
  if (typeof document === 'undefined' || !tile) { return null; }
  let v = (typeof tile.querySelector === 'function') ? tile.querySelector('video.mosaic-media') : null;
  if (v) { return v; }
  v = document.createElement('video');
  v.className = 'mosaic-media';
  v.muted = true;
  try { v.defaultMuted = true; } catch (e) { /* ignore */ }
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  try { v.playsInline = true; } catch (e) { /* ignore */ }
  v.loop = true;
  v.setAttribute('loop', '');
  v.setAttribute('preload', 'none');
  if (item && typeof item.poster === 'string' && item.poster.trim() !== '') {
    v.setAttribute('poster', item.poster);
  }
  const frame = (typeof tile.querySelector === 'function') ? tile.querySelector('.mosaic-frame') : null;
  (frame || tile).appendChild(v);
  return v;
}

function createMediaLoader() {
  /** @type {Set<*>} timeouts de carga (Req 5.8) pendientes; se limpian en dispose. */
  const loadTimers = new Set();
  /** @type {Array<{el:*,type:string,handler:Function}>} listeners de carga (load/error/loadeddata). */
  const mediaListeners = [];

  /** Registra un listener de medio rastreado (para retirarlo en dispose sin fugas). */
  function onMedia(el, type, handler) {
    if (!el || typeof el.addEventListener !== 'function') { return; }
    el.addEventListener(type, handler, { once: true });
    mediaListeners.push({ el: el, type: type, handler: handler });
  }

  function startTimeout(tile) {
    if (typeof setTimeout === 'undefined') { return null; }
    const id = setTimeout(function () {
      loadTimers.delete(id);
      // Timeout de 10 s sin cargar (Req 5.8): marcar error, sin reintentar.
      if (tile && tile.classList &&
        !tile.classList.contains('media-error') &&
        !tile.classList.contains('video-ready')) {
        const media = (typeof tile.querySelector === 'function') ? tile.querySelector('.mosaic-media') : null;
        const done = media && media.classList && media.classList.contains('loaded');
        if (!done) { tile.classList.add('media-error'); }
      }
    }, 10000);
    loadTimers.add(id);
    return id;
  }

  function clearTO(id) {
    if (id == null) { return; }
    if (loadTimers.has(id)) { loadTimers.delete(id); }
    if (typeof clearTimeout !== 'undefined') { clearTimeout(id); }
  }

  function ensureLoaded(tile, item) {
    if (!tile || !item) { return; }
    if (tile.dataset && tile.dataset.loaded === '1') { return; }
    const type = normalizeMediaType(item.type);

    if (type === 'image' || type === 'gif') {
      const img = (typeof tile.querySelector === 'function')
        ? (tile.querySelector('img.mosaic-media') || tile.querySelector('img'))
        : null;
      if (img) {
        const src = img.getAttribute('data-src') || item.src;
        const to = startTimeout(tile);
        onMedia(img, 'load', function () { clearTO(to); img.classList.add('loaded'); });
        onMedia(img, 'error', function () { clearTO(to); tile.classList.add('media-error'); });
        if (src) { img.setAttribute('src', src); img.removeAttribute('data-src'); }
        // Ya estaba decodificada (p. ej. el indice 0 que carga con `src` en buildMosaic).
        if (img.complete && img.naturalWidth > 0) { clearTO(to); img.classList.add('loaded'); }
      }
    } else if (type === 'video') {
      const v = ensureVideoEl(tile, item);
      if (v) {
        const to = startTimeout(tile);
        onMedia(v, 'loadeddata', function () {
          clearTO(to); tile.classList.add('video-ready'); v.classList.add('loaded');
        });
        onMedia(v, 'error', function () { clearTO(to); tile.classList.add('media-error'); });
        if (item.src) { v.setAttribute('src', item.src); }
      }
    }

    if (tile.dataset) { tile.dataset.loaded = '1'; }
  }

  function prefetch(tile, item) { ensureLoaded(tile, item); }

  function preloadStill(tile, item) {
    if (!tile || !item) { return; }
    if (tile.dataset && tile.dataset.stillLoaded === '1') { return; }
    const type = normalizeMediaType(item.type);
    const img = (typeof tile.querySelector === 'function')
      ? (tile.querySelector('img.mosaic-media') || tile.querySelector('img'))
      : null;
    if (img) {
      // Si ya esta decodificada (p. ej. el indice 0 que nace con `src`), basta
      // con marcar la clase de visibilidad.
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('loaded');
      } else {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        const to = startTimeout(tile);
        onMedia(img, 'load', function () { clearTO(to); img.classList.add('loaded'); });
        onMedia(img, 'error', function () { clearTO(to); tile.classList.add('media-error'); });
        if (src && !img.getAttribute('src')) { img.setAttribute('src', src); }
        img.removeAttribute('data-src');
      }
    }
    if (tile.dataset) {
      tile.dataset.stillLoaded = '1';
      // Para imagen/gif el still ES el medio definitivo: evita recargas posteriores.
      if (type === 'image' || type === 'gif') { tile.dataset.loaded = '1'; }
    }
  }

  function applyPlayback(tile, item, shouldPlay, reducedMotion) {
    if (!tile || !item) { return; }
    const type = normalizeMediaType(item.type);
    if (type === 'video') {
      let v = (typeof tile.querySelector === 'function') ? tile.querySelector('video') : null;
      if (!v) {
        // Ensure video element is created and loaded.
        ensureLoaded(tile, item); // This will create the video element if it doesn't exist.
        v = tile.querySelector('video');
        if (!v) { return; } // If still no video, return.
      }
      if (!reducedMotion) {
        const p = (typeof v.play === 'function') ? v.play() : null;
        if (p && typeof p.catch === 'function') { p.catch(function () { /* autoplay blocked */ }); }
      } else if (typeof v.pause === 'function') {
        v.pause();
      }
    } else if (type === 'gif') {
      // GIF playback still depends on shouldPlay (focus/visibility)
      if (shouldPlay && !reducedMotion) { ensureLoaded(tile, item); }
    }
    // image: no playback effect.
  }

  function dispose() {
    loadTimers.forEach(function (id) { if (typeof clearTimeout !== 'undefined') { clearTimeout(id); } });
    loadTimers.clear();
    // Retirar los listeners de carga aun no disparados (evita fugas tras destroy).
    mediaListeners.forEach(function (l) {
      if (l.el && typeof l.el.removeEventListener === 'function') { l.el.removeEventListener(l.type, l.handler); }
    });
    mediaListeners.length = 0;
  }

  return { ensureLoaded: ensureLoaded, prefetch: prefetch, preloadStill: preloadStill, applyPlayback: applyPlayback, dispose: dispose };
}
function createFocusScheduler(ctrl, opts) {
  opts = opts || {};
  const dwell = (opts.dwell != null) ? opts.dwell : MOSAIC_TIMING.DWELL;
  const defaultResume = (opts.resumeDelay != null) ? opts.resumeDelay : MOSAIC_TIMING.RESUME_DELAY;
  const getReducedMotion = (typeof opts.getReducedMotion === 'function')
    ? opts.getReducedMotion : function () { return false; };
  const _setTimeout = opts.setTimeout || ((typeof setTimeout !== 'undefined') ? setTimeout : null);
  const _clearTimeout = opts.clearTimeout || ((typeof clearTimeout !== 'undefined') ? clearTimeout : null);

  let driftTimer = null;
  let resumeTimer = null;
  let running = false;

  function clearDrift() { if (driftTimer != null && _clearTimeout) { _clearTimeout(driftTimer); } driftTimer = null; }
  function clearResume() { if (resumeTimer != null && _clearTimeout) { _clearTimeout(resumeTimer); } resumeTimer = null; }

  function armTimer() {
    if (!_setTimeout) { return; }
    clearDrift();
    driftTimer = _setTimeout(function () {
      driftTimer = null;
      // Solo deriva si seguimos en AUTO en el instante del disparo (Property 4).
      if (ctrl.getMode() === 'AUTO') {
        ctrl.setFocus(ctrl.getFocus() + 1, { source: 'auto' });
      }
      // Re-encadena un unico timer mientras siga activo (Req 6.4).
      if (running) { armTimer(); }
    }, dwell);
  }

  function start() {
    if (getReducedMotion()) { return; }          // nunca arranca con reduced motion (Req 7.1)
    if (ctrl.getCount() < 2) { return; }          // 1 medio: nada que derivar (Req 2.7)
    if (running) { return; }
    running = true;
    armTimer();
  }

  function pause() {
    running = false;
    clearDrift();
    clearResume();
  }

  function resumeAfter(ms) {
    if (!_setTimeout) { return; }
    clearResume();
    resumeTimer = _setTimeout(function () {
      resumeTimer = null;
      if (ctrl.canAuto()) { ctrl._setMode('AUTO'); start(); }
    }, (ms != null) ? ms : defaultResume);
  }

  function isRunning() { return running; }
  function dispose() { pause(); }

  return {
    start: start, pause: pause, resumeAfter: resumeAfter,
    isRunning: isRunning, dispose: dispose
  };
}
function createVisibilityGate(panel, onChange) {
  if (typeof document === 'undefined') {
    return {
      isPanelVisible: function () { return false; },
      isDocVisible: function () { return true; },
      dispose: function () { /* no-op */ }
    };
  }

  let panelVisible = false;
  let docVisible = !document.hidden;
  let io = null;

  function emit() { if (typeof onChange === 'function') { onChange(panelVisible && docVisible); } }

  if (typeof IntersectionObserver !== 'undefined' && panel) {
    io = new IntersectionObserver(function (entries) {
      for (let i = 0; i < entries.length; i++) { panelVisible = entries[i].isIntersecting; }
      emit();
    }, { threshold: 0 });
    io.observe(panel);
  } else {
    // Sin soporte de IO: mejora progresiva, se asume visible.
    panelVisible = true;
  }

  function onVisChange() { docVisible = !document.hidden; emit(); }
  document.addEventListener('visibilitychange', onVisChange);

  return {
    isPanelVisible: function () { return panelVisible; },
    isDocVisible: function () { return docVisible; },
    dispose: function () {
      if (io) { io.disconnect(); io = null; }
      document.removeEventListener('visibilitychange', onVisChange);
    }
  };
}

function createController(panel, vis, dom, items, proj, initialState) {
  let state = initialState;
  let scheduler = null;
  let gate = null;
  const loader = createMediaLoader();

  /** Listeners de DOM registrados (para destroy sin fugas). */
  let listeners = [];
  /** Timers transientes del controlador (barridos .just-focused). */
  const pendingTimers = new Set();
  /** matchMedia de reduced-motion + su listener. */
  let mql = null;
  let mqlHandler = null;
  let destroyed = false;

  function on(el, type, handler, opt) {
    if (!el || typeof el.addEventListener !== 'function') { return; }
    el.addEventListener(type, handler, opt);
    listeners.push({ el: el, type: type, handler: handler, opt: opt });
  }

  function scheduleTimer(fn, ms) {
    if (typeof setTimeout === 'undefined') { return null; }
    const id = setTimeout(function () { pendingTimers.delete(id); fn(); }, ms);
    pendingTimers.add(id);
    return id;
  }

  function clearAllTimers() {
    pendingTimers.forEach(function (id) { if (typeof clearTimeout !== 'undefined') { clearTimeout(id); } });
    pendingTimers.clear();
  }

  /* ── Helpers de DOM ───────────────────────────────────────── */

  function closestTile(node) {
    if (!node || typeof node.closest !== 'function') { return null; }
    const t = node.closest('.mosaic-tile');
    return (t && dom.mosaic && dom.mosaic.contains(t)) ? t : null;
  }

  function tileIndex(tile) { return dom.tiles.indexOf(tile); }

  function readCellVars(tile) {
    const col = parseInt(tile.style.getPropertyValue('--col'), 10);
    const colSpan = parseInt(tile.style.getPropertyValue('--col-span'), 10);
    const row = parseInt(tile.style.getPropertyValue('--row'), 10);
    const rowSpan = parseInt(tile.style.getPropertyValue('--row-span'), 10);
    if (!(col >= 1) || !(colSpan >= 1) || !(row >= 1) || !(rowSpan >= 1)) { return null; }
    return { col: col, colSpan: colSpan, row: row, rowSpan: rowSpan };
  }

  const tileCells = dom.tiles.map(readCellVars);

  function tileIndexAtPoint(clientX, clientY) {
    if (!dom.mosaic) { return -1; }
    const rect = dom.mosaic.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) { return -1; }
    if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) { return -1; }
    const colPt = Math.min(MOSAIC_COLS - 1, Math.floor((clientX - rect.left) / rect.width * MOSAIC_COLS)) + 1;
    const rowPt = Math.min(MOSAIC_ROWS - 1, Math.floor((clientY - rect.top) / rect.height * MOSAIC_ROWS)) + 1;
    for (let i = 0; i < tileCells.length; i++) {
      const c = tileCells[i];
      if (!c) { continue; }
      if (colPt >= c.col && colPt < c.col + c.colSpan && rowPt >= c.row && rowPt < c.row + c.rowSpan) { return i; }
    }
    return -1;
  }

  function focusTile(idx) {
    const tile = dom.tiles[idx];
    if (tile && typeof tile.focus === 'function') { try { tile.focus(); } catch (e) { /* ignore */ } }
  }

  function applyFocusPos(tile, focus) {
    if (!tile || !tile.style) { return; }
    const pos = (typeof focus === 'string' && focus.trim() !== '') ? focus : '50% 50%';
    tile.style.setProperty('--focus-pos', pos);
  }

  function flashSweep(tile) {
    if (!tile || !tile.classList) { return; }
    tile.classList.add('just-focused');
    scheduleTimer(function () { tile.classList.remove('just-focused'); }, MOSAIC_TIMING.FOCUS_TRANS);
  }

  function updateReadout(idx) {
    if (!dom.readout || typeof dom.readout.querySelector !== 'function') { return; }
    const moIdx = dom.readout.querySelector('.mo-idx');
    const moType = dom.readout.querySelector('.mo-type');
    if (moIdx) { moIdx.textContent = pad2(idx + 1); }
    if (moType) { moType.textContent = typeLabel(normalizeMediaType(items[idx].type)); }
  }

  function setModeDot() {
    if (!dom.modedot) { return; }
    dom.modedot.setAttribute('data-mode', state.mode === 'AUTO' ? 'auto' : 'user');
  }

  function announce(idx) {
    if (!dom.live) { return; }
    const lang = currentLang();
    const word = typeWordFor(normalizeMediaType(items[idx].type), lang);
    const connector = (lang === 'en') ? ' of ' : ' de ';
    dom.live.textContent = (idx + 1) + connector + state.n + ', ' + word;
  }

  function pauseAllMedia() {
    for (let k = 0; k < dom.tiles.length; k++) {
      loader.applyPlayback(dom.tiles[k], items[k], false, state.reducedMotion);
    }
  }

  function preloadStills() {
    const isMobile = typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
      !window.matchMedia('(min-width: 901px)').matches;

    for (let k = 0; k < dom.tiles.length; k++) {
      loader.preloadStill(dom.tiles[k], items[k]);
      if (isMobile) {
        // En móvil calculamos la proporción de todos los recursos para reconfigurar sus dimensiones
        clampFocusScale(dom.tiles[k]);
      }
    }
  }
  function clampFocusScale(tile) {
    if (!tile || !dom.mosaic) { return; }
    const frame = (typeof tile.querySelector === 'function') ? tile.querySelector('.mosaic-frame') : null;
    if (!frame || !frame.style) { return; }

    // Evaluamos si el dispositivo tiene un viewport móvil (<= 900px)
    const isMobile = typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
      !window.matchMedia('(min-width: 901px)').matches;

    if (isMobile) {
      // En móvil retiramos cualquier escala inline heredada para que no haya zoom de enfoque
      frame.style.removeProperty('--actual-scale');
    }

    const desired = parseFloat(tile.style.getPropertyValue('--focus-scale')) || 1.3;

    const vid = frame.querySelector('video.mosaic-media');
    const img = frame.querySelector('img.mosaic-media');
    let natW = 0, natH = 0;
    if (vid && vid.videoWidth > 0) { natW = vid.videoWidth; natH = vid.videoHeight; }
    else if (img && img.complete && img.naturalWidth > 0) { natW = img.naturalWidth; natH = img.naturalHeight; }
    if (!(natW > 0) || !(natH > 0)) {
      const recompute = function () {
        // En móvil ajustamos la dimensión tan pronto como cargue cualquier celda; en desktop solo la activa
        if (isMobile || tile.classList.contains('is-focus')) {
          clampFocusScale(tile);
        }
      };
      if (vid && typeof vid.addEventListener === 'function') { vid.addEventListener('loadedmetadata', recompute, { once: true }); }
      if (img && typeof img.addEventListener === 'function') { img.addEventListener('load', recompute, { once: true }); }
      return;
    }

    // (1) El marco adopta la forma del medio y lo contiene dentro de la celda.
    // La forma en si (aspect-ratio/width/height/object-fit) vive en CSS via
    // --media-ar y la clase .media-sized (ver @media max-width:900px en
    // source.css para movil, y @media min-width:901px mas abajo para el
    // escalado de foco en escritorio).
    tile.style.setProperty('--media-ar', natW + ' / ' + natH);
    tile.classList.add('media-sized');

    if (isMobile) { return; }

    // (2) Medir el marco ya reformado (offsetWidth fuerza el reflujo sincrono).
    const w0 = frame.offsetWidth;   // tamaño SIN escalar (el transform no altera offset*)
    const h0 = frame.offsetHeight;
    if (!(w0 > 0) || !(h0 > 0)) { return; }   // sin dimensiones aun; el listener recalcula

    const mr = dom.mosaic.getBoundingClientRect();
    if (!(mr.width > 0) || !(mr.height > 0)) { return; }
    const fr = frame.getBoundingClientRect();
    const tol = 6;   // 3px de padding del mosaico + margen de redondeo
    const leftFlush = Math.abs(fr.left - mr.left) <= tol;
    const rightFlush = Math.abs(fr.right - mr.right) <= tol;
    const topFlush = Math.abs(fr.top - mr.top) <= tol;
    const botFlush = Math.abs(fr.bottom - mr.bottom) <= tol;

    // Escala maxima horizontal segun el ancla (borde pegado = punto fijo):
    let maxSH;
    if (leftFlush && !rightFlush) { maxSH = (mr.right - fr.left) / w0; }          // crece a la derecha
    else if (rightFlush && !leftFlush) { maxSH = (fr.right - mr.left) / w0; }     // crece a la izquierda
    else { const cx = (fr.left + fr.right) / 2; maxSH = Math.min(cx - mr.left, mr.right - cx) * 2 / w0; } // desde el centro

    // Escala maxima vertical:
    let maxSV;
    if (topFlush && !botFlush) { maxSV = (mr.bottom - fr.top) / h0; }
    else if (botFlush && !topFlush) { maxSV = (fr.bottom - mr.top) / h0; }
    else { const cy = (fr.top + fr.bottom) / 2; maxSV = Math.min(cy - mr.top, mr.bottom - cy) * 2 / h0; }

    let clamped = Math.min(desired, maxSH, maxSV);
    if (!(clamped > 0)) { clamped = 1; }
    clamped = Math.max(1, clamped);
    clamped = Math.round(clamped * 1000) / 1000;
    frame.style.setProperty('--actual-scale', String(clamped));
  }

  /* ── Render (invariante: exactamente un is-focus) ─────────── */

  function render(prev, ropts) {
    ropts = ropts || {};
    const idx = state.focusIndex;
    const n = state.n;
    const visible = state.panelVisible && state.docVisible;
    const isNeutral = !!ropts.neutral;

    // 1. Clases + aria-pressed (Req 1.2, 7.4). Sin reflow: solo clases.
    for (let k = 0; k < dom.tiles.length; k++) {
      const tile = dom.tiles[k];
      const isFocus = !isNeutral && (k === idx);
      tile.classList.toggle('is-neutral', isNeutral);
      tile.classList.toggle('is-focus', isFocus);
      tile.classList.toggle('is-ambient', !isNeutral && !isFocus);
      tile.setAttribute('aria-pressed', isFocus ? 'true' : 'false');
    }

    // 2. object-position de interes + barrido CRT breve (salvo reduced-motion,
    //    modo neutral o cuando se pide silencioso, p. ej. al deshacer el hover).
    //    El recorte de escala va en el paso 3 (tras crear el <video>).
    if (!isNeutral) {
      applyFocusPos(dom.tiles[idx], items[idx] && items[idx].focus);
      if (prev !== idx && !state.reducedMotion && !ropts.noSweep) { flashSweep(dom.tiles[idx]); }
    }

    // 3. Carga del enfocado + prefetch del siguiente (Req 5.2, 5.3) y politica
    //    de reproduccion de un unico medio (Req 5.6, 5.7).
    if (!isNeutral) {
      loader.ensureLoaded(dom.tiles[idx], items[idx]);   // crea el <video> si toca
      clampFocusScale(dom.tiles[idx]);                    // forma + recorte (ya con el <video> en el DOM)
      if (n > 1) {
        const nextI = nextIndex(idx, n);
        loader.prefetch(dom.tiles[nextI], items[nextI]);
      }
    }
    for (let m = 0; m < dom.tiles.length; m++) {
      const tileItem = items[m];
      // For GIFs, shouldPlay depends on focus and visibility. For videos, it's always true unless reducedMotion.
      const shouldPlayForGif = !isNeutral && (m === idx) && visible;
      loader.applyPlayback(dom.tiles[m], tileItem, shouldPlayForGif, state.reducedMotion);
    }

    // 4. HUD + accesibilidad.
    if (!isNeutral) { updateReadout(idx); }
    setModeDot();
    if (!isNeutral) { announce(idx); }
  }

  /** Aplica el estado neutral: todas las piezas sin expansion ni atenuacion. */
  function renderNeutral() {
    render(state.focusIndex, { neutral: true });
  }

  /* ── setFocus: nucleo de la interaccion ───────── */

  function setFocus(i, opts) {
    opts = opts || {};
    const source = opts.source;
    const n = state.n;
    if (n < 1) { return; }

    if (source === 'auto' && state.mode !== 'AUTO') { return; }

    const prev = state.focusIndex;
    const idx = normalizeIndex(i, n);
    if (source === 'hover' || source === 'focus' || source === 'scroll') {
      state = reduce(state, { type: 'focus', index: idx });
      if (scheduler) { scheduler.pause(); }
    } else if (source === 'key') {
      state = reduce(state, { type: 'key', index: idx });
      if (scheduler) { scheduler.pause(); }
    } else if (source === 'click') {
      state = reduce(state, { type: 'click', index: idx });
      if (scheduler) { scheduler.pause(); }
    } else if (source === 'restore') {
      // Deshacer el hover: vuelve al estado neutral (sin ninguna pieza expandida).
      renderNeutral();
      return;
    } else {
      // 'auto' o 'init': solo mueve el foco; el modo lo gobierna _onVisibility/scheduler.
      state = Object.assign({}, state, { focusIndex: idx });
    }

    render(prev);
  }

  /* ── API publica de navegacion ────────────────────────────── */

  function getFocus() { return state.focusIndex; }
  function getMode() { return state.mode; }
  function getCount() { return state.n; }
  function getReducedMotion() { return state.reducedMotion; }
  function canAutoFn() { return canAuto(state); }
  function setMode(m) { state = Object.assign({}, state, { mode: m }); setModeDot(); }

  function next() {
    const idx = nextIndex(state.focusIndex, state.n);
    setFocus(idx, { source: 'key' });
    focusTile(idx);
  }
  function prev() {
    const idx = prevIndex(state.focusIndex, state.n);
    setFocus(idx, { source: 'key' });
    focusTile(idx);
  }

  function pause() {
    if (scheduler) { scheduler.pause(); }
    state = Object.assign({}, state, { mode: 'USER_FOCUS' });
    setModeDot();
  }
  function resume() {
    if (canAuto(state)) {
      state = Object.assign({}, state, { mode: 'AUTO' });
      if (scheduler) { scheduler.start(); }
      setModeDot();
    }
  }

  /* ── Visibilidad ──────────────────────────────── */

  function _onVisibility(visible) {
    if (gate) {
      state = Object.assign({}, state, {
        panelVisible: gate.isPanelVisible(),
        docVisible: gate.isDocVisible()
      });
    }
    const isVisible = (typeof visible === 'boolean') ? visible : (state.panelVisible && state.docVisible);

    if (!isVisible) {
      state = Object.assign({}, state, { mode: state.docVisible ? 'PAUSED_OFFSCREEN' : 'PAUSED_HIDDEN' });
      if (scheduler) { scheduler.pause(); }
      pauseAllMedia();                                   // Req 6.6 / 5.10
    } else {
      if (state.reducedMotion) {
        state = Object.assign({}, state, { mode: 'STATIC_RM' });
      } else if (state.pinned) {
        state = Object.assign({}, state, { mode: 'USER_FOCUS' });
      } else {
        state = Object.assign({}, state, { mode: 'AUTO' });
        if (scheduler) { scheduler.start(); }            // Req 6.3
      }
      const idx = state.focusIndex;
      for (let k = 0; k < dom.tiles.length; k++) {
        const tileItem = items[k];
        // For GIFs, shouldPlay depends on focus. For videos, it's always true unless reducedMotion.
        const shouldPlayForGif = (k === idx);
        loader.applyPlayback(dom.tiles[k], tileItem, shouldPlayForGif, state.reducedMotion);
      }
    }
    setModeDot();
  }

  /* ── Reactividad a prefers-reduced-motion ────── */

  function bindReducedMotion() {
    const mm = getMatchMedia();
    if (!mm) { return; }
    try { mql = mm('(prefers-reduced-motion: reduce)'); } catch (e) { mql = null; }
    if (!mql) { return; }
    mqlHandler = function (e) {
      state = reduce(state, { type: 'setRM', value: !!e.matches });
      if (state.reducedMotion) {
        if (scheduler) { scheduler.pause(); }            // sin deriva ni autoplay (Req 7.1)
        pauseAllMedia();
        setModeDot();
      } else {
        _onVisibility(state.panelVisible && state.docVisible);  // re-evaluar deriva/playback
      }
    };
    if (typeof mql.addEventListener === 'function') { mql.addEventListener('change', mqlHandler); }
    else if (typeof mql.addListener === 'function') { mql.addListener(mqlHandler); }
  }

  /* ── Cableado de eventos hover/focus/click/teclado ── */

  function _bind(sched, vgate) {
    scheduler = sched;
    gate = vgate;
    if (typeof document === 'undefined' || !dom.mosaic) { return; }

    const mosaic = dom.mosaic;
    let lastHover = -1;
    let hoverReturnIndex = -1;
    let hoverTimer = null;
    let pendingHoverIdx = -1;
    let insideMosaic = false;

    function cancelHoverIntent() {
      if (hoverTimer != null) { clearTimeout(hoverTimer); pendingTimers.delete(hoverTimer); hoverTimer = null; }
      pendingHoverIdx = -1;
    }

    function requestHoverFocus(idx) {
      if (idx === lastHover && state.mode === 'USER_FOCUS') { return; }
      if (idx === pendingHoverIdx) { return; }
      pendingHoverIdx = idx;
      if (hoverTimer != null) { clearTimeout(hoverTimer); pendingTimers.delete(hoverTimer); }
      hoverTimer = scheduleTimer(function () {
        hoverTimer = null;
        if (pendingHoverIdx !== idx) { return; }
        if (!insideMosaic) { pendingHoverIdx = -1; return; }
        pendingHoverIdx = -1;
        // Recordar el foco previo solo al INICIAR un hover (no en cada tile).
        if (lastHover === -1) { hoverReturnIndex = state.focusIndex; }
        lastHover = idx;
        setFocus(idx, { source: 'hover' });
      }, MOSAIC_TIMING.HOVER_INTENT);
    }

    on(mosaic, 'mouseover', function (e) {
      insideMosaic = true;
      const idx = tileIndexAtPoint(e.clientX, e.clientY);
      if (idx < 0) { return; }
      requestHoverFocus(idx);
    });

    let hoverMoveX = -1;
    let hoverMoveY = -1;
    let hoverMoveTicking = false;
    on(mosaic, 'mousemove', function (e) {
      insideMosaic = true;
      hoverMoveX = e.clientX;
      hoverMoveY = e.clientY;
      if (hoverMoveTicking) { return; }
      hoverMoveTicking = true;
      requestAnimationFrame(function () {
        hoverMoveTicking = false;
        if (destroyed) { return; }
        if (!insideMosaic) { return; } // mouseleave ya disparo mientras este frame esperaba
        const idx = tileIndexAtPoint(hoverMoveX, hoverMoveY);
        if (idx < 0) { return; }
        requestHoverFocus(idx);
      });
    }, { passive: true });

    // Foco de teclado entrando en una pieza.
    on(mosaic, 'focusin', function (e) {
      const tile = closestTile(e.target);
      if (!tile) { return; }
      setFocus(tileIndex(tile), { source: 'focus' });
    });

    // El cursor abandona el mosaico: se DESHACE el hover (vuelve al foco previo)
    // y, si no esta fijado, se programa la reanudacion con gracia (cancelable).
    on(mosaic, 'mouseleave', function () {
      insideMosaic = false;
      lastHover = -1;
      cancelHoverIntent();
      if (state.pinned) { return; }
      // Restaurar el foco que habia antes del hover (deshace la expansion).
      if (hoverReturnIndex >= 0 && hoverReturnIndex !== state.focusIndex) {
        setFocus(hoverReturnIndex, { source: 'restore' });
      }
      hoverReturnIndex = -1;
      if (scheduler) {
        state = reduce(state, { type: 'mouseleave' });
        setModeDot();
        scheduler.resumeAfter(MOSAIC_TIMING.RESUME_DELAY);   // Req 3.4
      }
    });

    // El foco de teclado sale del mosaico (no a otra pieza interna).
    on(mosaic, 'focusout', function (e) {
      const to = e.relatedTarget;
      if (to && mosaic.contains(to)) { return; }
      if (!state.pinned && scheduler) {
        state = reduce(state, { type: 'blur' });
        setModeDot();
        scheduler.resumeAfter(MOSAIC_TIMING.RESUME_DELAY);
      }
    });

    // Click/Enter/Space (los <button> disparan 'click' con Enter/Space): toggle pin.
    on(mosaic, 'click', function (e) {
      const tile = closestTile(e.target);
      if (!tile) { return; }
      setFocus(tileIndex(tile), { source: 'click' });       // Req 3.6
      focusTile(state.focusIndex);
    });

    // ArrowRight/ArrowLeft: avance/retroceso con wrap + traslado del foco (Req 3.2/3.3).
    on(mosaic, 'keydown', function (e) {
      const key = e.key;
      if (key === 'ArrowRight' || key === 'Right') { e.preventDefault(); next(); }
      else if (key === 'ArrowLeft' || key === 'Left') { e.preventDefault(); prev(); }
    });

    let scrollTicking = false;
    if (typeof window !== 'undefined') {
      on(window, 'scroll', function () {
        if (destroyed) { return; }
        if (globalMouseX < 0 || globalMouseY < 0) { return; }
        if (scrollTicking) { return; }
        scrollTicking = true;
        requestAnimationFrame(function () {
          scrollTicking = false;
          if (destroyed) { return; }

          const idx = tileIndexAtPoint(globalMouseX, globalMouseY);
          if (idx >= 0) {
            insideMosaic = true;
            requestHoverFocus(idx);
          } else {
            if (lastHover !== -1) {
              insideMosaic = false;
              lastHover = -1;
              cancelHoverIntent();
              if (!state.pinned) {
                if (hoverReturnIndex >= 0 && hoverReturnIndex !== state.focusIndex) {
                  setFocus(hoverReturnIndex, { source: 'restore' });
                }
                hoverReturnIndex = -1;
                if (scheduler) {
                  state = reduce(state, { type: 'mouseleave' });
                  setModeDot();
                  scheduler.resumeAfter(MOSAIC_TIMING.RESUME_DELAY);
                }
              } else {
                hoverReturnIndex = -1;
              }
            }
          }
        });
      }, { passive: true });
    }

    // Scroll horizontal en el mosaico móvil: enfoca la tarjeta que queda en medio
    let mosaicScrollTicking = false;
    on(mosaic, 'scroll', function () {
      if (destroyed) { return; }
      if (mosaicScrollTicking) { return; }
      mosaicScrollTicking = true;
      requestAnimationFrame(function () {
        mosaicScrollTicking = false;
        if (destroyed) { return; }

        const isMobile = typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
          !window.matchMedia('(min-width: 901px)').matches;
        if (!isMobile) { return; }

        const containerRect = mosaic.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;

        let closestIdx = -1;
        let minDistance = Infinity;

        for (let i = 0; i < dom.tiles.length; i++) {
          const tile = dom.tiles[i];
          const tileRect = tile.getBoundingClientRect();
          const tileCenterX = tileRect.left + tileRect.width / 2;
          const distance = Math.abs(tileCenterX - centerX);

          if (distance < minDistance) {
            minDistance = distance;
            closestIdx = i;
          }
        }

        if (closestIdx >= 0 && closestIdx !== state.focusIndex) {
          setFocus(closestIdx, { source: 'scroll' });
        }
      });
    });

    // Detector de cambio de tamaño de ventana: limpia o aplica estilos si cambia el formato
    let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    on(window, 'resize', function () {
      if (destroyed) { return; }
      const currentWidth = window.innerWidth;
      const crossedThreshold = (lastWidth > 900 && currentWidth <= 900) || (lastWidth <= 900 && currentWidth > 900);
      if (crossedThreshold) {
        for (let k = 0; k < dom.tiles.length; k++) {
          clampFocusScale(dom.tiles[k]);
        }
      }
      lastWidth = currentWidth;
    });

    bindReducedMotion();
  }

  /* ── relabel ─────────────────────────────────── */

  function relabel() {
    const lang = currentLang();
    for (let k = 0; k < dom.tiles.length; k++) {
      const tile = dom.tiles[k];
      const alt = resolveAlt(
        { idx: k, captionEs: items[k].captionEs, captionEn: items[k].captionEn },
        proj, lang
      );
      const img = (typeof tile.querySelector === 'function')
        ? (tile.querySelector('img.mosaic-media') || tile.querySelector('img'))
        : null;
      if (img) { img.setAttribute('alt', alt); }   // textContent/atributos, sin innerHTML
    }
    announce(state.focusIndex);                     // anuncio en el nuevo idioma
  }

  /* ── destroy ─────────────────────────────────── */

  function destroy() {
    if (destroyed) { return; }
    destroyed = true;

    if (scheduler) { scheduler.dispose(); }
    if (gate) { gate.dispose(); }

    // Retirar el listener de la media query de reduced-motion.
    if (mql && mqlHandler) {
      if (typeof mql.removeEventListener === 'function') { mql.removeEventListener('change', mqlHandler); }
      else if (typeof mql.removeListener === 'function') { mql.removeListener(mqlHandler); }
    }
    mql = null; mqlHandler = null;

    // Retirar todos los listeners de DOM registrados.
    listeners.forEach(function (l) {
      if (l.el && typeof l.el.removeEventListener === 'function') { l.el.removeEventListener(l.type, l.handler, l.opt); }
    });
    listeners = [];

    // Cancelar timers transientes y los del cargador.
    clearAllTimers();
    if (loader && loader.dispose) { loader.dispose(); }

    // Pausar cualquier video (estado permitido; no se reconstruye el DOM).
    for (let k = 0; k < dom.tiles.length; k++) {
      const v = (typeof dom.tiles[k].querySelector === 'function') ? dom.tiles[k].querySelector('video') : null;
      if (v && typeof v.pause === 'function') { v.pause(); }
    }

    // Permitir una posterior re-hidratacion del mismo panel.
    if (vis && vis.dataset) { delete vis.dataset.mosaicReady; }
    if (vis) { vis.__mosaicCtrl = null; }
    if (panel) { panel.__mosaicCtrl = null; }
  }

  return {
    // API publica (typedef MosaicController)
    setFocus: setFocus,
    getFocus: getFocus,
    next: next,
    prev: prev,
    pause: pause,
    resume: resume,
    getMode: getMode,
    relabel: relabel,
    destroy: destroy,
    // Auxiliares usados por scheduler/gate/init
    getCount: getCount,
    getReducedMotion: getReducedMotion,
    canAuto: canAutoFn,
    _setMode: setMode,
    _onVisibility: _onVisibility,
    _preloadStills: preloadStills,
    _renderNeutral: renderNeutral,
    _bind: _bind
  };
}

/**
 * @param {HTMLElement} panel - article.proj-panel
 * @returns {Object|null} MosaicController o null
 */
function initMediaMosaic(panel) {
  if (typeof document === 'undefined') { return null; }    // node-safe
  if (!panel || typeof panel.querySelector !== 'function') { return null; }

  const proj = (panel.dataset && panel.dataset.proj) || '';
  const items = safeGetManifest(proj);
  const vis = panel.querySelector('.proj-vis');

  // Sin .proj-vis o sin medios: no hidratar, conservar markup base (Req 1.6 / 8.5).
  if (!vis || !items || items.length === 0) { return null; }

  // Idempotencia (Req 8.2 / Property 11): reutilizar el controlador existente.
  if (vis.dataset && vis.dataset.mosaicReady === '1' && vis.__mosaicCtrl) {
    return vis.__mosaicCtrl;
  }

  // Solo los medios validos generan Pieza; el layout debe dimensionarse a ese
  // recuento porque planMosaic empareja cada medio valido con layout.cells[p].
  const validItems = items.filter(hasValidSrc);
  if (validItems.length === 0) { return null; }

  const layout = getLayout(validItems.length);
  const dom = buildMosaic(vis, items, layout, { proj: proj });
  if (!dom) { return null; }

  const state = {
    focusIndex: 0,
    mode: 'BOOTING',
    pinned: false,
    panelVisible: false,
    docVisible: (typeof document !== 'undefined') ? !document.hidden : true,
    reducedMotion: readReducedMotion(),
    n: dom.tiles.length
  };

  const ctrl = createController(panel, vis, dom, validItems, proj, state);
  const sched = createFocusScheduler(ctrl, {
    dwell: MOSAIC_TIMING.DWELL,
    resumeDelay: MOSAIC_TIMING.RESUME_DELAY,
    getReducedMotion: function () { return ctrl.getReducedMotion(); }
  });
  const gate = createVisibilityGate(panel, function (visible) { ctrl._onVisibility(visible); });

  ctrl._bind(sched, gate);
  ctrl._preloadStills();                                                  // carga TODAS las imagenes estaticas (sin esperar foco/hover)
  ctrl._renderNeutral();                                                  // arranca en estado neutral (sin ninguna pieza expandida)
  ctrl._onVisibility(gate.isPanelVisible() && gate.isDocVisible());        // arranca AUTO si procede

  if (vis.dataset) { vis.dataset.mosaicReady = '1'; }
  vis.__mosaicCtrl = ctrl;
  panel.__mosaicCtrl = ctrl;                                              // para el cableado de relabel
  return ctrl;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MOSAIC_LAYOUTS, getLayout, MOSAIC_TIMING,
    normalizeIndex, nextIndex, prevIndex,
    reduce, computeFocusClasses, canAuto, recomputeMode,
    planMosaic, buildMosaic, computeFocusScale,
    initMediaMosaic, createMediaLoader, createFocusScheduler,
    createVisibilityGate, ensureVideoEl
  };
}