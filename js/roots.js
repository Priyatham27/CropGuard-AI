/* ============================================================
   roots.js — CropGuard AI
   Soil health slider → animated SVG root system + cross-section
   ============================================================ */

(function () {
  'use strict';

  /* ── ROOT COLORS ── */
  function getRootColor(health) {
    /* healthy=100 → deep greens, poor=10 → withered browns */
    const t = (health - 10) / 90;
    const r = Math.round(139 - t * 80);  // 139→59
    const g = Math.round(95  + t * 85);  // 95→180
    const b = Math.round(20  + t * 10);  // 20→30
    return { main: `rgb(${r},${g},${b})`, light: `rgba(${r},${g+30},${b},0.5)` };
  }

  /* ── GENERATE ROOT PATH ── */
  function buildRootPaths(health, W, H) {
    const clr = getRootColor(health);
    const t   = (health - 10) / 90;  // 0–1

    /* Root parameters scale with health */
    const maxDepth    = 20 + t * 75;     // px depth from top of SVG (% of H)
    const branchCount = Math.round(3 + t * 5);  // 3–8 main branches
    const subDepth    = 0.3 + t * 0.55;
    const lineW       = 1.2 + t * 1.0;
    const opacity     = 0.55 + t * 0.4;

    const svgH = H;
    const mid  = W / 2;

    let paths = '';
    let totalLen = 0;

    /* Main tap root */
    const tapH = svgH * (0.25 + t * 0.55);
    paths += `<path class="root-path tap-root" 
      d="M ${mid} 0 Q ${mid + (Math.random()-0.5)*12} ${tapH*0.5} ${mid} ${tapH}"
      stroke="${clr.main}" stroke-width="${lineW + 0.5}" fill="none" 
      opacity="${opacity}" stroke-linecap="round"
      style="--root-len:${Math.round(tapH + 20)}; stroke-dasharray:${Math.round(tapH + 20)}; stroke-dashoffset:${Math.round(tapH + 20)};"/>`;
    totalLen = Math.round(tapH + 20);

    /* Lateral branches */
    for (let i = 0; i < branchCount; i++) {
      const side   = i % 2 === 0 ? 1 : -1;
      const startY = svgH * (0.08 + (i / branchCount) * (0.2 + t * 0.45));
      const endX   = mid + side * (15 + Math.random() * (20 + t * 40));
      const endY   = startY + svgH * (subDepth * (0.4 + Math.random() * 0.4));
      const cp1x   = mid + side * 10;
      const cp1y   = startY + (endY - startY) * 0.4;
      const len    = Math.round(Math.hypot(endX - mid, endY - startY) * 1.4 + 15);

      paths += `<path class="root-path lateral-root"
        d="M ${mid} ${startY} Q ${cp1x} ${cp1y} ${endX} ${endY}"
        stroke="${clr.main}" stroke-width="${lineW}" fill="none"
        opacity="${opacity * 0.85}" stroke-linecap="round"
        style="--root-len:${len}; animation-delay:${(0.3 + i * 0.12).toFixed(2)}s;
          stroke-dasharray:${len}; stroke-dashoffset:${len};"/>`;

      /* Sub-branches (only for healthier soil) */
      if (t > 0.3 && Math.random() > 0.4) {
        const sx = endX + side * (8 + Math.random() * 15);
        const sy = endY + svgH * 0.05 + Math.random() * svgH * 0.08;
        const sl = Math.round(Math.hypot(sx - endX, sy - endY) * 1.5 + 10);
        paths += `<path class="root-path sub-root"
          d="M ${endX} ${endY} Q ${endX + (Math.random()-0.5)*8} ${(endY+sy)/2} ${sx} ${sy}"
          stroke="${clr.light}" stroke-width="${lineW * 0.65}" fill="none"
          opacity="${opacity * 0.65}" stroke-linecap="round"
          style="--root-len:${sl}; animation-delay:${(0.6 + i * 0.15).toFixed(2)}s;
            stroke-dasharray:${sl}; stroke-dashoffset:${sl};"/>`;
      }
    }

    /* Root hair tips (fine lines for healthy) */
    if (t > 0.5) {
      for (let h = 0; h < 12; h++) {
        const hx  = mid + (Math.random() - 0.5) * (W * 0.7);
        const hy  = svgH * (0.3 + Math.random() * 0.55);
        const hx2 = hx + (Math.random() - 0.5) * 14;
        const hy2 = hy + 8 + Math.random() * 12;
        const hl  = Math.round(Math.hypot(hx2 - hx, hy2 - hy) + 5);
        paths += `<line class="root-path root-hair"
          x1="${hx}" y1="${hy}" x2="${hx2}" y2="${hy2}"
          stroke="${clr.light}" stroke-width="0.6" opacity="${opacity * 0.5}"
          style="--root-len:${hl}; animation-delay:${(0.8 + h*0.07).toFixed(2)}s;
            stroke-dasharray:${hl}; stroke-dashoffset:${hl};"/>`;
      }
    }

    return { paths, totalLen };
  }

  /* ── SOIL LAYERS CROSS-SECTION ── */
  function buildSoilCrossSection(health, W) {
    const t = (health - 10) / 90;
    const topsoilH  = Math.round(18 + t * 22);  // 18–40px
    const subsoilH  = 28;
    const bedrockH  = 22;
    const totalH    = topsoilH + subsoilH + bedrockH + 6;

    /* Topsoil color: rich dark brown when healthy, pale sandy when poor */
    const topR = Math.round(120 - t * 60);
    const topG = Math.round(70  + t * 35);
    const topB = Math.round(25  + t * 10);

    const organicDots = Array.from({length: Math.round(t * 12)}, (_, i) => {
      const dx = 5 + Math.random() * (W - 10);
      const dy = 4 + Math.random() * (topsoilH - 8);
      return `<circle cx="${dx}" cy="${dy}" r="${0.8 + Math.random()}" fill="rgba(30,80,10,0.6)"/>`;
    }).join('');

    const pebbles = Array.from({length: 6}, () => {
      const px = 8 + Math.random() * (W - 16);
      const py = topsoilH + 4 + Math.random() * (subsoilH - 10);
      const pr = 2 + Math.random() * 4;
      return `<ellipse cx="${px}" cy="${py}" rx="${pr}" ry="${pr*0.7}" fill="rgba(160,130,90,0.5)"/>`;
    }).join('');

    return {
      svg: `
      <svg width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}"
           xmlns="http://www.w3.org/2000/svg" class="soil-cross-section">
        <!-- Layer labels -->
        <!-- Topsoil -->
        <rect x="0" y="0" width="${W}" height="${topsoilH}"
              fill="rgb(${topR},${topG},${topB})"/>
        ${organicDots}
        <!-- Organic matter speckle texture -->
        <text x="5" y="${topsoilH - 5}" font-size="8" fill="rgba(255,230,180,0.7)"
              font-family="sans-serif">Topsoil (${topsoilH}px depth)</text>
        <!-- Subsoil -->
        <rect x="0" y="${topsoilH}" width="${W}" height="${subsoilH}"
              fill="#96713C" opacity="0.75"/>
        ${pebbles}
        <line x1="0" y1="${topsoilH}" x2="${W}" y2="${topsoilH}"
              stroke="rgba(0,0,0,0.15)" stroke-width="1" stroke-dasharray="4 3"/>
        <text x="5" y="${topsoilH + subsoilH - 6}" font-size="8"
              fill="rgba(255,230,180,0.65)" font-family="sans-serif">Subsoil</text>
        <!-- Bedrock -->
        <rect x="0" y="${topsoilH+subsoilH}" width="${W}" height="${bedrockH}"
              fill="#6B5A48" opacity="0.8"/>
        <line x1="0" y1="${topsoilH+subsoilH}" x2="${W}" y2="${topsoilH+subsoilH}"
              stroke="rgba(0,0,0,0.18)" stroke-width="1" stroke-dasharray="4 3"/>
        <text x="5" y="${topsoilH+subsoilH+14}" font-size="8"
              fill="rgba(255,220,160,0.6)" font-family="sans-serif">Bedrock</text>
        <!-- Crack lines in bedrock -->
        <path d="M ${W*0.3} ${topsoilH+subsoilH+2} l 8,6 l -4,10 l 10,4"
              stroke="rgba(40,20,0,0.4)" stroke-width="0.8" fill="none"/>
        <path d="M ${W*0.7} ${topsoilH+subsoilH+3} l -5,8 l 6,8"
              stroke="rgba(40,20,0,0.35)" stroke-width="0.8" fill="none"/>
      </svg>`,
      totalH
    };
  }

  /* ── ANIMATION CSS ── */
  const rootStyle = document.createElement('style');
  rootStyle.textContent = `
    .root-container {
      position: relative;
      background: linear-gradient(to bottom,
        rgba(120,80,25,0.18) 0%, rgba(150,100,40,0.10) 50%, rgba(80,50,10,0.06) 100%);
      border-radius: 0 0 10px 10px;
      overflow: hidden;
      margin-top: 2px;
      border: 1px solid rgba(120,80,20,0.2);
      border-top: none;
      transition: height 0.5s ease;
    }

    .root-svg-area {
      width: 100%;
      display: block;
    }

    .soil-cross-section {
      display: block;
      width: 100%;
    }

    @keyframes rootGrow {
      from { stroke-dashoffset: var(--root-len); }
      to   { stroke-dashoffset: 0; }
    }

    .root-path {
      animation: rootGrow 0.6s ease-out forwards;
    }
    .lateral-root { animation-duration: 0.45s; }
    .sub-root     { animation-duration: 0.35s; }
    .root-hair    { animation-duration: 0.25s; }

    .soil-health-label {
      font-size: 10px;
      font-weight: 600;
      text-align: center;
      padding: 3px 0 2px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(80,50,10,0.75);
      background: rgba(200,160,80,0.12);
    }

    #soil-root-wrap {
      margin-top: 6px;
      border-radius: 0 0 8px 8px;
    }
  `;
  document.head.appendChild(rootStyle);

  /* ── BUILD / UPDATE ROOT WIDGET ── */
  function buildRootWidget(soilValue) {
    const soilRow = document.getElementById('sl-soil')?.closest('.factor-row');
    if (!soilRow) return;

    let wrap = document.getElementById('soil-root-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'soil-root-wrap';
      soilRow.appendChild(wrap);
    }

    const W    = soilRow.offsetWidth || 260;
    const rootH = Math.round(50 + ((soilValue - 10) / 90) * 90);  // 50–140px
    const { paths } = buildRootPaths(soilValue, W, rootH);
    const { svg: soilSVG, totalH: soilH } = buildSoilCrossSection(soilValue, W);

    const health = soilValue < 35 ? 'Poor Soil' : soilValue < 65 ? 'Moderate Soil' : 'Healthy Soil';
    const hColor = soilValue < 35 ? '#9a5f20' : soilValue < 65 ? '#7a7a20' : '#3a6a10';

    wrap.innerHTML = `
      <div class="soil-health-label" style="color:${hColor};">
        🌱 ${health} — Root Depth ${Math.round(10 + ((soilValue-10)/90)*80)}cm
      </div>
      <div class="root-container" style="height:${rootH}px;">
        <svg class="root-svg-area" width="${W}" height="${rootH}"
             viewBox="0 0 ${W} ${rootH}" xmlns="http://www.w3.org/2000/svg">
          <!-- Soil background gradient -->
          <defs>
            <linearGradient id="soilBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stop-color="rgba(140,90,30,0.25)"/>
              <stop offset="100%" stop-color="rgba(80,50,15,0.45)"/>
            </linearGradient>
          </defs>
          <rect width="${W}" height="${rootH}" fill="url(#soilBg)"/>
          ${paths}
        </svg>
      </div>
      <div>${soilSVG}</div>
    `;
  }

  /* ── HOOK SOIL SLIDER ── */
  function hookSoilSlider() {
    const sl = document.getElementById('sl-soil');
    if (!sl) return;
    /* Build initial */
    buildRootWidget(parseInt(sl.value));
    /* Live update */
    sl.addEventListener('input', () => {
      buildRootWidget(parseInt(sl.value));
    });
  }

  if (document.readyState !== 'loading') {
    hookSoilSlider();
  } else {
    document.addEventListener('DOMContentLoaded', hookSoilSlider);
  }

  window.CropGuardRoots = { buildRootWidget };

})();
