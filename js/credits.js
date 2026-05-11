// ── Storage ────────────────────────────────────────────────────

const LS_CREDITS = 'nestimate_credits';
let _credits = [];

function saveCredits() {
  try { localStorage.setItem(LS_CREDITS, JSON.stringify(_credits)); } catch(e) {}
}

function loadCredits() {
  try {
    const raw = localStorage.getItem(LS_CREDITS);
    if (raw) _credits = JSON.parse(raw).map(_migrateLegacyCredit);
  } catch(e) { _credits = []; }
}

// Migration format legacy (amount/rate/duration à la racine → lignes[])
function _migrateLegacyCredit(c) {
  if (!c.lignes && c.amount !== undefined) {
    c.lignes = [{
      id: 'l_legacy',
      name: 'Prêt principal',
      amount:   parseFloat(c.amount)   || 0,
      rate:     parseFloat(c.rate)     || 0,
      duration: parseInt(c.duration)   || 240,
    }];
    delete c.amount; delete c.rate; delete c.duration;
  }
  if (!c.lignes) c.lignes = [];
  return c;
}

// ── Calcul d'une ligne ─────────────────────────────────────────

function _computeLigne(ligne, globalK) {
  const P = parseFloat(ligne.amount) || 0;
  const r = (parseFloat(ligne.rate) || 0) / 100 / 12;
  const n = parseInt(ligne.duration) || 0;

  // Si la ligne a sa propre date de départ, on calcule k depuis elle
  let k = globalK;
  if (ligne.startDate) {
    const [sy, sm] = ligne.startDate.split('-').map(Number);
    const now = new Date();
    k = Math.max(0, (now.getFullYear() - sy) * 12 + (now.getMonth() + 1 - sm));
  }
  const lk = Math.min(k, n);

  const lm = r > 0
    ? P * r / (1 - Math.pow(1 + r, -n))
    : (n > 0 ? P / n : 0);

  let crd = r > 0
    ? P * Math.pow(1+r, lk) - lm * (Math.pow(1+r, lk) - 1) / r
    : Math.max(P - lm * lk, 0);
  crd = Math.max(crd, 0);

  const paidCapital  = P - crd;
  const paidInterest = Math.max(lk * lm - paidCapital, 0);
  const totalCostLigne = Math.max(n * lm - P, 0); // intérêts totaux ligne
  const active = lk < n; // la ligne est encore en cours

  return { lm, crd, paidCapital, paidInterest, paidTotal: lk * lm, totalCostLigne, active, n, lk };
}

// ── Calcul consolidé d'un crédit ──────────────────────────────

function computeCredit(c) {
  const insM   = parseFloat(c.insuranceMonthly) || 0;
  const lignes = c.lignes || [];

  // Mensualités écoulées depuis la date de départ
  let k = 0;
  if (c.startDate) {
    const [sy, sm] = c.startDate.split('-').map(Number);
    const now = new Date();
    k = Math.max(0, (now.getFullYear() - sy) * 12 + (now.getMonth() + 1 - sm));
  }

  let totalLm = 0, totalCrd = 0, totalPaidCapital = 0;
  let totalPaidInterest = 0, totalPaidLignes = 0, totalCost = 0;
  let maxDuration = 0;

  for (const ligne of lignes) {
    const l = _computeLigne(ligne, k);
    if (l.active) totalLm += l.lm;   // on ne compte que les lignes encore actives
    totalCrd          += l.crd;
    totalPaidCapital  += l.paidCapital;
    totalPaidInterest += l.paidInterest;
    totalPaidLignes   += l.paidTotal;
    totalCost         += l.totalCostLigne;
    maxDuration        = Math.max(maxDuration, l.n);
  }

  // Assurance (sur toute la durée max)
  totalCost += maxDuration * insM;

  const totM       = totalLm + insM;
  const paidTotal  = totalPaidLignes + k * insM;
  const totalAmount= lignes.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const pct        = maxDuration > 0 ? Math.min(k / maxDuration, 1) : 0;

  return {
    lm: totalLm, totM, crd: totalCrd,
    paidCapital: totalPaidCapital, paidInterest: totalPaidInterest,
    paidTotal, totalCost, totalAmount,
    pct, k, n: maxDuration,
  };
}

// ── CRUD ───────────────────────────────────────────────────────

function deleteCredit(id) {
  if (!confirm('Supprimer ce crédit ?')) return;
  _credits = _credits.filter(c => c.id !== id);
  saveCredits();
  renderCreditList();
  if (typeof refreshHome === 'function') refreshHome();
}

// ── Formulaire crédit — lignes dynamiques ──────────────────────

let _editingCreditId = null;
let _creditLignes    = [];

function _newLigneId() { return 'l_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); }

function addLigne() {
  _creditLignes.push({ id: _newLigneId(), name: '', amount: '', rate: '', duration: '' });
  _renderLignes();
}

function removeLigne(id) {
  if (_creditLignes.length <= 1) return;
  _creditLignes = _creditLignes.filter(l => l.id !== id);
  _renderLignes();
}

function updateLigneField(id, field, value) {
  const l = _creditLignes.find(l => l.id === id);
  if (l) l[field] = value;
}

function _renderLignes() {
  const container = G('cfLignes');
  if (!container) return;

  const isImmo = G('cfType').value === 'immo';
  const LABELS = {
    principale: ['Prêt principal', 'PTZ', 'Prêt employeur', 'PAS'],
    locatif:    ['Prêt principal', 'Prêt relais', 'Prêt in fine'],
    conso:      ['Prêt consommation'],
  };
  const subtype  = isImmo ? (G('cfSubtype').value || 'principale') : 'conso';
  const defaults = LABELS[subtype] || [];

  container.innerHTML = _creditLignes.map((l, i) => {
    const placeholder = defaults[i] || ('Ligne ' + (i + 1));
    const canRemove   = _creditLignes.length > 1;
    return `<div class="ligne-card">
      <div class="ligne-head">
        <span class="ligne-num">Ligne ${i + 1}</span>
        ${canRemove ? `<button class="comp-remove-btn" onclick="removeLigne('${l.id}')" title="Supprimer">&#10005;</button>` : ''}
      </div>
      <div class="field" style="margin-bottom:8px;">
        <label style="font-size:.82rem;">Nom</label>
        <input type="text" value="${escHtml(l.name || '')}" placeholder="${placeholder}"
          oninput="updateLigneField('${l.id}','name',this.value)" style="min-height:38px;">
      </div>
      <div class="comp-fields" style="grid-template-columns:repeat(4,1fr);">
        <div class="field">
          <label style="font-size:.82rem;">Montant (&#8364;)</label>
          <input type="number" value="${l.amount || ''}" min="0" step="1000" inputmode="decimal" placeholder="180 000"
            oninput="updateLigneField('${l.id}','amount',this.value)">
        </div>
        <div class="field">
          <label style="font-size:.82rem;">Taux (%)</label>
          <input type="number" value="${l.rate || ''}" min="0" step="0.01" inputmode="decimal" placeholder="3.15"
            oninput="updateLigneField('${l.id}','rate',this.value)">
        </div>
        <div class="field">
          <label style="font-size:.82rem;">Dur&#233;e (mois)</label>
          <input type="number" value="${l.duration || ''}" min="1" step="1" inputmode="decimal" placeholder="240"
            oninput="updateLigneField('${l.id}','duration',this.value)">
        </div>
        <div class="field">
          <label style="font-size:.82rem;">1er paiement</label>
          <input type="month" value="${l.startDate || ''}"
            onchange="updateLigneField('${l.id}','startDate',this.value)">
        </div>
      </div>
    </div>`;
  }).join('');

  // Bouton "Ajouter une ligne" — uniquement pour immo
  const addBtn = G('cfAddLigneBtn');
  if (addBtn) addBtn.style.display = isImmo ? '' : 'none';
}

function openCreditForm(id) {
  _editingCreditId = id || null;
  const c = id ? _credits.find(x => x.id === id) : null;

  G('creditFormTitle').textContent = c ? 'Modifier le crédit' : 'Nouveau crédit';
  G('cfName').value              = c?.name             || '';
  G('cfType').value              = c?.type             || 'immo';
  G('cfSubtype').value           = c?.subtype          || 'principale';
  G('cfStartDate').value         = c?.startDate        || '';
  G('cfInsurance').value         = c?.insuranceMonthly || 0;
  G('cfLoyer').value             = c?.loyerPercu       || 0;
  G('cfError').textContent       = '';

  _creditLignes = c?.lignes?.length
    ? c.lignes.map(l => ({ ...l }))
    : [{ id: _newLigneId(), name: '', amount: '', rate: '', duration: '' }];

  updateCreditFormSubtype();
  _renderLignes();
  G('creditFormPopup').classList.add('open');
}

function closeCreditForm() {
  G('creditFormPopup').classList.remove('open');
  _editingCreditId = null;
}

function updateCreditFormSubtype() {
  const isImmo   = G('cfType').value === 'immo';
  const isLocatif = isImmo && G('cfSubtype').value === 'locatif';
  const row      = G('cfSubtypeRow');
  const loyerRow = G('cfLoyerRow');
  if (row)      row.style.display      = isImmo    ? '' : 'none';
  if (loyerRow) loyerRow.style.display = isLocatif ? '' : 'none';
  _renderLignes();
}

function saveCreditForm() {
  const name = G('cfName').value.trim();
  if (!name) { G('cfError').textContent = 'Le nom est requis.'; return; }

  // Valider chaque ligne
  for (let i = 0; i < _creditLignes.length; i++) {
    const l = _creditLignes[i];
    const a = parseFloat(l.amount), d = parseInt(l.duration);
    if (!a || a <= 0) { G('cfError').textContent = `Ligne ${i+1} : montant requis.`; return; }
    if (!d || d <= 0) { G('cfError').textContent = `Ligne ${i+1} : durée requise.`; return; }
    // Taux 0 autorisé (PTZ)
  }

  const credit = {
    id:               _editingCreditId || ('cred_' + Date.now()),
    name,
    type:             G('cfType').value,
    subtype:          G('cfType').value === 'immo' ? G('cfSubtype').value : null,
    startDate:        G('cfStartDate').value,
    insuranceMonthly: parseFloat(G('cfInsurance').value) || 0,
    loyerPercu:       parseFloat(G('cfLoyer').value)     || 0,
    lignes: _creditLignes.map((l, i) => ({
      id:       l.id,
      name:     l.name || ('Ligne ' + (i + 1)),
      amount:   parseFloat(l.amount)   || 0,
      rate:     parseFloat(l.rate)     || 0,
      duration: parseInt(l.duration)   || 0,
    })),
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

    // Détail par ligne (affiché si > 1 ligne)
    const lignesDetail = c.lignes.length > 1
      ? `<div class="credit-lignes-detail">
          ${c.lignes.map(l => {
            const ll = _computeLigne(l, m.k);
            return `<div class="credit-ligne-row">
              <span class="clr-name">${escHtml(l.name || 'Ligne')}</span>
              <span class="clr-info">${euro(l.amount)} · ${parseFloat(l.rate).toFixed(2)}% · ${l.duration} mois</span>
              <span class="clr-crd">${ll.active ? 'restant ' + euro(ll.crd) : '✓ soldé'}</span>
            </div>`;
          }).join('')}
        </div>`
      : '';

    return `<div class="credit-card">
      <div class="credit-card-head">
        <div>
          <div class="credit-name">${escHtml(c.name)}</div>
          <span class="credit-type-badge" style="color:${typeColor};border-color:${typeColor}55;background:${typeColor}12;">${typeLabel}</span>
          ${c.lignes.length > 1 ? `<span class="credit-type-badge" style="color:var(--muted);border-color:var(--border);background:var(--surface-2);margin-left:4px;">${c.lignes.length} lignes</span>` : ''}
        </div>
        <div class="credit-actions">
          <button class="pli-btn" onclick="openCreditForm('${c.id}')" title="Modifier">✏</button>
          <button class="pli-btn pli-delete" onclick="deleteCredit('${c.id}')" title="Supprimer">✕</button>
        </div>
      </div>
      ${lignesDetail}
      ${c.subtype === 'locatif' && c.loyerPercu > 0 ? `
      <div class="credit-loyer-row">
        <span>Loyer perçu</span>
        <span style="color:var(--success);font-weight:700;">${euro(c.loyerPercu)}/mois</span>
        <span style="color:var(--muted);font-size:.75rem;">Effort mensuel net : ${euro(Math.max(m.totM - c.loyerPercu, 0))}/mois</span>
      </div>` : ''}
      <div class="credit-progress-wrap">
        <div class="credit-progress-bar" style="width:${pctBar}%"></div>
      </div>
      <div class="credit-progress-label">${pctBar}% remboursé · mensualité ${m.k} / ${m.n}</div>
      <div class="credit-metrics">
        <div class="credit-metric">
          <div class="cm-label">Mensualité totale</div>
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
  const COLS = {
    date:      ['date', 'période', 'periode'],
    crd:       ['capital restant', 'restant dû', 'restant du', 'solde', 'crd', 'capital dû', 'encours'],
    interest:  ['intérêts', 'interets', 'intérêt', 'interet', 'int.'],
    capital:   ['capital amorti', 'amortissement', 'part capital', 'remb. cap'],
    payment:   ['échéance', 'echeance', 'mensualité', 'mensualite', 'total échéance'],
    insurance: ['assurance', 'adi', 'prime'],
  };

  let headerIdx = -1, colX = {};
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const text = rows[i].map(t => t.str.toLowerCase()).join(' ');
    if (COLS.crd.some(k => text.includes(k)) && COLS.interest.some(k => text.includes(k))) {
      headerIdx = i;
      for (const [col, patterns] of Object.entries(COLS)) {
        for (const token of rows[i]) {
          if (patterns.some(p => token.str.toLowerCase().includes(p)) && !colX[col])
            colX[col] = token.x;
        }
      }
      break;
    }
  }
  if (headerIdx === -1 || !colX.crd) return null;

  const dataRows = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    if (rows[i].length < 3) continue;
    const cell = col => colX[col] === undefined ? null :
      rows[i].reduce((b, t) => Math.abs(t.x - colX[col]) < Math.abs((b?.x ?? 9999) - colX[col]) ? t : b, null)?.str ?? null;
    const rowObj = {};
    for (const col of Object.keys(COLS)) rowObj[col] = cell(col);
    if (Object.values(rowObj).some(v => v && /\d/.test(v))) dataRows.push(rowObj);
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
    if ((m = str.match(/(\d{1,2})\/(\d{4})/)))          return new Date(+m[2], +m[1]-1, 1);
    if ((m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)))return new Date(+m[3], +m[2]-1, 1);
    if ((m = str.match(/(\d{4})-(\d{2})/)))             return new Date(+m[1], +m[2]-1, 1);
    return null;
  };

  const first     = dataRows[0];
  const firstCrd  = pn(first.crd);
  const firstCap  = pn(first.capital);
  const amount    = firstCrd !== null && firstCap !== null ? firstCrd + firstCap : firstCrd;
  const payment   = pn(first.payment);
  const insurance = pn(first.insurance);

  const today = new Date();
  let currentIdx = dataRows.length - 1, hasDates = false;
  for (let i = 0; i < dataRows.length; i++) {
    const d = parseDate(dataRows[i].date);
    if (d) { hasDates = true; if (d <= today) currentIdx = i; }
  }

  const current    = dataRows[currentIdx];
  const crd        = pn(current.crd);
  const paidRows   = dataRows.slice(0, currentIdx + 1);
  const paidInt    = paidRows.reduce((s, r) => s + (pn(r.interest) || 0), 0);
  const paidTotal  = (currentIdx + 1) * ((payment || 0) + (insurance || 0));
  const totInt     = dataRows.reduce((s, r) => s + (pn(r.interest) || 0), 0);

  return {
    amount, payment, insurance, crd, paidTotal, paidInt,
    totalCost: totInt + (insurance || 0) * dataRows.length,
    duration: dataRows.length,
    currentRow: currentIdx + 1,
    totalRows: dataRows.length,
    hasDates,
  };
}

function _showPdfResult(data) {
  G('prAmount').textContent    = data.amount    ? euro(data.amount)    : '—';
  G('prPayment').textContent   = data.payment   ? euro(data.payment)  + '/mois' : '—';
  G('prInsurance').textContent = data.insurance ? euro(data.insurance)+ '/mois' : '—';
  G('prCrd').textContent       = data.crd       ? euro(data.crd)       : '—';
  G('prPaid').textContent      = data.paidTotal ? euro(data.paidTotal) : '—';
  G('prTotalCost').textContent = data.totalCost ? euro(data.totalCost) : '—';
  G('prDuration').textContent  = data.duration + ' mensualités';
  G('prCurrentRow').textContent= data.hasDates
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

  // Pré-remplir la première ligne avec les données parsées
  if (_creditLignes.length > 0) {
    const l = _creditLignes[0];
    l.name = 'Prêt principal';
    if (data.amount)   l.amount   = Math.round(data.amount);
    if (data.duration) l.duration = data.duration;

    // Retrouver le taux par bisection
    if (data.payment && data.amount && data.duration) {
      const P = data.amount, m = data.payment, n = data.duration;
      let lo = 0.00001, hi = 3;
      for (let i = 0; i < 120; i++) {
        const mid = (lo + hi) / 2;
        const r   = mid / 100 / 12;
        const calc = r > 0 ? P * r / (1 - Math.pow(1+r, -n)) : P / n;
        calc > m ? hi = mid : lo = mid;
      }
      l.rate = ((lo + hi) / 2).toFixed(2);
    }
    if (data.insurance) G('cfInsurance').value = data.insurance.toFixed(2);
    _renderLignes();
  }
}

// ── Init ───────────────────────────────────────────────────────

function initCredits() {
  loadCredits();
  renderCreditList();
}

initCredits();
