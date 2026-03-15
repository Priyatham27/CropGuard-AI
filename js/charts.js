/* ============================================================
   charts.js — CropGuard AI
   Organic / agricultural Chart.js renderers
   Earthy palettes: muted greens, warm ambers, soil browns
   ============================================================ */

let premChart, radarChart, scenarioChart, distChart, tradeoffChart;

function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

/* ── EARTHY AGRICULTURAL PALETTE ── */
const EARTH = {
  soil:    '#7a9a3a',   // muted sage green
  climate: '#c88420',   // warm amber
  irr:     '#3a7898',   // steel blue
  pest:    '#a84040',   // muted brick red
  market:  '#5a8868',   // teal-earth
};

const EARTH_PALETTE = ['#7a9a3a','#c88420','#3a7898','#a84040','#5a8868'];

function chartColors() {
  return {
    grid:    isDark() ? 'rgba(100,90,70,0.35)' : 'rgba(180,160,100,0.25)',
    tick:    isDark() ? '#a09070'               : '#8a7050',
    text:    isDark() ? '#c0a878'               : '#7a5830',
    surface: isDark() ? 'rgba(30,25,15,0.7)'   : 'rgba(255,248,230,0.8)',
  };
}

function destroyAll() {
  [premChart, radarChart, scenarioChart, distChart, tradeoffChart]
    .forEach(c => { if (c) c.destroy(); });
}

/* ── ORGANIC GROW ANIMATION PLUGIN ── */
const GrowPlugin = {
  id: 'growPlugin',
  afterDatasetsDraw(chart) {
    /* No-op: Chart.js handles animation natively */
  },
  beforeInit(chart) {
    /* Reset animation to grow upward on first render */
  }
};

/* ── CUSTOM SOIL-TEXTURE WATERMARK PLUGIN ── */
const SoilWatermarkPlugin = {
  id: 'soilWatermark',
  beforeDraw(chart, args, options) {
    if (!options.active) return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    ctx.save();
    ctx.globalAlpha = 0.06;
    /* Draw repeating soil-texture dots */
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 12; patternCanvas.height = 12;
    const pctx = patternCanvas.getContext('2d');
    pctx.fillStyle = '#7a5030';
    pctx.beginPath();
    pctx.arc(3, 3, 1.5, 0, Math.PI * 2);
    pctx.arc(9, 9, 1.2, 0, Math.PI * 2);
    pctx.fill();
    pctx.fillStyle = '#5a3820';
    pctx.beginPath();
    pctx.arc(9, 3, 0.8, 0, Math.PI * 2);
    pctx.arc(3, 9, 1.0, 0, Math.PI * 2);
    pctx.fill();
    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
};

/* ── CROP STALK BAR PLUGIN ── */
/*  Overrides bar rendering to look like growing crop stalks  */
const CropStalkPlugin = {
  id: 'cropStalk',
  afterDatasetsDraw(chart, args, options) {
    if (!options.active) return;
    const { ctx, data, chartArea, scales } = chart;
    const dataset = data.datasets[0];
    if (!dataset) return;

    const meta = chart.getDatasetMeta(0);
    meta.data.forEach((bar, i) => {
      const { x, y, width, base } = bar.getProps(['x','y','width','base']);
      const barH = base - y;
      if (barH <= 0) return;

      /* Draw leaf nub at top of each bar */
      ctx.save();
      const leafX = x;
      const leafY = y;
      const lw = width * 0.25;
      const lh = Math.min(barH * 0.25, 18);

      /* Left leaf */
      ctx.beginPath();
      ctx.moveTo(leafX, leafY + lh * 0.5);
      ctx.bezierCurveTo(
        leafX - lw * 2, leafY,
        leafX - lw * 3, leafY - lh * 0.3,
        leafX - lw, leafY - lh * 0.1
      );
      ctx.fillStyle = 'rgba(80,160,40,0.55)';
      ctx.fill();

      /* Right leaf */
      ctx.beginPath();
      ctx.moveTo(leafX, leafY + lh * 0.5);
      ctx.bezierCurveTo(
        leafX + lw * 2, leafY,
        leafX + lw * 3, leafY - lh * 0.3,
        leafX + lw, leafY - lh * 0.1
      );
      ctx.fillStyle = 'rgba(80,160,40,0.5)';
      ctx.fill();

      /* Central nib dot */
      ctx.beginPath();
      ctx.arc(leafX, leafY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(60,120,20,0.8)';
      ctx.fill();
      ctx.restore();
    });
  }
};

/* ── REGISTER PLUGINS ── */
if (typeof Chart !== 'undefined') {
  Chart.register(SoilWatermarkPlugin, CropStalkPlugin);
}

/* ── PREMIUM SENSITIVITY CHART ── */
function updatePremiumChart(s) {
  const canvasEl = document.getElementById('premChart');
  if (!canvasEl) return;
  const base    = Math.round(s.area * 750 * (CROP_RISK[s.crop] || 1));
  const contrib = getContributions(s);
  const data    = ['soil','climate','irr','pest','market']
                    .map(k => Math.round(base * contrib[k] / 100));
  const cc = chartColors();

  if (premChart) premChart.destroy();

  /* Add gradient fills */
  const ctx = canvasEl.getContext('2d');
  const gradients = EARTH_PALETTE.map((clr, i) => {
    const g = ctx.createLinearGradient(0, 0, 0, canvasEl.height);
    g.addColorStop(0,   clr + 'EE');
    g.addColorStop(0.6, clr + '99');
    g.addColorStop(1,   clr + '44');
    return g;
  });

  premChart = new Chart(canvasEl, {
    type: 'bar',
    data: {
      labels: ['🌱 Soil','🌡 Climate','💧 Irrigation','🐛 Pest','📈 Market'],
      datasets: [{
        data,
        backgroundColor: gradients,
        borderColor: EARTH_PALETTE,
        borderWidth: 1.5,
        borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: 'bottom',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: 'easeOutBounce',
        delay(ctx) { return ctx.dataIndex * 80; }
      },
      plugins: {
        legend: { display: false },
        cropStalk: { active: true },
        tooltip: {
          backgroundColor: isDark() ? 'rgba(30,20,10,0.92)' : 'rgba(252,244,224,0.96)',
          titleColor: cc.text,
          bodyColor:  cc.tick,
          borderColor: 'rgba(180,140,60,0.4)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: c => '₹' + c.parsed.y.toLocaleString() + ' premium contribution'
          }
        }
      },
      scales: {
        y: {
          ticks: { callback: v => '₹' + v.toLocaleString(), color: cc.tick, font: { size: 11 } },
          grid:  { color: cc.grid }
        },
        x: {
          ticks: { color: cc.tick, font: { size: 11 } },
          grid:  { display: false }
        }
      }
    }
  });
}

/* ── DASHBOARD CHARTS ── */
function updateDashboardCharts(score) {
  const cc = chartColors();

  /* ── RADAR — crop field from above ── */
  const rctx = document.getElementById('radarChart');
  if (rctx) {
    if (radarChart) radarChart.destroy();

    const ctx2 = rctx.getContext('2d');
    const fgGrad = ctx2.createRadialGradient(
      rctx.width/2, rctx.height/2, 0,
      rctx.width/2, rctx.height/2, rctx.height * 0.4
    );
    fgGrad.addColorStop(0,   'rgba(120,180,50,0.35)');
    fgGrad.addColorStop(0.6, 'rgba(180,140,40,0.22)');
    fgGrad.addColorStop(1,   'rgba(200,80,40,0.10)');

    radarChart = new Chart(rctx, {
      type: 'radar',
      data: {
        labels: ['Soil\nHealth','Climate\nRisk','Irr.\nRisk','Pest\nPressure','Market\nRisk'],
        datasets: [{
          label: 'Risk Profile',
          data: [100 - state.soil, state.climate, 100 - state.irr, state.pest, state.market],
          backgroundColor:      fgGrad,
          borderColor:          '#c88420',
          borderWidth:          2.5,
          pointBackgroundColor: '#7a9a3a',
          pointBorderColor:     '#5a7a1a',
          pointRadius:          5,
          pointHoverRadius:     7,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutCubic' },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { display: false, stepSize: 25 },
            grid: {
              color: isDark()
                ? 'rgba(180,140,60,0.2)'
                : 'rgba(140,100,30,0.18)',
            },
            angleLines: {
              color: isDark()
                ? 'rgba(180,140,60,0.2)'
                : 'rgba(140,100,30,0.12)',
            },
            pointLabels: {
              color: cc.text,
              font: { size: 11, family: 'DM Sans, sans-serif' }
            }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  /* ── SCENARIO COMPARISON — horizontal crop stalks ── */
  const sctx = document.getElementById('scenarioChart');
  if (sctx) {
    if (scenarioChart) scenarioChart.destroy();
    const base       = computeRiskScore(state);
    const scenScores = Object.values(SCENARIOS).map(sc => computeRiskScore(applyScenarioToState(state, sc)));
    const allScores  = [base, ...scenScores];
    const allLabels  = ['🌿 Baseline', ...Object.values(SCENARIOS).map(s => s.label)];

    /* Earthy gradient bars */
    const sCanvas = sctx.getContext('2d');
    const bgColors = allScores.map(s => {
      if (s < 40)  return 'rgba(90,150,40,0.82)';
      if (s < 65)  return 'rgba(180,120,20,0.82)';
      return 'rgba(160,55,45,0.82)';
    });
    const borderColors = allScores.map(s =>
      s < 40 ? '#4a8a20' : s < 65 ? '#c08010' : '#a82828'
    );

    scenarioChart = new Chart(sctx, {
      type: 'bar',
      data: {
        labels: allLabels,
        datasets: [{
          data: allScores,
          backgroundColor: bgColors,
          borderColor:     borderColors,
          borderWidth:     1.5,
          borderRadius:    4,
          borderSkipped:   'left',
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
          delay(ctx) { return ctx.dataIndex * 60; }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark() ? 'rgba(30,20,10,0.92)' : 'rgba(252,244,224,0.96)',
            titleColor: cc.text, bodyColor: cc.tick,
            borderColor: 'rgba(180,140,60,0.4)', borderWidth: 1,
          }
        },
        scales: {
          x: { min: 0, max: 100, ticks: { color: cc.tick, font: { size: 10 } }, grid: { color: cc.grid } },
          y: { ticks: { color: cc.tick, font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  }

  /* ── MONTE CARLO WITH SOIL WATERMARK ── */
  const dctx = document.getElementById('distChart');
  if (dctx) {
    if (distChart) distChart.destroy();
    const bins = Array(20).fill(0);
    for (let i = 0; i < 1200; i++) {
      const s2 = {
        soil:    Math.max(10, Math.min(100, state.soil    + (Math.random()-0.5)*24)),
        climate: Math.max(10, Math.min(100, state.climate + (Math.random()-0.5)*28)),
        irr:     Math.max(10, Math.min(100, state.irr     + (Math.random()-0.5)*20)),
        pest:    Math.max(10, Math.min(100, state.pest    + (Math.random()-0.5)*30)),
        market:  Math.max(10, Math.min(100, state.market  + (Math.random()-0.5)*25)),
        region: state.region, crop: state.crop, area: state.area,
      };
      bins[Math.min(19, Math.floor(computeRiskScore(s2)/5))]++;
    }

    /* Earthy gradient bins */
    const dCanvas = dctx.getContext('2d');
    const binColors = bins.map((_, i) => {
      const score = i * 5;
      if (score < 35) return 'rgba(90,150,40,0.78)';
      if (score < 60) return 'rgba(180,120,20,0.78)';
      return 'rgba(160,55,45,0.78)';
    });

    distChart = new Chart(dctx, {
      type: 'bar',
      data: {
        labels: bins.map((_, i) => i * 5),
        datasets: [{
          data: bins,
          backgroundColor: binColors,
          borderColor:     binColors.map(c => c.replace('0.78','1')),
          borderWidth:     1,
          borderRadius:    3,
          borderSkipped:   'bottom',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700, easing: 'easeOutQuad', delay(c) { return c.dataIndex * 15; } },
        plugins: {
          legend: { display: false },
          soilWatermark: { active: true },
          cropStalk: { active: false },
          tooltip: {
            backgroundColor: isDark() ? 'rgba(30,20,10,0.92)' : 'rgba(252,244,224,0.96)',
            titleColor: cc.text, bodyColor: cc.tick,
            borderColor: 'rgba(180,140,60,0.4)', borderWidth: 1,
          }
        },
        scales: {
          x: {
            ticks: {
              callback: (v, i) => i % 2 === 0 ? bins.map((_, j) => j * 5)[i] : '',
              color: cc.tick, font: { size: 10 }
            },
            title: { display: true, text: 'Risk Score', color: cc.text, font: { size: 10 } },
            grid: { display: false }
          },
          y: {
            ticks: { color: cc.tick, font: { size: 10 } },
            title: { display: true, text: 'Simulations', color: cc.text, font: { size: 10 } },
            grid:  { color: cc.grid }
          }
        }
      }
    });
  }

  /* ── PREMIUM vs COVERAGE TRADEOFF ── */
  const tctx = document.getElementById('tradeoffChart');
  if (tctx) {
    if (tradeoffChart) tradeoffChart.destroy();
    const bp = Math.round(state.area * 400 * (CROP_RISK[state.crop] || 1));
    const plans = [
      { label: '🌿 Basic 50%',       cov: 50, prem: bp },
      { label: '🛡 Standard 75%',    cov: 75, prem: Math.round(bp * 1.9) },
      { label: '⚡ Premium 90%',      cov: 90, prem: Math.round(bp * 3.1) },
      { label: '💹 Revenue Protect', cov: 95, prem: Math.round(bp * 4.5) },
    ];
    const tCanvas = tctx.getContext('2d');
    const pointColors = ['#7a9a3a','#c88420','#a84040','#3a7898'];

    tradeoffChart = new Chart(tctx, {
      type: 'scatter',
      data: {
        datasets: [{
          data: plans.map(p => ({ x: p.prem, y: p.cov })),
          backgroundColor: pointColors,
          borderColor:     pointColors.map(c => c + 'cc'),
          borderWidth: 2,
          pointRadius: 10,
          pointHoverRadius: 13,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark() ? 'rgba(30,20,10,0.92)' : 'rgba(252,244,224,0.96)',
            titleColor: cc.text, bodyColor: cc.tick,
            borderColor: 'rgba(180,140,60,0.4)', borderWidth: 1,
            callbacks: {
              label: ctx => `${plans[ctx.dataIndex].label}: ₹${plans[ctx.dataIndex].prem.toLocaleString()} | ${plans[ctx.dataIndex].cov}% cover`
            }
          }
        },
        scales: {
          x: {
            ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'K', color: cc.tick, font: { size: 10 } },
            title: { display: true, text: 'Annual Premium', color: cc.text, font: { size: 10 } },
            grid:  { color: cc.grid }
          },
          y: {
            min: 40, max: 100,
            ticks: { callback: v => v + '%', color: cc.tick, font: { size: 10 } },
            title: { display: true, text: 'Coverage %', color: cc.text, font: { size: 10 } },
            grid:  { color: cc.grid }
          }
        }
      }
    });
  }
}
