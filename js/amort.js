let amortView2 = 'month'; // 'month' | 'year'

// Graphe à barres empilées capital/intérêts pour une année donnée
function drawAmortBarChart(svgId, data) {
  const svg = G(svgId);
  if (!svg || !data) return;

  const W = 600, H = 120, pad = 4, n = data.years;
  const years = [];
  for (let y = 1; y <= n; y++) {
    const slice = data.rows.filter(r => Math.ceil(r.m / 12) === y);
    years.push({
      y,
      interest: slice.reduce((s, r) => s + r.interest, 0),
      capital: slice.reduce((s, r) => s + r.capital, 0)
    });
  }
  const maxVal = Math.max(...years.map(y => y.interest + y.capital));
  const bw = (W - pad * 2) / n;
  let s = '';
  years.forEach((y, i) => {
    const x = pad + i * bw, bwi = bw - 2;
    const hI = Math.round((y.interest / maxVal) * (H - pad * 2));
    const hC = Math.round((y.capital / maxVal) * (H - pad * 2));
    const yI = H - pad - hI, yC = H - pad - hI - hC;
    s += `<rect x="${x}" y="${yI}" width="${bwi}" height="${hI}" fill="var(--warn)" opacity=".75" rx="1"/>`;
    s += `<rect x="${x}" y="${yC}" width="${bwi}" height="${hC}" fill="var(--success)" opacity=".8" rx="1"/>`;
    if (n <= 20 || y.y % 5 === 0 || y.y === 1 || y.y === n) {
      s += `<text x="${x + bwi / 2}" y="${H - 1}" font-size="9" fill="var(--muted)" text-anchor="middle">${y.y}</text>`;
    }
  });
  svg.innerHTML = s;
}

// Rendu générique d'un tableau d'amortissement vers des IDs donnés
function renderAmortTableTo(data, view, ids) {
  const fmtE = n => euro(n);
  const fmtE2 = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);

  if (!data) {
    G(ids.body).innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted)">Complétez les étapes précédentes.</td></tr>';
    return;
  }

  drawAmortBarChart(ids.chart, data);

  if (view === 'month') {
    G(ids.head).innerHTML = '<tr><th>Mois</th><th>Mensualité</th><th>Intérêts</th><th>Capital</th><th>Restant dû</th></tr>';
    G(ids.body).innerHTML = data.rows.map(r => `
      <tr>
        <td>${r.m}</td>
        <td>${fmtE2(r.pmt)}</td>
        <td class="td-interest">${fmtE2(r.interest)}</td>
        <td class="td-principal">${fmtE2(r.capital)}</td>
        <td>${fmtE(r.bal)}</td>
      </tr>`).join('');
    G(ids.foot).innerHTML = `
      <tr>
        <td>TOTAL</td>
        <td>${fmtE(data.lm * data.n)}</td>
        <td class="td-interest">${fmtE(data.totI)}</td>
        <td class="td-principal">${fmtE(data.totC)}</td>
        <td>0 €</td>
      </tr>`;
  } else {
    G(ids.head).innerHTML = '<tr><th>Année</th><th>Total payé</th><th>Intérêts</th><th>Capital</th><th>Restant dû</th></tr>';
    let rows = '', totP = 0, totI = 0, totC = 0;
    for (let y = 1; y <= data.years; y++) {
      const sl = data.rows.filter(r => Math.ceil(r.m / 12) === y);
      const p = sl.reduce((s, r) => s + r.pmt, 0);
      const interest = sl.reduce((s, r) => s + r.interest, 0);
      const capital = sl.reduce((s, r) => s + r.capital, 0);
      const bal = sl[sl.length - 1]?.bal || 0;
      totP += p; totI += interest; totC += capital;
      rows += `<tr>
        <td>An ${y}</td>
        <td>${fmtE(p)}</td>
        <td class="td-interest">${fmtE(interest)}</td>
        <td class="td-principal">${fmtE(capital)}</td>
        <td>${fmtE(bal)}</td>
      </tr>`;
    }
    G(ids.body).innerHTML = rows;
    G(ids.foot).innerHTML = `
      <tr>
        <td>TOTAL</td>
        <td>${fmtE(totP)}</td>
        <td class="td-interest">${fmtE(totI)}</td>
        <td class="td-principal">${fmtE(totC)}</td>
        <td>0 €</td>
      </tr>`;
  }
}

// IDs des éléments du tableau amortissement (page Budget max)
const AMORT2_IDS = {
  chart: 'amortChart2',
  head: 'amortHead2',
  body: 'amortBody2',
  foot: 'amortFoot2'
};

function toggleAmort2() {
  const btn = G('amortToggleBtn2');
  const sec = G('amortSection2');
  const isOpen = sec.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  G('amortToggleLabel2').textContent = isOpen
    ? '📋 Masquer le tableau détaillé'
    : '📋 Afficher le tableau détaillé (mois par mois)';
  if (isOpen) renderAmortTableTo(calcAmortDataProject(), amortView2, AMORT2_IDS);
}

function setAmortView2(v) {
  amortView2 = v;
  G('amortChipM2').classList.toggle('active', v === 'month');
  G('amortChipY2').classList.toggle('active', v === 'year');
  renderAmortTableTo(calcAmortDataProject(), amortView2, AMORT2_IDS);
}

function refreshAmortStats2() {
  const data = calcAmortDataProject();
  const el = G('amortCapital2');
  if (!el) return;
  if (data) {
    el.textContent = euro(data.P);
    G('amortInterest2').textContent = euro(data.totI);
    G('amortTotal2').textContent = euro(data.P + data.totI);
    if (G('amortSection2')?.classList.contains('open')) {
      renderAmortTableTo(data, amortView2, AMORT2_IDS);
    }
  } else {
    el.textContent = '—';
    G('amortInterest2').textContent = '—';
    G('amortTotal2').textContent = '—';
  }
}

// Graphe ligne avantage patrimonial RvB (achat vs location année par année)
function drawRvbChart(base) {
  const svg = G('rvbChart');
  if (!svg || !base) return;

  const maxY = 25, W = 600, H = 180, pL = 58, pR = 18, pT = 20, pB = 30;
  const pts = [];
  let be = -1;
  for (let y = 1; y <= maxY; y++) {
    const d = rvbAtYear(y, base);
    pts.push({ y, d });
    if (be < 0 && d > 0) be = y;
  }

  const vals = pts.map(p => p.d);
  const minV = Math.min(...vals, 0);
  const maxV = Math.max(...vals, 0);
  const range = maxV - minV || 1;
  const cx = y => pL + (y - 1) / (maxY - 1) * (W - pL - pR);
  const cy = v => pT + (1 - (v - minV) / range) * (H - pT - pB);
  const z = cy(0);

  let s = `<line x1="${pL}" y1="${z}" x2="${W - pR}" y2="${z}" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="4,3"/>`;
  const pStr = pts.map(p => `${cx(p.y)},${cy(p.d)}`).join(' ');
  s += `<polygon points="${cx(1)},${z} ${pStr} ${cx(maxY)},${z}" fill="var(--primary-soft)" opacity="0.6"/>`;
  s += `<polyline points="${pStr}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

  if (be > 0 && be <= maxY) {
    const bx = cx(be);
    s += `<line x1="${bx}" y1="${pT}" x2="${bx}" y2="${H - pB}" stroke="var(--success)" stroke-width="1.5" stroke-dasharray="4,3"/>`;
    s += `<circle cx="${bx}" cy="${z}" r="5" fill="var(--success)"/>`;
    const anchor = bx > 380 ? 'end' : 'start';
    const lx = bx > 380 ? bx - 7 : bx + 7;
    s += `<text x="${lx}" y="${z - 9}" font-size="11" fill="var(--success)" font-weight="700" text-anchor="${anchor}">Équilibre : ${be} ans</text>`;
  }

  const fmt = v => {
    const a = Math.abs(v);
    return (v < 0 ? '-' : '+') + (a >= 1e6 ? (a / 1e6).toFixed(1) + 'M' : a >= 1000 ? (a / 1000).toFixed(0) + 'k' : a.toFixed(0)) + '€';
  };
  s += `<text x="${pL - 6}" y="${pT + 10}" font-size="10" fill="var(--muted)" text-anchor="end">${fmt(maxV)}</text>`;
  s += `<text x="${pL - 6}" y="${z + 4}" font-size="10" fill="var(--muted)" text-anchor="end">0</text>`;
  s += `<text x="${pL - 6}" y="${H - pB - 2}" font-size="10" fill="var(--muted)" text-anchor="end">${fmt(minV)}</text>`;
  [1, 5, 10, 15, 20, 25].forEach(y => {
    s += `<text x="${cx(y)}" y="${H - 4}" font-size="10" fill="var(--muted)" text-anchor="middle">${y}a</text>`;
  });

  svg.innerHTML = s;
}
