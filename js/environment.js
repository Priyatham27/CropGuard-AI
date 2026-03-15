/* ============================================================
   environment.js — CropGuard AI
   Procedural paddy field, particle system, dynamic sky engine
   ============================================================ */

(function() {
  'use strict';

  /* ── CONFIG ── */
  const CFG = {
    grassBladeCount: 180,       // total SVG grass blades
    dustParticleCount: 22,      // ambient dust motes
    particleCount: 28,          // wind-carried crop particles
    cloudCount: 5,
    rayCount: 8,
    sunRayOriginX: 92,          // % from left
    sunRayOriginY: -5,          // % from top
  };

  /* ── STATE ── */
  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.5;
  let currentSky = 'baseline';
  let weatherEls = [];          // cleanup refs
  const particles = [];

  /* ── DOM SCAFFOLDING ── */
  function createLayer(id, zIndex, extra = '') {
    const el = document.createElement('div');
    el.id = id;
    el.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${zIndex};${extra}`;
    document.body.prepend(el);
    return el;
  }

  /* Sky backdrop */
  const skyEl = createLayer('sky-backdrop', 0);

  /* Field ground strip */
  const groundEl = document.createElement('div');
  groundEl.id = 'field-ground';
  document.body.prepend(groundEl);

  /* Sun rays container */
  const raysEl = document.createElement('div');
  raysEl.id = 'sun-rays';
  document.body.prepend(raysEl);

  /* Grass field SVG container */
  const grassEl = document.createElement('div');
  grassEl.id = 'grass-field';
  document.body.prepend(grassEl);

  /* Particle canvas */
  const particleCanvas = document.createElement('canvas');
  particleCanvas.id = 'particle-canvas';
  particleCanvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:5;';
  document.body.prepend(particleCanvas);
  const ctx = particleCanvas.getContext('2d');

  /* Cloud layer */
  const cloudLayer = createLayer('cloud-layer', 1);

  /* Weather layer (rain, snow, swarm) */
  const weatherLayer = createLayer('weather-layer', 6);

  /* Initialise canvas size */
  function resizeCanvas() {
    particleCanvas.width  = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  /* ── ① GRASS BLADE GENERATOR ── */
  const SWAY_ANIMS   = ['sway1','sway2','sway3','sway4'];
  const GRASS_COLORS = [
    '#4a8c18','#5aa020','#6abf28','#3a7010',
    '#7cc832','#4e9420','#82c840','#2e6010',
  ];
  const PADDY_COLORS = [
    '#c8b032','#d4bc3a','#e0c840','#b89028',
    '#ccb43a','#d8c040','#b49030','#e4cc48',
  ];

  function makeBlade(x, heightPx, color, animName, delay, speedS, opacity = 1) {
    const width   = 3 + Math.random() * 4;           // 3–7 px wide
    const taper   = width * 0.25;
    const curve   = (Math.random() - 0.5) * 18;      // natural lean
    const d = `M ${width/2} ${heightPx}
               C ${width/2 + curve*0.3} ${heightPx*0.6},
                 ${width/2 + curve*0.7} ${heightPx*0.3},
                 ${width/2 + curve} 0
               L ${width/2 + curve + taper} 0
               C ${width/2 + curve*0.7 + taper} ${heightPx*0.3},
                 ${width/2 + curve*0.3 + taper} ${heightPx*0.6},
                 ${width/2 + width} ${heightPx} Z`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox', `0 0 ${width + Math.abs(curve) + taper + 4} ${heightPx}`);
    svg.setAttribute('width',  `${(width + Math.abs(curve) + taper + 4).toFixed(0)}px`);
    svg.setAttribute('height', `${heightPx}px`);
    svg.style.cssText = `
      position:absolute; bottom:0; left:${x}px;
      transform-origin:bottom center;
      animation:${animName} ${speedS}s ease-in-out ${delay}s infinite;
      opacity:${opacity};
      overflow:visible;
    `;

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('fill', color);

    /* Tip highlight */
    const shine = document.createElementNS('http://www.w3.org/2000/svg','path');
    const sd = `M ${width/2+curve} 0 L ${width/2+curve+taper} 0 L ${width/2+curve+taper} ${heightPx*0.15} Z`;
    shine.setAttribute('d', sd);
    shine.setAttribute('fill', 'rgba(255,255,220,0.5)');

    svg.appendChild(path);
    svg.appendChild(shine);
    return svg;
  }

  function buildGrassField() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    grassEl.innerHTML = '';

    /* Back row — shorter, more golden (ripe paddy) */
    for (let i = 0; i < CFG.grassBladeCount * 0.45; i++) {
      const x       = Math.random() * W;
      const height  = 40 + Math.random() * 50;
      const color   = PADDY_COLORS[Math.floor(Math.random() * PADDY_COLORS.length)];
      const anim    = SWAY_ANIMS[Math.floor(Math.random() * SWAY_ANIMS.length)];
      const delay   = (Math.random() * 4).toFixed(2);
      const speed   = (2.5 + Math.random() * 2.5).toFixed(2);
      const opacity = 0.55 + Math.random() * 0.35;
      grassEl.appendChild(makeBlade(x, height, color, anim, delay, speed, opacity));
    }

    /* Front row — taller, greener */
    for (let i = 0; i < CFG.grassBladeCount * 0.55; i++) {
      const x       = Math.random() * W;
      const height  = 60 + Math.random() * 90;
      const color   = GRASS_COLORS[Math.floor(Math.random() * GRASS_COLORS.length)];
      const anim    = SWAY_ANIMS[Math.floor(Math.random() * SWAY_ANIMS.length)];
      const delay   = (Math.random() * 5).toFixed(2);
      const speed   = (2 + Math.random() * 3).toFixed(2);
      const opacity = 0.65 + Math.random() * 0.35;
      grassEl.appendChild(makeBlade(x, height, color, anim, delay, speed, opacity));
    }
  }

  buildGrassField();
  window.addEventListener('resize', buildGrassField);

  /* ── ② DUST PARTICLES (field ambience) ── */
  function buildDust() {
    const existing = document.querySelectorAll('.dust-particle');
    existing.forEach(e => e.remove());

    for (let i = 0; i < CFG.dustParticleCount; i++) {
      const el = document.createElement('div');
      el.className = 'dust-particle';
      const size = 3 + Math.random() * 6;
      const opacity = (0.3 + Math.random() * 0.4).toFixed(2);
      const dx = 40 + Math.random() * 100;
      const dy = -(60 + Math.random() * 120);
      el.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        bottom:${5 + Math.random() * 50}%;
        --dust-opacity:${opacity};
        --dust-dx:${dx}px;
        --dust-dy:${dy}px;
        animation-duration:${(5 + Math.random() * 8).toFixed(1)}s;
        animation-delay:${(Math.random() * 8).toFixed(1)}s;
      `;
      grassEl.appendChild(el);
    }
  }

  buildDust();

  /* ── ③ SUN RAYS ── */
  function buildSunRays() {
    raysEl.innerHTML = '';
    for (let i = 0; i < CFG.rayCount; i++) {
      const ray = document.createElement('div');
      ray.className = 'sun-ray';
      const angle  = -45 + (i / CFG.rayCount) * 80;  // spread across top-right
      const offset = (i * 80) + 'px';
      ray.style.cssText = `
        transform: rotate(${angle}deg);
        right: ${offset};
        animation-delay: ${(i * 0.7).toFixed(1)}s;
        animation-duration: ${(5 + i * 0.6).toFixed(1)}s;
        opacity: ${(0.3 + Math.random() * 0.3).toFixed(2)};
        width: ${1 + Math.random() * 3}px;
      `;
      raysEl.appendChild(ray);
    }
  }

  buildSunRays();

  /* ── ④ CLOUDS ── */
  function makeSVGCloud(w, h, opacity) {
    const bumps = 5 + Math.floor(Math.random() * 4);
    const bR    = h * 0.5;
    let parts   = '';
    for (let b = 0; b < bumps; b++) {
      const cx = (w / bumps) * b + bR * 0.5;
      const cy = h * 0.4 + Math.random() * h * 0.25;
      const r  = bR * (0.7 + Math.random() * 0.6);
      parts += `<circle cx="${cx}" cy="${cy}" r="${r}" />`;
    }
    parts += `<rect x="0" y="${h * 0.5}" width="${w}" height="${h * 0.5}" rx="4"/>`;

    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" 
               xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <g fill="white" opacity="${opacity}">${parts}</g>
    </svg>`;
  }

  function buildClouds() {
    cloudLayer.innerHTML = '';
    for (let i = 0; i < CFG.cloudCount; i++) {
      const el = document.createElement('div');
      el.className = 'cloud-shape';
      const w    = 140 + Math.random() * 200;
      const h    = 40  + Math.random() * 60;
      const top  = 2   + Math.random() * 22;
      const dur  = 45  + Math.random() * 55;
      const del  = -(Math.random() * dur);
      const op   = 0.5 + Math.random() * 0.4;

      el.innerHTML = makeSVGCloud(w, h, op);
      el.style.cssText = `
        top:${top}%;
        animation: cloudDrift ${dur}s linear ${del}s infinite;
      `;
      cloudLayer.appendChild(el);
    }
  }

  buildClouds();

  /* ── ⑤ WIND PARTICLE SYSTEM (canvas-based) ── */
  const PARTICLE_TYPES = [
    {
      type: 'leaf',
      draw(ctx, p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(p.floatScale, p.floatScale);
        // Leaf shape
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.6, p.size * 0.3, 0, 0, Math.PI * 2);
        const g = ctx.createLinearGradient(-p.size*0.6, 0, p.size*0.6, 0);
        g.addColorStop(0,   `hsla(${p.hue}, 65%, 30%, ${p.alpha})`);
        g.addColorStop(0.5, `hsla(${p.hue}, 60%, 42%, ${p.alpha})`);
        g.addColorStop(1,   `hsla(${p.hue}, 55%, 25%, ${p.alpha})`);
        ctx.fillStyle = g;
        ctx.fill();
        // Midrib
        ctx.beginPath();
        ctx.moveTo(-p.size*0.55, 0);
        ctx.lineTo(p.size*0.55, 0);
        ctx.strokeStyle = `hsla(${p.hue}, 50%, 20%, ${p.alpha * 0.7})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      },
      init(p) {
        p.hue = 80 + Math.random() * 60;  // green range
        p.size = 8 + Math.random() * 16;
      },
    },
    {
      type: 'rice',
      draw(ctx, p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(p.floatScale, p.floatScale);
        // Rice grain ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.35, p.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(50, 80%, 78%, ${p.alpha})`;
        ctx.fill();
        ctx.strokeStyle = `hsla(40, 60%, 60%, ${p.alpha * 0.6})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      },
      init(p) { p.size = 8 + Math.random() * 10; },
    },
    {
      type: 'wheat',
      draw(ctx, p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const stem = p.size * 1.2;
        // Stalk
        ctx.beginPath();
        ctx.moveTo(0, stem / 2);
        ctx.lineTo(0, -stem / 2);
        ctx.strokeStyle = `hsla(45, 70%, 55%, ${p.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // Grains along stalk
        for (let i = -2; i <= 2; i++) {
          ctx.save();
          ctx.translate(0, (i / 2) * (stem * 0.35));
          ctx.rotate(i % 2 === 0 ? 0.4 : -0.4);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.18, p.size * 0.08, 0, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(42, 75%, 65%, ${p.alpha})`;
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      },
      init(p) { p.size = 10 + Math.random() * 14; },
    },
    {
      type: 'petal',
      draw(ctx, p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(p.floatScale, p.floatScale);
        // Teardrop petal
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.5);
        ctx.bezierCurveTo(p.size * 0.4, -p.size * 0.2, p.size * 0.3, p.size * 0.4, 0, p.size * 0.5);
        ctx.bezierCurveTo(-p.size * 0.3, p.size * 0.4, -p.size * 0.4, -p.size * 0.2, 0, -p.size * 0.5);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 0.5);
        g.addColorStop(0, `hsla(${p.hue}, 90%, 82%, ${p.alpha})`);
        g.addColorStop(1, `hsla(${p.hue}, 80%, 65%, ${p.alpha * 0.7})`);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      },
      init(p) {
        const hues = [0, 30, 330, 280, 340];
        p.hue = hues[Math.floor(Math.random() * hues.length)];
        p.size = 6 + Math.random() * 12;
      },
    },
  ];

  function spawnParticle() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const type   = PARTICLE_TYPES[Math.floor(Math.random() * PARTICLE_TYPES.length)];
    const size   = 8 + Math.random() * 16;
    const p = {
      x:         -30,
      y:         H * 0.1 + Math.random() * H * 0.8,
      vx:        1.2 + Math.random() * 2.0,
      vy:        (Math.random() - 0.5) * 0.6,
      rot:       Math.random() * Math.PI * 2,
      rotSpeed:  (Math.random() - 0.5) * 0.08,
      alpha:     0.3 + Math.random() * 0.5,
      alphaDir:  0,
      size,
      floatScale: 1,
      floatPhase: Math.random() * Math.PI * 2,
      floatAmp:   0.06 + Math.random() * 0.1,
      driftAngle: (Math.random() - 0.5) * 0.3,
      age:       0,
      typeObj:   type,
      hue:       0,
    };
    type.init(p);
    particles.push(p);
  }

  /* Seed initial particles distributed across screen */
  for (let i = 0; i < CFG.particleCount; i++) {
    spawnParticle();
    if (particles.length > 0) {
      const last = particles[particles.length - 1];
      last.x = Math.random() * window.innerWidth;
    }
  }

  /* ── Mouse interaction ── */
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  /* ── Particle update loop ── */
  let lastTime = 0;
  function animateParticles(ts) {
    const dt = Math.min((ts - lastTime) / 16.67, 3); // cap at 3× for background tabs
    lastTime = ts;
    const W = window.innerWidth;
    const H = window.innerHeight;

    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      /* Mouse repulsion — gentle curve away */
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160) {
        const force = (160 - dist) / 160 * 0.8;
        p.vx += (dx / dist) * force * 0.5;
        p.vy += (dy / dist) * force * 0.35;
      }

      /* Dampen velocity back to normal */
      p.vx += (1.6 - p.vx) * 0.012;
      p.vy += (p.driftAngle - p.vy) * 0.012;

      /* Update position */
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      /* Floating bob */
      p.floatPhase += 0.03 * dt;
      p.floatScale = 1 + Math.sin(p.floatPhase) * p.floatAmp;

      /* Tumble rotation */
      p.rot += p.rotSpeed * dt;

      /* Fade in/out */
      p.age++;
      if (p.age < 30) { p.alpha = Math.min(p.alpha, p.age / 30 * 0.8); }

      /* Out of bounds — respawn */
      if (p.x > W + 60) {
        particles.splice(i, 1);
        spawnParticle();
        continue;
      }

      p.typeObj.draw(ctx, p);
    }

    requestAnimationFrame(animateParticles);
  }

  requestAnimationFrame(animateParticles);

  /* ── ⑥ SKY / WEATHER SYSTEM ── */
  const SKY_CONFIGS = {
    baseline: {
      bodyClass: '',
      cloudOpacity: 0.7,
      raysVisible: true,
      weather: null,
    },
    drought: {
      bodyClass: 'sky-drought',
      cloudOpacity: 0.25,
      raysVisible: true,
      weather: null,
    },
    flood: {
      bodyClass: 'sky-flood',
      cloudOpacity: 0,
      raysVisible: false,
      weather: 'rain',
    },
    cold: {
      bodyClass: 'sky-frost',
      cloudOpacity: 0.5,
      raysVisible: false,
      weather: 'snow',
    },
    pest: {
      bodyClass: 'sky-pest',
      cloudOpacity: 0.15,
      raysVisible: true,
      weather: 'swarm',
    },
    market: {
      bodyClass: '',
      cloudOpacity: 0.65,
      raysVisible: true,
      weather: null,
    },
    compound: {
      bodyClass: 'sky-drought',
      cloudOpacity: 0.2,
      raysVisible: true,
      weather: 'swarm',
    },
  };

  /* ── Rain ── */
  function startRain() {
    clearWeather();
    for (let i = 0; i < 80; i++) {
      const streak = document.createElement('div');
      streak.className = 'rain-streak';
      const height = 12 + Math.random() * 20;
      streak.style.cssText = `
        left:${Math.random() * 100}%;
        top:-${height + 20}px;
        height:${height}px;
        animation-duration:${(0.5 + Math.random() * 0.6).toFixed(2)}s;
        animation-delay:${(Math.random() * 1.5).toFixed(2)}s;
        opacity:${(0.4 + Math.random() * 0.4).toFixed(2)};
      `;
      weatherLayer.appendChild(streak);
      weatherEls.push(streak);
    }
  }

  /* ── Snow ── */
  const SNOWFLAKES = ['❄','❅','❆','*','·'];
  function startSnow() {
    clearWeather();
    for (let i = 0; i < 40; i++) {
      const flake = document.createElement('div');
      flake.className = 'snowflake-el';
      const size = 10 + Math.random() * 18;
      const drift = (Math.random() - 0.5) * 100;
      flake.textContent = SNOWFLAKES[Math.floor(Math.random() * SNOWFLAKES.length)];
      flake.style.cssText = `
        left:${Math.random() * 100}%;
        --snow-drift:${drift}px;
        --snow-size:${size}px;
        font-size:${size}px;
        animation-duration:${(5 + Math.random() * 8).toFixed(1)}s;
        animation-delay:${(Math.random() * 10).toFixed(1)}s;
      `;
      weatherLayer.appendChild(flake);
      weatherEls.push(flake);
    }
  }

  /* ── Swarm ── */
  function startSwarm() {
    clearWeather();
    for (let i = 0; i < 120; i++) {
      const dot = document.createElement('div');
      dot.className = 'swarm-dot';
      const sx  = (Math.random() - 0.5) * 60;
      const sy  = (Math.random() - 0.5) * 40;
      const sx2 = (Math.random() - 0.5) * 80;
      const sy2 = (Math.random() - 0.5) * 50;
      const sx3 = (Math.random() - 0.5) * 50;
      const sy3 = (Math.random() - 0.5) * 60;
      dot.style.cssText = `
        left:${5 + Math.random() * 90}%;
        top:${5  + Math.random() * 85}%;
        --sx:${sx}px; --sy:${sy}px;
        --sx2:${sx2}px; --sy2:${sy2}px;
        --sx3:${sx3}px; --sy3:${sy3}px;
        animation-duration:${(1.2 + Math.random() * 2).toFixed(2)}s;
        animation-delay:${(Math.random() * 2).toFixed(2)}s;
        width:${2 + Math.random() * 3}px;
        height:${2 + Math.random() * 3}px;
        opacity:${(0.4 + Math.random() * 0.5).toFixed(2)};
      `;
      weatherLayer.appendChild(dot);
      weatherEls.push(dot);
    }
  }

  function clearWeather() {
    weatherEls.forEach(el => el.remove());
    weatherEls = [];
  }

  function activateSky(scenarioKey) {
    const cfg = SKY_CONFIGS[scenarioKey] || SKY_CONFIGS.baseline;

    /* Remove all sky body classes */
    document.body.classList.remove(
      'sky-drought','sky-flood','sky-frost','sky-pest'
    );
    if (cfg.bodyClass) document.body.classList.add(cfg.bodyClass);

    /* Cloud opacity */
    cloudLayer.style.opacity = cfg.cloudOpacity.toString();

    /* Ray visibility */
    raysEl.style.opacity = cfg.raysVisible ? '1' : '0';

    /* Weather */
    clearWeather();
    if (cfg.weather === 'rain')  startRain();
    if (cfg.weather === 'snow')  startSnow();
    if (cfg.weather === 'swarm') startSwarm();

    currentSky = scenarioKey;
  }

  /* ── ⑦ HOOK INTO EXISTING applyScenario / resetScenario ── */
  /* We wrap the existing functions from app.js */
  function installScenarioHooks() {
    const origApply = window.applyScenario;
    const origReset = window.resetScenario;

    if (typeof origApply === 'function') {
      window.applyScenario = function(key) {
        origApply(key);
        activateSky(key);
      };
    }

    if (typeof origReset === 'function') {
      window.resetScenario = function() {
        origReset();
        activateSky('baseline');
      };
    }
  }

  /* app.js loads before us so the functions exist, but wait for DOM-complete */
  if (document.readyState === 'complete') {
    installScenarioHooks();
  } else {
    window.addEventListener('load', installScenarioHooks);
  }

  /* ── ⑧ AMBIENT IDLE ANIMATION — sky breathes gently ── */
  let skyPhase = 0;
  function skyBreath() {
    if (currentSky === 'baseline') {
      skyPhase += 0.003;
      const s = Math.sin(skyPhase);
      /* Subtle brightness pulse on rays */
      raysEl.style.opacity = (0.75 + s * 0.25).toFixed(3);
    }
    requestAnimationFrame(skyBreath);
  }
  skyBreath();

  /* ── ⑨ INITIAL BASELINE SKY ── */
  activateSky('baseline');

  /* Expose for external use if needed */
  window.CropGuardEnv = { activateSky };

})();
