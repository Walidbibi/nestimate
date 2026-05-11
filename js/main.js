const MONTAGE_FIELDS = [
  'apport', 'rate', 'insuranceRate', 'insuranceRate2', 'quotite1', 'quotite2', 'duration', 'debtRatio',
  'notaryRate', 'guaranteeRate', 'bankFees', 'brokerPct'
];

// ── Profils multiples ─────────────────────────────────────────

const LS_PROFILES = 'nestimate_profiles';
let _profiles = { current: '', list: {} };

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function applyProfile(data) {
  PFIELDS.forEach(id => {
    const el = G(id);
    if (!el) return;
    if (data && data[id] !== undefined) el.value = data[id];
    else if (DEFAULT_VALUES[id] !== undefined) el.value = DEFAULT_VALUES[id];
    else el.value = '';
  });
  if (data && data.hasCo) setCo(true); else setCo(false);
  const brokerEl = G('useBroker');
  if (brokerEl) {
    brokerEl.checked = !!(data && (data.useBroker === true || data.useBroker === 'true'));
    updateBroker();
  }
  if (data && data._montages) {
    const m = data._montages;
    if (m.current && m.list && m.list[m.current]) applyMontage(m.list[m.current]);
  }
  return !!(data && Object.keys(data).length > 0);
}

function _captureCurrentData() {
  const data = { hasCo, useBroker: G('useBroker').checked };
  PFIELDS.forEach(id => { const el = G(id); if (el) data[id] = el.value; });
  return data;
}

function _saveProfiles() {
  try { localStorage.setItem(LS_PROFILES, JSON.stringify(_profiles)); } catch (e) {}
}

// ── localStorage ──────────────────────────────────────────────

function save() {
  if (!_profiles.current || !_profiles.list[_profiles.current]) { _saveProfiles(); return; }
  const oldProfile = _profiles.list[_profiles.current];
  const data = _captureCurrentData();
  // Préserver _montages et synchroniser le montage courant
  const montages = oldProfile && oldProfile._montages;
  if (montages) {
    if (montages.current) {
      const mData = { useBroker: data.useBroker };
      MONTAGE_FIELDS.forEach(id => { if (data[id] !== undefined) mData[id] = data[id]; });
      montages.list[montages.current] = mData;
    }
    data._montages = montages;
  }
  _profiles.list[_profiles.current] = data;
  _saveProfiles();
  const ind = G('saveInd');
  if (ind) { ind.style.opacity = '1'; clearTimeout(ind._t); ind._t = setTimeout(() => ind.style.opacity = '0', 1500); }
}

function load() {
  try {
    const raw = localStorage.getItem(LS_PROFILES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.list === 'object') {
        _profiles = parsed;
        return _profiles.current ? applyProfile(_profiles.list[_profiles.current]) : false;
      }
    }
    // Migrer l'ancien format nestimate_v2
    const oldRaw = localStorage.getItem(LS);
    if (oldRaw) {
      const data = JSON.parse(oldRaw);
      _profiles = { current: 'Mon profil', list: { 'Mon profil': data } };
      _saveProfiles();
      return applyProfile(data);
    }
    _profiles = { current: '', list: {} };
    return false;
  } catch (e) {
    _profiles = { current: '', list: {} };
    return false;
  }
}

// ── Gestion des profils ───────────────────────────────────────

function switchProfile(name) {
  if (!_profiles.list[name] || name === _profiles.current) { closeProfileDropdown(); return; }
  if (_profiles.current) _profiles.list[_profiles.current] = _captureCurrentData();
  _profiles.current = name;
  applyProfile(_profiles.list[name]);
  _saveProfiles();
  renderProfileUI();
  closeProfileDropdown();
  refresh();
}

// ── Modale saisie nom de profil ───────────────────────────────

let _profModalCb = null;

function openProfModal(title, defaultVal, cb) {
  _profModalCb = cb;
  G('profModalTitle').textContent = title;
  G('profModalInput').value = defaultVal;
  G('profModalError').textContent = '';
  G('profModal').style.display = 'flex';
  setTimeout(() => { G('profModalInput').select(); G('profModalInput').focus(); }, 60);
}

function closeProfModal() {
  G('profModal').style.display = 'none';
  _profModalCb = null;
}

function confirmProfModal() {
  const val = G('profModalInput').value.trim();
  if (!val) { G('profModalError').textContent = 'Le nom ne peut pas être vide.'; return; }
  if (_profModalCb) {
    const err = _profModalCb(val);
    if (err) { G('profModalError').textContent = err; return; }
  }
  closeProfModal();
}

function _createProfile(name, clone) {
  if (_profiles.current) _profiles.list[_profiles.current] = _captureCurrentData();
  _profiles.list[name] = clone && _profiles.current ? { ..._profiles.list[_profiles.current] } : {};
  _profiles.current = name;
  if (!clone) {
    PFIELDS.forEach(id => { const el = G(id); if (el) el.value = ''; });
    setCo(false);
    const brokerEl = G('useBroker');
    if (brokerEl) { brokerEl.checked = false; updateBroker(); }
  }
  _saveProfiles();
  renderProfileUI();
  closeProfileDropdown();
  if (!clone) refresh();
}

function deleteProfile(name) {
  const wasActive = name === _profiles.current;
  delete _profiles.list[name];
  if (Object.keys(_profiles.list).length === 0) {
    _profiles.current = '';
    PFIELDS.forEach(id => { const el = G(id); if (el) el.value = ''; });
    setCo(false);
    const br = G('useBroker'); if (br) { br.checked = false; updateBroker(); }
    refresh();
  } else if (wasActive) {
    _profiles.current = Object.keys(_profiles.list)[0];
    applyProfile(_profiles.list[_profiles.current]);
    refresh();
  }
  _saveProfiles();
  renderProfileUI();
  renderProfileList();
}

function renameProfile(oldName) {
  closeProfileDropdown();
  openProfModal('Renommer le profil', oldName, name => {
    if (name === oldName) return;
    if (_profiles.list[name]) return 'Un profil avec ce nom existe déjà.';
    _profiles.list[name] = _profiles.list[oldName];
    delete _profiles.list[oldName];
    if (_profiles.current === oldName) _profiles.current = name;
    _saveProfiles();
    renderProfileUI();
    renderProfileList();
  });
}

function promptNewProfile(clone) {
  const defaultName = clone
    ? _profiles.current + ' (copie)'
    : 'Profil ' + (Object.keys(_profiles.list).length + 1);
  closeProfileDropdown();
  openProfModal(
    clone ? 'Dupliquer ce profil' : 'Nouveau profil',
    defaultName,
    name => {
      if (_profiles.list[name]) return 'Un profil avec ce nom existe déjà.';
      _createProfile(name, clone);
    }
  );
}

function renderProfileDropdown() {
  const dd = G('profileDropdown');
  if (!dd) return;
  const names = Object.keys(_profiles.list);
  let html = '<div class="prof-list">';
  names.forEach((n, i) => {
    const active = n === _profiles.current;
    html += `<div class="prof-item${active ? ' prof-active' : ''}">`;
    html += `<button class="prof-name" data-action="switch" data-idx="${i}">${escHtml(n)}</button>`;
    if (active) html += `<button class="prof-ren" data-action="rename" data-idx="${i}" title="Renommer">✏</button>`;
    if (names.length > 1) html += `<button class="prof-del" data-action="delete" data-idx="${i}" title="Supprimer">✕</button>`;
    html += '</div>';
  });
  html += '</div><div class="prof-actions">';
  html += `<button class="prof-btn" data-action="new">+ Nouveau</button>`;
  html += `<button class="prof-btn prof-btn-outline" data-action="clone">Dupliquer</button>`;
  html += '</div>';
  dd.innerHTML = html;
  dd.onclick = function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.stopPropagation();
    const action = btn.dataset.action;
    const name = Object.keys(_profiles.list)[parseInt(btn.dataset.idx)];
    if (action === 'switch') switchProfile(name);
    else if (action === 'rename') renameProfile(name);
    else if (action === 'delete') deleteProfile(name);
    else if (action === 'new') promptNewProfile(false);
    else if (action === 'clone') promptNewProfile(true);
  };
}

// ── Gestion des montages financiers ──────────────────────────

function _captureMontageData() {
  const data = { useBroker: G('useBroker')?.checked };
  MONTAGE_FIELDS.forEach(id => { const el = G(id); if (el) data[id] = el.value; });
  return data;
}

function applyMontage(data) {
  if (!data) return;
  MONTAGE_FIELDS.forEach(id => {
    const el = G(id);
    if (!el) return;
    if (data[id] !== undefined) el.value = data[id];
    // Ne pas vider les champs absents — les valeurs du profil sont préservées
  });
  if (data.useBroker !== undefined) {
    const brokerEl = G('useBroker');
    if (brokerEl) { brokerEl.checked = !!(data.useBroker === true || data.useBroker === 'true'); updateBroker(); }
  }
}

function _getMontages() {
  const profile = _profiles.list[_profiles.current];
  if (!profile) return { current: '', list: {} };
  if (!profile._montages) profile._montages = { current: '', list: {} };
  return profile._montages;
}

function switchMontage(name) {
  const montages = _getMontages();
  if (!montages.list[name] || name === montages.current) { goTo(2); return; }
  if (montages.current) montages.list[montages.current] = _captureMontageData();
  montages.current = name;
  applyMontage(montages.list[name]);
  _profiles.list[_profiles.current]._montages = montages;
  _saveProfiles();
  renderMontageList();
  goTo(2);
}

function _createMontage(name, clone) {
  const montages = _getMontages();
  if (montages.current) montages.list[montages.current] = _captureMontageData();
  montages.list[name] = clone && montages.current ? { ...montages.list[montages.current] } : { debtRatio: '35' };
  montages.current = name;
  if (!clone) { const el = G('debtRatio'); if (el) el.value = '35'; }
  _profiles.list[_profiles.current]._montages = montages;
  _saveProfiles();
  renderMontageList();
}

function deleteMontage(name) {
  const montages = _getMontages();
  const wasActive = name === montages.current;
  delete montages.list[name];
  if (Object.keys(montages.list).length === 0) {
    montages.current = '';
    const elDr = G('debtRatio'); if (elDr) elDr.value = '35';
    const br = G('useBroker'); if (br) { br.checked = false; updateBroker(); }
    refresh();
  } else if (wasActive) {
    montages.current = Object.keys(montages.list)[0];
    applyMontage(montages.list[montages.current]);
    refresh();
  }
  _profiles.list[_profiles.current]._montages = montages;
  _saveProfiles();
  renderMontageList();
}

function renameMontage(oldName) {
  openProfModal('Renommer ce montage', oldName, name => {
    const montages = _getMontages();
    if (name === oldName) return;
    if (montages.list[name]) return 'Un montage avec ce nom existe déjà.';
    montages.list[name] = montages.list[oldName];
    delete montages.list[oldName];
    if (montages.current === oldName) montages.current = name;
    _profiles.list[_profiles.current]._montages = montages;
    _saveProfiles();
    renderMontageList();
  });
}

function promptNewMontageAndEdit(clone) {
  const montages = _getMontages();
  const defaultName = clone
    ? montages.current + ' (copie)'
    : 'Montage ' + (Object.keys(montages.list).length + 1);
  openProfModal(
    clone ? 'Dupliquer ce montage' : 'Nouveau montage financier',
    defaultName,
    name => {
      const montages = _getMontages();
      if (montages.list[name]) return 'Un montage avec ce nom existe déjà.';
      _createMontage(name, clone);
      goTo(2);
    }
  );
}

let _expandedMontage = null;

function _montageSummaryHtml(data) {
  if (!data || Object.keys(data).length === 0) return '<span class="pli-sum-empty">Aucune donnée saisie</span>';
  const rows = [
    parseFloat(data.apport) >= 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Apport</span><span>${euro(parseFloat(data.apport)||0)}</span></div>` : null,
    parseFloat(data.rate) > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Taux nominal</span><span>${parseFloat(data.rate).toFixed(2)}%</span></div>` : null,
    parseFloat(data.duration) > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Durée</span><span>${data.duration} ans</span></div>` : null,
    parseFloat(data.insuranceRate) > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Assurance empr. 1</span><span>${parseFloat(data.insuranceRate).toFixed(2)}%</span></div>` : null,
    parseFloat(data.insuranceRate2) > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Assurance co-empr.</span><span>${parseFloat(data.insuranceRate2).toFixed(2)}%</span></div>` : null,
    parseFloat(data.debtRatio) > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Taux endettement cible</span><span>${data.debtRatio}%</span></div>` : null,
    parseFloat(data.notaryRate) > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Frais de notaire</span><span>${data.notaryRate}%</span></div>` : null,
  ].filter(Boolean);

  return rows.length ? rows.join('') : '<span class="pli-sum-empty">Aucune donnée saisie</span>';
}

function renderMontageList() {
  const container = G('montageList');
  if (!container) return;
  const montages = _getMontages();

  // Auto-créer un montage depuis le profil si la liste est vide mais que le profil a des données de financement
  if (Object.keys(montages.list).length === 0 && _profiles.current) {
    const profile = _profiles.list[_profiles.current];
    if (profile && parseFloat(profile.rate) > 0) {
      const mData = {};
      MONTAGE_FIELDS.forEach(id => { if (profile[id] !== undefined) mData[id] = profile[id]; });
      if (profile.useBroker !== undefined) mData.useBroker = profile.useBroker;
      montages.list['Montage 1'] = mData;
      montages.current = 'Montage 1';
      profile._montages = montages;
      _saveProfiles();
    }
  }

  const names = Object.keys(montages.list);
  if (names.length === 0) {
    container.innerHTML = '<div class="pli-empty">Aucun montage enregistré.<br>Créez votre premier montage ci-dessous.</div>';
    return;
  }
  container.innerHTML = names.map((n, i) => {
    const active = n === montages.current;
    const expanded = n === _expandedMontage;
    const data = montages.list[n];
    return `<div class="pli${active ? ' pli-active' : ''}">
      <div class="pli-header">
        <button class="pli-name" data-midx="${i}" data-maction="expand">
          <span class="pli-chevron">${expanded ? '▾' : '▸'}</span>
          ${escHtml(n)}${active ? ' <span class="pli-badge">actif</span>' : ''}
        </button>
        <div class="pli-actions">
          <button class="pli-btn" data-maction="edit" data-midx="${i}" title="Modifier">✏</button>
          <button class="pli-btn pli-delete" data-maction="delete" data-midx="${i}" title="Supprimer">✕</button>
        </div>
      </div>
      ${expanded ? `<div class="pli-summary">${_montageSummaryHtml(data)}<button class="pli-rename-btn" data-maction="rename" data-midx="${i}">✏ Renommer ce montage</button></div>` : ''}
    </div>`;
  }).join('');

  container.onclick = function(e) {
    const btn = e.target.closest('[data-maction]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.midx);
    const name = Object.keys(_getMontages().list)[idx];
    if (btn.dataset.maction === 'expand') {
      _expandedMontage = _expandedMontage === name ? null : name;
      renderMontageList();
    } else if (btn.dataset.maction === 'edit') {
      switchMontage(name);
    } else if (btn.dataset.maction === 'rename') {
      renameMontage(name);
    } else if (btn.dataset.maction === 'delete') {
      deleteMontage(name);
    }
  };
}

let _expandedProfile = null;

function _profileSummaryHtml(data) {
  if (!data || Object.keys(data).length === 0) return '<span class="pli-sum-empty">Aucune donnée saisie</span>';
  const f = (v, suffix) => parseFloat(v) > 0 ? `<span>${euro(parseFloat(v))}${suffix}</span>` : null;
  const rows = [
    data.salary1 > 0 || data.salary2 > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Salaire(s)</span><span>${euro(parseFloat(data.salary1)||0)}${parseFloat(data.salary2)>0 ? ' + ' + euro(parseFloat(data.salary2)) : ''}/mois</span></div>` : null,
    parseFloat(data.rentIncome) > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Revenus locatifs</span><span>${euro(parseFloat(data.rentIncome))}/mois</span></div>` : null,
    parseFloat(data.currentCredits) > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Crédits en cours</span><span>${euro(parseFloat(data.currentCredits))}/mois</span></div>` : null,
    parseFloat(data.rentPaid) > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Loyer actuel</span><span>${euro(parseFloat(data.rentPaid))}/mois</span></div>` : null,
    parseFloat(data.otherExpenses) > 0 ? `<div class="pli-sum-row"><span class="pli-sum-label">Autres charges</span><span>${euro(parseFloat(data.otherExpenses))}/mois</span></div>` : null,
    (parseFloat(data.nbAdults) > 0 || parseFloat(data.nbChildren) > 0) ? `<div class="pli-sum-row"><span class="pli-sum-label">Foyer</span><span>${data.nbAdults||1} adulte(s), ${data.nbChildren||0} enfant(s)</span></div>` : null,
  ].filter(Boolean);
  return rows.length ? rows.join('') : '<span class="pli-sum-empty">Aucune donnée saisie</span>';
}

function renderProfileList() {
  const container = G('profileList');
  if (!container) return;
  const names = Object.keys(_profiles.list);
  if (names.length === 0) {
    container.innerHTML = '<div class="pli-empty">Aucun profil enregistré.<br>Créez votre premier profil ci-dessous.</div>';
    return;
  }
  container.innerHTML = names.map((n, i) => {
    const active = n === _profiles.current;
    const expanded = n === _expandedProfile;
    const data = _profiles.list[n];
    return `<div class="pli${active ? ' pli-active' : ''}">
      <div class="pli-header">
        <button class="pli-name" data-idx="${i}" data-action="expand">
          <span class="pli-chevron">${expanded ? '▾' : '▸'}</span>
          ${escHtml(n)}${active ? ' <span class="pli-badge">actif</span>' : ''}
        </button>
        <div class="pli-actions">
          <button class="pli-btn" data-action="edit" data-idx="${i}" title="Modifier">✏</button>
          <button class="pli-btn pli-delete" data-action="delete" data-idx="${i}" title="Supprimer">✕</button>
        </div>
      </div>
      ${expanded ? `<div class="pli-summary">${_profileSummaryHtml(data)}</div>` : ''}
    </div>`;
  }).join('');

  container.onclick = function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx);
    const name = Object.keys(_profiles.list)[idx];
    if (btn.dataset.action === 'expand') {
      _expandedProfile = _expandedProfile === name ? null : name;
      renderProfileList();
    } else if (btn.dataset.action === 'edit') {
      switchProfile(name);
      goTo(0);
    } else if (btn.dataset.action === 'delete') {
      deleteProfile(name);
    }
  };
}

function promptNewProfileAndEdit(clone) {
  const defaultName = clone
    ? _profiles.current + ' (copie)'
    : 'Profil ' + (Object.keys(_profiles.list).length + 1);
  openProfModal(
    clone ? 'Dupliquer ce profil' : 'Nouveau profil',
    defaultName,
    name => {
      if (_profiles.list[name]) return 'Un profil avec ce nom existe déjà.';
      _createProfile(name, clone);
      goTo(0);
    }
  );
}

function renderProfileUI() {
  const nameEl = G('profileBtnName');
  if (nameEl) { nameEl.textContent = _profiles.current || '—'; G('profileBtn').title = _profiles.current || 'Aucun profil'; }
  renderProfileDropdown();
}

function toggleProfileDropdown() {
  const dd = G('profileDropdown');
  if (!dd) return;
  if (dd.classList.contains('open')) { closeProfileDropdown(); return; }
  renderProfileDropdown();
  dd.classList.add('open');
}

function closeProfileDropdown() {
  const dd = G('profileDropdown');
  if (dd) dd.classList.remove('open');
}

// ── Taux marché BCE ───────────────────────────────────────────

const FALLBACK_RATES = {
  date: '2026-03',
  source: 'BCE / Observatoire Crédit Logement',
  y15: 3.19, y20: 3.26, y25: 3.39,
  live: false
};

function applyRates(r) {
  G('rate15').textContent = r.y15.toFixed(2) + '%';
  G('rate20').textContent = r.y20.toFixed(2) + '%';
  G('rate25').textContent = r.y25.toFixed(2) + '%';
  const tag = G('rateTag');
  if (r.live) {
    tag.textContent = '● Temps réel';
    tag.className = 'rh-tag live';
    G('rateSource').textContent = 'Source : BCE / Banque de France — dernière publication disponible.';
  } else {
    tag.textContent = r.date;
    tag.className = 'rh-tag static';
    G('rateSource').textContent = 'Source : ' + r.source + '. Hors assurance. À titre indicatif.';
  }
}

async function fetchRates() {
  applyRates(FALLBACK_RATES);
  try {
    const url = 'https://data-api.ecb.europa.eu/service/data/MIR/M.FR.B.A2C.A.R.A.2250.EUR.N?format=json&lastNObservations=1';
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    const obs = json.series.observations;
    if (!obs || !obs.length) throw new Error('No data');
    const lastObs = obs[obs.length - 1];
    const lastVal = parseFloat(lastObs.value);
    if (!isFinite(lastVal)) throw new Error('Invalid value');
    const y20 = +(lastVal + 0.16).toFixed(2);
    const y15 = +(lastVal + 0.09).toFixed(2);
    const y25 = +(lastVal + 0.29).toFixed(2);
    const period = lastObs.period || '';
    applyRates({ date: period, source: 'BCE / Banque de France', y15, y20, y25, live: true });
  } catch (e) {
    // fallback déjà appliqué
  }
}

// ── Thème clair / sombre ──────────────────────────────────────

let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', theme);
G('themeBtn').addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
});

// ── Event listeners ───────────────────────────────────────────

G('soloBtn').addEventListener('click', () => setCo(false));
G('coBtn').addEventListener('click', () => setCo(true));
G('useBroker').addEventListener('change', () => { updateBroker(); refresh(); });

PFIELDS.forEach(id => {
  const el = G(id);
  if (el) {
    el.addEventListener('input', refresh);
    el.addEventListener('change', refresh);
  }
});

// Les inputs de comparaison déclenchent refreshComparison directement
['compPrice0','compWorks0','compDur0','compName0',
 'compPrice1','compWorks1','compDur1','compName1',
 'compPrice2','compWorks2','compDur2','compName2'].forEach(id => {
  const el = G(id);
  if (el) {
    el.addEventListener('input', refreshComparison);
    el.addEventListener('change', refreshComparison);
  }
});

// Fermer les popups sur Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePopup(); closeTip(); closeProfileDropdown(); closeProfModal(); }
});

// Valider la modale profil avec Entrée
G('profModalInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmProfModal();
});

// Fermer le dropdown profil en cliquant ailleurs
document.addEventListener('click', e => {
  if (!e.target.closest('#profileWrap')) closeProfileDropdown();
});

// Ombre sur la nav sticky au scroll
(function () {
  const nav = document.querySelector('.phase-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
})();

// ── Init ──────────────────────────────────────────────────────

const _hasData = load();
if (!_hasData) setCo(false);
currentPage = -1;
renderProfileUI();
refresh();
refreshHome();
fetchRates();
initSimApport();
