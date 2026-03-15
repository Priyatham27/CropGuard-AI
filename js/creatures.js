/* ============================================================
   creatures.js — CropGuard AI
   Ambient micro-creatures: butterfly, fireflies, ladybug
   Pure SVG + CSS animations — no image files
   ============================================================ */

(function () {
  'use strict';

  /* ── SHARED STATE ── */
  let sliderActive = false;
  document.addEventListener('mousedown', e => {
    if (e.target.matches('input[type=range]')) sliderActive = true;
  });
  document.addEventListener('mouseup', () => { sliderActive = false; });

  /* ─────────────────────────────────────────────────
     ①  BUTTERFLY  — crosses screen every 45 seconds
     ───────────────────────────────────────────────── */
  const butterflySVG = `
  <svg id="butterfly" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg"
       width="52" height="36" style="overflow:visible">
    <style>
      #bfly-l-upper { transform-origin: 30px 20px; animation: bflyFlap 0.28s ease-in-out infinite alternate; }
      #bfly-l-lower { transform-origin: 30px 20px; animation: bflyFlap 0.28s ease-in-out infinite alternate; }
      #bfly-r-upper { transform-origin: 30px 20px; animation: bflyFlapR 0.28s ease-in-out infinite alternate; }
      #bfly-r-lower { transform-origin: 30px 20px; animation: bflyFlapR 0.28s ease-in-out infinite alternate; }
      @keyframes bflyFlap  { from { transform: scaleX(1); } to { transform: scaleX(0.12); } }
      @keyframes bflyFlapR { from { transform: scaleX(-1); } to { transform: scaleX(-0.12); } }
    </style>
    <!-- Left wings -->
    <path id="bfly-l-upper" d="M30,20 C18,5 2,8 4,20 C6,28 16,22 30,20Z"
          fill="#E8924A" stroke="#B05A18" stroke-width="0.5" opacity="0.9"/>
    <path id="bfly-l-lower" d="M30,20 C14,24 8,34 14,36 C20,38 26,30 30,20Z"
          fill="#F0A850" stroke="#B05A18" stroke-width="0.5" opacity="0.85"/>
    <!-- Right wings -->
    <path id="bfly-r-upper" d="M30,20 C42,5 58,8 56,20 C54,28 44,22 30,20Z"
          fill="#E8924A" stroke="#B05A18" stroke-width="0.5" opacity="0.9"/>
    <path id="bfly-r-lower" d="M30,20 C46,24 52,34 46,36 C40,38 34,30 30,20Z"
          fill="#F0A850" stroke="#B05A18" stroke-width="0.5" opacity="0.85"/>
    <!-- Wing spots -->
    <circle cx="20" cy="16" r="3" fill="rgba(80,20,0,0.35)"/>
    <circle cx="21" cy="28" r="2" fill="rgba(80,20,0,0.3)"/>
    <!-- Body -->
    <ellipse cx="30" cy="20" rx="2.2" ry="8" fill="#3a2010"/>
    <!-- Antennae -->
    <line x1="30" y1="13" x2="22" y2="4" stroke="#3a2010" stroke-width="0.8"/>
    <line x1="30" y1="13" x2="38" y2="4" stroke="#3a2010" stroke-width="0.8"/>
    <circle cx="22" cy="4" r="1.5" fill="#3a2010"/>
    <circle cx="38" cy="4" r="1.5" fill="#3a2010"/>
  </svg>`;

  const bflyContainer = document.createElement('div');
  bflyContainer.id = 'butterfly-wrap';
  bflyContainer.style.cssText = `
    position: fixed; pointer-events: none; z-index: 25;
    top: 0; left: 0; display: none;
  `;
  bflyContainer.innerHTML = butterflySVG;
  document.body.appendChild(bflyContainer);

  /* Bezier path flight across screen */
  function launchButterfly() {
    if (sliderActive) return;   // pause during interaction
    const H = window.innerHeight;
    const W = window.innerWidth;

    const startY = H * 0.1  + Math.random() * H * 0.45;
    const endY   = startY + (Math.random() - 0.5) * 140;
    const cp1x   = W * 0.25, cp1y = startY - 100 - Math.random() * 80;
    const cp2x   = W * 0.65, cp2y = endY   + 60  + Math.random() * 80;

    bflyContainer.style.display = 'block';
    bflyContainer.style.top  = startY + 'px';
    bflyContainer.style.left = '-70px';

    const dur    = 18000 + Math.random() * 8000; // 18–26s
    const steps  = 120;
    let   frame  = 0;
    let   prevX  = -70;

    function tick() {
      if (sliderActive) { requestAnimationFrame(tick); return; }
      const t  = frame / steps;
      const mt = 1 - t;
      const x  = mt*mt*mt*(-70) + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*(W+70);
      const y  = mt*mt*mt*startY+ 3*mt*mt*t*cp1y  + 3*mt*t*t*cp2y   + t*t*t*endY;

      /* Flip horizontally when going right (always here, but wobble effect) */
      const dy = y - parseFloat(bflyContainer.style.top);
      bflyContainer.style.top  = y + 'px';
      bflyContainer.style.left = x + 'px';
      /* Gentle body tilt with direction */
      const tilt = Math.atan2(y - startY, x - (-70)) * (180 / Math.PI) * 0.3;
      bflyContainer.querySelector('svg').style.transform = `rotate(${tilt}deg)`;

      frame++;
      if (frame <= steps) {
        setTimeout(tick, dur / steps);
      } else {
        bflyContainer.style.display = 'none';
      }
    }
    tick();
  }

  /* Launch every 45 seconds, first after 8 seconds */
  setTimeout(launchButterfly, 8000);
  setInterval(launchButterfly, 45000);

  /* ─────────────────────────────────────────────────
     ②  FIREFLIES  — only visible after 8PM
     ───────────────────────────────────────────────── */
  const hour = new Date().getHours();  // uses local time from metadata: 11:50 (daytime, so fireflies off)
  
  const fireflyLayer = document.createElement('div');
  fireflyLayer.id = 'firefly-layer';
  fireflyLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:22;';
  document.body.appendChild(fireflyLayer);

  function makeFirefly(i) {
    const ff = document.createElementNS('http://www.w3.org/2000/svg','svg');
    ff.setAttribute('width','8');
    ff.setAttribute('height','8');
    ff.setAttribute('viewBox','0 0 8 8');
    ff.style.cssText = `
      position:absolute;
      left:${5 + Math.random() * 90}%;
      bottom:${3 + Math.random() * 50}%;
      animation:
        fireflyBlink ${(1.2 + Math.random()*2.5).toFixed(1)}s ease-in-out ${(Math.random()*3).toFixed(1)}s infinite,
        fireflyWander ${(6 + Math.random()*8).toFixed(1)}s ease-in-out ${(Math.random()*5).toFixed(1)}s infinite;
    `;
    ff.innerHTML = `
      <defs>
        <radialGradient id="ffg${i}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#e8ff80" stop-opacity="1"/>
          <stop offset="60%" stop-color="#c8ff00" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
      </defs>
      <circle cx="4" cy="4" r="3" fill="url(#ffg${i})"/>
      <circle cx="4" cy="4" r="1.2" fill="#ffffff"/>
    `;
    return ff;
  }

  /* Firefly CSS */
  const ffStyle = document.createElement('style');
  ffStyle.textContent = `
    @keyframes fireflyBlink {
      0%,100% { opacity: 0; filter: blur(0px); }
      40%,60% { opacity: 0.9; filter: blur(1px) drop-shadow(0 0 6px #c8ff00); }
    }
    @keyframes fireflyWander {
      0%   { transform: translate(0,0); }
      25%  { transform: translate(${(Math.random()-0.5)*60}px, ${(Math.random()-0.5)*40}px); }
      50%  { transform: translate(${(Math.random()-0.5)*80}px, ${(Math.random()-0.5)*50}px); }
      75%  { transform: translate(${(Math.random()-0.5)*50}px, ${(Math.random()-0.5)*35}px); }
      100% { transform: translate(0,0); }
    }
  `;
  document.head.appendChild(ffStyle);

  if (hour >= 20 || hour < 5) {
    /* Spawn fireflies */
    for (let i = 0; i < 18; i++) {
      fireflyLayer.appendChild(makeFirefly(i));
    }
  }

  /* ─────────────────────────────────────────────────
     ③  LADYBUG  — crawls along bottom of hovered cards
     ───────────────────────────────────────────────── */
  const ladybugSVG = `
  <svg viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg" width="28" height="20">
    <ellipse cx="14" cy="13" rx="11" ry="8" fill="#D42020"/>
    <ellipse cx="14" cy="13" rx="11" ry="8" fill="none" stroke="#8B0000" stroke-width="0.5"/>
    <!-- Spots -->
    <circle cx="9"  cy="11" r="2.5" fill="#8B0000" opacity="0.85"/>
    <circle cx="19" cy="11" r="2.5" fill="#8B0000" opacity="0.85"/>
    <circle cx="10" cy="16" r="2"   fill="#8B0000" opacity="0.85"/>
    <circle cx="18" cy="16" r="2"   fill="#8B0000" opacity="0.85"/>
    <!-- Center line -->
    <line x1="14" y1="5" x2="14" y2="21" stroke="#8B0000" stroke-width="1"/>
    <!-- Head -->
    <ellipse cx="14" cy="5.5" rx="5" ry="4" fill="#1a1a1a"/>
    <!-- Eyes -->
    <circle cx="11.5" cy="4.5" r="1.2" fill="#ffffff"/>
    <circle cx="16.5" cy="4.5" r="1.2" fill="#ffffff"/>
    <circle cx="11.8" cy="4.5" r="0.5" fill="#000"/>
    <circle cx="16.8" cy="4.5" r="0.5" fill="#000"/>
    <!-- Antennae -->
    <line x1="11" y1="2" x2="8"  y2="-1" stroke="#1a1a1a" stroke-width="0.8"/>
    <line x1="17" y1="2" x2="20" y2="-1" stroke="#1a1a1a" stroke-width="0.8"/>
    <circle cx="8"  cy="-1.5" r="1" fill="#1a1a1a"/>
    <circle cx="20" cy="-1.5" r="1" fill="#1a1a1a"/>
    <!-- Legs (3 per side) -->
    <line x1="6"  y1="11" x2="1"  y2="8"  stroke="#1a1a1a" stroke-width="0.8"/>
    <line x1="5"  y1="14" x2="0"  y2="13" stroke="#1a1a1a" stroke-width="0.8"/>
    <line x1="6"  y1="17" x2="1"  y2="19" stroke="#1a1a1a" stroke-width="0.8"/>
    <line x1="22" y1="11" x2="27" y2="8"  stroke="#1a1a1a" stroke-width="0.8"/>
    <line x1="23" y1="14" x2="28" y2="13" stroke="#1a1a1a" stroke-width="0.8"/>
    <line x1="22" y1="17" x2="27" y2="19" stroke="#1a1a1a" stroke-width="0.8"/>
  </svg>`;

  const lb = document.createElement('div');
  lb.id = 'ladybug';
  lb.innerHTML = ladybugSVG;
  lb.style.cssText = `
    position: absolute;
    bottom: -6px;
    left: 20px;
    pointer-events: none;
    z-index: 50;
    opacity: 0;
    transition: opacity 0.4s ease;
    animation: ladybugWalk 4s linear infinite paused;
  `;
  document.body.appendChild(lb);

  /* Ladybug walk keyframes */
  const lbStyle = document.createElement('style');
  lbStyle.textContent = `
    @keyframes ladybugWalk {
      0%   { transform: translateX(0px) rotate(0deg); }
      20%  { transform: translateX(40px) rotate(2deg); }
      50%  { transform: translateX(100px) rotate(-2deg) scaleY(1.05); }
      80%  { transform: translateX(60px) rotate(1deg); }
      100% { transform: translateX(0px) rotate(0deg); }
    }
    @keyframes legWiggle {
      0%,100% { transform: rotate(0deg); }
      50%      { transform: rotate(15deg); }
    }
  `;
  document.head.appendChild(lbStyle);

  /* Attach to hovered cards */
  function attachLadyBug(card) {
    if (sliderActive) return;
    card.style.position = 'relative';
    card.appendChild(lb);
    lb.style.opacity = '1';
    lb.style.animationPlayState = 'running';
  }

  function detachLadyBug() {
    lb.style.opacity = '0';
    lb.style.animationPlayState = 'paused';
    setTimeout(() => {
      if (lb.parentNode !== document.body) {
        document.body.appendChild(lb);
      }
    }, 400);
  }

  /* Wait for DOM then attach listeners */
  function initLadybugHover() {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mouseenter', () => attachLadyBug(card));
      card.addEventListener('mouseleave', detachLadyBug);
    });
  }

  if (document.readyState !== 'loading') {
    initLadybugHover();
  } else {
    document.addEventListener('DOMContentLoaded', initLadybugHover);
  }

  /* Expose for creature pause */
  window.CropGuardCreatures = { launchButterfly };

})();
