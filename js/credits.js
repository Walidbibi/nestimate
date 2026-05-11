// ── Storage ────────────────────────────────────────────────────

const LS_CREDITS = 'nestimate_credits';
let _credits = [];

function saveCredits() {
  try { localStorage.setItem(LS_CREDITS, JSON.stringify(_credits)); } catch(e) {}
}

function loadCredits() {
  try {
    const raw = localStorage.getItem(LS_CREDITS);
    if (raw) _credits = JSON.parse(raw);
  } catch(e) { _credits = []; }
}

// ── Calcul des métriques d'un crédit ──────────────────────────

function computeCredit(c) {
  const P  = parseFloat(c.amount) || 0;
  const r  = (parseFloat(c.rate) || 0) / 100 / 12;
  const n  = parseInt(c.duration) || 0;
  const insM = parseFloat(c.insuranceMonthly) || 0;

  const lm = r > 0 ? P * r / (1 - Math.pow(1 + r, -n)) : (n > 0 ? P / n : 0);
  const totM = lm + insM;

  // Mensualités écoulées depuis la date de départ
  let k = 0;
  if (c.startDate) {
    const [sy, sm] = c.startDate.split('-').map(Number);
    const now = new Date();
    k = (now.getFullYear() - sy) * 12 + (now.getMonth() + 1 - sm);
    k = Math.max(0, Math.min(k, n));
  }

  // Capital restant dû
  let crd = r > 0
    ? P * Math.pow(1+r, k) - lm * (Math.pow(1+r, k) - 1) / r
    : Math.max(P - lm * k, 0);
  crd = Math.max(crd, 0);

  const paidCapital  = P - crd;
  const paidInterest = Math.max(k * lm - paidCapital, 0);
  const paidTotal    = k * totM;
  const totalCost    = n * totM - P;
  const pct          = n > 0 ? k / n : 0;

  return { lm, totM, crd, paidCapital, paidInterest, paidTotal, totalCost, pct, k, n };
}

// ── CRUD ───────────────────────────────────────────────────────

function deleteCredit(id) {
  if (!confirm('Supprimer ce crédit ?')) return;
  _credits = _credits.filter(c => c.id !== id);
  saveCredits();
  renderCreditList();
  if (typeof refreshHome === 'function') refreshHome();
}

// ── Formulaire crédit ──────────────────────────────────────────

let _editingCreditId = null;

function openCreditForm(id) {
  _editingCreditId = id || null;
  const c = id ? _credits.find(x => x.id === id) : null;

  G('creditFormTitle').textContent = c ? 'Modifier le crédit' : 'Nouveau crédit';
  G('cfName').value       = c?.name              || '';
  G('cfType').value       = c?.type              || 'immo';
  G('cfSubtype').value    = c?.subtype           || 'principale';
  G('cfAmount').value     = c?.amount            || '';
  G('cfRate').value       = c?.rate              || '';
  G('cfDuration').value   = c?.duration          || '';
  G('cfStartDate').value  = c?.startDate         || '';
  G('cfInsurance').value  = c?.insuranceMonthly  || 0;
  G('cfError').textContent = '';

  updateCreditFormSubtype();
  G('creditFormPopup').classList.add('open');
}

function closeCreditForm() {
  G('creditFormPopup').classList.remove('open');
  _editingCreditId = null;
}

function updateCreditFormSubtype() {
  const isImmo = G('cfType').value === 'immo';
  const row = G('cfSubtypeRow');
  if (row) row.style.display = isImmo ? '' : 'none';
}

function saveCreditForm() {
  const name     = G('cfName').value.trim();
  const amount   = parseFloat(G('cfAmount').value);
  const rate     = parseFloat(G('cfRate').value);
  const duration = parseInt(G('cfDuration').value);

  if (!name)                  { G('cfError').textContent = 'Le nom est requis.';      return; }
  if (!amount  || amount <= 0){ G('cfError').textContent = 'Le montant est requis.';  return; }
  if (!rate    || rate <= 0)  { G('cfError').textContent = 'Le taux est requis.';     return; }
  if (!duration|| duration<=0){ G('cfError').textContent = 'La durée est requise.';  return; }

  const credit = {
    id:               _editingCreditId || ('cred_' + Date.now()),
    name,
    type:             G('cfType').value,
    subtype:          G('cfType').value === 'immo' ? G('cfSubtype').value : null,
    amount,
    rate,
    duration,
    startDate:        G('cfStartDate').value,
    insuranceMonthly: parseFloat(G('cfInsurance').value) || 0,
  };

  if (_editingCreditId) {
    const idx = _credits.findIndex(c => c.id === _editingCreditId);
    if (idx >= 0) _credits[idx] = credit;
  } else {
    _credits.push(credit);
  }

  saveCredits();
  closeCreditForm();
  renderCreditList();
  if (typeof refreshHome === 'function') refreshHome();
}

// ── Rendu liste ────────────────────────────────────────────────

function renderCreditList() {
  const container = G('creditList');
  if (!container) return;

  if (_credits.length === 0) {
    container.innerHTML = '<div class="pli-empty">Aucun crédit enregistré.<br>Ajoutez votre premier crédit ci-dessous.</div>';
    _updateCreditSummary(0, 0);
    return;
  }

  let totalM = 0, totalCrd = 0;

  container.innerHTML = _credits.map(c => {
    const m = computeCredit(c);
    totalM   += m.totM;
    totalCrd += m.crd;

    const typeLabel = c.type === 'immo'
      ? (c.subtype === 'locatif' ? 'Immo locatif' : 'Immo résidence')
      : 'Consommation';
    const typeColor = c.type === 'immo'
      ? (c.subtype === 'locatif' ? '#7a5c9a' : 'var(--primary)')
      : 'var(--warn)';

    const pctBar = Math.round(m.pct * 100);

    return `<div class="credit-card">
      <div class="credit-card-head">
        <div>
          <div class="credit-name">${escHtml(c.name)}</div>
          <span class="credit-type-badge" style="color:${typeColor};border-color:${typeColor}55;background:${typeColor}12;">${typeLabel}</span>
        </div>
        <div class="credit-actions">
          <button class="pli-btn" onclick="openCreditForm('${c.id}')" title="Modifier">✏</button>
          <button class="pli-btn pli-delete" onclick="deleteCredit('${c.id}')" title="Supprimer">✕</button>
        </div>
      </div>
      <div class="credit-progress-wrap">
        <div class="credit-progress-bar" style="width:${pctBar}%"></div>
      </div>
      <div class="credit-progress-label">${pctBar}% remboursé · mensualité ${m.k} / ${m.n}</div>
      <div class="credit-metrics">
        <div class="credit-metric">
          <div class="cm-label">Mensualité</div>
          <div class="cm-value">${euro(m.totM)}<span style="font-weight:400;font-size:.72rem;color:var(--muted);">/mois</span></div>
        </div>
        <div class="credit-metric">
          <div class="cm-label">Capital restant</div>
          <div class="cm-value">${euro(m.crd)}</div>
        </div>
        <div class="credit-metric">
          <div class="cm-label">Déjà remboursé</div>
          <div class="cm-value">${euro(m.paidTotal)}</div>
        </div>
        <div class="credit-metric">
          <div class="cm-label">Coût total crédit</div>
          <div class="cm-value cm-warn">${euro(m.totalCost)}</div>
        </div>
      </div>
    </div>`;
  }).join('');

  _updateCreditSummary(totalM, totalCrd);
}

function _updateCreditSummary(totalM, totalCrd) {
  const elM   = G('creditSumM');
  const elCrd = G('creditSumCrd');
  const elN   = G('creditSumN');
  if (elM)   elM.textContent   = euro(totalM) + '/mois';
  if (elCrd) elCrd.textContent = euro(totalCrd);
  if (elN)   elN.textContent   = _credits.length + ' crédit' + (_credits.length > 1 ? 's' : '');
}

// ── PDF Parser ─────────────────────────────────────────────────

if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function openPdfParser() {
  G('pdfParserPopup').classList.add('open');
  G('pdfParserResult').style.display = 'none';
  G('pdfParserStatus').textContent = '';
  G('pdfFile').value = '';
}

function closePdfParser() {
  G('pdfParserPopup').classList.remove('open');
}

async function parsePdfFile() {
  const file = G('pdfFile').files[0];
  if (!file) return;
  const status = G('pdfParserStatus');

  try {
    if (typeof pdfjsLib === 'undefined') {
      status.textContent = '⚠ PDF.js non chargé. Vérifiez votre connexion internet.';
      return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    status.textContent = 'Lecture du PDF…';
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    status.textContent = `${pdf.numPages} page(s) détectée(s)… Analyse du tableau…`;

    // Extraire tous les tokens avec leur position
    let items = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page    = await pdf.getPage(p);
      const content = await page.getTextContent();
      const vp      = page.getViewport({ scale: 1 });
      const yOffset = (p - 1) * vp.height * 1.05;
      content.items.forEach(it => {
        if (!it.str.trim()) return;
        items.push({
          str: it.str.trim(),
          x:   Math.round(it.transform[4]),
          y:   Math.round(vp.height - it.transform[5] + yOffset),
        });
      });
    }

    const rows   = _groupByRow(items, 5);
    const parsed = _parseAmortTable(rows);

    if (!parsed) {
      status.textContent = '⚠ Tableau d\'amortissement non détecté. Assurez-vous que le PDF contient bien un tableau d\'amortissement texte (non scanné).';
      return;
    }

    status.textContent = '✓ Tableau détecté avec succès.';
    _showPdfResult(parsed);

  } catch(e) {
    status.textContent = '⚠ Erreur : ' + e.message;
  }
}

function _groupByRow(items, tol) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows = [];
  let curY = null, curRow = null;
  for (const it of sorted) {
    if (curY === null || Math.abs(it.y - curY) > tol) {
      curRow = []; rows.push(curRow); curY = it.y;
    }
    curRow.push(it);
  }
  return rows;
}

function _parseAmortTable(rows) {
  // Synonymes par colonne
  const COLS = {
    date:      ['date', 'période', 'periode'],
    crd:       ['capital restant', 'restant dû', 'restant du', 'solde', 'crd', 'capital dû', 'encours'],
    interest:  ['intérêts', 'interets', 'intérêt', 'interet', 'int.', 'int '],
    capital:   ['capital amorti', 'amortissement', 'part capital', 'remb. cap', 'capital remb'],
    payment:   ['échéance', 'echeance', 'mensualité', 'mensualite', 'total échéance'],
    insurance: ['assurance', 'adi', 'prime d\'ass'],
  };

  // Trouver la ligne d'en-tête
  let headerIdx = -1;
  let colX = {};

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const text = rows[i].map(t => t.str.toLowerCase()).join(' ');
    const hasCrd      = COLS.crd.some(k => text.includes(k));
    const hasInterest = COLS.interest.some(k => text.includes(k));
    if (hasCrd && hasInterest) {
      headerIdx = i;
      // Associer chaque colonne à une position x
      for (const [col, patterns] of Object.entries(COLS)) {
        for (const token of rows[i]) {
          const low = token.str.toLowerCase();
          if (patterns.some(p => low.includes(p)) && !colX[col]) {
            colX[col] = token.x;
          }
        }
      }
      break;
    }
  }
  if (headerIdx === -1 || !colX.crd) return null;

  // Extraire les lignes de données
  const dataRows = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    if (rows[i].length < 3) continue;
    const cell = col => {
      if (colX[col] === undefined) return null;
      return rows[i].reduce((best, t) =>
        Math.abs(t.x - colX[col]) < Math.abs((best?.x ?? 9999) - colX[col]) ? t : best
      , null)?.str ?? null;
    };
    const rowObj = {};
    for (const col of Object.keys(COLS)) rowObj[col] = cell(col);
    const hasNum = Object.values(rowObj).some(v => v && /\d/.test(v));
    if (hasNum) dataRows.push(rowObj);
    // Arrêt si ligne de total
    const txt = rows[i].map(t => t.str.toLowerCase()).join(' ');
    if (dataRows.length > 3 && /^total\b/.test(txt)) break;
  }
  if (dataRows.length === 0) return null;

  const pn = str => {
    if (!str) return null;
    const n = parseFloat(str.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.'));
    return isFinite(n) ? n : null;
  };

  const parseDate = str => {
    if (!str) return null;
    let m;
    if ((m = str.match(/(\d{1,2})\/(\d{4})/)))   return new Date(+m[2], +m[1]-1, 1);
    if ((m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return new Date(+m[3], +m[2]-1, 1);
    if ((m = str.match(/(\d{4})-(\d{2})/)))       return new Date(+m[1], +m[2]-1, 1);
    return null;
  };

  const first = dataRows[0];
  const firstCrd  = pn(first.crd);
  const firstCap  = pn(first.capital);
  const amount    = firstCrd !== null && firstCap !== null ? firstCrd + firstCap : firstCrd;
  const payment   = pn(first.payment);
  const insurance = pn(first.insurance);

  // Trouver la ligne courante par date
  const today = new Date();
  let currentIdx = dataRows.length - 1;
  let hasDates = false;
  for (let i = 0; i < dataRows.length; i++) {
    const d = parseDate(dataRows[i].date);
    if (d) { hasDates = true; if (d <= today) currentIdx = i; }
  }

  const current   = dataRows[currentIdx];
  const crd       = pn(current.crd);
  const paidRows  = dataRows.slice(0, currentIdx + 1);
  const paidInt   = paidRows.reduce((s, r) => s + (pn(r.interest) || 0), 0);
  const paidTotal = (currentIdx + 1) * ((payment || 0) + (insurance || 0));
  const totInt    = dataRows.reduce((s, r) => s + (pn(r.interest) || 0), 0);
  const totIns    = (insurance || 0) * dataRows.length;

  return {
    amount, payment, insurance, crd, paidTotal, paidInt,
    totalCost: totInt + totIns,
    duration: dataRows.length,
    currentRow: currentIdx + 1,
    totalRows: dataRows.length,
    hasDates,
  };
}

function _showPdfResult(data) {
  G('prAmount').textContent   = data.amount   ? euro(data.amount)   : '—';
  G('prPayment').textContent  = data.payment  ? euro(data.payment) + '/mois' : '—';
  G('prInsurance').textContent= data.insurance? euro(data.insurance)+ '/mois' : '—';
  G('prCrd').textContent      = data.crd      ? euro(data.crd)      : '—';
  G('prPaid').textContent     = data.paidTotal? euro(data.paidTotal): '—';
  G('prTotalCost').textContent= data.totalCost? euro(data.totalCost): '—';
  G('prDuration').textContent = data.duration + ' mensualités';
  G('prCurrentRow').textContent = data.hasDates
    ? `Mensualité ${data.currentRow} / ${data.totalRows}`
    : `Dernière mensualité (${data.totalRows})`;
  G('pdfParserResult').style.display = 'block';
  window._parsedCredit = data;
}

function importParsedCredit() {
  const data = window._parsedCredit;
  if (!data) return;
  closePdfParser();
  openCreditForm(null);

  if (data.amount)   G('cfAmount').value   = Math.round(data.amount);
  if (data.duration) G('cfDuration').value = data.duration;
  if (data.insurance)G('cfInsurance').value= data.insurance.toFixed(2);

  // Retrouver le taux par bisection depuis mensualité + capital + durée
  if (data.payment && data.amount && data.duration) {
    const P = data.amount, m = data.payment, n = data.duration;
    let lo = 0.00001, hi = 3;
    for (let i = 0; i < 120; i++) {
      const mid = (lo + hi) / 2;
      const r   = mid / 100 / 12;
      const calc = r > 0 ? P * r / (1 - Math.pow(1+r, -n)) : P / n;
      calc > m ? hi = mid : lo = mid;
    }
    G('cfRate').value = ((lo + hi) / 2).toFixed(2);
  }
}

// ── Init ───────────────────────────────────────────────────────

function initCredits() {
  loadCredits();
  renderCreditList();
}

initCredits();
