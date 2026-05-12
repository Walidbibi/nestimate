// Facteur d'actualisation d'une rente
function afactor(annualRate, years) {
  const n = years * 12;
  const r = annualRate / 100 / 12;
  if (!n) return 0;
  return r === 0 ? n : (1 - Math.pow(1 + r, -n)) / r;
}

// Mensualité prêt (capital + intérêts)
function mpmt(principal, annualRate, years) {
  const f = afactor(annualRate, years);
  return f > 0 ? principal / f : 0;
}

// Taux d'assurance combiné (emprunteur 1 + co-emprunteur si actif)
function insRate() {
  const r1 = pct('insuranceRate') * num('quotite1') / 100;
  return hasCo ? r1 + pct('insuranceRate2') * num('quotite2') / 100 : r1;
}

// Plancher de reste à vivre selon la composition du foyer
function ravFloor() {
  const adults = Math.max(num('nbAdults'), 1);
  const children = Math.max(num('nbChildren'), 0);
  return adults * 800 + children * 400;
}

// Revenus mensuels nets retenus
function income() {
  const s1 = num('salary1') * num('months1') / 12;
  const s2 = hasCo ? num('salary2') * num('months2') / 12 : 0;
  return s1 + s2 + num('rentIncome') * pct('rentPct') + num('otherIncome');
}

// Charges dans le taux d'endettement
function debtCharges() {
  return num('currentCredits') + num('alimonyPaid');
}

// Calcul du budget maximum depuis le profil
function calcBudget() {
  const inc = income();
  const dc = debtCharges();
  const ar = num('rate');
  const y = num('duration');
  const ir = insRate();

  const disp = Math.max(inc * pct('debtRatio') - dc, 0);
  const f = afactor(ar, y);
  const denom = 1 + f * ir / 12;
  const lm = denom > 0 ? disp / denom : 0;
  const borrow = lm * f;
  const insM = borrow * ir / 12;

  const apport = (_simApport !== null) ? _simApport : num('apport');
  const env = borrow + apport;

  const nr = pct('notaryRate');
  const gr = pct('guaranteeRate');
  const bF = num('bankFees');
  const brF = num('brokerFees');
  const fixed = borrow * gr + bF + brF;
  const propMax = Math.max((env - fixed) / (1 + nr), 0);
  const fN = propMax * nr;
  const fG = borrow * gr;
  const totFees = fN + fG + bF + brF;

  return { inc, dc, disp, lm, insM, borrow, apport, env, propMax, totFees, fN, fG, bF, brF };
}

// Calcul pour un bien précis
// overrides permet de passer des valeurs sans lire le DOM (ex. comparaison multi-biens)
function calcProject(price, years, overrides = {}) {
  const b = calcBudget();
  const ar = num('rate');
  const ir = insRate();
  const ag = overrides.agencyFees !== undefined ? overrides.agencyFees : num('agencyFees');
  const wk = overrides.works !== undefined ? overrides.works : num('works');
  const bF = num('bankFees');
  const brF = num('brokerFees');

  const notary = price * pct('notaryRate');
  const gr = pct('guaranteeRate');
  const baseTotal = price + ag + wk + notary + bF + brF;
  // Résolution algébrique : financed = total - apport et guarantee = financed * gr
  const financed = gr < 1
    ? Math.max((baseTotal - b.apport) / (1 - gr), 0)
    : Math.max(baseTotal - b.apport, 0);
  const guarantee = financed * gr;
  const total = baseTotal + guarantee;
  const lm = mpmt(financed, ar, years);
  const insM = financed * ir / 12;
  const totM = lm + insM;
  const remaining = b.inc - b.dc - totM - num('otherExpenses');
  const tension = b.disp - totM;
  const dr = b.inc > 0 ? (b.dc + totM) / b.inc * 100 : 0;

  return { total, notary, guarantee, ag, wk, bF, brF, financed, lm, insM, totM, remaining, tension, disp: b.disp, dr };
}

// Calcul inversé : bien visable depuis une mensualité cible
function calcInverse(targetM) {
  if (targetM <= 0) return null;
  const ar = num('rate');
  const y = num('duration');
  const ir = insRate();
  const apport = num('apport');
  const nr = pct('notaryRate');
  const gr = pct('guaranteeRate');
  const bF = num('bankFees');
  const brF = num('brokerFees');

  const f = afactor(ar, y);
  const denom = f > 0 ? (1 / f + ir / 12) : 0;
  if (denom <= 0) return null;

  const borrow = targetM / denom;
  const insM = borrow * ir / 12;
  const lm = targetM - insM;
  const env = borrow + apport;
  const fixed = borrow * gr + bF + brF;
  const propMax = Math.max((env - fixed) / (1 + nr), 0);

  return { borrow, lm, insM, env, propMax };
}

// Calcul Louer vs Acheter
function calcRvb() {
  const price = num('rvbPrice') > 0 ? num('rvbPrice') : num('propPrice');
  if (price <= 0) return null;

  const b = calcBudget();
  const N = num('holdYears');
  const ar = num('rate');
  const ir = insRate();
  const dy = num('duration');

  const notary = price * pct('notaryRate');
  const guarantee = b.borrow * pct('guaranteeRate');
  const bF = num('bankFees');
  const brF = num('brokerFees');
  const ag = num('agencyFees');
  const totalEntry = notary + guarantee + bF + brF;

  const financed = Math.max(price + notary + guarantee + ag + bF + brF - b.apport, 0);
  const lm = mpmt(financed, ar, dy);
  const insM = financed * ir / 12;
  const totM = lm + insM;

  const r = ar / 100 / 12;
  const nM = Math.min(N * 12, dy * 12);
  let capLeft = r > 0
    ? financed * Math.pow(1 + r, nM) - lm * (Math.pow(1 + r, nM) - 1) / r
    : Math.max(financed - lm * nM, 0);
  capLeft = Math.max(capLeft, 0);
  const capRepaid = financed - capLeft;

  const sellPrice = price * Math.pow(1 + num('appRate') / 100, N);
  const sellFees = sellPrice * pct('sellAgRate');
  const netSale = sellPrice - sellFees - capLeft;
  const totalMpaid = totM * 12 * N;
  const totalOwner = num('ownerCosts') * 12 * N;
  const netBuy = netSale - totalMpaid - totalOwner - totalEntry;

  let totalRent = 0;
  for (let i = 0; i < N; i++) {
    totalRent += num('rentRef') * Math.pow(1 + num('rentInfl') / 100, i) * 12;
  }
  const apportG = b.apport * Math.pow(1 + num('savRate') / 100, N);
  const ms = Math.max(totM + num('ownerCosts') - num('rentRef'), 0);
  const rm = num('savRate') / 100 / 12;
  const savExtra = rm > 0 ? ms * ((Math.pow(1 + rm, N * 12) - 1) / rm) : ms * N * 12;
  const portfolio = apportG + savExtra;
  const netRent = portfolio - totalRent;

  return {
    price, N, sellPrice, capLeft, capRepaid, totalMpaid, totalOwner,
    totalEntry, sellFees, netBuy, totalRent, apportG, savExtra, portfolio, netRent,
    delta: netBuy - netRent, totM, financed
  };
}

// Avantage patrimonial achat vs location à l'année Y
function rvbAtYear(Y, base) {
  const b = calcBudget();
  const ar = num('rate');
  const ir = insRate();
  const dy = num('duration');
  const lm = mpmt(base.financed, ar, dy);
  const totM = lm + base.financed * ir / 12;

  const r = ar / 100 / 12;
  const nM = Math.min(Y * 12, dy * 12);
  let cl = r > 0
    ? base.financed * Math.pow(1 + r, nM) - lm * (Math.pow(1 + r, nM) - 1) / r
    : Math.max(base.financed - lm * nM, 0);
  cl = Math.max(cl, 0);

  const sp = base.price * Math.pow(1 + num('appRate') / 100, Y);
  const nb = sp - sp * pct('sellAgRate') - cl - totM * 12 * Y - num('ownerCosts') * 12 * Y - base.totalEntry;

  let tr = 0;
  for (let i = 0; i < Y; i++) tr += num('rentRef') * Math.pow(1 + num('rentInfl') / 100, i) * 12;
  const ag2 = b.apport * Math.pow(1 + num('savRate') / 100, Y);
  const ms = Math.max(totM + num('ownerCosts') - num('rentRef'), 0);
  const rm = num('savRate') / 100 / 12;
  const se = rm > 0 ? ms * ((Math.pow(1 + rm, Y * 12) - 1) / rm) : ms * Y * 12;

  return nb - (ag2 + se - tr);
}

// TAEG par bisection
function calcTAEG() {
  const b = calcBudget();
  if (b.borrow <= 0 || b.lm <= 0) return null;

  const P = b.borrow;
  const M = b.lm + b.insM;
  const n = num('duration') * 12;
  const fees = b.bF + b.brF + b.fG;
  const netP = P - fees;
  if (netP <= 0 || n <= 0) return null;

  const pv = r => r <= 0 ? M * n : M * (1 - Math.pow(1 + r, -n)) / r;
  let lo = 1e-6, hi = 1.5 / 12;
  for (let i = 0; i < 120; i++) {
    const mid = (lo + hi) / 2;
    pv(mid) > netP ? lo = mid : hi = mid;
  }
  const rM = (lo + hi) / 2;
  const taeg = (Math.pow(1 + rM, 12) - 1) * 100;
  const insAnnual = num('insuranceRate') + (hasCo ? num('insuranceRate2') : 0);
  const feesAnnual = fees / b.borrow / num('duration') * 100;

  return { taeg, rateNom: num('rate'), insAnnual, feesAnnual };
}

// TAEG calculé sur le capital réel du bien testé (page 4)
function calcTAEGProject() {
  const price = num('propPrice');
  if (price <= 0) return null;
  const d = calcProject(price, num('duration'));
  if (d.financed <= 0 || d.lm <= 0) return null;

  const P = d.financed;
  const M = d.totM;
  const n = num('duration') * 12;
  const fees = d.bF + d.brF + d.guarantee;
  const netP = P - fees;
  if (netP <= 0 || n <= 0) return null;

  const pv = r => r <= 0 ? M * n : M * (1 - Math.pow(1 + r, -n)) / r;
  let lo = 1e-6, hi = 1.5 / 12;
  for (let i = 0; i < 120; i++) {
    const mid = (lo + hi) / 2;
    pv(mid) > netP ? lo = mid : hi = mid;
  }
  const rM = (lo + hi) / 2;
  const taeg = (Math.pow(1 + rM, 12) - 1) * 100;
  const insAnnual = num('insuranceRate') + (hasCo ? num('insuranceRate2') : 0);
  const feesAnnual = fees / P / num('duration') * 100;

  return { taeg, rateNom: num('rate'), insAnnual, feesAnnual };
}

// Tableau d'amortissement du budget max (capital empruntable)
function calcAmortData() {
  const b = calcBudget();
  if (b.borrow <= 0) return null;

  const P = b.borrow;
  const r = num('rate') / 100 / 12;
  const n = num('duration') * 12;
  const lm = b.lm;

  let rows = [], bal = P, totI = 0, totC = 0;
  for (let i = 1; i <= n; i++) {
    const interest = r > 0 ? bal * r : 0;
    const capital = Math.min(lm - interest, bal);
    bal = Math.max(bal - capital, 0);
    totI += interest;
    totC += capital;
    rows.push({ m: i, pmt: lm, interest, capital, bal, totI, totC });
  }
  return { rows, P, totI, totC, lm, n, rate: num('rate'), years: num('duration') };
}

// Tableau d'amortissement du bien testé (capital financé réel)
// FIX: utilisait des IDs inexistants (fraisNotaire, fraisAgence...) — remplacé par calcProject()
function calcAmortDataProject() {
  const price = num('propPrice');
  if (price <= 0) return null;

  const d = calcProject(price, num('duration'));
  const P = d.financed;
  if (P <= 0) return null;

  const r = num('rate') / 100 / 12;
  const n = num('duration') * 12;
  const lm = r > 0 ? P * r / (1 - Math.pow(1 + r, -n)) : P / n;

  let rows = [], bal = P, totI = 0, totC = 0;
  for (let i = 1; i <= n; i++) {
    const interest = r > 0 ? bal * r : 0;
    const capital = Math.min(lm - interest, bal);
    bal = Math.max(bal - capital, 0);
    totI += interest;
    totC += capital;
    rows.push({ m: i, pmt: lm, interest, capital, bal, totI, totC });
  }
  return { rows, P, totI, totC, lm, n, rate: num('rate'), years: num('duration') };
}
