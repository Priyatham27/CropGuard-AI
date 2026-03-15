/* ============================================================
   wind.js — CropGuard AI
   Interactive Wind Control Panel
   - Animated SVG dial with gust ring
   - Volume slider (Web Audio API gain)
   - Live waveform visualiser canvas
   - Screen breeze streak effect (canvas overlay)
   - Auto mode follows risk score, Manual overrides it
   ============================================================ */

(function () {
  'use strict';

  /* ─────────────── STATE ─────────────── */
  let windStrength = 20;   // 0–100
  let volume       = 60;   // 0–100 (user controlled)
  let soundOn      = false;
  let autoMode     = true; // auto = risk drives wind
  let panelOpen    = false;

  /* Audio nodes */
  let audioCtx = null, noiseSource = null, masterGain = null, analyser = null;
  let lpf = null, bpf = null, lfo = null, lfoGain = null;

  /* Animation frames */
  let waveRaf = null, breezeRaf = null;

  /* ─────────────── WIND CSS EFFECT ─────────────── */
  const styleEl = document.createElement('style');
  styleEl.id = 'wind-dynamic-styles';
  document.head.appendChild(styleEl);

  const blurKF = document.createElement('style');
  blurKF.textContent = `
    @keyframes windBlurPulse {
      0%,100% { opacity: 0; }
      50%      { opacity: 1; }
    }
    @keyframes windGust {
      0%   { transform: translateX(-110%); opacity: 0; }
      8%   { opacity: 1; }
      90%  { opacity: 0.6; }
      100% { transform: translateX(110vw); opacity: 0; }
    }
  `;
  document.head.appendChild(blurKF);

  function updateWindCSS(w) {
    const swaySpeed   = (6 - (w / 100) * 5.2).toFixed(2);
    const shadowShift = (w / 100) * 18;
    const shadowBlur  = (w / 100) * 20 + 4;
    styleEl.textContent = `
      :root {
        --wind-strength: ${w};
        --wind-sway-speed: ${swaySpeed}s;
        --wind-shadow-x: ${shadowShift}px;
      }
      #grass-field svg { animation-duration: ${swaySpeed}s !important; }
      ${w > 55 ? `
        .card, .metric-card {
          box-shadow:
            ${(shadowShift * 0.4).toFixed(1)}px ${(shadowShift * 0.6).toFixed(1)}px ${shadowBlur}px rgba(60,100,20,0.18),
            0 1px 0 rgba(255,255,255,0.7) inset !important;
          transition: box-shadow 1.5s ease !important;
        }
      ` : ''}
    `;
  }

  /* ─────────────── BREEZE STREAK CANVAS ─────────────── */
  const breezeCanvas = document.createElement('canvas');
  breezeCanvas.id = 'breeze-canvas';
  breezeCanvas.style.cssText = `
    position: fixed; inset: 0; pointer-events: none; z-index: 8;
    width: 100%; height: 100%;
  `;
  document.body.appendChild(breezeCanvas);

  const streaks = Array.from({ length: 40 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    len: 40 + Math.random() * 120,
    speed: 2 + Math.random() * 4,
    opacity: 0.03 + Math.random() * 0.06,
    width: 0.5 + Math.random() * 1.2,
  }));

  function animateBreeze() {
    const ctx = breezeCanvas.getContext('2d');
    breezeCanvas.width  = window.innerWidth;
    breezeCanvas.height = window.innerHeight;

    const intensity = Math.max(0, (windStrength - 30) / 70); // 0 below 30, 1 at 100

    ctx.clearRect(0, 0, breezeCanvas.width, breezeCanvas.height);

    if (intensity > 0) {
      streaks.forEach(s => {
        s.x += s.speed * (1 + intensity * 3);
        if (s.x > breezeCanvas.width + s.len) {
          s.x = -s.len;
          s.y = Math.random() * breezeCanvas.height;
          s.len = 40 + Math.random() * 120;
          s.speed = 2 + Math.random() * 4;
        }
        ctx.beginPath();
        const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y);
        const alpha = s.opacity * intensity;
        grad.addColorStop(0, `rgba(200,230,255,0)`);
        grad.addColorStop(0.4, `rgba(200,230,255,${alpha})`);
        grad.addColorStop(1, `rgba(200,230,255,0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.len, s.y + s.len * 0.04);
        ctx.stroke();
      });
    }
    breezeRaf = requestAnimationFrame(animateBreeze);
  }
  breezeRaf = requestAnimationFrame(animateBreeze);

  /* ─────────────── WEB AUDIO ─────────────── */
  function buildAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    /* White noise */
    const bufLen = audioCtx.sampleRate * 4;
    const buffer = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const data   = buffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop   = true;

    /* Filters */
    lpf = audioCtx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 700; lpf.Q.value = 0.4;

    bpf = audioCtx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 350; bpf.Q.value = 0.25;

    /* Master gain */
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;

    /* LFO gust tremolo */
    lfo = audioCtx.createOscillator();
    lfo.type = 'sine'; lfo.frequency.value = 0.15;
    lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfo.start();

    /* Analyser for waveform */
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    noiseSource.connect(lpf);
    lpf.connect(bpf);
    bpf.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);
    noiseSource.start();
  }

  function targetGain() {
    return soundOn ? (volume / 100) * (0.04 + (windStrength / 100) * 0.12) : 0;
  }

  function applyGain() {
    if (!masterGain || !audioCtx) return;
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(targetGain(), audioCtx.currentTime + 1.2);
  }

  /* ─────────────── SETTERS ─────────────── */
  function setWindStrength(w) {
    windStrength = Math.max(0, Math.min(100, Math.round(w)));
    updateWindCSS(windStrength);
    if (window.CropGuardEnv) window.CropGuardEnv.windMultiplier = 0.5 + (windStrength / 100) * 2.5;
    applyGain();
    refreshPanel();
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(100, Math.round(v)));
    applyGain();
    refreshPanel();
  }

  /* ─────────────── RISK → WIND ─────────────── */
  window.setWindFromRisk = function (riskScore) {
    if (!autoMode) return;
    let w;
    if (riskScore < 35)      w = 5  + (riskScore / 35) * 20;
    else if (riskScore < 65) w = 25 + ((riskScore - 35) / 30) * 30;
    else                     w = 55 + ((riskScore - 65) / 35) * 45;
    setWindStrength(Math.round(w));
  };

  window.addEventListener('load', () => {
    const orig = window.recalc;
    if (typeof orig === 'function') {
      window.recalc = function () {
        orig();
        const score = parseInt(document.getElementById('score-num')?.textContent || '50', 10);
        window.setWindFromRisk(score);
      };
    }
    const score = parseInt(document.getElementById('score-num')?.textContent || '50', 10);
    window.setWindFromRisk(score);
  });

  /* ─────────────── PANEL HTML ─────────────── */
  const panel = document.createElement('div');
  panel.id = 'wind-panel';
  panel.innerHTML = `
    <div class="wp-header">
      <span class="wp-icon">🌬️</span>
      <span class="wp-title">Wind System</span>
      <button class="wp-close" id="wp-close-btn" title="Close">✕</button>
    </div>

    <!-- Dial -->
    <div class="wp-dial-wrap">
      <svg id="wind-dial-svg" viewBox="0 0 200 130" width="200" height="130">
        <!-- Arc track -->
        <path id="wp-arc-track" d="M 20 110 A 80 80 0 0 1 180 110"
              fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="14"
              stroke-linecap="round"/>
        <!-- Arc fill (wind level) -->
        <path id="wp-arc-fill" d="M 20 110 A 80 80 0 0 1 180 110"
              fill="none" stroke="#60d080" stroke-width="14"
              stroke-linecap="round"
              stroke-dasharray="251" stroke-dashoffset="251"/>
        <!-- Gust ring (animated) -->
        <circle id="wp-gust-ring" cx="100" cy="110" r="55"
                fill="none" stroke="rgba(160,220,255,0.15)" stroke-width="2"
                stroke-dasharray="8 6"/>
        <!-- Needle -->
        <line id="wp-needle" x1="100" y1="110" x2="100" y2="42"
              stroke="#fff" stroke-width="2.5" stroke-linecap="round"
              transform="rotate(-90, 100, 110)"/>
        <circle cx="100" cy="110" r="7" fill="#2a3a2a" stroke="#fff" stroke-width="2"/>
        <!-- Labels -->
        <text x="12"  y="128" fill="rgba(255,255,255,0.45)" font-size="10" font-family="DM Sans,sans-serif">Calm</text>
        <text x="86"  y="25"  fill="rgba(255,255,255,0.45)" font-size="10" font-family="DM Sans,sans-serif" text-anchor="middle">Breeze</text>
        <text x="168" y="128" fill="rgba(255,255,255,0.45)" font-size="10" font-family="DM Sans,sans-serif" text-anchor="end">Storm</text>
        <!-- Wind value -->
        <text id="wp-dial-val" x="100" y="96" fill="#ffffff" font-size="22" font-weight="700"
              font-family="DM Sans,sans-serif" text-anchor="middle">20</text>
        <text x="100" y="108" fill="rgba(255,255,255,0.5)" font-size="9"
              font-family="DM Sans,sans-serif" text-anchor="middle">WIND STRENGTH</text>
      </svg>

      <!-- Drag ring overlay -->
      <div id="wp-dial-drag" title="Drag to set wind"></div>
    </div>

    <!-- Manual override slider -->
    <div class="wp-row wp-manual-row" id="wp-manual-row">
      <span class="wp-row-label">💨 Strength</span>
      <input type="range" id="wp-strength-slider" min="0" max="100" value="20"
             class="wp-slider wp-strength-sl"/>
      <span class="wp-row-val" id="wp-strength-val">20</span>
    </div>

    <!-- Auto/Manual toggle -->
    <div class="wp-row">
      <span class="wp-row-label">⚡ Auto (risk-driven)</span>
      <label class="wp-toggle">
        <input type="checkbox" id="wp-auto-check" checked/>
        <span class="wp-toggle-track"></span>
      </label>
    </div>

    <!-- Sound toggle + volume -->
    <div class="wp-row">
      <button class="wp-sound-btn" id="wp-sound-btn">🔇 Enable Sound</button>
    </div>

    <div class="wp-row wp-vol-row" id="wp-vol-row" style="opacity:0.35;pointer-events:none;">
      <span class="wp-row-label">🔊 Volume</span>
      <input type="range" id="wp-vol-slider" min="0" max="100" value="60"
             class="wp-slider wp-vol-sl"/>
      <span class="wp-row-val" id="wp-vol-val">60%</span>
    </div>

    <!-- Waveform -->
    <div class="wp-wave-wrap" id="wp-wave-wrap" style="opacity:0.35;">
      <canvas id="wp-waveform" width="240" height="44"></canvas>
      <span class="wp-wave-label">Audio waveform</span>
    </div>

    <!-- Status bar -->
    <div class="wp-status" id="wp-status">
      <span id="wp-status-dot" class="wp-dot calm"></span>
      <span id="wp-status-text">Calm — low risk field</span>
    </div>
  `;
  document.body.appendChild(panel);

  /* ─────────────── PANEL CSS ─────────────── */
  const panelCSS = document.createElement('style');
  panelCSS.textContent = `
    /* Nav button */
    #wind-sound-btn {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.35);
      background: rgba(255,255,255,0.14);
      color: rgba(255,255,255,0.9);
      font-size: 11px; font-family: 'DM Sans', sans-serif; font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.3s ease;
      margin-left: 4px;
      position: relative;
    }
    #wind-sound-btn:hover { background: rgba(255,255,255,0.26); }
    #wind-sound-btn.panel-open {
      background: rgba(80,200,120,0.3);
      border-color: rgba(120,220,150,0.55);
      box-shadow: 0 0 12px rgba(80,220,120,0.3);
    }
    .wind-nav-streak {
      position: absolute;
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      height: 1px;
      background: linear-gradient(to left, rgba(180,240,200,0.7), transparent);
      animation: navStreakFade 1.8s ease-out forwards;
      pointer-events: none;
    }
    @keyframes navStreakFade {
      from { width: 0; opacity: 1; }
      to   { width: 120px; opacity: 0; }
    }

    /* Panel */
    #wind-panel {
      position: fixed;
      top: 56px;
      right: 16px;
      width: 276px;
      background: linear-gradient(160deg, rgba(10,28,18,0.97) 0%, rgba(8,22,14,0.98) 100%);
      border: 1px solid rgba(80,200,120,0.3);
      border-radius: 18px;
      box-shadow:
        0 20px 60px rgba(0,0,0,0.55),
        0 0 0 1px rgba(80,200,120,0.08) inset,
        0 1px 0 rgba(255,255,255,0.06) inset;
      backdrop-filter: blur(20px);
      z-index: 999;
      padding: 16px;
      display: none;
      flex-direction: column;
      gap: 10px;
      font-family: 'DM Sans', sans-serif;
      transform: translateY(-8px) scale(0.96);
      opacity: 0;
      transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease;
    }
    #wind-panel.open {
      display: flex;
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    #wind-panel.animating { display: flex; }

    /* Header */
    .wp-header {
      display: flex; align-items: center; gap: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 10px;
    }
    .wp-icon { font-size: 18px; }
    .wp-title {
      font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9);
      flex: 1;
    }
    .wp-close {
      background: rgba(255,255,255,0.08); border: none;
      color: rgba(255,255,255,0.5); font-size: 12px;
      width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .wp-close:hover { background: rgba(255,80,80,0.25); color: #ff8080; }

    /* Dial */
    .wp-dial-wrap {
      position: relative;
      display: flex; justify-content: center;
      margin: 0 auto 2px;
    }
    #wp-dial-svg { overflow: visible; display: block; }
    #wp-dial-drag {
      position: absolute;
      inset: 0;
      cursor: grab;
      border-radius: 50%;
    }

    /* Gust ring animation */
    @keyframes gustSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    #wp-gust-ring {
      transform-origin: 100px 110px;
      animation: gustSpin 4s linear infinite;
    }

    /* Rows */
    .wp-row {
      display: flex; align-items: center; gap: 10px;
    }
    .wp-row-label {
      font-size: 11px; color: rgba(255,255,255,0.55); flex: 1; white-space: nowrap;
    }
    .wp-row-val {
      font-size: 11px; color: rgba(255,255,255,0.75); min-width: 28px; text-align: right;
    }

    /* Sliders */
    .wp-slider {
      flex: 1; height: 5px;
      -webkit-appearance: none; appearance: none;
      background: rgba(255,255,255,0.12);
      border-radius: 3px; outline: none; cursor: pointer;
    }
    .wp-strength-sl::-webkit-slider-thumb {
      -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
      background: radial-gradient(circle at 40% 35%, #a0f0c0, #40c070);
      box-shadow: 0 2px 8px rgba(60,200,100,0.5);
      cursor: grab; transition: transform 0.1s ease;
    }
    .wp-strength-sl::-webkit-slider-thumb:active { transform: scale(1.2); cursor: grabbing; }
    .wp-vol-sl::-webkit-slider-thumb {
      -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
      background: radial-gradient(circle at 40% 35%, #80c8ff, #3080d0);
      box-shadow: 0 2px 8px rgba(60,140,240,0.5);
      cursor: grab;
    }

    /* Toggle */
    .wp-toggle { position: relative; display: inline-block; width: 36px; height: 20px; cursor: pointer; }
    .wp-toggle input { opacity: 0; width: 0; height: 0; }
    .wp-toggle-track {
      position: absolute; inset: 0;
      background: rgba(255,255,255,0.15);
      border-radius: 20px; transition: background 0.2s ease;
    }
    .wp-toggle-track::after {
      content: ''; position: absolute; top: 3px; left: 3px;
      width: 14px; height: 14px; border-radius: 50%;
      background: rgba(255,255,255,0.5);
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .wp-toggle input:checked + .wp-toggle-track { background: rgba(80,200,120,0.6); }
    .wp-toggle input:checked + .wp-toggle-track::after {
      transform: translateX(16px); background: #80f0a0;
    }

    /* Sound button */
    .wp-sound-btn {
      flex: 1; padding: 7px 12px; border-radius: 10px; cursor: pointer;
      font-size: 12px; font-family: 'DM Sans', sans-serif; font-weight: 500;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.7);
      transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }
    .wp-sound-btn:hover { background: rgba(255,255,255,0.14); }
    .wp-sound-btn.on {
      background: rgba(60,180,100,0.25);
      border-color: rgba(80,200,120,0.45);
      color: #80f0a0;
    }

    /* Waveform */
    .wp-wave-wrap {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      transition: opacity 0.4s ease;
    }
    #wp-waveform {
      border-radius: 8px;
      background: rgba(255,255,255,0.04);
      display: block;
    }
    .wp-wave-label {
      font-size: 9px; color: rgba(255,255,255,0.28); letter-spacing: 0.05em; text-transform: uppercase;
    }

    /* Status bar */
    .wp-status {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.04);
      border-radius: 8px; padding: 6px 10px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .wp-dot {
      width: 8px; height: 8px; border-radius: 50%;
      flex-shrink: 0;
      transition: background 0.5s ease, box-shadow 0.5s ease;
    }
    .wp-dot.calm   { background: #60d080; box-shadow: 0 0 6px rgba(80,200,100,0.6); }
    .wp-dot.breeze { background: #e0c040; box-shadow: 0 0 6px rgba(220,180,40,0.6); }
    .wp-dot.storm  { background: #e04040; box-shadow: 0 0 8px rgba(220,60,60,0.7); animation: dotPulse 0.8s ease-in-out infinite; }
    @keyframes dotPulse { 50% { transform: scale(1.4); } }
    #wp-status-text { font-size: 11px; color: rgba(255,255,255,0.55); }

    /* Breeze canvas */
    #breeze-canvas { display: block; }
  `;
  document.head.appendChild(panelCSS);

  /* ─────────────── PANEL REFRESH ─────────────── */
  function refreshPanel() {
    /* Arc fill: dasharray = 251 (approx half-circle circumference for R=80)
       dashoffset = 251 - 251*(w/100) */
    const arc = document.getElementById('wp-arc-fill');
    if (arc) {
      const filled = 251 * (windStrength / 100);
      arc.setAttribute('stroke-dashoffset', (251 - filled).toFixed(1));
      /* Color: green → amber → red */
      const clr = windStrength < 40 ? '#60d080'
                : windStrength < 70 ? '#e0c040'
                : '#e05050';
      arc.setAttribute('stroke', clr);
    }

    /* Needle: -90deg (0%) to +90deg (100%) */
    const needle = document.getElementById('wp-needle');
    if (needle) {
      const deg = -90 + (windStrength / 100) * 180;
      needle.setAttribute('transform', `rotate(${deg}, 100, 110)`);
    }

    /* Gust ring speed */
    const ring = document.getElementById('wp-gust-ring');
    if (ring) {
      const dur = Math.max(0.4, 4 - (windStrength / 100) * 3.6);
      ring.style.animationDuration = dur.toFixed(2) + 's';
      ring.style.opacity = windStrength > 20 ? 0.9 : 0.2;
    }

    /* Dial value */
    const dv = document.getElementById('wp-dial-val');
    if (dv) dv.textContent = windStrength;

    /* Strength slider */
    const ss = document.getElementById('wp-strength-slider');
    if (ss && !ss.matches(':active')) ss.value = windStrength;
    const sv = document.getElementById('wp-strength-val');
    if (sv) sv.textContent = windStrength;

    /* Volume */
    const vv = document.getElementById('wp-vol-val');
    if (vv) vv.textContent = volume + '%';
    const vs = document.getElementById('wp-vol-slider');
    if (vs && !vs.matches(':active')) vs.value = volume;

    /* Nav button label */
    const nBtn = document.getElementById('wind-sound-btn');
    if (nBtn) {
      const icon = windStrength < 30 ? '🌾' : windStrength < 60 ? '🌬️' : '🌪️';
      nBtn.querySelector('.wind-nav-label').textContent = icon + ' Wind';
    }

    /* Status */
    const dot = document.getElementById('wp-status-dot');
    const txt = document.getElementById('wp-status-text');
    if (dot && txt) {
      if (windStrength < 30)      { dot.className='wp-dot calm';   txt.textContent='Calm — gentle field air'; }
      else if (windStrength < 55) { dot.className='wp-dot breeze'; txt.textContent='Breeze — leaves are moving'; }
      else if (windStrength < 75) { dot.className='wp-dot breeze'; txt.textContent='Wind — moderate gusts'; }
      else                        { dot.className='wp-dot storm';  txt.textContent='Storm — high risk detected!'; }
    }

    /* Vol row fade */
    const volRow = document.getElementById('wp-vol-row');
    const waveWrap = document.getElementById('wp-wave-wrap');
    if (volRow) volRow.style.opacity = soundOn ? '1' : '0.35';
    if (volRow) volRow.style.pointerEvents = soundOn ? 'auto' : 'none';
    if (waveWrap) waveWrap.style.opacity = soundOn ? '1' : '0.35';

    /* Sound btn */
    const sBtn = document.getElementById('wp-sound-btn');
    if (sBtn) {
      sBtn.textContent = soundOn ? '🔊 Sound: On' : '🔇 Enable Sound';
      sBtn.className = 'wp-sound-btn' + (soundOn ? ' on' : '');
    }

    /* Auto check */
    const autoCheck = document.getElementById('wp-auto-check');
    if (autoCheck) autoCheck.checked = autoMode;
    const manualRow = document.getElementById('wp-manual-row');
    if (manualRow) manualRow.style.opacity = autoMode ? '0.4' : '1';
    if (manualRow) manualRow.style.pointerEvents = autoMode ? 'none' : 'auto';
  }

  /* ─────────────── WAVEFORM RENDERER ─────────────── */
  function drawWaveform() {
    if (!analyser) { waveRaf = requestAnimationFrame(drawWaveform); return; }
    const canvas = document.getElementById('wp-waveform');
    if (!canvas) { waveRaf = null; return; }
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(buf);

    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    const sliceW = W / buf.length;
    let x = 0;

    /* Gradient wave */
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0,   'rgba(80,200,120,0.3)');
    grad.addColorStop(0.5, 'rgba(80,200,120,0.9)');
    grad.addColorStop(1,   'rgba(80,200,120,0.3)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;

    buf.forEach((v, i) => {
      const y = ((v / 128) - 1) * (H * 0.4) + H / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceW;
    });
    ctx.stroke();

    waveRaf = requestAnimationFrame(drawWaveform);
  }

  /* ─────────────── PANEL TOGGLE ─────────────── */
  function openPanel() {
    panelOpen = true;
    panel.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.classList.add('open');
      });
    });
    document.getElementById('wind-sound-btn')?.classList.add('panel-open');
    refreshPanel();
    if (soundOn) { waveRaf = requestAnimationFrame(drawWaveform); }
  }

  function closePanel() {
    panelOpen = false;
    panel.classList.remove('open');
    panel.classList.add('animating');
    setTimeout(() => {
      panel.style.display = 'none';
      panel.classList.remove('animating');
    }, 220);
    document.getElementById('wind-sound-btn')?.classList.remove('panel-open');
    if (waveRaf) { cancelAnimationFrame(waveRaf); waveRaf = null; }
  }

  function togglePanel() {
    if (panelOpen) closePanel(); else openPanel();
  }

  /* Close on outside click */
  document.addEventListener('click', e => {
    if (panelOpen && !panel.contains(e.target) && e.target.id !== 'wind-sound-btn') {
      closePanel();
    }
  });

  /* ─────────────── PANEL EVENTS ─────────────── */
  panel.addEventListener('click', e => e.stopPropagation());

  document.getElementById('wp-close-btn')?.addEventListener('click', closePanel);

  /* Strength slider */
  panel.querySelector('#wp-strength-slider')?.addEventListener('input', e => {
    if (autoMode) return;
    setWindStrength(parseInt(e.target.value));
  });

  /* Volume slider */
  panel.querySelector('#wp-vol-slider')?.addEventListener('input', e => {
    setVolume(parseInt(e.target.value));
  });

  /* Auto toggle */
  panel.querySelector('#wp-auto-check')?.addEventListener('change', e => {
    autoMode = e.target.checked;
    if (autoMode) {
      const score = parseInt(document.getElementById('score-num')?.textContent || '50', 10);
      window.setWindFromRisk(score);
    }
    refreshPanel();
  });

  /* Sound button */
  panel.querySelector('#wp-sound-btn')?.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn) {
      buildAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      applyGain();
      waveRaf = requestAnimationFrame(drawWaveform);
    } else {
      applyGain();
      if (waveRaf) { cancelAnimationFrame(waveRaf); waveRaf = null; }
    }
    refreshPanel();
  });

  /* Dial drag (click on SVG area to set wind manually) */
  const dialSvg = document.getElementById('wind-dial-svg');
  let dragging = false;

  dialSvg?.addEventListener('mousedown', () => { dragging = true; });
  document.addEventListener('mouseup', () => { dragging = false; });
  dialSvg?.addEventListener('mousemove', e => {
    if (!dragging || autoMode) return;
    const rect = dialSvg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * (110 / 130);
    const angle = Math.atan2(cx - e.clientX, cy - e.clientY) * (180 / Math.PI);
    const w = Math.max(0, Math.min(100, Math.round((angle + 90) / 180 * 100)));
    setWindStrength(w);
  });
  dialSvg?.addEventListener('click', e => {
    if (autoMode) return; 
    const rect = dialSvg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * (110 / 130);
    const angle = Math.atan2(cx - e.clientX, cy - e.clientY) * (180 / Math.PI);
    const w = Math.max(0, Math.min(100, Math.round((angle + 90) / 180 * 100)));
    setWindStrength(w);
  });

  /* ─────────────── NAV BUTTON ─────────────── */
  function buildNavBtn() {
    const btn = document.createElement('button');
    btn.id = 'wind-sound-btn';
    btn.title = 'Open Wind Controls';
    btn.innerHTML = `
      <span class="wind-nav-label">🌾 Wind</span>
      <span class="wind-bar-wrap">
        <span class="wind-bar-fill" id="wind-bar-fill"></span>
      </span>
    `;
    btn.onclick = e => { e.stopPropagation(); togglePanel(); };
    document.querySelector('.nav')?.appendChild(btn);

    /* Animate bar */
    setInterval(() => {
      const fill = document.getElementById('wind-bar-fill');
      if (fill) fill.style.width = windStrength + '%';
    }, 400);

    /* Periodically add nav streak effect when windy */
    setInterval(() => {
      if (windStrength < 35) return;
      const streak = document.createElement('div');
      streak.className = 'wind-nav-streak';
      streak.style.width = (20 + Math.random() * 60) + 'px';
      btn.appendChild(streak);
      setTimeout(() => streak.remove(), 1800);
    }, Math.max(400, 2000 - windStrength * 15));
  }

  if (document.readyState !== 'loading') {
    buildNavBtn();
  } else {
    document.addEventListener('DOMContentLoaded', buildNavBtn);
  }

  /* ─────────────── INIT ─────────────── */
  updateWindCSS(windStrength);

  /* Export */
  window.CropGuardWind = { setWindStrength, getWindStrength: () => windStrength, openPanel, closePanel };

})();
