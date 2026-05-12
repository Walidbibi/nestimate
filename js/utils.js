// DOM helpers
const G = id => document.getElementById(id);
const num = id => { const el = G(id); if (!el) return 0; const v = parseFloat(el.value); return isFinite(v) ? v : 0; };
const pct = id => num(id) / 100;
const euro = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);
const fmtPct = v => isFinite(v) ? v.toFixed(2) + '%' : '—';

// Global state
let hasCo = false;
let currentMode = 'budget';
let currentPage = 0;
let _simApport = null;

// localStorage key
const LS = 'nestimate_v2';

const PFIELDS = [
  'salary1', 'months1', 'salary2', 'months2', 'rentIncome', 'rentPct', 'otherIncome',
  'currentCredits', 'alimonyPaid', 'rentPaid', 'otherExpenses', 'nbAdults', 'nbChildren',
  'apport', 'rate', 'insuranceRate', 'insuranceRate2', 'quotite1', 'quotite2', 'duration', 'debtRatio',
  'notaryRate', 'guaranteeRate', 'bankFees', 'brokerPct',
  'invTarget',
  'propPrice', 'agencyFees', 'works',
  'holdYears', 'appRate', 'rentRef', 'rentInfl', 'ownerCosts', 'savRate', 'sellAgRate', 'rvbPrice',
  'compPrice0', 'compWorks0', 'compDur0', 'compName0',
  'compPrice1', 'compWorks1', 'compDur1', 'compName1',
  'compPrice2', 'compWorks2', 'compDur2', 'compName2'
];

const DEFAULT_VALUES = {
  salary1: 0, months1: 12, salary2: 0, months2: 12,
  rentIncome: 0, rentPct: 90, otherIncome: 0,
  currentCredits: 0, alimonyPaid: 0, rentPaid: 0, otherExpenses: 0, nbAdults: 1, nbChildren: 0,
  apport: 0, rate: 0, insuranceRate: 0.36, insuranceRate2: 0,
  quotite1: 100, quotite2: 0, duration: 20, debtRatio: 35,
  notaryRate: 8, guaranteeRate: 1, bankFees: 0, brokerPct: 1,
  invTarget: 0,
  propPrice: 0, agencyFees: 0, works: 0,
  holdYears: 10, appRate: 0, rentRef: 0, rentInfl: 0,
  ownerCosts: 0, savRate: 0, sellAgRate: 0, rvbPrice: 0
};

const TIPS = {
  hcsf: {
    title: '📊 Taux d\'endettement & norme HCSF',
    body: 'Le Haut Conseil de Stabilité Financière (HCSF) impose aux banques de ne pas dépasser 35% de taux d\'endettement (assurance comprise). Certaines banques peuvent accorder des exceptions jusqu\'à 38% pour les dossiers solides.',
    formula: 'Taux d\'endettement = (mensualité prêt + assurance + crédits en cours) ÷ revenus nets × 100'
  },
  quotite: {
    title: '🛡 Quotité d\'assurance',
    body: 'La quotité est le pourcentage du capital emprunté couvert par l\'assurance pour chaque emprunteur. Avec un seul emprunteur, elle doit être à 100%. Avec un co-emprunteur, la somme des deux quotités doit être ≥ 100% (souvent 100/100 ou 70/30).',
    formula: 'Coût mensuel = capital emprunté × taux annuel × quotité ÷ 12'
  },
  garantie: {
    title: '🏦 Frais de garantie bancaire',
    body: 'La garantie bancaire protège la banque en cas de défaut de paiement. Il existe deux formes : l\'hypothèque (notaire, ~1,5%) et le cautionnement (organisme type Crédit Logement, ~1%). Le cautionnement est remboursé partiellement en fin de prêt.',
    formula: 'Estimation : ~1% du capital emprunté'
  },
  rav: {
    title: '💶 Reste à vivre',
    body: 'Le reste à vivre est la somme disponible chaque mois après paiement de toutes vos charges fixes (mensualité prêt, assurance, crédits, charges courantes). Nestimate calcule automatiquement votre plancher personnalisé : 800€/adulte + 400€/enfant selon votre foyer (étape 2).',
    formula: 'Reste à vivre = revenus nets − mensualité totale − autres charges courantes\nPlancher foyer = adultes × 800€ + enfants × 400€'
  },
  taeg: {
    title: '📊 TAEG — Taux Annuel Effectif Global',
    body: 'Le TAEG représente le coût total réel de votre crédit, exprimé en pourcentage annuel. Il intègre le taux nominal, l\'assurance emprunteur, les frais de dossier, de garantie et de courtier. Toute offre de prêt immobilier en France doit obligatoirement l\'afficher (Directive européenne 2014/17/UE).',
    formula: 'Capital net reçu = Σ (mensualité + assurance) ÷ (1 + TAEG/12)^t → résolu par itération'
  },
  assurance: {
    title: '📋 Assurance emprunteur',
    body: 'L\'assurance emprunteur couvre le remboursement du prêt en cas de décès, invalidité ou incapacité de travail. Depuis la loi Lagarde et la loi Lemoine, vous pouvez choisir librement votre assurance (délégation) et en changer à tout moment, souvent pour économiser 30 à 50%.',
    formula: 'Coût annuel ≈ capital × taux (0,10% à 0,50% selon profil et âge)'
  }
};
