// ── Navigation ────────────────────────────────────────────────

function _hideAll() {
  ['page-home','page-profiles','page-montages','page-mensualite','page-credits','page-biens','modeBudget','modeRvb'].forEach(id => {
    const el = G(id); if (el) el.classList.remove('active');
  });
}

function goTo(step) {
  if (step === 'home') {
    _hideAll(); G('page-home').classList.add('active');
    currentPage = -1; currentMode = 'budget';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshHome(); return;
  }
  if (step === 'profiles') {
    _hideAll(); G('page-profiles').classList.add('active');
    currentPage = -1; currentMode = 'budget';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderProfileList(); return;
  }
  if (step === 'montages') {
    _hideAll(); G('page-montages').classList.add('active');
    currentPage = -1; currentMode = 'budget';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderMontageList(); return;
  }
  if (step === 'biens') {
    _hideAll(); G('page-biens').classList.add('active');
    currentPage = -1; currentMode = 'budget';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof renderBienList === 'function') renderBienList();
    return;
  }
  if (step === 'credits') {
    _hideAll(); G('page-credits').classList.add('active');
    currentPage = -1; currentMode = 'budget';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof renderCreditList === 'function') renderCreditList();
    return;
  }
  if (step === 'mensualite') {
    _hideAll(); G('page-mensualite').classList.add('active');
    currentPage = -1; currentMode = 'budget';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshInverse();
    return;
  }
  if (step === 'rvb') {
    _hideAll(); G('modeRvb').classList.add('active');
    currentMode = 'rvb'; currentPage = -1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshRvb(); return;
  }
  // Validation avant tout changement visuel
  if (step > currentPage && currentPage >= 0) {
    const v = validatePage(currentPage);
    if (!v.ok) return;
  }
  if (step === 4) setTimeout(initSimApport, 50);
  if (step === 5) setTimeout(initComparison, 50);
  clearFieldErrors();
  _hideAll();
  currentMode = 'budget'; currentPage = step;
  G('modeBudget').classList.add('active');
  document.querySelectorAll('#modeBudget .page').forEach((p, i) => p.classList.toggle('active', i === step));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  refresh();
}

function setMode(mode) {
  if (mode === 'rvb') goTo('rvb');
  else goTo('home');
}

// ── Page d'accueil ────────────────────────────────────────────

function refreshHome() {
  const b = calcBudget();
  const profileOk = b.inc > 0;
  const locked = '⚠ Complétez votre profil financier';

  const el0 = G('hcMeta0');
  if (el0) el0.textContent = profileOk ? euro(b.inc) + ' /mois nets' : 'À compléter';

  const el1 = G('hcMeta1');
  if (el1) {
    const r = num('rate');
    if (r > 0) {
      const taegD = calcTAEG();
      const parts = [num('duration') + ' ans'];
      if (num('apport') > 0) parts.push('Apport ' + euro(num('apport')));
      if (taegD) parts.push('TAEG ' + taegD.taeg.toFixed(2) + '%');
      el1.textContent = parts.join(' · ');
    } else {
      el1.textContent = 'À compléter';
    }
  }

  const price = num('propPrice');
  const el2 = G('hcMeta2');
  if (el2) {
    if (!profileOk) el2.textContent = locked;
    else if (price > 0) { const d = calcProject(price, num('duration')); el2.textContent = euro(price) + ' — ' + d.dr.toFixed(1) + '% endettem.'; }
    else el2.textContent = 'Aucun bien saisi';
  }

  const el3 = G('hcMeta3');
  if (el3) {
    if (!profileOk) el3.textContent = locked;
    else {
      const n = ['compName0','compName1','compName2'].filter(id => { const e = G(id); return e && e.value.trim(); }).length;
      el3.textContent = n > 0 ? n + ' bien' + (n > 1 ? 's' : '') + ' comparé' + (n > 1 ? 's' : '') : 'Aucun bien saisi';
    }
  }

  const el4 = G('hcMeta4');
  if (el4) el4.textContent = !profileOk ? locked : b.propMax > 0 ? euro(b.propMax) : 'À compléter';

  const elInv = G('hcMetaInv');
  if (elInv) {
    const targetM = num('invTarget');
    if (targetM > 0) {
      const inv = calcInverse(targetM);
      elInv.textContent = inv && inv.propMax > 0
        ? euro(targetM) + '/mois → ' + euro(inv.propMax)
        : euro(targetM) + '/mois';
    } else {
      elInv.textContent = '—';
    }
  }

  const el5 = G('hcMeta5');
  if (el5) el5.textContent = profileOk ? '—' : locked;

  const elBiens = G('hcMetaBiens');
  if (elBiens && typeof _biens !== 'undefined') {
    if (_biens.length === 0) {
      elBiens.textContent = 'Aucun bien enregistré';
    } else {
      const total = _biens.reduce((s, b) => s + (b.price || 0), 0);
      elBiens.textContent = _biens.length + ' bien' + (_biens.length > 1 ? 's' : '') + ' · ' + euro(total);
    }
  }

  const elCred = G('hcMetaCredits');
  if (elCred && typeof _credits !== 'undefined') {
    if (_credits.length === 0) {
      elCred.textContent = 'Aucun crédit enregistré';
    } else {
      const totM = _credits.reduce((s, c) => s + computeCredit(c).totM, 0);
      elCred.textContent = _credits.length + ' crédit' + (_credits.length > 1 ? 's' : '') + ' · ' + euro(totM) + '/mois';
    }
  }

  ['hcCard2','hcCard3','hcCard4','hcCard5'].forEach(id => {
    const c = G(id); if (c) c.classList.toggle('home-card-locked', !profileOk);
  });
}

function setCo(active) {
  hasCo = active;
  document.querySelectorAll('.co-only').forEach(el => el.classList.toggle('hidden', !active));
  G('soloBtn').classList.toggle('active', !active);
  G('coBtn').classList.toggle('active', active);
  refresh();
}

function setHav(mode) {
  const isHav = mode === 'hav';
  G('havBtn').classList.toggle('active', isHav);
  G('hacBtn').classList.toggle('active', !isHav);
  const agField = G('agencyField');
  if (agField) agField.style.display = isHav ? 'none' : 'block';
  if (isHav) G('agencyFees').value = 0;
  const note = G('havNote');
  if (note) note.innerHTML = isHav
    ? 'ℹ️ <strong>HAV :</strong> Les honoraires d\'agence sont inclus dans le prix affiché. Les frais de notaire sont calculés sur le prix total.'
    : 'ℹ️ <strong>HAC :</strong> Les honoraires d\'agence sont à votre charge, en sus du prix affiché. Ils s\'ajoutent au coût total.';
  refresh();
}

function resetAll() {
  try { localStorage.removeItem(LS); } catch (e) {}
  G('useBroker').checked = false;
  G('brokerFees').value = 0;
  G('brokerPct').value = 1;
  Object.entries(DEFAULT_VALUES).forEach(([k, v]) => {
    const el = G(k);
    if (el) el.value = v;
  });
  setCo(false);
  goTo(0);
}

// ── Popups ────────────────────────────────────────────────────

function openPopup() { G('feesPopup').classList.add('open'); }
function closePopup() { G('feesPopup').classList.remove('open'); }

function showTip(id) {
  const t = TIPS[id];
  if (!t) return;
  G('tipTitle').textContent = t.title;
  G('tipBody').textContent = t.body;
  const f = G('tipFormula');
  if (t.formula) { f.style.display = 'block'; f.textContent = t.formula; }
  else f.style.display = 'none';
  G('tipPopup').classList.add('open');
}
function closeTip() { G('tipPopup').classList.remove('open'); }

// ── Validation ────────────────────────────────────────────────

function showFieldError(fieldId, msg) {
  const input = G(fieldId);
  if (!input) return;
  const field = input.closest('.field');
  if (!field) return;
  field.classList.add('has-error');
  let err = field.querySelector('.field-err');
  if (!err) {
    err = document.createElement('div');
    err.className = 'field-err';
    field.appendChild(err);
  }
  err.textContent = '⚠ ' + msg;
  err.style.display = 'block';
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearFieldErrors() {
  document.querySelectorAll('.field.has-error').forEach(f => {
    f.classList.remove('has-error');
    const e = f.querySelector('.field-err');
    if (e) e.style.display = 'none';
  });
}

function validatePage(step) {
  clearFieldErrors();
  let ok = true;
  if (step === 0 && num('salary1') <= 0) {
    showFieldError('salary1', 'Renseignez votre salaire net mensuel.');
    ok = false;
  }
  if (step === 2) {
    if (num('rate') <= 0) { showFieldError('rate', 'Le taux nominal du prêt ne peut pas être nul.'); ok = false; }
    if (num('apport') < 0) { showFieldError('apport', "L'apport personnel ne peut pas être négatif."); ok = false; }
  }
  if (step === 4 && num('propPrice') <= 0) {
    showFieldError('propPrice', 'Renseignez le prix du bien pour voir votre bilan.');
    ok = false;
  }
  return { ok };
}

// ── Courtier ──────────────────────────────────────────────────

function updateBroker() {
  const wrap = G('brokerWrap');
  const hidden = G('brokerFees');
  const disp = G('brokerDisp');
  const fb = G('brokerFeedback');

  if (!G('useBroker').checked) {
    hidden.value = 0;
    if (wrap) wrap.style.display = 'none';
    if (fb) fb.style.display = 'none';
    return;
  }
  if (wrap) wrap.style.display = 'block';
  const b = calcBudget();
  const capped = Math.min(Math.max(b.borrow * num('brokerPct') / 100, 1500), 3500);
  hidden.value = Math.round(capped);
  if (disp) disp.textContent = euro(capped);
  if (fb) {
    fb.style.display = 'block';
    const amt = G('brokerFeedbackAmt');
    if (amt) amt.textContent = euro(capped);
  }
}

// ── Badge dossier ─────────────────────────────────────────────

const BADGE_CLASSES = ['badge-solide', 'badge-fincable', 'badge-limite', 'badge-fragile', 'badge-refuse'];

function getDossierBadge(dr, rav) {
  const floor = ravFloor();
  if (dr > 42 || rav <= 0)
    return { cls: 'badge-refuse',   icon: '❌', title: 'Dossier refusé',    sub: 'Taux d\'endettement trop élevé ou reste à vivre négatif. Accord bancaire très improbable.' };
  if (dr > 38 || rav < floor)
    return { cls: 'badge-fragile',  icon: '🔴', title: 'Dossier fragile',   sub: `Hors norme HCSF (>38%) ou reste à vivre insuffisant (plancher foyer : ${euro(floor)}). Dossier difficile à faire accepter.` };
  if (dr > 35 || rav < floor * 1.5)
    return { cls: 'badge-limite',   icon: '⚠️', title: 'Dossier limite',    sub: 'Au-delà du seuil HCSF (35%) ou reste à vivre serré. Possible avec un dossier solide par ailleurs.' };
  if (dr > 30 || rav < floor * 2.25)
    return { cls: 'badge-fincable', icon: '✅', title: 'Dossier finançable', sub: 'Dans la norme HCSF. Reste à vivre correct. Bon profil pour la plupart des banques.' };
  return   { cls: 'badge-solide',   icon: '⭐', title: 'Dossier solide',    sub: 'Taux d\'endettement confortable (≤30%) et excellent reste à vivre. Dossier très bien perçu.' };
}

function applyBadgeTo(badge, iconEl, titleEl, subEl, b) {
  BADGE_CLASSES.forEach(c => badge.classList.remove(c));
  badge.classList.add('visible', b.cls);
  if (iconEl) iconEl.textContent = b.icon;
  if (titleEl) titleEl.textContent = b.title;
  if (subEl) subEl.textContent = b.sub;
}

function refreshDossierBadge(dr, rav, hasPrice) {
  const badge = G('dossierBadge');
  const status = G('projStatus');
  if (!badge) return;

  if (!hasPrice) {
    badge.className = 'dossier-badge';
    if (status) status.style.display = 'block';
    return;
  }
  if (status) status.style.display = 'none';

  const b = getDossierBadge(dr, rav);
  applyBadgeTo(badge, G('dossierIcon'), G('dossierTitle'), G('dossierSub'), b);

  // Badge dossier dans le bilan (page 5)
  const badge2 = G('dossierBadge2');
  if (badge2) {
    badge2.className = 'dossier-badge';
    applyBadgeTo(badge2, G('dossierIcon2'), G('dossierTitle2'), G('dossierSub2'), b);
  }
}

// ── TAEG ──────────────────────────────────────────────────────

function refreshTAEG() {
  const d = calcTAEG();
  // Page Budget max (page 3)
  const tv = G('taegVal');
  if (tv) {
    tv.textContent = d ? fmtPct(d.taeg) : '—';
    G('taegNominal').textContent = d ? fmtPct(d.rateNom) : '—';
    G('taegIns').textContent = d ? fmtPct(d.insAnnual) : '—';
    G('taegFees').textContent = d ? fmtPct(d.feesAnnual) : '—';
  }
  // Bilan (page 5)
  const tv2 = G('taegVal2');
  if (tv2) {
    tv2.textContent = d ? fmtPct(d.taeg) : '—';
    G('taegNominal2').textContent = d ? fmtPct(d.rateNom) : '—';
    G('taegIns2').textContent = d ? fmtPct(d.insAnnual) : '—';
    G('taegFees2').textContent = d ? fmtPct(d.feesAnnual) : '—';
  }
}

// ── Barre flottante ───────────────────────────────────────────

function refreshFloatBar() {
  const bar = G('floatBar');
  if (!bar) return;
  if (currentPage < 4) { bar.style.display = 'none'; return; }
  bar.style.display = '';
  const price = num('propPrice');
  if (price <= 0) { bar.classList.add('hidden'); return; }
  const d = calcProject(price, num('duration'));
  bar.classList.remove('hidden');
  G('fbPrice').textContent = euro(price);
  G('fbTotal').textContent = euro(d.total);
  G('fbMens').textContent = euro(d.totM) + '/mois';
  G('fbDr').textContent = d.dr.toFixed(1) + '%';
}

// ── Curseur apport simulation ─────────────────────────────────

function initSimApport() {
  const profileAp = num('apport');
  const maxVal = Math.ceil(Math.max(profileAp * 2.5, 150000) / 10000) * 10000;
  const sl = G('simApport');
  if (!sl) return;
  sl.min = 0; sl.max = maxVal; sl.value = profileAp;
  G('simApportVal').textContent = euro(profileAp);
  G('simApportMax').textContent = euro(maxVal);
  G('simModBadge').style.display = 'none';
  G('simResetBtn').style.display = 'none';
  G('simDelta').classList.remove('show');
}

function onSimApport() {
  const sl = G('simApport');
  const val = parseInt(sl.value);
  const profileAp = num('apport');
  _simApport = val;
  G('simApportVal').textContent = euro(val);
  const modified = val !== profileAp;
  G('simModBadge').style.display = modified ? 'inline' : 'none';
  G('simResetBtn').style.display = modified ? 'inline-block' : 'none';

  const price = num('propPrice');
  if (price > 0 && modified) {
    _simApport = null;
    const dRef = calcProject(price, num('duration'));
    const bRef = getDossierBadge(dRef.dr, dRef.remaining);
    _simApport = val;
    const dSim = calcProject(price, num('duration'));
    const bSim = getDossierBadge(dSim.dr, dSim.remaining);

    const diff = dSim.totM - dRef.totM;
    const diffAbs = Math.abs(Math.round(diff));
    const cls = diff <= 0 ? 'pos' : 'neg';
    G('simDeltaMens').innerHTML =
      `${euro(dRef.totM)} → ${euro(dSim.totM)} <span class="sim-dval ${cls}">${diff <= 0 ? '−' : '+'} ${euro(diffAbs)}</span>`;

    const bdRow = G('simDeltaBadgeRow');
    if (bRef.title !== bSim.title) {
      G('simDeltaBadge').textContent = bRef.icon + ' ' + bRef.title + ' → ' + bSim.icon + ' ' + bSim.title;
      bdRow.style.display = 'flex';
    } else {
      bdRow.style.display = 'none';
    }
    G('simDelta').classList.add('show');
  } else {
    G('simDelta').classList.remove('show');
  }
  refresh();
}

function resetSimApport() {
  _simApport = null;
  initSimApport();
  refresh();
}

// ── Refresh budget (page 3) ───────────────────────────────────

function refreshBudget() {
  updateBroker();
  const b = calcBudget();

  G('propMax').textContent = euro(b.propMax);
  G('totalEnv').textContent = euro(b.env);
  G('borrowable').textContent = euro(b.borrow);
  G('b4LoanM').textContent = euro(b.lm);
  G('b4InsM').textContent = euro(b.insM);
  G('b4TotalM').textContent = euro(b.disp);
  G('fNotary').textContent = euro(b.fN);
  G('fGuarantee').textContent = euro(b.fG);
  G('fDossier').textContent = euro(b.bF);
  G('fBroker').textContent = euro(b.brF);
  G('fTotal').textContent = euro(b.totFees);

  const s4 = G('b4Status');
  s4.className = 'status';
  if (b.disp <= 0) {
    s4.classList.add('warn');
    G('b4Head').textContent = 'Les charges absorbent toute la capacité.';
    G('b4Cmt').textContent = "Ajustez à l'étape 2.";
  } else {
    s4.classList.add('ok');
    G('b4Head').textContent = 'Enveloppe calculée — assurance incluse.';
    G('b4Cmt').textContent = 'Mensualité : ' + euro(b.lm) + ' + ' + euro(b.insM) + ' assurance = ' + euro(b.disp) + '. Prix du bien visable : ' + euro(b.propMax) + '.';
  }

  if (hasCo) {
    const qt = num('quotite1') + num('quotite2');
    const w = G('quotiteWarn');
    if (qt < 100) {
      w.style.display = 'block';
      w.innerHTML = '<strong>Attention :</strong> quotité totale ' + qt + '% < 100%.';
    } else {
      w.style.display = 'none';
    }
  }

  // Évaluation du bien testé (page 4)
  const price = num('propPrice');
  if (price <= 0) {
    G('ravCard').style.display = 'none';
    G('drCard').style.display = 'none';
    refreshDossierBadge(0, 0, false);
  } else {
    const d = calcProject(price, num('duration'));

    G('projFinanced').textContent = euro(d.financed);
    G('projApport').textContent = euro(b.apport);
    G('projCostTotal').textContent = euro(d.total);
    G('projLoanM').textContent = euro(d.lm);
    G('projInsM').textContent = euro(d.insM);
    G('projTotalM').textContent = euro(d.totM);

    // Détail coût total
    G('projPrixBien').textContent = euro(price);
    const isHav = G('havBtn')?.classList.contains('active') ?? true;
    G('projAgency').textContent = d.ag > 0 ? euro(d.ag) : '—';
    const agLabel = G('projAgencyLabel');
    const agLine = G('projAgencyLine');
    if (agLabel) agLabel.textContent = isHav ? 'Honoraires d\'agence (HAV, inclus)' : '+ Honoraires d\'agence (HAC)';
    if (agLine) agLine.style.display = (!isHav && d.ag > 0) ? 'flex' : 'none';
    G('projWorks').textContent = d.wk > 0 ? euro(d.wk) : '—';
    G('projNotary').textContent = euro(d.notary);
    G('projGuarantee').textContent = euro(d.guarantee);
    G('projBankFees').textContent = d.bF > 0 ? euro(d.bF) : '—';
    G('projBrokerFees').textContent = d.brF > 0 ? euro(d.brF) : '—';
    G('projCostDetail').textContent = euro(d.total);

    // Reste à vivre
    const floor = ravFloor();
    G('ravCard').style.display = 'block';
    G('ravVal').textContent = euro(d.remaining);
    G('ravBar').style.width = Math.min(Math.max(d.remaining / (floor * 3.75) * 100, 0), 100) + '%';
    let rc, rbc, rbg, rm2;
    if (d.remaining < floor)            { rc = '#c0392b'; rbc = 'rgba(192,57,43,.3)'; rbg = 'rgba(192,57,43,.05)'; rm2 = `Insuffisant — plancher foyer ${euro(floor)} non atteint. Risque de refus.`; }
    else if (d.remaining < floor * 1.5) { rc = 'var(--warn)'; rbc = 'rgba(150,66,25,.3)'; rbg = 'var(--warn-soft)'; rm2 = 'Limité — à peine au-dessus du plancher foyer. Dossier fragile.'; }
    else if (d.remaining < floor * 2.25){ rc = '#b8860b'; rbc = 'rgba(212,160,23,.3)'; rbg = 'rgba(212,160,23,.05)'; rm2 = 'Correct — reste à vivre dans la moyenne pour votre foyer.'; }
    else                                { rc = 'var(--success)'; rbc = 'rgba(67,122,34,.3)'; rbg = 'var(--success-soft)'; rm2 = 'Confortable — large marge au-dessus du plancher foyer. Bon dossier.'; }
    G('ravBar').style.background = rc;
    G('ravCard').style.borderColor = rbc;
    G('ravCard').style.background = rbg;
    G('ravCmt').style.color = rc;
    G('ravCmt').textContent = rm2;

    // Légende dynamique selon foyer
    const f1 = euro(floor), f2 = euro(Math.round(floor * 1.5)), f3 = euro(Math.round(floor * 2.25));
    const l1 = G('ravLeg1'), l2 = G('ravLeg2'), l3 = G('ravLeg3'), l4 = G('ravLeg4');
    if (l1) l1.textContent = `◼ <${f1} Insuffisant`;
    if (l2) l2.textContent = `◼ ${f1}-${f2} Limité`;
    if (l3) l3.textContent = `◼ ${f2}-${f3} Correct`;
    if (l4) l4.textContent = `◼ >${f3} Confortable`;

    // Hint plancher foyer
    const adults = Math.max(num('nbAdults'), 1);
    const children = Math.max(num('nbChildren'), 0);
    const hintEl = G('ravFloorHint');
    if (hintEl) {
      let parts = [adults + ' adulte' + (adults > 1 ? 's' : '') + ' × 800€'];
      if (children > 0) parts.push(children + ' enfant' + (children > 1 ? 's' : '') + ' × 400€');
      hintEl.innerHTML = `&#9432; Plancher foyer : ${parts.join(' + ')} = <strong>${f1}</strong>`;
    }

    // Taux d'endettement
    G('drCard').style.display = 'block';
    G('drVal').textContent = d.dr.toFixed(1) + '%';
    G('drBar').style.width = Math.min(d.dr / 50 * 100, 100) + '%';
    let dc2, dbc, dbg, dm;
    if (d.dr <= 35)      { dc2 = 'var(--success)'; dbc = 'rgba(67,122,34,.3)'; dbg = 'var(--success-soft)'; dm = 'Dans la norme HCSF — dossier solide.'; }
    else if (d.dr <= 38) { dc2 = 'var(--warn)'; dbc = 'rgba(150,66,25,.3)'; dbg = 'var(--warn-soft)'; dm = "Au-delà de 35% — certaines banques accordent jusqu'à 38%."; }
    else                 { dc2 = '#c0392b'; dbc = 'rgba(192,57,43,.3)'; dbg = 'rgba(192,57,43,.05)'; dm = 'Hors norme HCSF — accord très difficile.'; }
    G('drBar').style.background = dc2;
    G('drCard').style.borderColor = dbc;
    G('drCard').style.background = dbg;
    G('drCmt').style.color = dc2;
    G('drCmt').textContent = dm;

    refreshDossierBadge(d.dr, d.remaining, true);

    const ps = G('projStatus');
    ps.className = 'status';
    if (d.tension >= 0 && d.remaining >= floor) {
      ps.classList.add('ok');
      G('projHead').textContent = 'Le bien paraît soutenable.';
      G('projCmt').textContent = 'Mensualité (' + euro(d.totM) + ') sous la cible (' + euro(d.disp) + '). Reste à vivre au-dessus du plancher foyer (' + euro(floor) + ').';
    } else if (d.tension >= 0) {
      ps.classList.add('warn');
      G('projHead').textContent = 'Finançable mais reste à vivre serré.';
      G('projCmt').textContent = 'Peu de marge après charges courantes.';
    } else {
      ps.classList.add('warn');
      G('projHead').textContent = 'Ce bien met le budget sous tension.';
      G('projCmt').textContent = 'La mensualité dépasse la cible de ' + euro(Math.abs(d.tension)) + '.';
    }
  }
}

// ── Calculateur inversé ───────────────────────────────────────

function refreshInverse() {
  const targetM = num('invTarget');
  const resultsEl = G('invResults');
  const emptyEl = G('invEmpty');
  if (!G('invPropMax')) return;

  if (targetM <= 0) {
    if (resultsEl) resultsEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  const d = calcInverse(targetM);
  if (!d || d.propMax <= 0) {
    if (resultsEl) resultsEl.style.display = 'none';
    if (emptyEl) { emptyEl.style.display = 'block'; emptyEl.textContent = 'Mensualité trop faible pour couvrir les frais annexes.'; }
    return;
  }

  if (resultsEl) resultsEl.style.display = 'block';

  // Budget
  G('invPropMax').textContent = euro(d.propMax);
  if (G('invTotalEnv')) G('invTotalEnv').textContent = euro(d.env);
  G('invBorrow').textContent = euro(d.borrow);

  // Détail mensualité
  if (G('invLoanM')) G('invLoanM').textContent = euro(d.lm);
  if (G('invInsM')) G('invInsM').textContent = euro(d.insM);
  if (G('invTotalM')) G('invTotalM').textContent = euro(targetM) + '/mois';

  // Taux d'endettement + reste à vivre
  const inc = income();
  const dc = debtCharges();
  const dr = inc > 0 ? (dc + targetM) / inc * 100 : 0;
  const rav = inc - dc - targetM - num('otherExpenses');
  if (G('invDr')) G('invDr').textContent = dr.toFixed(1) + '%';
  if (G('invRav')) G('invRav').textContent = euro(rav) + '/mois';

  // Badge dossier
  const badgeEl = G('invBadge');
  if (badgeEl) {
    const bg = getDossierBadge(dr, rav);
    badgeEl.className = 'dossier-badge visible ' + bg.cls;
    badgeEl.innerHTML = `<span class="badge-icon">${bg.icon}</span><div class="badge-body"><div class="badge-title">${bg.title}</div><div class="badge-sub">${bg.sub}</div></div>`;
  }

  // Delta vs profil
  const b = calcBudget();
  const sign = n => n >= 0 ? '+' : '';
  const deltaEl = G('invDelta');
  if (deltaEl) {
    const diffProp = d.propMax - b.propMax;
    deltaEl.textContent = `vs profil : ${sign(diffProp)}${euro(diffProp)} sur le bien visable`;
    deltaEl.style.display = 'block';
  }

  // Note
  const noteEl = G('invNote');
  if (noteEl) {
    if (targetM > b.disp) {
      noteEl.style.display = 'block';
      noteEl.textContent = `⚠ Dépasse la mensualité max de votre profil (${euro(b.disp)}).`;
    } else {
      noteEl.style.display = 'none';
    }
  }
}

// ── Refresh bilan (page 5) ─────────────────────────────────────

function refreshResults() {
  const b = calcBudget();
  G('resPropMax').textContent = euro(b.propMax);
  G('resTotalEnv').textContent = euro(b.env);
  G('resBorrow').textContent = euro(b.borrow);
  G('resLoanM').textContent = euro(b.lm);
  G('resInsM').textContent = euro(b.insM);
  G('resTotalM').textContent = euro(b.disp);
  G('resFNotary').textContent = euro(b.fN);
  G('resFGuarantee').textContent = euro(b.fG);
  G('resFDossier').textContent = euro(b.bF);
  G('resFBroker').textContent = euro(b.brF);
  G('resFTotal').textContent = euro(b.totFees);

  const price = num('propPrice');
  const section = G('resProjectSection');
  if (!section) return;

  if (price > 0) {
    section.style.display = 'block';
    const pLbl = G('resProjPriceLabel');
    if (pLbl) pLbl.textContent = euro(price);
    const d = calcProject(price, num('duration'));
    G('resProjCost').textContent = euro(d.total);
    G('resProjFin').textContent = euro(d.financed);
    G('resProjRav').textContent = euro(d.remaining);
    G('resProjDr').textContent = d.dr.toFixed(1) + '%';
    G('resProjLoanM').textContent = euro(d.totM);

    const ps = G('resProjStatus');
    ps.className = 'status';
    if (d.tension >= 0 && d.remaining >= 1000) {
      ps.classList.add('ok');
      G('resProjHead').textContent = 'Le bien paraît soutenable.';
      G('resProjCmt').textContent = 'Mensualité (' + euro(d.totM) + ') sous la cible (' + euro(d.disp) + '). Reste à vivre confortable.';
    } else if (d.tension >= 0) {
      ps.classList.add('warn');
      G('resProjHead').textContent = 'Finançable mais reste à vivre serré.';
      G('resProjCmt').textContent = 'Peu de marge après charges courantes.';
    } else {
      ps.classList.add('warn');
      G('resProjHead').textContent = 'Ce bien met le budget sous tension.';
      G('resProjCmt').textContent = 'La mensualité dépasse la cible de ' + euro(Math.abs(d.tension)) + '.';
    }
  } else {
    section.style.display = 'none';
  }
}

// ── Refresh RvB ───────────────────────────────────────────────

function refreshRvb() {
  const rvb = calcRvb();
  if (!rvb) {
    G('rvbEmpty').style.display = 'block';
    G('rvbResults').style.display = 'none';
    return;
  }
  G('rvbEmpty').style.display = 'none';
  G('rvbResults').style.display = 'block';
  G('rvbN').textContent = rvb.N;

  G('rvbSell').textContent = euro(rvb.sellPrice);
  G('rvbRepaid').textContent = euro(rvb.capRepaid);
  G('rvbLeft').textContent = euro(rvb.capLeft);
  G('rvbMpaid').textContent = euro(rvb.totalMpaid);
  G('rvbOwner').textContent = euro(rvb.totalOwner);
  G('rvbFees').textContent = euro(rvb.totalEntry + rvb.sellFees);
  G('rvbNetBuy').textContent = euro(rvb.netBuy);
  G('rvbRentPaid').textContent = euro(rvb.totalRent);
  G('rvbApportG').textContent = euro(rvb.apportG);
  G('rvbSavExtra').textContent = euro(rvb.savExtra);
  G('rvbPortf').textContent = euro(rvb.portfolio);
  G('rvbNetRent').textContent = euro(rvb.netRent);

  const buyBetter = rvb.delta >= 0;
  G('rvbBuy').classList.toggle('reco', buyBetter);
  G('rvbRent').classList.toggle('reco', !buyBetter);

  const vEl = G('rvbVerdict');
  vEl.style.borderColor = buyBetter ? 'rgba(67,122,34,.3)' : 'rgba(1,105,111,.3)';
  vEl.style.background = buyBetter ? 'var(--success-soft)' : 'var(--primary-soft)';

  const dEl = G('rvbDelta');
  dEl.textContent = (rvb.delta >= 0 ? '+' : '') + euro(rvb.delta) + ' en faveur de l\'' + (buyBetter ? 'achat' : 'location');
  dEl.style.color = buyBetter ? 'var(--success)' : 'var(--primary)';

  const wEl = G('rvbWinner');
  wEl.textContent = buyBetter ? "L'achat est plus rentable sur cette période." : "La location + épargne est plus rentable.";
  wEl.style.color = buyBetter ? 'var(--success)' : 'var(--primary)';

  G('rvbCmt').textContent = 'Sur ' + rvb.N + ' ans, ' + (buyBetter
    ? "l'achat génère " + euro(Math.abs(rvb.delta)) + ' de patrimoine supplémentaire.'
    : "la location+épargne génère " + euro(Math.abs(rvb.delta)) + ' de plus. L\'immobilier immobilise le capital et génère des frais importants à court terme.');

  let be = -1;
  for (let y = 1; y <= 30; y++) { if (rvbAtYear(y, rvb) > 0) { be = y; break; } }
  const beEl = G('rvbBE');
  beEl.textContent = be > 0
    ? "L'achat devient avantageux après " + be + ' ans de détention.'
    : "Non rentable sur 30 ans avec ces hypothèses.";
  beEl.style.color = be > 0 ? 'var(--success)' : 'var(--warn)';

  try { drawRvbChart(rvb); } catch (e) {}
}

// ── Copier le bilan ───────────────────────────────────────────

function copyBilan() {
  const b = calcBudget();
  const price = num('propPrice');
  const d = new Date().toLocaleDateString('fr-FR');
  const taegD = calcTAEG();

  let txt = '=== MON BILAN NESTIMATE — ' + d + ' ===\n\n';
  txt += 'CAPACITÉ D\'EMPRUNT\n';
  txt += '  Prix du bien visable    : ' + euro(b.propMax) + '\n';
  txt += '  Enveloppe totale        : ' + euro(b.env) + '\n';
  txt += '  Montant empruntable     : ' + euro(b.borrow) + '\n';
  txt += '  Mensualité totale       : ' + euro(b.disp) + '/mois\n';
  txt += '  TAEG                    : ' + (taegD ? taegD.taeg.toFixed(2) + '%' : '—') + '\n';
  txt += '  Frais annexes estimés   : ' + euro(b.totFees) + '\n';

  if (price > 0) {
    const p = calcProject(price, num('duration'));
    txt += '\nBIEN TESTÉ (' + euro(price) + ')\n';
    txt += '  Coût total projet      : ' + euro(p.total) + '\n';
    txt += '  Mensualité             : ' + euro(p.totM) + '/mois\n';
    txt += '  Taux d\'endettement    : ' + p.dr.toFixed(1) + '%\n';
    txt += '  Reste à vivre          : ' + euro(p.remaining) + '/mois\n';
  }

  const btn = G('copyBilanBtn');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt)
      .then(() => { btn.textContent = '✓ Copié !'; setTimeout(() => { btn.innerHTML = '📋 Copier le résumé'; }, 2200); })
      .catch(() => fallbackCopy(txt, btn));
  } else {
    fallbackCopy(txt, btn);
  }
}

function fallbackCopy(txt, btn) {
  const ta = document.createElement('textarea');
  ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try {
    document.execCommand('copy');
    btn.textContent = '✓ Copié !';
    setTimeout(() => { btn.innerHTML = '📋 Copier le résumé'; }, 2200);
  } catch (e) { alert('Copiez manuellement :\n\n' + txt); }
  document.body.removeChild(ta);
}

// ── Comparaison de biens ──────────────────────────────────────

let _numComps = 1;

function initComparison() {
  const isFirstVisit = num('compPrice0') === 0 && num('compPrice1') === 0 && num('compPrice2') === 0;
  if (isFirstVisit) {
    const price = num('propPrice');
    if (price > 0) {
      G('compPrice0').value = price;
      G('compWorks0').value = G('works').value;
    }
    const profileDur = G('duration').value;
    ['compDur0', 'compDur1', 'compDur2'].forEach(id => { G(id).value = profileDur; });
  }
  // Restaurer le nombre de cards visibles depuis les données sauvegardées
  _numComps = 1;
  [1, 2].forEach(i => {
    const card = G('compCard' + i);
    if (!card) return;
    if (num('compPrice' + i) > 0 || (G('compName' + i) && G('compName' + i).value.trim())) {
      card.classList.remove('hidden');
      _numComps = i + 1;
    } else {
      card.classList.add('hidden');
    }
  });
  const btn = G('addCompBtn');
  if (btn) btn.style.display = _numComps >= 3 ? 'none' : '';
  refreshComparison();
}

function addComp() {
  if (_numComps >= 3) return;
  _numComps++;
  const card = G('compCard' + (_numComps - 1));
  if (card) card.classList.remove('hidden');
  if (_numComps >= 3) { const btn = G('addCompBtn'); if (btn) btn.style.display = 'none'; }
  refreshComparison();
}

function removeComp(idx) {
  for (let i = idx; i <= 2; i++) {
    const card = G('compCard' + i);
    if (card) card.classList.add('hidden');
    if (G('compPrice' + i)) G('compPrice' + i).value = '';
    if (G('compWorks' + i)) G('compWorks' + i).value = 0;
    if (G('compName' + i)) G('compName' + i).value = '';
  }
  _numComps = idx;
  const btn = G('addCompBtn');
  if (btn) btn.style.display = '';
  refreshComparison();
  save();
}

function refreshComparison() {
  const LETTERS = ['A', 'B', 'C'];
  const BADGE_ORDER = ['badge-solide', 'badge-fincable', 'badge-limite', 'badge-fragile', 'badge-refuse'];

  const props = [0, 1, 2].slice(0, _numComps).map(i => {
    const price = num('compPrice' + i);
    const name = G('compName' + i)?.value?.trim() || ('Bien ' + LETTERS[i]);
    return { price, works: num('compWorks' + i), dur: num('compDur' + i) || num('duration'), name, letter: LETTERS[i] };
  }).filter(p => p.price > 0);

  const empty = G('compEmpty');
  const results = G('compResults');
  if (!results) return;

  if (props.length === 0) {
    if (empty) empty.style.display = 'block';
    results.innerHTML = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  const calcs = props.map(p => {
    const d = calcProject(p.price, p.dur, { works: p.works, agencyFees: 0 });
    const badge = getDossierBadge(d.dr, d.remaining);
    return { ...p, ...d, badge };
  });

  const withinBudget = c => c.tension >= 0;
  const markBest = calcs.length > 1;
  const best = (fn, lower = true) => {
    if (!markBest) return calcs.map(() => false);
    const vals = calcs.map(fn);
    const target = lower ? Math.min(...vals) : Math.max(...vals);
    return calcs.map(c => fn(c) === target);
  };

  const bestTotM  = best(c => c.totM);
  const bestDr    = best(c => c.dr);
  const bestRav   = best(c => c.remaining, false);
  const bestTotal = best(c => c.total);

  const drColor = dr => dr <= 35 ? 'var(--success)' : dr <= 38 ? 'var(--warn)' : '#c0392b';
  const fl = ravFloor();
  const ravColor = r => r >= fl * 2.25 ? 'var(--success)' : r >= fl * 1.5 ? 'var(--text)' : r >= fl ? 'var(--warn)' : '#c0392b';

  const cell = (content, isBest) =>
    `<td class="ct-val${isBest ? ' ct-best' : ''}">${content}</td>`;

  const rows = [
    { label: 'Prix du bien',      vals: calcs.map(c => euro(c.price)),           bests: calcs.map(() => false) },
    { label: 'Travaux',           vals: calcs.map(c => c.wk > 0 ? euro(c.wk) : '—'), bests: calcs.map(() => false), skip: calcs.every(c => c.wk === 0) },
    { label: 'Coût total projet', vals: calcs.map(c => euro(c.total)),           bests: bestTotal },
    { label: 'Montant emprunté',  vals: calcs.map(c => euro(c.financed)),        bests: calcs.map(() => false) },
    { label: 'Mensualité totale', vals: calcs.map(c => `${euro(c.totM)}<span class="ct-unit">/mois</span>`), bests: bestTotM },
    { label: 'Taux d\'endettement', vals: calcs.map(c => `<span style="color:${drColor(c.dr)};font-weight:700;">${c.dr.toFixed(1)}%</span>`), bests: bestDr },
    { label: 'Reste à vivre',     vals: calcs.map(c => `<span style="color:${ravColor(c.remaining)};font-weight:700;">${euro(c.remaining)}<span class="ct-unit">/mois</span></span>`), bests: bestRav },
    { label: 'Dossier',          vals: calcs.map(c => `<span class="dossier-badge visible ${c.badge.cls}" style="padding:3px 10px;font-size:.75rem;">${c.badge.icon} ${c.badge.title}</span>`), bests: calcs.map(() => false) },
    { label: 'Verdict',          vals: calcs.map(c => withinBudget(c) ? '<span style="color:var(--success);font-weight:700;">✓ Dans le budget</span>' : '<span style="color:var(--warn);font-weight:700;">⚠ Hors cible</span>'), bests: calcs.map(c => withinBudget(c)) }
  ];

  let html = `<div class="comp-table-wrap"><table class="comp-table">
    <thead><tr>
      <th class="ct-label"></th>
      ${calcs.map(c => `<th class="ct-col ${withinBudget(c) ? 'ct-ok' : 'ct-over'}">${c.name}</th>`).join('')}
    </tr></thead>
    <tbody>`;

  rows.forEach(row => {
    if (row.skip) return;
    html += `<tr><td class="ct-label">${row.label}</td>${calcs.map((c, i) => cell(row.vals[i], row.bests[i])).join('')}</tr>`;
  });

  html += '</tbody></table></div>';

  if (calcs.length > 1) {
    const inBudget = calcs.filter(withinBudget);
    if (inBudget.length > 0) {
      const BADGE_ORDER2 = ['badge-solide', 'badge-fincable', 'badge-limite', 'badge-fragile', 'badge-refuse'];
      const top = inBudget.reduce((a, b) => {
        const sa = BADGE_ORDER2.indexOf(a.badge.cls) * 10000 - a.remaining;
        const sb = BADGE_ORDER2.indexOf(b.badge.cls) * 10000 - b.remaining;
        return sa < sb ? a : b;
      });
      html += `<div class="status ok" style="margin-top:14px;"><strong>Recommandation : ${top.name}</strong><div>${top.badge.icon} ${top.badge.title} — mensualité ${euro(top.totM)}/mois, endettement ${top.dr.toFixed(1)}%.</div></div>`;
    } else {
      html += `<div class="status warn" style="margin-top:14px;"><strong>Aucun bien dans votre enveloppe.</strong><div>Tous dépassent votre mensualité cible. Augmentez l'apport, la durée, ou ciblez un prix inférieur.</div></div>`;
    }
  }

  results.innerHTML = html;
}

// ── Refresh principal ─────────────────────────────────────────

function refresh() {
  refreshBudget();
  refreshAmortStats2();
  refreshTAEG();
  refreshResults();
  refreshInverse();
  if (currentPage === 5) refreshComparison();
  if (currentMode === 'rvb') refreshRvb();
  if (currentPage === -1) refreshHome();
  refreshFloatBar();
  save();
}
