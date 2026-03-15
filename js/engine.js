/* ============================================================
   engine.js — CropGuard AI
   Multi-factor probabilistic risk scoring engine
   ============================================================ */

const state = {
  soil: 62, climate: 58, irr: 70, pest: 45, market: 40,
  region: 'tropical', crop: 'rice', area: 8,
};

const WEIGHTS = { soil:0.28, climate:0.30, irr:0.20, pest:0.14, market:0.08 };

const CROP_RISK = {
  rice:1.10, wheat:0.85, maize:0.95, cotton:1.20,
  pulses:0.80, sugarcane:0.90, vegetables:1.30,
};

const REGION_RISK = { arid:1.25, tropical:1.05, temperate:0.85, coastal:1.00 };

const FACTOR_META = {
  soil:    { name:'🌱 Soil Health',   color:'#97C459' },
  climate: { name:'🌡 Climate',        color:'#EF9F27' },
  irr:     { name:'💧 Irrigation',    color:'#378ADD' },
  pest:    { name:'🐛 Pest Pressure', color:'#E24B4A' },
  market:  { name:'📈 Market Risk',   color:'#1D9E75' },
};

const SCENARIOS = {
  drought:  { label:'Severe Drought',     rain:60,  temp:5,   pestM:1.2, irrFail:40 },
  flood:    { label:'Excessive Rainfall', rain:-40, temp:1,   pestM:1.4, irrFail:10 },
  pest:     { label:'Pest Outbreak',      rain:10,  temp:1.5, pestM:3.5, irrFail:5  },
  cold:     { label:'Cold Wave / Frost',  rain:20,  temp:-8,  pestM:0.8, irrFail:15 },
  market:   { label:'Market Crash',       rain:0,   temp:0,   pestM:1.0, irrFail:0, marketBoost:45 },
  compound: { label:'Compound Event',     rain:55,  temp:4,   pestM:3.0, irrFail:35 },
};

function computeRiskScore(s) {
  const soilRisk=100-s.soil, irrRisk=100-s.irr;
  let base = WEIGHTS.soil*soilRisk + WEIGHTS.climate*s.climate
           + WEIGHTS.irr*irrRisk   + WEIGHTS.pest*s.pest + WEIGHTS.market*s.market;
  let ix=1.0;
  if(soilRisk>50 && s.climate>60) ix*=1.18;
  if(irrRisk>60  && s.climate>60) ix*=1.12;
  if(s.pest>60   && s.climate>65) ix*=1.08;
  base *= ix * (CROP_RISK[s.crop]||1.0) * (REGION_RISK[s.region]||1.0);
  return Math.min(99, Math.max(5, Math.round(base)));
}

function getContributions(s) {
  const raw = {
    soil:WEIGHTS.soil*(100-s.soil), climate:WEIGHTS.climate*s.climate,
    irr:WEIGHTS.irr*(100-s.irr),    pest:WEIGHTS.pest*s.pest, market:WEIGHTS.market*s.market,
  };
  const total=Object.values(raw).reduce((a,b)=>a+b,0);
  const pct={};
  for(const k in raw) pct[k]=Math.round(raw[k]/total*100);
  return pct;
}

function getRiskTier(score) {
  if(score<35) return {label:'Low Risk',      cls:'risk-low',      color:'#3B6D11'};
  if(score<60) return {label:'Moderate Risk', cls:'risk-moderate', color:'#854F0B'};
  if(score<78) return {label:'High Risk',     cls:'risk-high',     color:'#A32D2D'};
  return            {label:'Very High Risk', cls:'risk-high',     color:'#501313'};
}

function applyScenarioToState(base, sc) {
  const s={...base};
  s.climate=Math.min(100, base.climate+(sc.rain||0)*0.4+Math.abs(sc.temp||0)*2.5);
  s.irr    =Math.max(10,  base.irr-(sc.irrFail||0)*0.7);
  s.pest   =Math.min(100, base.pest*(sc.pestM||1));
  if((sc.temp||0)<-3) s.soil=Math.max(10, base.soil-10);
  if(sc.marketBoost)  s.market=Math.min(100, base.market+sc.marketBoost);
  return s;
}

function fmtINR(n) {
  if(n>=100000) return '₹'+(n/100000).toFixed(1)+'L';
  if(n>=1000)   return '₹'+Math.round(n/1000)+'K';
  return '₹'+n;
}
