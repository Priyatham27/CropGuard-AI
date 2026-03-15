/* ============================================================
   fieldmode.js — CropGuard AI
   "Field Mode" toggle: first-person parallax field perspective,
   wooden signboard cards, pipe slider dials, vintage gauge ring
   ============================================================ */

(function () {
  'use strict';

  let fieldModeActive = false;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let rafId  = null;

  /* ── INJECT FIELD MODE CSS ── */
  const fmStyle = document.createElement('style');
  fmStyle.id = 'field-mode-styles';
  fmStyle.textContent = `
    /* ── FIELD MODE BODY ── */
    body.field-mode {
      perspective: 1000px;
      perspective-origin: 50% 40%;
    }

    /* ── PARALLAX LAYERS ── */
    #fm-sky-layer, #fm-mid-layer, #fm-fg-layer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      transition: transform 0.12s ease-out;
      will-change: transform;
    }

    #fm-sky-layer {
      z-index: 0;
      background: linear-gradient(180deg, #4a96d4 0%, #92c8e8 55%, #a8c860 100%);
    }

    /* Mid-field crops row */
    #fm-mid-layer {
      z-index: 2;
      bottom: 0;
      top: auto;
      height: 55vh;
    }

    /* Foreground grass */
    #fm-fg-layer {
      z-index: 3;
      bottom: 0;
      top: auto;
      height: 30vh;
    }

    /* ── WOODEN SIGNBOARD CARDS ── */
    body.field-mode .card {
      background: linear-gradient(135deg,
        #c17b3a 0%, #a8642c 20%, #c8854a 40%,
        #b06030 60%, #d4924e 80%, #a86030 100%) !important;
      border: none !important;
      border-radius: 4px 4px 2px 2px !important;
      box-shadow:
        inset 0 1px 0 rgba(255,220,160,0.3),
        inset 0 -1px 0 rgba(40,15,0,0.4),
        3px 3px 0 #7a4010,
        6px 6px 0 rgba(80,30,0,0.3),
        0 8px 24px rgba(40,10,0,0.4) !important;
      position: relative !important;
      color: #fff8e8 !important;
      font-family: 'Georgia', serif !important;
      /* Wood grain via repeating gradient */
      background-size: 4px 100% !important;
      animation: woodGrain 0s linear !important;
    }

    body.field-mode .card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: repeating-linear-gradient(
        90deg,
        transparent 0px,
        transparent 3px,
        rgba(0,0,0,0.04) 3px,
        rgba(0,0,0,0.04) 4px
      );
      pointer-events: none;
    }

    /* Rope texture top */
    body.field-mode .card::after {
      content: '〰〰〰〰〰〰〰〰';
      position: absolute;
      top: -14px;
      left: 0; right: 0;
      font-size: 10px;
      color: rgba(200,160,80,0.7);
      text-align: center;
      letter-spacing: -1px;
      line-height: 1;
      overflow: hidden;
    }

    body.field-mode .card-title,
    body.field-mode .metric-label {
      color: rgba(255,235,180,0.75) !important;
      text-shadow: 0 1px 2px rgba(40,10,0,0.6);
    }

    body.field-mode .card-title::before {
      content: '─── ';
      color: rgba(255,210,120,0.5);
    }

    body.field-mode .score-big,
    body.field-mode .metric-value {
      color: #fff8d0 !important;
      text-shadow: 0 2px 4px rgba(40,10,0,0.5);
    }

    /* ── CARD-LEVEL TEXT (cream on wood) ── */
    /* Only target text DIRECTLY inside wooden .card — not inner sub-panels */
    body.field-mode .factor-name,
    body.field-mode .slider-labels span,
    body.field-mode .slider-val,
    body.field-mode .score-lbl,
    body.field-mode .score-desc,
    body.field-mode .field-label,
    body.field-mode .section-compare-label,
    body.field-mode .csg-header span,
    body.field-mode .score-compare-label,
    body.field-mode .score-compare-delta,
    body.field-mode .arrow-sep,
    body.field-mode .contrib-label,
    body.field-mode .contrib-pct,
    body.field-mode .gauge-label,
    body.field-mode .gauge-val,
    body.field-mode .rec-title,
    body.field-mode .rec-premium,
    body.field-mode .compare-table td,
    body.field-mode .compare-table th {
      color: #fff0d0 !important;
    }

    /* ── INNER PANELS — keep dark for readability ── */
    /* explain-row, rec-card inner, and any element on a light bg need DARK text */
    body.field-mode .explain-row {
      background: rgba(255,235,200,0.18) !important;
    }
    body.field-mode .explain-text,
    body.field-mode .explain-bold,
    body.field-mode .explain-note {
      color: #3a1a00 !important;
    }
    body.field-mode .rec-desc {
      color: #4a2800 !important;
    }

    /* rec-card gets its own wooden look so all content on it stays readable */
    body.field-mode .rec-card {
      background: linear-gradient(135deg, #a86830, #8a5020) !important;
      border: 1px solid rgba(255,200,120,0.3) !important;
    }
    body.field-mode .rec-card .rec-title,
    body.field-mode .rec-card .rec-desc,
    body.field-mode .rec-card .rec-premium {
      color: #fff0d0 !important;
    }

    /* Tags inside wooden cards */
    body.field-mode .tag {
      background: rgba(255,220,140,0.25) !important;
      color: #ffe0a0 !important;
      border: 1px solid rgba(255,200,100,0.3);
    }

    /* Stake below cards */
    body.field-mode .card {
      margin-bottom: 28px !important;
    }
    body.field-mode .card + *::before {
      content: '';
    }

    /* ── PIPE DIAL SLIDERS ── */
    body.field-mode input[type=range] {
      -webkit-appearance: none;
      appearance: none;
      height: 12px;
      background:
        linear-gradient(#6a3010, #8a4820) padding-box,
        linear-gradient(#4a2008, #6a3818) border-box;
      border: 2px solid #3a1a08;
      border-radius: 6px;
      box-shadow:
        inset 0 2px 4px rgba(0,0,0,0.5),
        0 2px 0 rgba(255,200,100,0.15);
      cursor: pointer;
    }

    body.field-mode input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 22px; height: 22px;
      border-radius: 50%;
      background:
        radial-gradient(circle at 35% 35%, #e0c060 0%, #c09030 60%, #7a5010 100%);
      border: 2px solid #5a3008;
      box-shadow:
        0 2px 6px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,230,140,0.5);
      cursor: grab;
      position: relative;
    }

    body.field-mode input[type=range]::-webkit-slider-thumb:active {
      cursor: grabbing;
      transform: scale(1.1);
    }

    /* ── VINTAGE GAUGE (score ring override) ── */
    body.field-mode .score-ring {
      background:
        radial-gradient(circle at 50% 50%, #d4b060 0%, #b08030 60%, #7a5010 100%);
      border-radius: 50%;
      border: 6px solid #5a3808;
      box-shadow:
        0 4px 20px rgba(40,10,0,0.5),
        inset 0 2px 8px rgba(0,0,0,0.3),
        0 0 0 2px rgba(255,200,80,0.3);
      padding: 4px;
    }

    body.field-mode .score-ring svg {
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
    }

    body.field-mode .ring-bg {
      stroke: rgba(40,15,0,0.5) !important;
    }

    body.field-mode .score-big {
      font-family: 'Georgia', serif !important;
      font-style: italic;
    }

    /* Gauge needle overlay */
    body.field-mode #ring-needle {
      display: block !important;
    }

    #ring-needle {
      display: none;
      position: absolute;
      top: 50%; left: 50%;
      width: 3px;
      height: 52px;
      background: linear-gradient(to bottom, #e04020 60%, transparent 100%);
      border-radius: 2px 2px 0 0;
      transform-origin: bottom center;
      transform: translate(-50%, -100%) rotate(0deg);
      transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 2px 8px rgba(200,30,10,0.6);
    }

    /* ── NAV IN FIELD MODE ── */
    body.field-mode .nav {
      background: linear-gradient(135deg, #3a6018 0%, #5a8828 100%) !important;
      border-bottom: 2px solid #2a4810 !important;
    }

    /* ── FIELD MODE BUTTON ACTIVE STATE ── */
    #field-mode-btn.active {
      background: rgba(80,160,30,0.4) !important;
      color: #c8ff80 !important;
      border-color: rgba(120,200,60,0.5) !important;
    }

    /* ── METRIC CARDS IN FIELD MODE ── */
    body.field-mode .metric-card {
      background: linear-gradient(135deg, #b07030, #906020) !important;
      border: none !important;
      box-shadow: 2px 2px 0 #5a3010, 0 4px 12px rgba(40,10,0,0.3) !important;
    }

    /* Section head in field mode */
    body.field-mode .page > .section-head {
      background: rgba(80,40,10,0.6) !important;
      border-color: rgba(200,140,60,0.3) !important;
    }

    body.field-mode .section-title {
      color: #ffe8a0 !important;
      font-family: 'Georgia', serif !important;
      text-shadow: 0 2px 8px rgba(40,10,0,0.6) !important;
    }

    body.field-mode .section-sub {
      color: rgba(255,230,160,0.7) !important;
    }
  `;
  document.head.appendChild(fmStyle);

  /* ── BUILD PARALLAX LAYERS ── */
  function buildParallaxLayers() {
    /* Sky */
    const sky = document.createElement('div');
    sky.id = 'fm-sky-layer';
    sky.innerHTML = `
      <div style="position:absolute;bottom:0;left:0;right:0;height:30%;
        background:linear-gradient(to top, rgba(120,180,60,0.6) 0%, transparent 100%);">
      </div>
      <!-- Distant crop row hills -->
      <svg style="position:absolute;bottom:28%;left:0;right:0;width:100%;height:80px"
           viewBox="0 0 1000 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,60 Q100,20 200,55 Q300,15 400,50 Q500,20 600,55 Q700,15 800,50 Q900,20 1000,45 L1000,80 L0,80Z"
              fill="rgba(60,120,20,0.5)"/>
      </svg>`;
    document.body.prepend(sky);

    /* Mid-field crop stalks */
    const mid = document.createElement('div');
    mid.id = 'fm-mid-layer';
    const midSVG = buildMidFieldSVG();
    mid.innerHTML = midSVG;
    document.body.prepend(mid);

    /* Foreground grass blades */
    const fg = document.createElement('div');
    fg.id = 'fm-fg-layer';
    fg.style.cssText += 'overflow:hidden;';
    fg.innerHTML = buildFgGrassSVG();
    document.body.prepend(fg);
  }

  function buildMidFieldSVG() {
    const W = window.innerWidth;
    const H = Math.round(window.innerHeight * 0.55);
    let stalks = '';
    for (let i = 0; i < 35; i++) {
      const x   = (i / 34) * W;
      const h   = 60 + Math.random() * 120;
      const clr = Math.random() > 0.5 ? '#5aa020' : '#c8b030';
      stalks += `<line x1="${x}" y1="${H}" x2="${x + (Math.random()-0.5)*15}" y2="${H - h}"
                   stroke="${clr}" stroke-width="${1.5 + Math.random()*2}" opacity="0.7"/>`;
      if (Math.random() > 0.5) {
        stalks += `<ellipse cx="${x}" cy="${H - h + 8}" rx="4" ry="2"
                     fill="${clr}" opacity="0.6"/>`;
      }
    }
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
                 style="position:absolute;bottom:0;left:0;" xmlns="http://www.w3.org/2000/svg">
      ${stalks}
      <path d="M0,${H} Q${W/4},${H*0.6} ${W/2},${H*0.7} Q${W*0.75},${H*0.55} ${W},${H*0.65} L${W},${H}Z"
            fill="rgba(50,100,20,0.55)"/>
    </svg>`;
  }

  function buildFgGrassSVG() {
    const W = window.innerWidth;
    const H = Math.round(window.innerHeight * 0.30);
    let blades = '';
    for (let i = 0; i < 55; i++) {
      const x = Math.random() * W;
      const h = 40 + Math.random() * 100;
      const c = Math.random() > 0.4 ? '#4a8c18' : '#c8b030';
      const lx = x + (Math.random()-0.5)*20;
      blades += `<path d="M${x},${H} Q${(x+lx)/2},${H - h*0.5} ${lx},${H-h}"
                   stroke="${c}" stroke-width="${2+Math.random()*3}" fill="none" opacity="0.85"/>`;
    }
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
                 style="position:absolute;bottom:0;left:0;" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,${H*0.4} Q${W*0.25},${H*0.1} ${W*0.5},${H*0.3} Q${W*0.75},${H*0.05} ${W},${H*0.25} L${W},${H} L0,${H}Z"
            fill="rgba(40,90,15,0.7)"/>
      ${blades}
    </svg>`;
  }

  /* ── NEEDLE UPDATE ── */
  function updateNeedle(score) {
    const needle = document.getElementById('ring-needle');
    if (!needle || !fieldModeActive) return;
    /* Map score 0–100 to rotation -135° to +135° */
    const deg = -135 + (score / 100) * 270;
    needle.style.transform = `translate(-50%, -100%) rotate(${deg}deg)`;
  }

  /* ── MOUSE PARALLAX TICK ── */
  function parallaxTick() {
    if (!fieldModeActive) return;
    const W  = window.innerWidth;
    const H  = window.innerHeight;
    const nx = (mouseX / W - 0.5);  // -0.5 to 0.5
    const ny = (mouseY / H - 0.5);

    const sky = document.getElementById('fm-sky-layer');
    const mid = document.getElementById('fm-mid-layer');
    const fg  = document.getElementById('fm-fg-layer');

    if (sky) sky.style.transform = `translate(${nx * 12}px, ${ny * 6}px)`;
    if (mid) mid.style.transform = `translate(${nx * 28}px, ${ny * 12}px)`;
    if (fg)  fg.style.transform  = `translate(${nx * 55}px, ${ny * 22}px)`;

    rafId = requestAnimationFrame(parallaxTick);
  }

  /* ── ADD GAUGE NEEDLE ── */
  function addGaugeNeedle() {
    const ring = document.querySelector('.score-ring');
    if (!ring || document.getElementById('ring-needle')) return;
    const needle = document.createElement('div');
    needle.id = 'ring-needle';
    ring.appendChild(needle);

    /* Gauge tick marks */
    const tickSVG = document.createElementNS('http://www.w3.org/2000/svg','svg');
    tickSVG.setAttribute('viewBox','0 0 160 160');
    tickSVG.setAttribute('width','160');
    tickSVG.setAttribute('height','160');
    tickSVG.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;display:none;';
    tickSVG.id = 'gauge-ticks';
    const labels = ['0','25','50','75','100'];
    labels.forEach((lbl, i) => {
      const angle = -135 + (i / 4) * 270;
      const rad   = angle * Math.PI / 180;
      const ix    = 80 + Math.cos(rad) * 58;
      const iy    = 80 + Math.sin(rad) * 58;
      const ox    = 80 + Math.cos(rad) * 48;
      const oy    = 80 + Math.sin(rad) * 48;
      const lx    = 80 + Math.cos(rad) * 70;
      const ly    = 80 + Math.sin(rad) * 70;
      tickSVG.innerHTML += `
        <line x1="${ix}" y1="${iy}" x2="${ox}" y2="${oy}"
              stroke="rgba(255,210,100,0.6)" stroke-width="1.5"/>
        <text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle"
              font-size="9" fill="rgba(255,230,140,0.7)" font-family="Georgia,serif">${lbl}</text>`;
    });
    ring.appendChild(tickSVG);
  }

  /* ── TOGGLE FIELD MODE ── */
  function toggleFieldMode() {
    fieldModeActive = !fieldModeActive;
    const btn = document.getElementById('field-mode-btn');

    if (fieldModeActive) {
      document.body.classList.add('field-mode');
      buildParallaxLayers();
      addGaugeNeedle();

      document.getElementById('gauge-ticks').style.display = 'block';

      /* Update needle with current score */
      const score = parseInt(document.getElementById('score-num')?.textContent || 50);
      updateNeedle(score);

      /* Start parallax */
      rafId = requestAnimationFrame(parallaxTick);

      if (btn) { btn.classList.add('active'); btn.title = 'Exit Field Mode'; }
    } else {
      document.body.classList.remove('field-mode');

      /* Remove parallax layers */
      ['fm-sky-layer','fm-mid-layer','fm-fg-layer'].forEach(id => {
        document.getElementById(id)?.remove();
      });

      const gaugeEl = document.getElementById('gauge-ticks');
      if (gaugeEl) gaugeEl.style.display = 'none';

      if (rafId) cancelAnimationFrame(rafId);

      if (btn) { btn.classList.remove('active'); btn.title = 'Enter Field Mode'; }
    }
  }

  /* ── MOUSE TRACKING ── */
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  /* ── NEEDLE HOOK INTO RECALC ── */
  window.addEventListener('load', () => {
    const origRecalc = window.recalc;
    if (typeof origRecalc === 'function') {
      window.recalc = function () {
        origRecalc();
        if (fieldModeActive) {
          const score = parseInt(document.getElementById('score-num')?.textContent || 50);
          updateNeedle(score);
        }
      };
    }
  });

  /* ── BUILD TOGGLE BUTTON ── */
  function buildFieldModeBtn() {
    const btn = document.createElement('button');
    btn.id    = 'field-mode-btn';
    btn.title = 'Enter Field Mode';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1,12 Q4,6 8,10 Q12,4 15,12" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" fill="none"/>
        <circle cx="8" cy="3" r="2" fill="currentColor" opacity="0.8"/>
        <path d="M3,16 L13,16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Field Mode
    `;
    btn.style.cssText = `
      display:flex; align-items:center; gap:6px;
      padding:6px 12px;
      font-size:12px; font-weight:500;
      border-radius:8px; cursor:pointer;
      font-family:'DM Sans',sans-serif;
      border:1px solid rgba(255,255,255,0.35);
      background:rgba(255,255,255,0.18);
      color:rgba(255,255,255,0.9);
      transition:all 0.2s ease;
      margin-left:4px;
    `;
    btn.onmouseenter = () => { if (!fieldModeActive) btn.style.background = 'rgba(255,255,255,0.28)'; };
    btn.onmouseleave = () => { if (!fieldModeActive) btn.style.background = 'rgba(255,255,255,0.18)'; };
    btn.onclick = toggleFieldMode;
    document.querySelector('.nav')?.appendChild(btn);
  }

  if (document.readyState !== 'loading') {
    buildFieldModeBtn();
  } else {
    document.addEventListener('DOMContentLoaded', buildFieldModeBtn);
  }

  window.CropGuardFieldMode = { toggle: toggleFieldMode, updateNeedle };

})();
