// ── Storage ────────────────────────────────────────────────────

const LS_BIENS = 'nestimate_biens';
let _biens = [];

function saveBiens() {
  try { localStorage.setItem(LS_BIENS, JSON.stringify(_biens)); } catch(e) {}
}

function loadBiens() {
  try {
    const raw = localStorage.getItem(LS_BIENS);
    if (raw) _biens = JSON.parse(raw);
  } catch(e) { _biens = []; }
}

// ── CRUD ───────────────────────────────────────────────────────

function deleteBien(id) {
  if (!confirm('Supprimer ce bien ?')) return;
  _biens = _biens.filter(b => b.id !== id);
  saveBiens();
  renderBienList();
  if (typeof refreshHome === 'function') refreshHome();
}

// ── Formulaire ─────────────────────────────────────────────────

let _editingBienId = null;

function openBienForm(id) {
  _editingBienId = id || null;
  const b = id ? _biens.find(x => x.id === id) : null;

  G('bienFormTitle').textContent = b ? 'Modifier le bien' : 'Nouveau bien';
  G('bfName').value         = b?.name          || '';
  G('bfType').value         = b?.type          || 'principale';
  G('bfPrice').value        = b?.price         || '';
  G('bfCurrentValue').value = b?.currentValue  || '';
  G('bfPurchaseDate').value = b?.purchaseDate  || '';
  G('bfError').textContent  = '';

  _renderBienCreditSelector(b?.creditId || null);
  G('bienFormPopup').classList.add('open');
}

function closeBienForm() {
  G('bienFormPopup').classList.remove('open');
  _editingBienId = null;
}

function _renderBienCreditSelector(selectedCreditId) {
  const sel = G('bfCreditId');
  if (!sel) return;

  const immoCreds = (typeof _credits !== 'undefined')
    ? _credits.filter(c => c.type === 'immo')
    : [];

  let html = '<option value="">— Aucun prêt associé —</option>';
  html += immoCreds.map(c => {
    const m = computeCredit(c);
    const label = `${escHtml(c.name)} · ${euro(m.crd)} restant`;
    return `<option value="${c.id}" ${c.id === selectedCreditId ? 'selected' : ''}>${label}</option>`;
  }).join('');

  sel.innerHTML = html;
}

function saveBienForm() {
  const name  = G('bfName').value.trim();
  const price = parseFloat(G('bfPrice').value);

  if (!name)             { G('bfError').textContent = 'Le nom est requis.';    return; }
  if (!price || price<=0){ G('bfError').textContent = 'Le prix est requis.';   return; }

  const bien = {
    id:           _editingBienId || ('bien_' + Date.now()),
    name,
    type:         G('bfType').value,
    price,
    currentValue: parseFloat(G('bfCurrentValue').value) || null,
    purchaseDate: G('bfPurchaseDate').value || null,
    creditId:     G('bfCreditId').value     || null,
  };

  if (_editingBienId) {
    const idx = _biens.findIndex(b => b.id === _editingBienId);
    if (idx >= 0) _biens[idx] = bien;
  } else {
    _biens.push(bien);
  }

  saveBiens();
  closeBienForm();
  renderBienList();
  if (typeof refreshHome === 'function') refreshHome();
}

// ── Rendu ──────────────────────────────────────────────────────

function renderBienList() {
  const container = G('bienList');
  if (!container) return;

  if (_biens.length === 0) {
    container.innerHTML = '<div class="pli-empty">Aucun bien enregistré.<br>Ajoutez votre premier bien ci-dessous.</div>';
    _updateBienSummary();
    return;
  }

  container.innerHTML = _biens.map(b => {
    const isLocatif = b.type === 'locatif';
    const typeLabel = isLocatif ? 'Investissement locatif' : 'Résidence principale';
    const typeColor = isLocatif ? '#7a5c9a' : 'var(--primary)';

    // Plus-value latente
    const plusValue = b.currentValue && b.price
      ? b.currentValue - b.price
      : null;

    // Prêt associé
    const credit = b.creditId && typeof _credits !== 'undefined'
      ? _credits.find(c => c.id === b.creditId)
      : null;
    const creditMissing = b.creditId && !credit;

    let creditHtml = '';
    if (credit) {
      const m = computeCredit(credit);
      const pctBar = Math.round(m.pct * 100);
      creditHtml = `
        <div class="bien-credit-block">
          <div class="bien-credit-header">
            <span class="bien-credit-name">&#128200; ${escHtml(credit.name)}</span>
          </div>
          <div class="credit-progress-wrap" style="margin:6px 0 3px;">
            <div class="credit-progress-bar" style="width:${pctBar}%"></div>
          </div>
          <div class="credit-progress-label">${pctBar}% remboursé</div>
          <div class="bien-credit-metrics">
            <div class="bien-credit-metric">
              <div class="cm-label">Mensualité</div>
              <div class="cm-value">${euro(m.totM)}<span style="font-weight:400;font-size:.7rem;color:var(--muted);">/mois</span></div>
            </div>
            <div class="bien-credit-metric">
              <div class="cm-label">Capital restant</div>
              <div class="cm-value">${euro(m.crd)}</div>
            </div>
            <div class="bien-credit-metric">
              <div class="cm-label">Coût total crédit</div>
              <div class="cm-value cm-warn">${euro(m.totalCost)}</div>
            </div>
          </div>
        </div>`;
    } else if (creditMissing) {
      creditHtml = `
        <div class="bien-no-credit warn">
          <span>&#9888; Prêt introuvable (supprimé ?)</span>
          <button class="btn secondary" style="padding:5px 12px;font-size:.78rem;" onclick="openCreditForm(null)">Recréer un prêt</button>
        </div>`;
    } else {
      creditHtml = `
        <div class="bien-no-credit">
          <span style="color:var(--muted);">Aucun prêt associé</span>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn secondary" style="padding:5px 12px;font-size:.78rem;" onclick="openBienForm('${b.id}')">Associer un prêt existant</button>
            <button class="btn primary" style="padding:5px 12px;font-size:.78rem;" onclick="_createCreditForBien('${b.id}')">+ Créer un prêt</button>
          </div>
        </div>`;
    }

    return `<div class="bien-card">
      <div class="credit-card-head">
        <div>
          <div class="credit-name">${escHtml(b.name)}</div>
          <span class="credit-type-badge" style="color:${typeColor};border-color:${typeColor}55;background:${typeColor}12;">${typeLabel}</span>
        </div>
        <div class="credit-actions">
          <button class="pli-btn" onclick="openBienForm('${b.id}')" title="Modifier">✏</button>
          <button class="pli-btn pli-delete" onclick="deleteBien('${b.id}')" title="Supprimer">✕</button>
        </div>
      </div>

      <div class="bien-prices">
        <div class="bien-price-item">
          <div class="cm-label">Prix d'achat</div>
          <div class="cm-value">${euro(b.price)}</div>
        </div>
        ${b.currentValue ? `
        <div class="bien-price-item">
          <div class="cm-label">Valeur actuelle estimée</div>
          <div class="cm-value">${euro(b.currentValue)}</div>
        </div>` : ''}
        ${plusValue !== null ? `
        <div class="bien-price-item">
          <div class="cm-label">Plus-value latente</div>
          <div class="cm-value" style="color:${plusValue >= 0 ? 'var(--success)' : '#c0392b'};">
            ${plusValue >= 0 ? '+' : ''}${euro(plusValue)}
          </div>
        </div>` : ''}
        ${b.purchaseDate ? `
        <div class="bien-price-item">
          <div class="cm-label">Date d'achat</div>
          <div class="cm-value" style="font-size:.85rem;">${b.purchaseDate}</div>
        </div>` : ''}
      </div>

      ${creditHtml}
    </div>`;
  }).join('');

  _updateBienSummary();
}

// Créer un prêt pré-lié à ce bien
function _createCreditForBien(bienId) {
  // Ouvre le formulaire crédit, et après sauvegarde, lie le crédit à ce bien
  window._pendingBienLink = bienId;
  openCreditForm(null);
}

// Hook appelé après saveCreditForm (à brancher dans credits.js)
function _afterSaveCreditForBien(creditId) {
  if (!window._pendingBienLink) return;
  const bien = _biens.find(b => b.id === window._pendingBienLink);
  if (bien) {
    bien.creditId = creditId;
    saveBiens();
    renderBienList();
  }
  window._pendingBienLink = null;
}

function _updateBienSummary() {
  const elN    = G('bienSumN');
  const elVal  = G('bienSumVal');
  const elDebt = G('bienSumDebt');

  const totalPrice = _biens.reduce((s, b) => s + (b.price || 0), 0);
  const totalDebt  = _biens.reduce((s, b) => {
    if (!b.creditId || typeof _credits === 'undefined') return s;
    const c = _credits.find(x => x.id === b.creditId);
    return c ? s + computeCredit(c).crd : s;
  }, 0);

  if (elN)    elN.textContent    = _biens.length + ' bien' + (_biens.length > 1 ? 's' : '');
  if (elVal)  elVal.textContent  = euro(totalPrice);
  if (elDebt) elDebt.textContent = totalDebt > 0 ? euro(totalDebt) : '—';
}

// ── Init ───────────────────────────────────────────────────────

function initBiens() {
  loadBiens();
  renderBienList();
}

initBiens();
