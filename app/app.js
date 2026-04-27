/* ============================================
   GC-CPRI — Interactive Explorer
   Reads PCA-derived data from gc_cpri_scores_for_app.json (v2 schema)
   and recomputes scores faithfully when indicator weights change.
   ============================================ */

const DATA_URL = 'data/gc_cpri_scores_for_app.json';

// State loaded from JSON
let INDICATORS   = [];        // [{id, label, direction, transform, mean, std, median_for_imputation}]
let LOADINGS     = {};        // {id: pc1_loading}
let RAW_MIN      = 0;
let RAW_MAX      = 1;
let COUNTIES     = [];        // [{name, indicators_raw, gc_cpri_score, score (computed)}]
let COVERED_COUNTIES = new Set();

const WEIGHTS = {};            // {indicator_id: weight}, all default to 1.0

// Direction → arrow + class
const DIRECTION_LABELS = {
  higher_is_riskier: { arrow: '↑', text: 'higher = higher risk', cls: 'risk-higher' },
  lower_is_riskier:  { arrow: '↓', text: 'lower = higher risk',  cls: 'risk-lower'  },
};

// ------------------------------------
// LOAD
// ------------------------------------

function toTitleCase(name) {
  return name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

async function loadData() {
  const res = await fetch(DATA_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
  const data = await res.json();

  if (!data || data.version !== 2) {
    throw new Error('Expected v2 schema with indicators + pc1_loadings.');
  }

  INDICATORS = data.indicators;
  LOADINGS   = data.pc1_loadings;
  RAW_MIN    = data.score_normalization.raw_min;
  RAW_MAX    = data.score_normalization.raw_max;
  COUNTIES   = data.counties.map(c => ({
    name: toTitleCase(c.name),
    indicators_raw: c.indicators_raw,
    gc_cpri_score:  c.gc_cpri_score,
  }));
  COVERED_COUNTIES = new Set(COUNTIES.map(c => c.name));
  INDICATORS.forEach(ind => { WEIGHTS[ind.id] = 1.0; });
}

// ------------------------------------
// SCORE MATH (mirrors notebook 02 exactly)
// ------------------------------------

function applyTransform(value, transform) {
  if (transform === 'div100') return value > 1 ? value / 100 : value;
  if (transform === 'negate') return -value;
  return value;
}

function recomputeScore(county) {
  let rawPC1 = 0;
  for (const ind of INDICATORS) {
    let v = county.indicators_raw[ind.id];
    if (v === null || v === undefined) {
      // Imputed value is already in aligned space, so don't re-transform
      v = ind.median_for_imputation;
    } else {
      v = applyTransform(v, ind.transform);
    }
    const z = (v - ind.mean) / ind.std;
    rawPC1 += WEIGHTS[ind.id] * LOADINGS[ind.id] * z;
  }
  const score = 100 * (rawPC1 - RAW_MIN) / (RAW_MAX - RAW_MIN);
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

function getScoredCounties() {
  return COUNTIES.map(c => ({ ...c, score: recomputeScore(c) }));
}

// ------------------------------------
// TIER + COLOR
// ------------------------------------

function getTier(score) {
  if (score === null || score === undefined) return 'pending';
  if (score >= 67) return 'high';
  if (score >= 34) return 'medium';
  return 'low';
}

function getTierLabel(score) {
  if (score === null || score === undefined) return 'Pending';
  const t = getTier(score);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function interpolateColor(score) {
  const low  = [74, 156, 109];
  const mid  = [200, 136, 42];
  const high = [184, 59, 59];
  let r, g, b;
  if (score <= 50) {
    const t = score / 50;
    r = Math.round(low[0] + t * (mid[0] - low[0]));
    g = Math.round(low[1] + t * (mid[1] - low[1]));
    b = Math.round(low[2] + t * (mid[2] - low[2]));
  } else {
    const t = (score - 50) / 50;
    r = Math.round(mid[0] + t * (high[0] - mid[0]));
    g = Math.round(mid[1] + t * (high[1] - mid[1]));
    b = Math.round(mid[2] + t * (high[2] - mid[2]));
  }
  return `rgb(${r},${g},${b})`;
}

// ------------------------------------
// FILTER + SORT STATE
// ------------------------------------

let currentSort = 'score-desc';
let currentFilter = 'all';
let searchQuery = '';

function getFilteredSortedCounties() {
  let data = getScoredCounties();
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    data = data.filter(c => c.name.toLowerCase().includes(q));
  }
  if (currentFilter !== 'all') {
    data = data.filter(c => getTier(c.score) === currentFilter);
  }
  if (currentSort === 'score-desc') data.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  if (currentSort === 'score-asc')  data.sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
  if (currentSort === 'alpha')      data.sort((a, b) => a.name.localeCompare(b.name));
  return data;
}

// ------------------------------------
// RENDER: MAP
// ------------------------------------

function colorMap() {
  const scored = getScoredCounties();
  const scoreMap = {};
  scored.forEach(c => { scoreMap[c.name] = c.score; });

  document.querySelectorAll('.county').forEach(path => {
    const name = path.dataset.county;
    if (COVERED_COUNTIES.has(name)) {
      const s = scoreMap[name];
      if (s !== null && s !== undefined) {
        path.style.fill = interpolateColor(s);
        path.style.opacity = '1';
      } else {
        path.style.fill = '#7a9cbf';
        path.style.opacity = '0.7';
      }
    } else {
      path.style.fill = '#c8c4be';
      path.style.opacity = '0.5';
    }
  });
}

function initMapTooltip() {
  const tooltip = document.getElementById('map-tooltip');
  const mapContainer = document.querySelector('.map-container');

  document.querySelectorAll('.county').forEach(path => {
    path.addEventListener('mouseenter', () => {
      const name = path.dataset.county;
      if (COVERED_COUNTIES.has(name)) {
        const c = COUNTIES.find(x => x.name === name);
        const s = c ? recomputeScore(c) : null;
        const tier = getTierLabel(s);
        tooltip.innerHTML = s !== null
          ? `<span class="tt-county">${name} County</span>
             <span class="tt-score">Score: ${s.toFixed(1)}</span>
             &nbsp;<span class="tt-tier">· ${tier} Risk</span>`
          : `<span class="tt-county">${name} County</span>
             <span class="tt-tier">Score pending</span>`;
      } else {
        tooltip.innerHTML = `
          <span class="tt-county">${name} County</span>
          <span class="tt-tier">No data — outside current coverage</span>
        `;
      }
      tooltip.classList.add('visible');
    });
    path.addEventListener('mousemove', e => {
      const rect = mapContainer.getBoundingClientRect();
      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top - 10;
      if (x + 180 > rect.width) x = e.clientX - rect.left - 190;
      tooltip.style.left = x + 'px';
      tooltip.style.top  = y + 'px';
    });
    path.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });
}

// ------------------------------------
// RENDER: TABLE
// ------------------------------------

function renderTable() {
  const data = getFilteredSortedCounties();
  const tbody = document.getElementById('table-body');
  const countEl = document.getElementById('county-count');

  countEl.textContent = `${data.length} ${data.length === 1 ? 'county' : 'counties'}`;

  tbody.innerHTML = data.map((county, i) => {
    const s = county.score;
    const tier = getTier(s);
    const tierLabel = getTierLabel(s);
    const scoreClass = `score-${tier}`;
    const scoreDisplay = s !== null ? s.toFixed(1) : '—';
    const barWidth = s !== null ? s : 0;
    const barColor = s !== null ? interpolateColor(s) : '#c8c4be';

    return `
      <tr style="animation-delay: ${i * 0.018}s">
        <td class="td-rank">${i + 1}</td>
        <td class="td-county">
          ${county.name}
          <div class="td-county-sub">Alabama</div>
        </td>
        <td class="td-score ${scoreClass}">${scoreDisplay}</td>
        <td><span class="tier-badge ${tier}">${tierLabel}</span></td>
        <td>
          <div class="score-bar-wrap">
            <div class="score-bar-fill" style="width:${barWidth}%; background:${barColor}"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ------------------------------------
// RENDER: SLIDERS (built from INDICATORS)
// ------------------------------------

function buildSliders() {
  const list = document.getElementById('sliders-list');
  list.innerHTML = INDICATORS.map(ind => {
    const dir = DIRECTION_LABELS[ind.direction] || DIRECTION_LABELS.higher_is_riskier;
    return `
      <div class="slider-item">
        <div class="slider-header">
          <div class="slider-label-group">
            <span class="slider-label">${ind.label}</span>
            <span class="slider-direction ${dir.cls}">${dir.arrow} ${dir.text}</span>
          </div>
          <span class="slider-value" id="val-${ind.id}">1.0×</span>
        </div>
        <div class="slider-track-wrap">
          <input type="range" class="slider" id="w-${ind.id}"
                 data-ind="${ind.id}" min="0" max="3" step="0.1" value="1.0" />
        </div>
      </div>
    `;
  }).join('');
}

function updateSliderTrack(slider) {
  const val = parseFloat(slider.value);
  const max = parseFloat(slider.max);
  const pct = (val / max) * 100;
  slider.style.background =
    `linear-gradient(to right, var(--amber) 0%, var(--amber) ${pct}%, var(--border-dark) ${pct}%)`;
}

function initSliders() {
  document.querySelectorAll('.slider').forEach(slider => {
    updateSliderTrack(slider);
    slider.addEventListener('input', () => {
      const id  = slider.dataset.ind;
      const val = parseFloat(slider.value);
      WEIGHTS[id] = val;
      document.getElementById(`val-${id}`).textContent = val.toFixed(1) + '×';
      updateSliderTrack(slider);
      colorMap();
      renderTable();
    });
  });
}

function resetWeights() {
  document.querySelectorAll('.slider').forEach(slider => {
    const id = slider.dataset.ind;
    WEIGHTS[id] = 1.0;
    slider.value = '1.0';
    document.getElementById(`val-${id}`).textContent = '1.0×';
    updateSliderTrack(slider);
  });
  colorMap();
  renderTable();
}

// ------------------------------------
// FILTERS
// ------------------------------------

function initFilters() {
  document.getElementById('county-search').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderTable();
  });
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.tier;
      renderTable();
    });
  });
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      renderTable();
    });
  });
  document.getElementById('reset-weights').addEventListener('click', resetWeights);
}

// ------------------------------------
// HEADER STATS
// ------------------------------------

function updateHeaderStats() {
  const stats = document.querySelectorAll('.stat-card .stat-num');
  if (stats[0]) stats[0].textContent = String(COUNTIES.length);
  if (stats[1]) stats[1].textContent = String(INDICATORS.length);

  const note = document.querySelector('.map-controls .data-note');
  if (note) note.textContent = `● ${COUNTIES.length} counties scored · live PCA data`;

  const caption = document.querySelector('.map-caption');
  if (caption) {
    caption.textContent =
      `Colored counties (${COUNTIES.length}) have PCA-scored data available. Grey counties are outside current dataset coverage.`;
  }
}

// ------------------------------------
// STATUS
// ------------------------------------

function showStatus(msg, isError = false) {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;
  const color = isError ? '#b83b3b' : 'var(--ink-muted, #6b6357)';
  tbody.innerHTML = `
    <tr><td colspan="5" style="padding:32px;text-align:center;color:${color};font-style:italic;">
      ${msg}
    </td></tr>
  `;
}

// ------------------------------------
// INIT
// ------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  initFilters();
  showStatus('Loading PCA scores…');
  try {
    await loadData();
    buildSliders();
    initSliders();
    updateHeaderStats();
    colorMap();
    initMapTooltip();
    renderTable();
  } catch (err) {
    console.error(err);
    showStatus(
      `Could not load score data (${err.message}). If opening locally, run a static server: python3 -m http.server`,
      true
    );
  }
});
