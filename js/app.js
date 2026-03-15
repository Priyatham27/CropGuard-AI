/* ============================================================
   app.js — CropGuard AI
   UI controller — DOM updates, navigation, theme toggle
   ============================================================ */

/* ── THEME ── */
function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  document.getElementById('themeIcon').textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('cg-theme', next);
  // Rebuild charts with new colors
  setTimeout(() => updateDashboardCharts(computeRiskScore(state)), 80);
  setTimeout(() => updatePremiumChart(state), 80);
}

// Restore saved theme
(function() {
  const saved = localStorage.getItem('cg-theme');
  if(saved) {
    document.documentElement.setAttribute('data-theme', saved);
    const icon = document.getElementById('themeIcon');
    if(icon) icon.textContent = saved === 'dark' ? '☀️' : '🌙';
  }
})();

/* ── PAGE NAVIGATION ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  const pages = ['assess','scenario','recommend','dashboard'];
  document.querySelectorAll('.nav-tab')[pages.indexOf(id)]?.classList.add('active');
  if(id === 'dashboard') setTimeout(() => updateDashboardCharts(computeRiskScore(state)), 60);
  if(id === 'recommend') setTimeout(() => updatePremiumChart(state), 60);
}

/* ── FACTOR SLIDER UPDATE ── */
function updateFactor(factor, value) {
  state[factor] = parseInt(value);
  document.getElementById('v-'+factor).textContent = value;
  const barColors = {
    soil:'var(--c-green-mid)', climate:'var(--c-amber-mid)',
    irr:'var(--c-blue-mid)',   pest:'var(--c-red-mid)', market:'var(--c-teal-mid)',
  };
  const bar = document.getElementById('bar-'+factor);
  bar.style.width   = value+'%';
  bar.style.background = barColors[factor];
  recalc();
}

/* ── MAIN RECALC ── */
function recalc() {
  state.region = document.getElementById('sel-region').value;
  state.crop   = document.getElementById('sel-crop').value;
  state.area   = parseFloat(document.getElementById('sl-area').value);

  const score   = computeRiskScore(state);
  const tier    = getRiskTier(score);
  const contrib = getContributions(state);

  // Score ring
  const circ = 402.1;
  const ring = document.getElementById('ring-fill');
  ring.style.strokeDashoffset = circ - (score/100)*circ;
  ring.style.stroke = score<35?'#97C459':score<60?'#EF9F27':'#E24B4A';

  document.getElementById('score-num').textContent  = score;
  document.getElementById('score-tier').textContent = tier.label;
  document.getElementById('score-tier').className   = 'risk-badge '+tier.cls;
  document.getElementById('overall-badge').textContent = tier.label;
  document.getElementById('overall-badge').className   = 'risk-badge '+tier.cls;

  const descs = [
    [80, "Critical risk detected — multiple compounding factors require comprehensive insurance."],
    [60, "High exposure from climate stress. Robust multi-peril coverage strongly advised."],
    [45, "Moderate risk — some vulnerability to weather and pest events."],
    [0,  "Good soil and irrigation keep risk contained. Basic coverage with selective add-ons sufficient."],
  ];
  for(const [t,d] of descs) { if(score>=t){ document.getElementById('score-desc').textContent=d; break; } }

  // Contribution bars
  const cp = document.getElementById('contrib-panel');
  cp.innerHTML = '';
  Object.entries(contrib).sort((a,b)=>b[1]-a[1]).forEach(([k,pct])=>{
    cp.innerHTML += `
    <div class="contrib-row">
      <div class="contrib-label">${FACTOR_META[k].name}</div>
      <div class="contrib-track"><div class="contrib-fill" style="width:${pct}%;background:${FACTOR_META[k].color};"></div></div>
      <div class="contrib-pct" style="color:${FACTOR_META[k].color};">${pct}%</div>
    </div>`;
  });

  // Interaction effects
  const soilRisk = 100 - state.soil;
  const effects  = [];
  if(soilRisk>50 && state.climate>60)  effects.push({i:'⚠️', t:'<span class="explain-bold">Soil × Climate (+18%):</span> Degraded soil critically worsens drought impact — irrigation or soil amendment advised.'});
  if((100-state.irr)>60 && state.climate>60) effects.push({i:'⚠️', t:'<span class="explain-bold">Irrigation × Climate (+12%):</span> Rainfed farming under high climate stress creates compounded loss exposure.'});
  if(state.pest>60 && state.climate>65) effects.push({i:'🔴', t:'<span class="explain-bold">Pest × Climate (+8%):</span> Heat-stressed crops are significantly more vulnerable to pest outbreaks.'});
  if(!effects.length) effects.push({i:'✅', t:'No significant interaction effects detected. Factors are operating independently.'});

  document.getElementById('interaction-panel').innerHTML =
    effects.map(e=>`<div class="explain-row"><div class="explain-icon">${e.i}</div><div class="explain-text">${e.t}</div></div>`).join('');

  // Bottom metrics
  document.getElementById('m-loss').textContent  = Math.round(score*0.65)+'%';
  document.getElementById('m-yield').textContent = '±'+Math.round(10+score*0.22)+'%';
  document.getElementById('m-value').textContent = fmtINR(Math.round(state.area*30000));
  document.getElementById('m-cover').textContent = (score<40?50:score<65?75:90)+'%';

  // Dashboard summary
  document.getElementById('d-score').textContent = score;
  const factors = [
    {k:'climate',v:state.climate,isRisk:true},{k:'pest',v:state.pest,isRisk:true},
    {k:'market',v:state.market,isRisk:true},{k:'soil',v:state.soil,isRisk:false},{k:'irr',v:state.irr,isRisk:false},
  ];
  const topRisk = factors.filter(f=>f.isRisk).sort((a,b)=>b.v-a.v)[0];
  const topProt = factors.filter(f=>!f.isRisk).sort((a,b)=>b.v-a.v)[0];
  document.getElementById('d-top').textContent   = FACTOR_META[topRisk.k].name.replace(/\S+\s/, '');
  document.getElementById('d-top-v').textContent = topRisk.v+'/100';
  document.getElementById('d-prot').textContent  = FACTOR_META[topProt.k].name.replace(/\S+\s/, '');
  document.getElementById('d-prot-v').textContent= topProt.v+'/100';

  // Scenario page baseline
  document.getElementById('sc-base-score').textContent = score;
  document.getElementById('sc-base-badge').textContent  = tier.label;
  document.getElementById('sc-base-badge').className    = 'risk-badge '+tier.cls;

  updateRecommendations(score);
  updateExplainability(score, contrib);
  updateScenarioImpact(state, computeRiskScore(state), 0);
}

/* ── RECOMMENDATIONS ── */
function updateRecommendations(score) {
  const cropName = state.crop.charAt(0).toUpperCase()+state.crop.slice(1);
  const plans = [];
  const rate  = Math.round(state.area * 400 * (CROP_RISK[state.crop]||1));

  if(score<40) {
    plans.push({icon:'🌿',bg:'var(--c-green-light)',title:'Basic Yield Protection',
      desc:`Your risk profile is favorable. A basic ${cropName} yield cover at 50% indemnity will protect against catastrophic losses while keeping premiums affordable.`,
      prem:'₹'+rate.toLocaleString(),tag:'tag-green',tagLabel:'Recommended'});
  } else if(score<65) {
    plans.push({icon:'🛡️',bg:'var(--c-amber-light)',title:'Standard Multi-Peril Cover',
      desc:`Moderate risk warrants comprehensive protection. Covers weather, pest outbreaks, and yield shortfall up to 75% for ${cropName} across all seasons.`,
      prem:'₹'+Math.round(rate*1.9).toLocaleString(),tag:'tag-amber',tagLabel:'Best Value'});
    if(state.pest>55) plans.push({icon:'🐛',bg:'var(--c-red-light)',title:'Pest & Disease Rider',
      desc:`Elevated pest history suggests adding a dedicated rider for ₹${Math.round(state.area*180).toLocaleString()}/ha. Covers stem borer, locust, and blast.`,
      prem:'+₹'+Math.round(state.area*180).toLocaleString(),tag:'tag-red',tagLabel:'Add-on'});
  } else {
    plans.push({icon:'⚡',bg:'var(--c-red-light)',title:'Comprehensive Premium Cover',
      desc:`High-risk profile requires full protection. 90% yield coverage, market price floor guarantee, and all-peril weather cover for ${cropName}.`,
      prem:'₹'+Math.round(rate*3.1).toLocaleString(),tag:'tag-red',tagLabel:'Essential'});
    plans.push({icon:'💹',bg:'var(--c-blue-light)',title:'Revenue Protection Plan',
      desc:`Revenue insurance locks in a minimum revenue floor, protecting against both price crash and production loss simultaneously.`,
      prem:'₹'+Math.round(rate*4.5).toLocaleString(),tag:'tag-blue',tagLabel:'Advanced'});
  }

  document.getElementById('rec-plans').innerHTML = plans.map(p=>`
    <div class="rec-card">
      <div class="rec-icon" style="background:${p.bg};">${p.icon}</div>
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
          <div class="rec-title">${p.title}</div>
          <span class="tag ${p.tag}">${p.tagLabel}</span>
        </div>
        <div class="rec-desc">${p.desc}</div>
        <div class="rec-premium">${p.prem} / season</div>
      </div>
    </div>`).join('');

  document.getElementById('cr-basic').textContent = '₹'+rate.toLocaleString();
  document.getElementById('cr-std').textContent   = '₹'+Math.round(rate*1.9).toLocaleString();
  document.getElementById('cr-prem').textContent  = '₹'+Math.round(rate*3.1).toLocaleString();
  document.getElementById('d-prem').textContent   = '₹'+Math.round(rate*1.9).toLocaleString();
  updateDed(document.getElementById('ded-slider').value, Math.round(rate*1.9));
}

/* ── EXPLAINABILITY ── */
function updateExplainability(score, contrib) {
  const topFactor = Object.entries(contrib).sort((a,b)=>b[1]-a[1])[0];
  const names = {soil:'Soil Health',climate:'Climate Stress',irr:'Irrigation Reliability',pest:'Pest Pressure',market:'Market Volatility'};
  const tier = getRiskTier(score);
  const cropMult = CROP_RISK[state.crop]||1;
  const regionMult = REGION_RISK[state.region]||1;

  document.getElementById('explain-panel').innerHTML = [
    {i:'🔢', t:`Risk score <span class="explain-bold">${score}/100</span> — <span class="explain-bold">${tier.label}</span>. Weighted sum of 5 factors with non-linear interaction multipliers applied where factors compound.`},
    {i:'📊', t:`<span class="explain-bold">${names[topFactor[0]]}</span> drives ${topFactor[1]}% of risk exposure. Improving this factor by 20 points would reduce your score by ~${Math.round(topFactor[1]*0.12)} points.`},
    {i:cropMult>1?'⬆️':'⬇️', t:`Crop <span class="explain-bold">${state.crop}</span> carries ${cropMult>1?'+':''}${Math.round(Math.abs(cropMult-1)*100)}% risk adjustment due to its ${cropMult>1?'higher water demand and market sensitivity':'drought resilience and stable demand'}.`},
    {i:'📍', t:`<span class="explain-bold">${state.region}</span> region adds ${regionMult>1?'+':''}${Math.round(Math.abs(regionMult-1)*100)}% regional modifier based on historical climate variability and infrastructure access.`},
    {i:'💡', t:`Key levers to reduce premium 15–20%: <span class="explain-bold">improve irrigation access</span> and <span class="explain-bold">soil health programs</span> (organic matter, cover crops).`},
  ].map(r=>`<div class="explain-row"><div class="explain-icon">${r.i}</div><div class="explain-text">${r.t}</div></div>`).join('');
}

/* ── DEDUCTIBLE OPTIMIZER ── */
function updateDed(val, basePremium) {
  const bp  = basePremium || parseInt((document.getElementById('ded-premium').textContent||'7800').replace(/[₹,]/g,'')) || 7800;
  const ded = parseInt(val);
  const adj = Math.round(bp*(1-(ded-5)/100*0.7));
  const oop = Math.round(ded/100*state.area*30000);
  document.getElementById('ded-val').textContent     = ded+'%';
  document.getElementById('ded-premium').textContent = '₹'+adj.toLocaleString();
  document.getElementById('ded-oop').textContent     = '₹'+oop.toLocaleString();
  const notes = [[35,'High deductible reduces premium but leaves large out-of-pocket exposure.'],
                 [20,'Moderate deductible balances affordability and protection.'],
                 [0, 'Low deductible maximizes protection — recommended for high-risk profiles.']];
  for(const [t,n] of notes) { if(ded>=t){ document.getElementById('ded-note').textContent=n; break; } }
}

/* ── SCENARIO PAGE ── */
function applyScenario(key) {
  document.querySelectorAll('.scenario-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('sc-'+key)?.classList.add('active');
  const sc = SCENARIOS[key];
  document.getElementById('csl-rain').value  = Math.max(0,sc.rain);
  document.getElementById('cv-rain').textContent = Math.max(0,sc.rain)+'%';
  document.getElementById('csl-temp').value  = sc.temp;
  document.getElementById('cv-temp').textContent = sc.temp+'°C';
  document.getElementById('csl-pest').value  = sc.pestM;
  document.getElementById('cv-pest').textContent = sc.pestM.toFixed(1)+'×';
  document.getElementById('csl-irr').value   = sc.irrFail;
  document.getElementById('cv-irr').textContent = sc.irrFail+'%';
  customScenario(sc.marketBoost||0);
}

function resetScenario() {
  document.querySelectorAll('.scenario-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('csl-rain').value=0;  document.getElementById('cv-rain').textContent='0%';
  document.getElementById('csl-temp').value=0;  document.getElementById('cv-temp').textContent='0°C';
  document.getElementById('csl-pest').value=1;  document.getElementById('cv-pest').textContent='1.0×';
  document.getElementById('csl-irr').value=0;   document.getElementById('cv-irr').textContent='0%';
  customScenario(0);
}

function customScenario(marketBoost=0) {
  const sc = {
    rain:       parseInt(document.getElementById('csl-rain').value),
    temp:       parseInt(document.getElementById('csl-temp').value),
    pestM:      parseFloat(document.getElementById('csl-pest').value),
    irrFail:    parseInt(document.getElementById('csl-irr').value),
    marketBoost,
  };
  const baseScore = computeRiskScore(state);
  const scenState = applyScenarioToState(state, sc);
  const newScore  = computeRiskScore(scenState);
  const delta     = newScore - baseScore;
  const tier      = getRiskTier(newScore);

  document.getElementById('sc-new-score').textContent = newScore;
  document.getElementById('sc-new-badge').textContent = tier.label;
  document.getElementById('sc-new-badge').className   = 'risk-badge '+tier.cls;

  const deltaEl = document.getElementById('sc-delta');
  deltaEl.textContent  = (delta>=0?'+':'')+delta;
  deltaEl.style.color  = delta>0?'var(--c-red)':delta<0?'var(--c-green)':'var(--text-muted)';
  document.getElementById('sc-delta-pct').textContent = (delta>=0?'+':'')+Math.round(delta/Math.max(baseScore,1)*100)+'%';

  const yieldLoss = Math.round(Math.min(90, Math.max(0, delta*0.8)));
  document.getElementById('sc-yield-loss').textContent    = yieldLoss+'%';
  document.getElementById('sc-premium-adj').textContent   = (delta>=0?'+₹':'₹')+Math.abs(Math.round(delta*state.area*120)).toLocaleString();
  document.getElementById('sc-payout').textContent        = '₹'+Math.max(0,Math.round(yieldLoss/100*state.area*30000*0.75)).toLocaleString();
  document.getElementById('sc-recovery').textContent      = Math.round(Math.max(20,100-yieldLoss*0.5))+'%';

  updateScenarioImpact(scenState, newScore, delta);
}

function updateScenarioImpact(scenState, newScore, delta) {
  const panel = document.getElementById('scenario-impact-panel');
  if(!panel) return;
  const factors=[
    {k:'climate',base:state.climate,sc:scenState.climate,isRisk:true},
    {k:'irr',    base:state.irr,    sc:scenState.irr,    isRisk:false},
    {k:'pest',   base:state.pest,   sc:scenState.pest,   isRisk:true},
    {k:'soil',   base:state.soil,   sc:scenState.soil,   isRisk:false},
    {k:'market', base:state.market, sc:scenState.market, isRisk:true},
  ];
  panel.innerHTML = factors.map(f=>{
    const d=Math.round(f.sc-f.base);
    const worse=f.isRisk?d>0:d<0;
    const dColor=d===0?'var(--text-muted)':worse?'var(--c-red)':'var(--c-green)';
    return `<div class="gauge-row">
      <div class="gauge-label">${FACTOR_META[f.k].name}</div>
      <div class="gauge-bar"><div class="gauge-fill" style="width:${Math.round(f.sc)}%;background:${FACTOR_META[f.k].color};"></div></div>
      <div class="gauge-val" style="color:${dColor};">${d===0?'—':(d>0?'+':'')+d}</div>
    </div>`;
  }).join('');
}

/* ── INIT ── */
recalc();
setTimeout(()=>updateDashboardCharts(computeRiskScore(state)), 200);
