/* ==========================================================================
   Comparateur CV / offre : score de correspondance + conseils (100 % local)
   ========================================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = CVRender.esc;
  const norm = s => ' ' + String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ').replace(/[^a-z0-9+#&%/.\- ]+/g, ' ').replace(/\s+/g, ' ') + ' ';

  // ---------- Lexique finance (FR/EN, synonymes) ----------
  // [libellé affiché, catégorie, [variantes]]
  const LEX = [
    // Métiers / domaines
    ['Fusions & acquisitions (M&A)', 'Domaine', ['m&a', 'fusions acquisitions', 'fusions-acquisitions', 'fusions et acquisitions', 'mergers and acquisitions', 'mergers & acquisitions', 'm and a']],
    ['Private Equity', 'Domaine', ['private equity', 'capital investissement', 'capital-investissement']],
    ['Venture Capital', 'Domaine', ['venture capital', 'capital risque', 'capital-risque']],
    ['Corporate Finance', 'Domaine', ['corporate finance', 'finance d entreprise']],
    ['Asset Management', 'Domaine', ['asset management', 'gestion d actifs', 'gestion de portefeuille', 'portfolio management']],
    ['Equity Research', 'Domaine', ['equity research', 'analyse actions', 'recherche actions']],
    ['Leveraged Finance', 'Domaine', ['leveraged finance', 'levfin', 'financements structures', 'financement d acquisition', 'acquisition finance']],
    ['Debt Capital Markets (DCM)', 'Domaine', ['dcm', 'debt capital markets', 'marche obligataire', 'emissions obligataires']],
    ['Equity Capital Markets (ECM)', 'Domaine', ['ecm', 'equity capital markets', 'introduction en bourse', 'ipo']],
    ['Transaction Services', 'Domaine', ['transaction services', 'tas', 'financial due diligence', 'due diligence financiere']],
    ['Audit', 'Domaine', ['audit', 'auditeur', 'commissariat aux comptes', 'external audit', 'audit externe', 'audit interne', 'internal audit']],
    ['Contrôle de gestion', 'Domaine', ['controle de gestion', 'controleur de gestion', 'management control', 'business controlling', 'controlling']],
    ['FP&A', 'Domaine', ['fp&a', 'financial planning', 'planification financiere']],
    ['Trésorerie', 'Domaine', ['tresorerie', 'treasury', 'cash management', 'gestion de tresorerie']],
    ['Gestion des risques', 'Domaine', ['gestion des risques', 'risk management', 'risques financiers', 'market risk', 'risque de marche', 'credit risk', 'risque de credit']],
    ['Conformité / Compliance', 'Domaine', ['compliance', 'conformite']],
    ['Analyse crédit', 'Domaine', ['analyse credit', 'credit analysis', 'analyste credit', 'credit analyst', 'notation', 'credit rating']],
    ['Marchés financiers', 'Domaine', ['marches financiers', 'capital markets', 'financial markets', 'salle des marches', 'trading', 'sales & trading']],
    ['Banque d\'affaires / IB', 'Domaine', ['banque d affaires', 'investment banking', 'banque d investissement', 'corporate & investment banking', 'cib']],
    ['Comptabilité', 'Domaine', ['comptabilite', 'accounting', 'comptable', 'bookkeeping']],
    ['Consolidation', 'Domaine', ['consolidation', 'consolidated', 'consolide']],
    ['Fiscalité', 'Domaine', ['fiscalite', 'tax', 'fiscal']],
    ['Immobilier / Real Estate', 'Domaine', ['real estate', 'immobilier']],
    ['Restructuring', 'Domaine', ['restructuring', 'restructuration']],
    ['Wealth Management', 'Domaine', ['wealth management', 'gestion de patrimoine', 'gestion privee', 'private banking', 'banque privee']],
    ['Financement de projets', 'Domaine', ['project finance', 'financement de projets', 'infrastructure finance']],
    ['ALM', 'Domaine', ['alm', 'asset liability management', 'gestion actif passif', 'gestion actif-passif']],
    // Compétences techniques
    ['Modélisation financière', 'Technique', ['modelisation financiere', 'financial modeling', 'financial modelling', 'modele financier', 'business plan', 'modeles financiers', 'three statement model', '3-statement']],
    ['Valorisation', 'Technique', ['valorisation', 'valuation', 'evaluation d entreprise', 'evaluation financiere', 'business valuation']],
    ['DCF', 'Technique', ['dcf', 'discounted cash flow', 'flux de tresorerie actualises', 'flux actualises']],
    ['LBO', 'Technique', ['lbo', 'leveraged buy-out', 'leveraged buyout', 'leverage buy out']],
    ['Comparables / multiples', 'Technique', ['comparables', 'multiples', 'comps', 'trading comps', 'transaction comps', 'precedent transactions', 'transactions comparables']],
    ['Analyse financière', 'Technique', ['analyse financiere', 'financial analysis', 'analyse des etats financiers', 'financial statement analysis']],
    ['Due diligence', 'Technique', ['due diligence', 'due diligences', 'audit d acquisition']],
    ['Pitch book', 'Technique', ['pitch book', 'pitchbook', 'pitch', 'presentations clients']],
    ['Information memorandum', 'Technique', ['information memorandum', 'memorandum d information', 'teaser', 'im ']],
    ['Reporting', 'Technique', ['reporting', 'reportings', 'tableaux de bord', 'dashboard', 'dashboards']],
    ['Budget / prévisions', 'Technique', ['budget', 'budgets', 'budgetaire', 'forecast', 'forecasts', 'previsions', 'reforecast', 'atterrissage']],
    ['Clôtures comptables', 'Technique', ['cloture', 'clotures', 'closing mensuel', 'month-end', 'month end close', 'closing']],
    ['États financiers', 'Technique', ['etats financiers', 'financial statements', 'bilan', 'compte de resultat', 'p&l', 'balance sheet', 'income statement', 'cash flow statement']],
    ['IFRS', 'Technique', ['ifrs']],
    ['US GAAP', 'Technique', ['us gaap', 'gaap']],
    ['Normes françaises (PCG)', 'Technique', ['pcg', 'normes francaises', 'french gaap']],
    ['Produits dérivés', 'Technique', ['derives', 'produits derives', 'derivatives', 'swaps', 'futures']],
    ['Taux / Fixed Income', 'Technique', ['fixed income', 'taux d interet', 'obligations', 'obligataire', 'bonds']],
    ['Actions / Equity', 'Technique', ['equities', 'actions cotees', 'cash equity']],
    ['VaR', 'Technique', ['var', 'value at risk']],
    ['Bâle III / prudentiel', 'Technique', ['bale iii', 'bale 3', 'basel iii', 'basel', 'crd', 'prudentiel', 'solvabilite ii', 'solvency ii']],
    ['KYC', 'Technique', ['kyc', 'know your customer', 'connaissance client']],
    ['LCB-FT / AML', 'Technique', ['lcb-ft', 'lcb ft', 'aml', 'anti money laundering', 'anti-money laundering', 'blanchiment']],
    ['Gestion de portefeuille', 'Technique', ['allocation d actifs', 'asset allocation', 'construction de portefeuille', 'portfolio construction']],
    ['Analyse sectorielle', 'Technique', ['analyse sectorielle', 'industry analysis', 'sector analysis', 'etude de marche', 'market research']],
    ['Recherche de cibles', 'Technique', ['recherche de cibles', 'sourcing', 'deal sourcing', 'origination', 'screening']],
    ['Suivi de participations', 'Technique', ['suivi de participations', 'portfolio monitoring', 'monitoring des participations']],
    ['Cash-flow / BFR', 'Technique', ['bfr', 'working capital', 'besoin en fonds de roulement', 'cash flow', 'cash-flow', 'free cash flow']],
    ['Contrôle interne', 'Technique', ['controle interne', 'internal control', 'internal controls', 'sox']],
    ['Analyse de rentabilité', 'Technique', ['rentabilite', 'profitability', 'tri', 'irr', 'van', 'npv', 'roi', 'roe']],
    ['Statistiques / économétrie', 'Technique', ['statistiques', 'statistics', 'econometrie', 'econometrics', 'regression']],
    // Outils
    ['Excel', 'Outil', ['excel', 'microsoft excel', 'ms excel', 'tableur']],
    ['VBA', 'Outil', ['vba', 'macros']],
    ['PowerPoint', 'Outil', ['powerpoint', 'power point', 'ppt']],
    ['Python', 'Outil', ['python', 'pandas']],
    ['SQL', 'Outil', ['sql', 'mysql', 'postgresql']],
    ['R', 'Outil', ['rstudio', 'langage r']],
    ['Bloomberg', 'Outil', ['bloomberg']],
    ['Capital IQ', 'Outil', ['capital iq', 'capiq', 's&p capital iq']],
    ['FactSet', 'Outil', ['factset']],
    ['Refinitiv / Eikon', 'Outil', ['refinitiv', 'eikon', 'thomson reuters', 'datastream']],
    ['PitchBook', 'Outil', ['pitchbook data']],
    ['Mergermarket', 'Outil', ['mergermarket']],
    ['SAP', 'Outil', ['sap', 's/4hana', 's4hana', 'sap fi', 'sap co']],
    ['Oracle / Hyperion', 'Outil', ['oracle', 'hyperion', 'essbase']],
    ['Power BI', 'Outil', ['power bi', 'powerbi']],
    ['Tableau', 'Outil', ['tableau software']],
    ['Matlab', 'Outil', ['matlab']],
    ['ERP', 'Outil', ['erp']],
    ['Anaplan', 'Outil', ['anaplan']],
    // Certifications
    ['CFA', 'Certification', ['cfa', 'chartered financial analyst']],
    ['Certification AMF', 'Certification', ['amf', 'certification amf']],
    ['FRM', 'Certification', ['frm', 'financial risk manager']],
    ['ACCA / DSCG / DEC', 'Certification', ['acca', 'dscg', 'dcg', 'expertise comptable', 'expert-comptable', 'cpa']],
    ['Bloomberg Market Concepts', 'Certification', ['bmc', 'bloomberg market concepts']],
    // Langues
    ['Anglais', 'Langue', ['anglais', 'english', 'toeic', 'toefl', 'ielts', 'bilingue anglais']],
    ['Allemand', 'Langue', ['allemand', 'german', 'deutsch']],
    ['Espagnol', 'Langue', ['espagnol', 'spanish']],
    ['Italien', 'Langue', ['italien', 'italian']],
    ['Chinois', 'Langue', ['chinois', 'mandarin', 'chinese']],
    ['Arabe', 'Langue', ['arabe', 'arabic']],
    // Savoir-être
    ['Rigueur', 'Savoir-être', ['rigueur', 'rigoureux', 'rigoureuse', 'attention to detail', 'detail-oriented', 'detail oriented', 'souci du detail', 'precision']],
    ['Esprit d\'analyse', 'Savoir-être', ['esprit d analyse', 'analytique', 'analytical', 'esprit analytique', 'capacites d analyse', 'analytical skills', 'esprit de synthese', 'synthese']],
    ['Travail en équipe', 'Savoir-être', ['travail en equipe', 'teamwork', 'team player', 'esprit d equipe', 'collaboration']],
    ['Communication', 'Savoir-être', ['communication', 'aisance relationnelle', 'relationnel', 'interpersonal', 'presentation skills', 'redactionnel', 'written skills']],
    ['Autonomie', 'Savoir-être', ['autonomie', 'autonome', 'autonomous', 'self-starter', 'independent']],
    ['Résistance au stress', 'Savoir-être', ['resistance au stress', 'pression', 'under pressure', 'fast-paced', 'disponibilite', 'charge de travail']],
    ['Leadership', 'Savoir-être', ['leadership', 'management d equipe', 'encadrement', 'team management', 'manager une equipe']],
    ['Organisation', 'Savoir-être', ['organisation', 'organise', 'organized', 'organised', 'priorisation', 'gestion des priorites', 'time management']],
    ['Curiosité', 'Savoir-être', ['curiosite', 'curieux', 'curieuse', 'curious', 'intellectual curiosity']],
    ['Proactivité', 'Savoir-être', ['proactif', 'proactive', 'force de proposition', 'initiative']],
  ];

  const STOP = new Set(('a au aux avec ce ces cet cette dans de des du elle en et eux il ils je la le les leur lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous c d j l m n s t y ete etre avoir ont sont est sera seront fait faire plus tres tout tous toute toutes ainsi afin aussi autre autres bien car chez comme dont donc entre lors sein sous tant via vers votre etc '
    + 'the and or of to in on for with a an is are be will you your our we as at by from this that it its their they who which have has can may must not more about into within across per'
    + ' poste mission missions profil candidat candidate role job offre stage stagiaire intern internship cdi cdd alternance h/f f/h m/f equipe team entreprise company societe client clients groupe group annee annees year years experience experiences mois month months niveau level bon bonne good strong excellent excellente forte fort capacite capacites ability skills competences connaissance connaissances knowledge requis required souhaite souhaitee preferred plus atout nice idealement ideally travail work travaillerez will rejoindre join opportunite opportunity paris france london londres responsabilites responsibilities principales main description descriptif qualifications rejoignez nous vos votre votre vous issu issue formation type bac+5 date debut start').split(/\s+/));

  // ---------- Extraction de texte des fichiers ----------
  async function readFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) {
      if (!window.pdfjsLib) throw new Error('Lecteur PDF non chargé');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      let out = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i);
        const tc = await pg.getTextContent();
        let lastY = null;
        tc.items.forEach(it => {
          const y = it.transform[5];
          if (lastY !== null && Math.abs(y - lastY) > 2) out += '\n';
          out += it.str + (it.hasEOL ? '\n' : ' ');
          lastY = y;
        });
        out += '\n';
      }
      return { text: out, pages: pdf.numPages };
    }
    if (name.endsWith('.docx')) {
      if (!window.mammoth) throw new Error('Lecteur Word non chargé');
      const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return { text: r.value };
    }
    return { text: await file.text() };
  }

  // ---------- Analyse ----------
  const has = (ntext, v) => ntext.includes(' ' + v.trim() + ' ') || (v.length > 4 && ntext.includes(' ' + v.trim()));

  function lexHits(ntext) {
    return LEX.filter(([, , vars]) => vars.some(v => has(ntext, norm(v).trim())));
  }

  function tokens(ntext) {
    return ntext.split(' ').map(t => t.replace(/^[.\-/]+|[.\-/]+$/g, '')).filter(t => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t));
  }

  // Mots-clés "libres" (hors lexique) fréquents ou importants dans l'offre
  function freeKeywords(offerN, lexVariants) {
    const toks = tokens(offerN);
    const counts = {};
    toks.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    for (let i = 0; i < toks.length - 1; i++) {
      const bg = toks[i] + ' ' + toks[i + 1];
      if (offerN.includes(' ' + bg + ' ')) counts[bg] = (counts[bg] || 0) + 1.5;
    }
    const covered = w => lexVariants.some(v => v.includes(w) || w.includes(v));
    return Object.entries(counts)
      .filter(([w, c]) => c >= 2 && !covered(w))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([w]) => w)
      // évite doublons unigramme/bigramme
      .filter((w, i, arr) => !arr.some((o, j) => j < i && o.includes(w)));
  }

  const ACTION_VERBS = ['analyse', 'modelise', 'pilote', 'realise', 'construit', 'redige', 'coordonne', 'gere', 'developpe', 'optimise', 'participe', 'prepare', 'elabore', 'conduit', 'supervise', 'negocie', 'automatise', 'ameliore', 'mis en place', 'mene', 'evalue', 'structure', 'conseille', 'accompagne', 'identifie', 'presente', 'audite', 'controle', 'produit', 'cree', 'lance', 'reduit', 'augmente', 'genere',
    'analyzed', 'analysed', 'built', 'modeled', 'modelled', 'led', 'managed', 'developed', 'prepared', 'conducted', 'drafted', 'coordinated', 'performed', 'supported', 'executed', 'created', 'designed', 'improved', 'reduced', 'increased', 'delivered', 'assisted', 'reviewed', 'valued', 'structured', 'negotiated', 'launched'];

  function analyse(cvText, offerText, jobTitle, cvObj, pdfPages) {
    const cvN = norm(cvText), ofN = norm(offerText);

    // 1. Compétences du lexique demandées par l'offre
    const req = lexHits(ofN);
    const reqDetail = req.map(([label, cat, vars]) => {
      const nv = vars.map(v => norm(v).trim());
      // pondération : nombre d'occurrences dans l'offre
      const occ = nv.reduce((n, v) => n + (ofN.split(' ' + v + ' ').length - 1), 0);
      const weight = (cat === 'Savoir-être' ? 0.6 : cat === 'Langue' ? 0.9 : 1) * (occ >= 2 ? 1.5 : 1);
      return { label, cat, weight, hit: nv.some(v => has(cvN, v)) };
    });
    const hardReq = reqDetail.filter(r => r.cat !== 'Savoir-être');
    const softReq = reqDetail.filter(r => r.cat === 'Savoir-être');
    const ratio = arr => arr.length ? arr.filter(r => r.hit).reduce((s, r) => s + r.weight, 0) / arr.reduce((s, r) => s + r.weight, 0) : 1;

    // 2. Mots-clés libres
    const allVariants = LEX.flatMap(l => l[2].map(v => norm(v).trim()));
    const free = freeKeywords(ofN, allVariants).map(w => ({ label: w, hit: has(cvN, w) }));

    // 3. Intitulé du poste
    const title = jobTitle || guessTitle(offerText);
    const tTok = tokens(norm(title));
    const titleHits = tTok.filter(t => has(cvN, t));
    const titleScore = tTok.length ? titleHits.length / tTok.length : 1;
    const cvTitleN = norm(cvObj ? cvObj.personal.title : cvText.split('\n').slice(0, 4).join(' '));
    const titleInHeader = tTok.length ? tTok.filter(t => has(cvTitleN, t)).length / tTok.length : 1;

    // 4. Qualité / format ATS
    const checks = atsChecks(cvText, cvN, cvObj, pdfPages);
    const fmtScore = checks.filter(c => c.ok).reduce((s, c) => s + c.w, 0) / checks.reduce((s, c) => s + c.w, 0);

    // 5. Niveau d'études / expérience exigés
    const eduReq = /(bac ?\+ ?5|master|msc|grande ecole|ecole de commerce|ecole d ingenieur|business school|mba)/.test(ofN);
    const eduHit = !eduReq || /(bac ?\+ ?5|master|msc|grande ecole|business school|mba|ecole|essec|hec|escp|edhec|em lyon|skema|neoma|dauphine|sorbonne|ingenieur)/.test(cvN);
    const yrs = ofN.match(/(\d{1,2})\s*(?:a|-|à)?\s*\d{0,2}\s*(?:ans|years|annees)\s*(?:d |of )?(?:experience|exp)/);

    const parts = {
      hard: { label: 'Compétences & mots-clés métier', weight: 45, score: ratio(hardReq) },
      free: { label: 'Autres mots-clés de l\'offre', weight: 15, score: free.length ? free.filter(f => f.hit).length / free.length : 1 },
      title: { label: 'Intitulé de poste', weight: 10, score: (titleScore * 0.6 + titleInHeader * 0.4) },
      soft: { label: 'Savoir-être', weight: 8, score: ratio(softReq) },
      edu: { label: 'Formation demandée', weight: 4, score: eduHit ? 1 : 0 },
      fmt: { label: 'Format & lisibilité ATS', weight: 18, score: fmtScore },
    };
    const total = Math.round(Object.values(parts).reduce((s, p) => s + p.weight * p.score, 0));

    return { total, parts, hardReq, softReq, free, title, titleInHeader, checks, eduReq, eduHit, yrs: yrs ? +yrs[1] : null };
  }

  function guessTitle(offer) {
    const lines = offer.split('\n').map(l => l.trim()).filter(Boolean);
    const cand = lines.find(l => l.length < 90 && /(analyst|analyste|associate|stagiaire|stage|intern|controleur|contr[ôo]leur|auditeur|auditor|charg[ée]|manager|gestionnaire|consultant|trader|comptable|accountant|tr[ée]sorier|treasury|risk|credit|financ)/i.test(l));
    return (cand || lines[0] || '').replace(/\(?\s*\b(h\/f|f\/h|m\/f)\b\s*\)?/gi, ' ').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  }

  function atsChecks(text, n, cv, pdfPages) {
    const bullets = cv
      ? ['experience', 'activities'].flatMap(k => cv[k].flatMap(e => CVRender.cleanLines(e.details)))
      : text.split('\n').filter(l => /^\s*[-•*–·▪●➢]/.test(l)).map(l => l.replace(/^\s*[-•*–·▪●➢]\s*/, ''));
    const quantified = bullets.filter(b => /\d/.test(b));
    const nb = s => norm(s).trim();
    const withVerb = bullets.filter(b => ACTION_VERBS.some(v => nb(b).startsWith(v) || nb(b).split(' ').slice(0, 2).includes(v)));
    const words = text.split(/\s+/).filter(Boolean).length;
    const hasSection = re => re.test(n);
    const list = [
      { ok: /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text), w: 3, label: 'Email présent', tip: 'Ajoutez une adresse email professionnelle (prenom.nom@…).' },
      { ok: /(\+?\d[\d .\-]{8,}\d)/.test(text), w: 2, label: 'Téléphone présent', tip: 'Ajoutez votre numéro de téléphone avec indicatif (+33).' },
      { ok: /linkedin/.test(n), w: 1, label: 'Profil LinkedIn', tip: 'Ajoutez l\'URL de votre profil LinkedIn (les recruteurs finance le consultent systématiquement).' },
      { ok: hasSection(/ (experience|experiences|professional experience|work experience) /), w: 3, label: 'Section « Expérience » identifiable', tip: 'Utilisez un titre standard : « Expérience professionnelle » ou « Professional Experience ». Les ATS ne reconnaissent pas les titres originaux.' },
      { ok: hasSection(/ (formation|education|etudes) /), w: 3, label: 'Section « Formation » identifiable', tip: 'Titrez la section « Formation » ou « Education ».' },
      { ok: hasSection(/ (competences|skills) /), w: 2, label: 'Section « Compétences » identifiable', tip: 'Ajoutez une section « Compétences » listant outils et techniques : c\'est là que les ATS cherchent les mots-clés.' },
      { ok: bullets.length >= 4, w: 2, label: 'Réalisations sous forme de puces', tip: 'Décrivez chaque expérience en 3 à 5 puces courtes plutôt qu\'en paragraphe.' },
      { ok: bullets.length === 0 || quantified.length / bullets.length >= 0.4, w: 3, label: `Résultats chiffrés (${quantified.length}/${bullets.length} puces)`, tip: 'Chiffrez au moins la moitié de vos puces : montants (M€), nombre de deals, %, délais, taille d\'équipe.' },
      { ok: bullets.length === 0 || withVerb.length / bullets.length >= 0.5, w: 2, label: `Verbes d'action (${withVerb.length}/${bullets.length} puces)`, tip: 'Commencez chaque puce par un verbe d\'action au passé : Analysé, Modélisé, Coordonné, Rédigé, Piloté…' },
      { ok: words >= 250 && words <= 750, w: 2, label: `Longueur adaptée (${words} mots)`, tip: words < 250 ? 'Votre CV est trop court : développez vos réalisations et compétences (cible : 350–650 mots pour une page).' : 'Votre CV est trop dense : visez 350–650 mots pour une page A4.' },
      { ok: /(19|20)\d{2}/.test(text), w: 1, label: 'Dates présentes', tip: 'Indiquez des dates (mois et année) pour chaque expérience et formation.' },
    ];
    if (pdfPages) list.push({ ok: pdfPages === 1, w: 3, label: `Une seule page (${pdfPages} page${pdfPages > 1 ? 's' : ''})`, tip: 'En finance, le CV doit tenir sur une seule page A4.' });
    if (pdfPages !== undefined && text.trim().length < 200) list.push({ ok: false, w: 6, label: 'Texte extractible du PDF', tip: 'Le PDF semble être une image (scan / export image) : les ATS ne peuvent pas le lire. Exportez depuis CV Studio ou Word.' });
    return list;
  }

  // ---------- Conseils ----------
  function buildTips(r, cvObj) {
    const tips = [];
    const missHard = r.hardReq.filter(x => !x.hit).sort((a, b) => b.weight - a.weight);
    const missSoft = r.softReq.filter(x => !x.hit);
    const missFree = r.free.filter(x => !x.hit);

    if (missHard.length) tips.push({ p: 'high', t: `<b>Ajoutez les compétences clés absentes</b> si vous les maîtrisez : ${missHard.slice(0, 8).map(x => `<i>${esc(x.label)}</i>`).join(', ')}. Placez-les dans la section Compétences <u>et</u> dans une puce d'expérience qui prouve leur utilisation (ex. « Modélisé un LBO… »).` });
    const missTools = missHard.filter(x => x.cat === 'Outil');
    if (missTools.length) tips.push({ p: 'high', t: `Les ATS filtrent souvent sur les <b>outils</b> : ${missTools.map(x => esc(x.label)).join(', ')}. Indiquez votre niveau (ex. « Excel avancé – VBA »).` });
    const missLang = missHard.filter(x => x.cat === 'Langue');
    if (missLang.length) tips.push({ p: 'high', t: `Langue demandée non trouvée : ${missLang.map(x => esc(x.label)).join(', ')}. Mentionnez-la avec un niveau objectif (C1, TOEIC 950, IELTS 7.5…).` });
    const missCert = missHard.filter(x => x.cat === 'Certification');
    if (missCert.length) tips.push({ p: 'med', t: `Certification citée dans l'offre : ${missCert.map(x => esc(x.label)).join(', ')}. Si vous êtes en cours de préparation, indiquez « CFA Level I – candidat(e) juin 2026 ».` });
    if (r.titleInHeader < 0.5 && r.title) tips.push({ p: 'high', t: `<b>Reprenez l'intitulé du poste</b> sous votre nom : « ${esc(r.title)} ». Les ATS et recruteurs comparent d'abord le titre du CV à celui de l'offre.` });
    if (missFree.length) tips.push({ p: 'med', t: `Intégrez naturellement ces termes récurrents de l'offre : ${missFree.slice(0, 10).map(x => `<i>${esc(x.label)}</i>`).join(', ')}.` });
    if (missSoft.length) tips.push({ p: 'low', t: `Savoir-être recherchés : ${missSoft.map(x => esc(x.label)).join(', ')}. Évitez de les lister seuls : illustrez-les dans le profil ou une puce (« Coordonné une équipe de 4… »).` });
    if (r.eduReq && !r.eduHit) tips.push({ p: 'med', t: 'L\'offre exige un niveau Bac+5 / Master / Grande École : rendez votre diplôme et votre école bien visibles (intitulé exact, spécialisation).' });
    if (r.yrs) tips.push({ p: 'low', t: `L'offre mentionne <b>${r.yrs} an(s) d'expérience</b> : faites apparaître clairement la durée de vos expériences (dates mois/année) et additionnez stages et alternance pertinents.` });
    r.checks.filter(c => !c.ok).forEach(c => tips.push({ p: c.w >= 3 ? 'high' : 'med', t: c.tip }));
    tips.push({ p: 'low', t: 'Format ATS : une seule colonne, pas de tableaux ni de zones de texte, police standard (Calibri, Arial, Georgia), titres de section classiques, fichier PDF texte ou .docx. Les modèles CV Studio respectent ces règles.' });
    if (cvObj && cvObj.style.showPhoto) tips.push({ p: 'low', t: 'Photo : acceptée en France, mais à retirer pour les candidatures en anglais (UK/US) où elle peut entraîner un rejet automatique.' });
    if (!r.hardReq.length && !r.free.length) tips.unshift({ p: 'high', t: 'Très peu de mots-clés détectés dans l\'offre : collez le texte complet (missions + profil recherché).' });
    const order = { high: 0, med: 1, low: 2 };
    return tips.sort((a, b) => order[a.p] - order[b.p]);
  }

  // ======================================================================
  //  INTERFACE
  // ======================================================================
  let source = 'saved';
  let fileData = null;
  const params = new URLSearchParams(location.search);

  function fillSelect() {
    const sel = $('#cv-pick');
    const pre = params.get('cv') || (Store.current() && Store.current().id);
    sel.innerHTML = Store.all().map(c => `<option value="${c.id}" ${c.id === pre ? 'selected' : ''}>${esc(c.name)}${Store.fullName(c) ? ' — ' + esc(Store.fullName(c)) : ''}</option>`).join('');
  }
  fillSelect();
  try { const o = localStorage.getItem('cvstudio.offer.v1'); if (o) $('#offer-text').value = o; const t = localStorage.getItem('cvstudio.offertitle.v1'); if (t) $('#offer-title').value = t; } catch (e) { }

  $$('[data-src]').forEach(b => b.onclick = () => {
    source = b.dataset.src;
    $$('[data-src]').forEach(x => x.classList.toggle('primary', x === b));
    $$('.src-pane').forEach(p => p.hidden = p.dataset.pane !== source);
  });

  $('#cv-file').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    $('#file-status').textContent = 'Lecture…';
    try {
      fileData = await readFile(f);
      $('#file-status').textContent = `✓ ${f.name} — ${fileData.text.split(/\s+/).filter(Boolean).length} mots extraits${fileData.pages ? `, ${fileData.pages} page(s)` : ''}`;
    } catch (err) { $('#file-status').textContent = '✗ ' + err.message; fileData = null; }
  };

  $('#btn-analyse').onclick = () => {
    const offer = $('#offer-text').value.trim();
    if (offer.length < 80) return alert('Collez le texte complet de l\'offre (missions et profil recherché).');
    try { localStorage.setItem('cvstudio.offer.v1', offer); localStorage.setItem('cvstudio.offertitle.v1', $('#offer-title').value); } catch (e) { }
    let cvText = '', cvObj = null, pages;
    if (source === 'saved') { cvObj = Store.get($('#cv-pick').value); cvText = CVRender.toText(cvObj); }
    else if (source === 'paste') cvText = $('#cv-text').value;
    else if (source === 'file') { if (!fileData) return alert('Choisissez un fichier PDF ou Word.'); cvText = fileData.text; pages = fileData.pages ?? undefined; }
    if (cvText.trim().length < 50 && source !== 'file') return alert('Le CV est vide.');
    const r = analyse(cvText, offer, $('#offer-title').value.trim(), cvObj, pages);
    showResults(r, cvObj);
  };

  function showResults(r, cvObj) {
    const res = $('#results');
    res.classList.add('show');
    const color = r.total >= 75 ? 'var(--ok)' : r.total >= 55 ? 'var(--warn)' : 'var(--bad)';
    const verdict = r.total >= 80 ? 'Excellent match — candidature prête' : r.total >= 65 ? 'Bon match — quelques optimisations' : r.total >= 50 ? 'Match moyen — à retravailler' : 'Faible match — CV à adapter à l\'offre';
    const C = 2 * Math.PI * 86;
    $('#score-card').innerHTML = `
      <div class="gauge"><svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="86" fill="none" stroke="#eef1f5" stroke-width="16"/>
        <circle cx="100" cy="100" r="86" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - r.total / 100)}" style="transition:stroke-dashoffset .8s"/>
      </svg><div class="val"><div><b style="color:${color}">${r.total}</b><small>/ 100</small></div></div></div>
      <div class="verdict" style="color:${color}">${verdict}</div>
      ${Object.values(r.parts).map(p => `
        <div class="bar-row"><div class="lbl"><span>${p.label}</span><span>${Math.round(p.score * 100)}%</span></div>
        <div class="bar"><i style="width:${Math.round(p.score * 100)}%;background:${p.score >= .75 ? 'var(--ok)' : p.score >= .5 ? 'var(--warn)' : 'var(--bad)'}"></i></div></div>`).join('')}
      <p class="inline-hint">Pondération : métier 45 · autres mots-clés 15 · format 18 · titre 10 · savoir-être 8 · formation 4. Le score est une estimation : chaque ATS (Workday, Taleo, SuccessFactors…) a ses propres règles, mais tous reposent sur la correspondance de mots-clés.</p>`;

    const chip = (x, canAdd) => x.hit
      ? `<span class="kw hit">✓ ${esc(x.label)}</span>`
      : `<span class="kw miss">${canAdd ? `<input type="checkbox" class="add-kw" value="${esc(x.label)}">` : '✗'} ${esc(x.label)}</span>`;
    const canAdd = !!cvObj;
    const groups = {};
    r.hardReq.forEach(x => { (groups[x.cat] = groups[x.cat] || []).push(x); });
    const catOrder = ['Domaine', 'Technique', 'Outil', 'Certification', 'Langue'];
    $('#kw-card').innerHTML = `
      <h3 style="margin-top:0">Mots-clés de l'offre</h3>
      ${r.title ? `<p class="inline-hint">Poste détecté : <b>${esc(r.title)}</b></p>` : ''}
      ${catOrder.filter(c => groups[c]).map(c => `<div class="kw-group"><h4>${c === 'Domaine' ? 'Domaine / métier' : c + 's'} <small class="inline-hint">${groups[c].filter(x => x.hit).length}/${groups[c].length}</small></h4>${groups[c].map(x => chip(x, canAdd)).join('')}</div>`).join('')}
      ${r.softReq.length ? `<div class="kw-group"><h4>Savoir-être <small class="inline-hint">${r.softReq.filter(x => x.hit).length}/${r.softReq.length}</small></h4>${r.softReq.map(x => chip(x, false)).join('')}</div>` : ''}
      ${r.free.length ? `<div class="kw-group"><h4>Autres termes fréquents <small class="inline-hint">${r.free.filter(x => x.hit).length}/${r.free.length}</small></h4>${r.free.map(x => chip(x, canAdd)).join('')}</div>` : ''}
      ${canAdd && r.hardReq.concat(r.free).some(x => !x.hit) ? `<div class="note" style="margin-top:8px">Cochez les compétences manquantes <b>que vous maîtrisez réellement</b>, puis :
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn sm primary" id="add-kw-btn">Ajouter à « ${esc(cvObj.name)} »</button><button class="btn sm" id="add-kw-copy">Ajouter à une copie du CV (adaptée à l'offre)</button></div></div>` : ''}
      <h3>Vérifications ATS</h3>
      <ul class="checks">${r.checks.map(c => `<li class="${c.ok ? '' : 'ko'}">${esc(c.label)}</li>`).join('')}</ul>`;

    const tips = buildTips(r, cvObj);
    $('#tips-card').innerHTML = `<h3 style="margin-top:0">Conseils pour améliorer votre score</h3>
      <ul class="tips">${tips.map(t => `<li><span class="prio ${t.p}">${{ high: 'Priorité', med: 'Important', low: 'Bonus' }[t.p]}</span><span>${t.t}</span></li>`).join('')}</ul>
      ${cvObj ? `<p style="margin-top:12px"><a class="btn primary" href="index.html" id="go-edit">✎ Modifier ce CV dans l'éditeur</a></p>` : ''}`;

    const addBtn = $('#add-kw-btn'), addCopy = $('#add-kw-copy');
    const doAdd = copy => {
      const kws = $$('.add-kw:checked').map(i => i.value);
      if (!kws.length) return alert('Cochez au moins une compétence.');
      let target = cvObj;
      if (copy) { target = Store.duplicate(cvObj.id); target.name = cvObj.name + ' — ' + (r.title || 'offre').slice(0, 40); }
      let grp = target.skills.find(s => /cl[ée]s|key|offre/i.test(s.category));
      if (!grp) { grp = { ...Store.emptyEntry('skills'), category: 'Compétences clés' }; target.skills.unshift(grp); }
      const existing = grp.items.split(',').map(s => s.trim()).filter(Boolean);
      grp.items = [...existing, ...kws.filter(k => !existing.includes(k))].join(', ');
      if (target.hidden.includes('skills')) target.hidden = target.hidden.filter(h => h !== 'skills');
      Store.save(target); Store.setCurrent(target.id);
      fillSelect(); $('#cv-pick').value = target.id;
      $('#btn-analyse').click();
      alert(`${kws.length} compétence(s) ajoutée(s) dans « ${target.name} » (groupe « ${grp.category} »). Pensez à les illustrer dans vos expériences.`);
    };
    addBtn && (addBtn.onclick = () => doAdd(false));
    addCopy && (addCopy.onclick = () => doAdd(true));
    const go = $('#go-edit'); go && (go.onclick = () => Store.setCurrent(cvObj.id));
    res.scrollIntoView({ behavior: 'smooth' });
  }
})();
