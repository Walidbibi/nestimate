// ── Profils multiples ─────────────────────────────────────────

const LS_PROFILES = 'nestimate_profiles';
let _profiles = { current: 'Mon profil', list: {} };

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
  _profiles.list[_profiles.current] = _captureCurrentData();
  _saveProfiles();
  const ind = G('saveInd');
  if (ind) { ind.style.opacity = '1'; clearTimeout(ind._t); ind._t = setTimeout(() => ind.style.opacity = '0', 1500); }
}

function load() {
  try {
    const raw = localStorage.getItem(LS_PROFILES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.current && parsed.list) {
        _profiles = parsed;
        return applyProfile(_profiles.list[_profiles.current]);
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
    _profiles = { current: 'Mon profil', list: { 'Mon profil': {} } };
    return false;
  } catch (e) {
    _profiles = { current: 'Mon profil', list: { 'Mon profil': {} } };
    return false;
  }
}

// ── Gestion des profils ───────────────────────────────────────

function switchProfile(name) {
  if (!_profiles.list[name] || name === _profiles.current) { closeProfileDropdown(); return; }
  _profiles.list[_profiles.current] = _captureCurrentData();
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
  _profiles.list[_profiles.current] = _captureCurrentData();
  _profiles.list[name] = clone ? { ..._profiles.list[_profiles.current] } : {};
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
  if (Object.keys(_profiles.list).length <= 1) return;
  const wasActive = name === _profiles.current;
  delete _profiles.list[name];
  if (wasActive) {
    _profiles.current = Object.keys(_profiles.list)[0];
    applyProfile(_profiles.list[_profiles.current]);
    refresh();
  }
  _saveProfiles();
  renderProfileUI();
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

function renderProfileUI() {
  const nameEl = G('profileBtnName');
  if (nameEl) { nameEl.textContent = _profiles.current; G('profileBtn').title = _profiles.current; }
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
  date: 'mars 2026',
  source: 'Observatoire Crédit Logement / CSA',
  y15: 3.19, y20: 3.26, y25: 3.38,
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
    const url = 'https://data-api.ecb.europa.eu/service/data/MIR/M.FR.B.A2B.AV.R.A.2240.EUR.N?format=jsondata&lastNObservations=1';
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    const obs = json.dataSets[0].series['0:0:0:0:0:0:0:0:0:0:0'].observations;
    const keys = Object.keys(obs);
    const lastVal = parseFloat(obs[keys[keys.length - 1]][0]);
    if (!isFinite(lastVal)) throw new Error('Invalid value');
    const y20 = lastVal;
    const y15 = +(lastVal - 0.07).toFixed(2);
    const y25 = +(lastVal + 0.13).toFixed(2);
    const periods = json.structure.dimensions.observation[0].values;
    const lastPeriod = periods[periods.length - 1].name;
    applyRates({ date: lastPeriod, source: 'BCE / Banque de France', y15, y20, y25, live: true });
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

// Calculateur inversé — indépendant du profil, pas dans PFIELDS (pas sauvegardé)
const invTargetEl = G('invTarget');
if (invTargetEl) {
  invTargetEl.addEventListener('input', refreshInverse);
  invTargetEl.addEventListener('change', refreshInverse);
}

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
renderProfileUI();
refresh();
fetchRates();
initSimApport();
if (_hasData) goTo(4);
