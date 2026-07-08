'use strict';
/* =============================================================
   media-manifest.js — Manifiesto declarativo de medios por proyecto
                        (Focus-Drift Mosaic)
   Javier Portfolio
   ============================================================= */

/**
 * Campos por medio (ademas de type/src/captionEs/captionEn):
 *  - focus  {string} object-position sugerido (ej. '30% 60%'), por defecto centrado.
 *  - scale  {number} escala de foco explicita (ej. 1.5). Si se omite, media-mosaic.js
 *           la deriva del tamaño de celda (computeFocusScale). Usar para corregir a
 *           mano una pieza que crece demasiado o muy poco al enfocarse.
 */
const PROJECT_MEDIA = {
  // Detección de ondas gravitacionales — CNN ResNet vs Transformer sobre LIGO/Virgo (TFG_GravitationalWaves_AI)
  gw: [
    { type: 'image', src: 'public/media/gw/masses.png', captionEs: 'Masses', captionEn: 'Masses' },
    { type: 'image', src: 'public/media/gw/rocresnet.png', captionEs: 'ROC ResNet', captionEn: 'ROC ResNet' },
    { type: 'image', src: 'public/media/gw/chirp.png', scale: 3, captionEs: 'Chirp', captionEn: 'Chirp' },
    { type: 'image', src: 'public/media/gw/matrixvit.png', scale: 2, captionEs: 'Matrix VIT', captionEn: 'Matrix VIT' }
  ],

  // NLTL-Lite — Gravedad análoga en un PCB
  nltl: [
    { type: 'image', src: 'public/media/nltl/sim_K2_kerr.png', scale: 1.25, captionEs: 'Sim K2 Kerr', captionEn: 'Sim K2 Kerr' },
    { type: 'image', src: 'public/media/nltl/pcb_main_rtx.png', captionEs: 'PCB Main RTX', captionEn: 'PCB Main RTX' },
    { type: 'image', src: 'public/media/nltl/sim_B4_bhl.png', captionEs: 'Sim B4 BHL', captionEn: 'Sim B4 BHL' },
    { type: 'image', src: 'public/media/nltl/pcb_mezz_rtx.png', captionEs: 'PCB Mezz RTX', captionEn: 'PCB Mezz RTX' },
    { type: 'image', src: 'public/media/nltl/pcb_main_bias.png', scale: 2.5, captionEs: 'PCB Main Bias', captionEn: 'PCB Main Bias' }
  ],

  // Concrete & Silicon — Sandbox de agentes IA autónomos
  concrete: [
    { type: 'video', src: 'public/media/concrete/explore.mp4', scale: 1.35, captionEs: 'Explore', captionEn: 'Explore' },
    { type: 'video', src: 'public/media/concrete/worldgen.mp4', scale: 2.5, captionEs: 'World Gen', captionEn: 'World Gen' },
    { type: 'image', src: 'public/media/concrete/graph.png', scale: 3, captionEs: 'Graph', captionEn: 'Graph' },
    { type: 'video', src: 'public/media/concrete/narrator.mp4', scale: 1.7, captionEs: 'Narrator', captionEn: 'Narrator' }
  ],

  // PhysDeck — Suite de física computacional
  physdeck: [
    { type: 'image', src: 'public/media/physdeck/atomo.png', captionEs: 'Atomo', captionEn: 'Atomo' },
    { type: 'image', src: 'public/media/physdeck/lluvia.png', scale: 2.5, captionEs: 'Lluvia', captionEn: 'Lluvia' },
    { type: 'video', src: 'public/media/physdeck/fractal.mp4', scale: 2.8, captionEs: 'Fractal', captionEn: 'Fractal' },
    { type: 'image', src: 'public/media/physdeck/explosivo.png', captionEs: 'Explosivo', captionEn: 'Explosivo' },
    { type: 'image', src: 'public/media/physdeck/molecula.png', scale: 2.3, captionEs: 'Molecula', captionEn: 'Molecula' }
  ],

  // Catálogo Mineral — PWA Offline
  mineralia: [
    { type: 'image', src: 'public/media/mineralia/main.png', scale: 1.4, captionEs: 'Main', captionEn: 'Main' },
    { type: 'video', src: 'public/media/mineralia/overview.mp4', scale: 3, captionEs: 'Overview', captionEn: 'Overview' },
    { type: 'image', src: 'public/media/mineralia/landing.png', captionEs: 'Landing', captionEn: 'Landing' },
    { type: 'image', src: 'public/media/mineralia/stats.png', captionEs: 'Stats', captionEn: 'Stats' }
  ],

  // Soundtrack Showdown — Comparador de BSO
  soundtrack: [
    { type: 'video', src: 'public/media/soundtrack/tutorial.mp4', scale: 1.4, captionEs: 'Tutorial', captionEn: 'Tutorial' },
    { type: 'image', src: 'public/media/soundtrack/main.png', scale: 2.5, captionEs: 'Main', captionEn: 'Main' },
    { type: 'image', src: 'public/media/soundtrack/tracksfan.png', scale: 2.5, captionEs: 'Tracks Fan', captionEn: 'Tracks Fan' },
    { type: 'image', src: 'public/media/soundtrack/landing.png', scale: 2, captionEs: 'Landing', captionEn: 'Landing' }
  ],

  // Solver de métricas — Google Colab Jupyter Notebook
  solver: [
    { type: 'image', src: 'public/media/solver/grid.png', scale: 1.3, captionEs: 'Grid', captionEn: 'Grid' },
    { type: 'video', src: 'public/media/solver/foam.mp4', scale: 2.5, captionEs: 'Foam', captionEn: 'Foam' },
    { type: 'image', src: 'public/media/solver/lente.png', scale: 2.25, captionEs: 'Lente', captionEn: 'Lente' }
  ],

  // Trappist-1 Mission — Optimización evolutiva
  trappist: [
    { type: 'video', src: 'public/media/trappist/gui_roundtrip.mp4', scale: 1.35, captionEs: 'GUI Roundtrip', captionEn: 'GUI Roundtrip' },
    { type: 'video', src: 'public/media/trappist/legacy_run.mp4', scale: 3, captionEs: 'Legacy Run', captionEn: 'Legacy Run' },
    { type: 'image', src: 'public/media/trappist/spacecraft_slide.png', scale: 2.3, captionEs: 'Spacecraft Slide', captionEn: 'Spacecraft Slide' },
    { type: 'video', src: 'public/media/trappist/gui_oneway.mp4', scale: 2.5, captionEs: 'GUI Oneway', captionEn: 'GUI Oneway' },
    { type: 'image', src: 'public/media/trappist/interstellar_simulation_plot.png', scale: 2, captionEs: 'Interstellar Simulation Plot', captionEn: 'Interstellar Simulation Plot' }
  ],

  // EnvironHealth — Air Quality crowdsensing
  environ: [
    { type: 'image', src: 'public/media/environ/insidegadget.png', scale: 1.3, captionEs: 'Inside Gadget', captionEn: 'Inside Gadget' },
    { type: 'image', src: 'public/media/environ/logo.jpg', scale: 2.8, captionEs: 'Logo', captionEn: 'Logo' },
    { type: 'image', src: 'public/media/environ/outsidegadget.png', scale: 2, captionEs: 'Outside Gadget', captionEn: 'Outside Gadget' },
    { type: 'image', src: 'public/media/environ/landing.png', scale: 3, captionEs: 'Landing', captionEn: 'Landing' },
    { type: 'image', src: 'public/media/environ/carcasa.png', scale: 1.7, captionEs: 'Carcasa', captionEn: 'Carcasa' }
  ],

  // MEV-Bot — Arbitraje atómico Base L2
  mev: [
    { type: 'video', src: 'public/media/mev/run.mp4', captionEs: 'Run', captionEn: 'Run' }
  ],

  // Proyecto Diophantus — Teorema MRDP
  diophantus: [
    { type: 'image', src: 'public/media/diophantus/compilacion.png', scale: 1.3, captionEs: 'Compilacion', captionEn: 'Compilacion' },
    { type: 'video', src: 'public/media/diophantus/check.mp4', scale: 2.7, captionEs: 'Check', captionEn: 'Check' },
    { type: 'video', src: 'public/media/diophantus/apery.mp4', scale: 1.9, captionEs: 'Apery', captionEn: 'Apery' }
  ]
};

function getManifest(proj) {
  return (Object.prototype.hasOwnProperty.call(PROJECT_MEDIA, proj) && PROJECT_MEDIA[proj]) || [];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PROJECT_MEDIA, getManifest };
}