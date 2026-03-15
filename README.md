<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0d2006,1a3a0a,2d5c12,4a8a1e,97C459,EF9F27&height=220&section=header&text=🌾%20CropGuard%20AI&fontSize=58&fontColor=ffffff&fontAlignY=40&desc=Step%20into%20the%20Field%20—%20Not%20a%20Dashboard&descAlignY=62&descSize=17&descColor=d4edaa&animation=fadeIn"/>

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-3B6D11?style=for-the-badge)](https://priyatham27.github.io/CropGuard-AI)
[![License: MIT](https://img.shields.io/badge/License-MIT-97C459?style=for-the-badge)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-EF9F27?style=for-the-badge)](#)

<br/>


☁️          ☁️      ☁️                ☁️

═══════════ Dynamic Sky · Reacts to Every Scenario ════════════

🌾🌾 🌿 🌾🌾🌾 🌿🌿 🌾 🌿 🌾🌾 🌿 🌾🌾🌾 🌿 🌾🌾

Cards staked into the field like boards

░░ 🌱 Soil ░░ 💧 Irrigation ░░ 🌡 Climate ░░ 🐛 Pest ░░

Root-growth animations under every slider

🦋 butterfly drifts by · 🔥 fireflies after 8 PM

🐞 ladybug on hover · 🍃 leaves in the breeze

> **This isn't a dashboard. It's a field.**
> Swaying grass, drifting leaves, dynamic weather skies, root-growth sliders,
> and ambient creatures — all wired to a live probabilistic risk engine.

</div>

---

## 🌾 What is CropGuard AI?

CropGuard AI is a **web-based crop insurance risk assessment platform** that helps farmers and insurance agents understand farm-level risk through an interactive, explainable interface.

Instead of a sterile spreadsheet or a generic dashboard, CropGuard AI puts you in the field — literally. The UI breathes, reacts, and feels alive. At the same time, the engine underneath runs a serious **multi-factor probabilistic scoring model** with interaction multipliers, scenario simulation, and plain-language explanations.

**Who it's for:**
- 🧑‍🌾 Farmers wanting to understand their insurance risk and coverage options
- 🏦 Insurance agents explaining premiums to clients
- 📊 Analysts stress-testing farm portfolios against adverse events
- 💻 Developers exploring agricultural risk modeling

---

## ✨ Features

### 🧠 Risk Scoring Engine
A weighted probabilistic algorithm combines 5 factors — soil health, climate stress, irrigation reliability, pest pressure, and market volatility — with **non-linear interaction multipliers** that capture how factors compound in the real world.

### 🌦️ Scenario Simulator
Test any farm profile against 6 adverse events — or build a custom scenario with 4 independent sliders. Watch the risk score, financial impact, and field atmosphere all react in real time.

### 🛡️ Insurance Recommendation Engine
Coverage plans dynamically adapt to the computed risk profile — from basic yield protection to full revenue insurance. A **deductible optimizer** shows the premium vs. out-of-pocket tradeoff instantly.

### 💡 Explainability Engine
Every risk score comes with a plain-language breakdown: which factor is driving it, how much each contributes, what the crop and region modifiers are doing, and what you can improve.

### 📊 Interactive Dashboard
Four Chart.js visualizations — a risk radar, scenario comparison bar, Monte Carlo distribution (1,200 simulations), and a premium vs. coverage scatter — all theme-aware and live-updating.

### 🌾 Living Field Atmosphere
The UI is the experience:
- **Animated grass** sways with staggered CSS keyframes — wind intensity tied to risk score
- **Leaf & crop particles** (rice grains, wheat stalks, petals) drift across the screen and curve away from the cursor
- **Dynamic sky system** shifts from calm blue → amber drought → stormy grey → frost lavender depending on the active scenario
- **Root-growth animation** under the Soil Health slider using SVG `stroke-dashoffset`
- **Ambient creatures** — butterfly on a bezier path every 45s, fireflies only after 8 PM, ladybug crawling on card hover

### 🌙 Light & Dark Theme
Instant toggle with smooth transitions. Preference persisted via `localStorage`. Charts rebuild with theme-correct colors.

---

## 🎬 See It In Action

| Interaction | What happens |
|---|---|
| Drag the Soil Health slider down | Roots wither under the slider in real-time |
| Switch to Drought scenario | Sky turns amber, wind picks up, cards heat-shimmer |
| Push risk score above 78 | Plan recommendation escalates to Revenue Protection |
| Hover over any card | A ladybug crawls along the bottom edge |
| Open the app after 8 PM | Fireflies appear near the footer |
| Move your mouse fast | Leaf particles curve away from your cursor |

---

## 🚀 Quick Start

**No install. No build. No backend. Just open.**

```bash
# Option 1 — Open directly
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux

# Option 2 — Local dev server
npx serve .
python -m http.server 8000

# Option 3 — GitHub Pages (already set up at the link above)
```

---

## 📁 Project Structure

```
CropGuard-AI/
│
├── 📄 index.html               # Single-page app — all 4 views + field layer
│
├── 🎨 css/
│   ├── theme.css               # Light & dark CSS custom properties
│   ├── components.css          # Cards, sliders, badges, tables, rings
│   ├── layout.css              # Grid systems, page layout, responsive
│   └── field.css               # 🌾 Grass, sky, particles, creature styles
│
├── ⚙️  js/
│   ├── engine.js               # Pure risk scoring logic — no DOM, portable
│   ├── charts.js               # Chart.js renderers, theme-aware rebuilds
│   ├── app.js                  # DOM controller, navigation, UI updates
│   └── field.js                # 🌾 Wind engine, particle system, creatures
│
└── 📖 README.md
```

---

## 🧠 How the Risk Engine Works

### Formula

```
RiskScore = Σ(weight_i × rawRisk_i) × interactionMultiplier × cropMod × regionMod
```

Bounded between **5 and 99**. Soil and irrigation are **inverted** — high quality means low risk.

### Factor Weights

| Factor | Weight | Direction |
|---|---|---|
| 🌡 Climate Stress | 30% | Higher = more risk |
| 🌱 Soil Health Index | 28% | Higher = **less** risk |
| 💧 Irrigation Reliability | 20% | Higher = **less** risk |
| 🐛 Historical Pest Pressure | 14% | Higher = more risk |
| 📈 Market Price Volatility | 8% | Higher = more risk |

### Interaction Multipliers

The engine detects three compounding relationships that dramatically amplify risk:

```
🌱 Soil × 🌡 Climate  →  ×1.18   poor soil under drought loses water retention entirely
💧 Irrig × 🌡 Climate →  ×1.12   rainfed farming collapses when both heat and rain fail
🐛 Pest  × 🌡 Climate →  ×1.08   heat-stressed crops have weakened natural pest defenses
```

### Crop Modifiers

```
vegetables ×1.30   cotton ×1.20   rice ×1.10   sugarcane ×0.90   maize ×0.95
wheat ×0.85   pulses ×0.80
```

### Region Modifiers

```
arid ×1.25   tropical ×1.05   coastal ×1.00   temperate ×0.85
```

### Risk Tiers

```
Score    0 ──────────────────────────────────────── 100
Tier       Low      │   Moderate   │  High  │ V.High
Range    (0–34)       (35–59)       (60–77)   (78+)
Color    🟢 green    🟡 amber       🔴 red    🔴 dark
```

---

## 🌦️ Scenario Simulator

### Presets

| Scenario | Parameters | Atmosphere |
|---|---|---|
| ☀️ Severe Drought | Rainfall −60%, Temp +4°C | Amber sky, heat shimmer, peak wind |
| 🌊 Excessive Rainfall | Precipitation +80% | Storm grey sky, rain streaks |
| 🦗 Pest Outbreak | Intensity ×3.5 | Yellow-green sky, swarm particles |
| ❄️ Cold Wave / Frost | Temp −8°C sudden | Lavender sky, snowflake SVGs |
| 📉 Market Crash | Commodity price −40% | Dim UI, market bar drops |
| ⚡ Compound Event | Drought + pest combined | Near-black sky, all effects fire |

### Custom Builder
4 independent sliders — **rainfall reduction**, **temperature anomaly**, **pest multiplier**, **irrigation failure** — recalculate risk and update the field atmosphere in real time.

---

## 🌾 The Atmosphere System

### Wind Engine
```javascript
// Wind strength is driven by the live risk score
const windStrength = currentRiskScore / 100;  // 0.0 → 1.0

grassBlade.style.animationDuration = `${3 - windStrength * 1.5}s`;
particle.driftSpeed = BASE_SPEED * (1 + windStrength * 2);
cardShadow.blur     = `${4 + windStrength * 12}px`;
```

### Particle System
- **Particle types:** rice grains, wheat stalks, broad leaves, flower petals, dust motes
- **Physics:** randomized size (8–24px), rotation speed, drift angle, opacity (0.3–0.8)
- **Mouse interaction:** particles curve away from cursor using vector math
- **Performance:** max 40 concurrent particles, off-screen culling, `requestAnimationFrame`

### Micro-creatures
```
🦋 Butterfly  →  cubic bezier offset-path, fires every 45s, pauses during interaction
🔥 Fireflies  →  spawn only when  new Date().getHours() >= 20  (after 8 PM)
🐞 Ladybug    →  CSS translate on mouseover per card, retreats on mouseleave
```

---

## 🏗️ Architecture

```
User Input (sliders / selects)
        │
        ▼
engine.js ── pure JS, no DOM, no side effects
        │    computeRiskScore(state)
        │    getContributions(state)
        │    applyScenarioToState(base, scenario)
        │    getRiskTier(score)
        │
        ├──► app.js ── DOM controller
        │              recalc()        updateFactor()
        │              updateRecs()    updateExplain()
        │              applyScenario() toggleTheme()
        │
        ├──► charts.js ── Chart.js 4.4.1
        │                 rebuildCharts()   isDark()
        │                 chartColors()     updatePremChart()
        │
        └──► field.js ── atmosphere engine
                         WindEngine         ParticleSystem
                         SkyController      CreatureSystem
                         RootGrowthAnimator FieldModeToggle
```

### Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 — semantic single-page app |
| Styling | CSS3 — custom properties for theming, keyframes for animation |
| Logic | Vanilla JavaScript ES6+ — modular, zero framework |
| Charts | Chart.js 4.4.1 via CDN |
| Typography | DM Sans + DM Serif Display (Google Fonts) |
| Persistence | localStorage — theme preference |
| Build tools | None — open and run |

> `engine.js` has zero DOM dependencies — it can be dropped directly into a Node.js backend or Python bridge with no changes.

---

## 🗺️ Roadmap

- [ ] 🗺️ **Geo-spatial risk map** — district-level NDVI satellite data overlays
- [ ] 🤖 **AI crop advisor** — natural language queries ("what if I switch to wheat?")
- [ ] 📡 **Live weather API** — OpenWeatherMap auto-fills the climate factor
- [ ] 📱 **PWA / offline mode** — installable on mobile, works fully without internet
- [ ] 🧾 **PDF report export** — downloadable farm risk brief with full breakdown
- [ ] 🌐 **Multilingual support** — Hindi, Telugu, Tamil for Indian farmer reach
- [ ] 📊 **Historical backtesting** — validate model against real claims data
- [ ] 🔗 **REST API** — expose `engine.js` as a Node.js microservice

---

## 🤝 Contributing

Contributions are welcome — new crop types, additional regions, more scenario presets, language translations, or field atmosphere effects.

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Commit with a descriptive message
git commit -m "✨ add geo risk heatmap overlay"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

---

## 📄 License

Distributed under the **MIT License** — free to use, modify, and deploy.
See [`LICENSE`](LICENSE) for full terms.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0d2006,1a3a0a,2d5c12,4a8a1e,97C459&height=120&section=footer&reversal=true"/>

**Built with 🌾 for farmers, by developers who care about food security.**

*The best agricultural tools should feel like the land they serve.*

<br/>

[![Star](https://img.shields.io/badge/⭐_Star_this_repo-3B6D11?style=for-the-badge)](https://github.com/Priyatham27/CropGuard-AI)
[![Fork](https://img.shields.io/badge/🍴_Fork_%26_Build-97C459?style=for-the-badge)](https://github.com/Priyatham27/CropGuard-AI/fork)
[![Issues](https://img.shields.io/badge/🐛_Issues-EF9F27?style=for-the-badge)](https://github.com/Priyatham27/CropGuard-AI/issues)

</div>
