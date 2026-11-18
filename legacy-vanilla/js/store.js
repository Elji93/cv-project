/* ==========================================================================
   Stockage local des CV (localStorage) + modèle de données
   ========================================================================== */
(function () {
  const KEY = 'cvstudio.cvs.v1';
  const CUR = 'cvstudio.current.v1';

  const uid = () => Math.random().toString(36).slice(2, 10);

  // Sections disponibles (clé, titre par défaut, type)
  const SECTIONS = [
    { key: 'summary', title: 'Profil', type: 'text', label: 'Profil' },
    { key: 'experience', title: 'Expérience professionnelle', type: 'entries', label: 'Expériences' },
    { key: 'education', title: 'Formation', type: 'entries', label: 'Études' },
    { key: 'activities', title: 'Activités & engagements', type: 'entries', label: 'Activités' },
    { key: 'skills', title: 'Compétences', type: 'skills', label: 'Compétences' },
    { key: 'certifications', title: 'Certifications', type: 'certs', label: 'Certifications' },
    { key: 'languages', title: 'Langues', type: 'langs', label: 'Langues' },
    { key: 'interests', title: "Centres d'intérêt", type: 'text', label: 'Intérêts' },
  ];

  const DEFAULT_STYLE = {
    template: 'classic',
    accent: '#1f3a5f',
    font: 'Calibri',
    fontSize: 10,
    lineHeight: 1.25,
    margin: 14,
    gap: 1,
    showPhoto: false,
    photoShape: 'round',
    titlesUpper: true,
    headerLeft: false,
    datesLeft: false,
  };

  function emptyEntry(kind) {
    if (kind === 'skills') return { id: uid(), category: '', items: '' };
    if (kind === 'languages') return { id: uid(), name: '', level: '' };
    if (kind === 'certifications') return { id: uid(), name: '', issuer: '', date: '' };
    // experience / education / activities
    return { id: uid(), org: '', role: '', location: '', start: '', end: '', details: '' };
  }

  function blankCV(name) {
    return {
      id: uid(),
      name: name || 'Nouveau CV',
      updatedAt: Date.now(),
      personal: { firstName: '', lastName: '', title: '', email: '', phone: '', location: '', linkedin: '', website: '', extra: '', photo: '' },
      summary: '',
      experience: [emptyEntry('experience')],
      education: [emptyEntry('education')],
      activities: [],
      skills: [emptyEntry('skills')],
      certifications: [],
      languages: [emptyEntry('languages')],
      interests: '',
      order: SECTIONS.map(s => s.key),
      hidden: [],
      titles: {},
      style: { ...DEFAULT_STYLE },
    };
  }

  function sampleCV() {
    const cv = blankCV('Exemple — Analyste M&A');
    cv.personal = {
      firstName: 'Camille', lastName: 'Martin', title: 'Analyste Fusions & Acquisitions',
      email: 'camille.martin@email.com', phone: '+33 6 12 34 56 78', location: 'Paris, France',
      linkedin: 'linkedin.com/in/camille-martin', website: '', extra: '', photo: '',
    };
    cv.summary = "Diplômée d'un Master en Finance (ESSEC), 2 stages en M&A et Private Equity. Maîtrise de la modélisation financière (DCF, LBO, comparables) et de l'exécution de transactions mid-cap. Anglais courant (TOEIC 960).";
    cv.experience = [
      { id: uid(), org: 'Banque d\'affaires XYZ', role: 'Stagiaire Analyste M&A', location: 'Paris', start: 'Janv. 2025', end: 'Juin 2025',
        details: "Participé à 3 mandats de cession sell-side (VE cumulée 450 M€) dans les secteurs industrie et santé\nConstruit des modèles DCF et LBO sous Excel, analyses de comparables boursiers et transactionnels\nRédigé des teasers, information memorandums et pitch books pour des clients mid-cap\nCoordonné la data room et les Q&A lors de la due diligence avec 12 acquéreurs potentiels" },
      { id: uid(), org: 'Fonds de Private Equity ABC', role: 'Stagiaire Analyste Investissement', location: 'Paris', start: 'Juin 2024', end: 'Déc. 2024',
        details: "Analysé 40+ dossiers d'investissement (tickets 10–50 M€) et rédigé 5 notes d'investissement\nModélisé des structures LBO (TRI, multiple) et réalisé des analyses de sensibilité\nSuivi de 6 participations : reporting trimestriel, KPIs et préparation des comités" },
    ];
    cv.education = [
      { id: uid(), org: 'ESSEC Business School', role: 'Master in Finance — Majeure Corporate Finance', location: 'Cergy', start: '2023', end: '2025', details: 'Cours : Corporate Finance, LBO Modeling, Valuation, Financial Statement Analysis' },
      { id: uid(), org: 'Université Paris-Dauphine', role: 'Licence Économie & Gestion — Mention Bien', location: 'Paris', start: '2020', end: '2023', details: '' },
    ];
    cv.activities = [
      { id: uid(), org: 'ESSEC Finance Club', role: 'Trésorière', location: 'Cergy', start: '2023', end: '2024', details: 'Organisé 8 conférences avec des banques d\'affaires (500+ participants)' },
    ];
    cv.skills = [
      { id: uid(), category: 'Techniques', items: 'Modélisation financière, DCF, LBO, comparables, analyse financière, IFRS' },
      { id: uid(), category: 'Outils', items: 'Excel (avancé, VBA), PowerPoint, Bloomberg, Capital IQ, FactSet, Python' },
    ];
    cv.certifications = [{ id: uid(), name: 'CFA Level I', issuer: 'CFA Institute', date: '2024' }, { id: uid(), name: 'Certification AMF', issuer: 'AMF', date: '2023' }];
    cv.languages = [
      { id: uid(), name: 'Français', level: 'Langue maternelle' },
      { id: uid(), name: 'Anglais', level: 'Courant (TOEIC 960)' },
      { id: uid(), name: 'Espagnol', level: 'Intermédiaire (B2)' },
    ];
    cv.interests = 'Marathon (3h25), échecs en club, bénévolat chez Article 1 (mentorat)';
    return cv;
  }

  function normalize(cv) {
    const base = blankCV();
    const out = { ...base, ...cv };
    out.personal = { ...base.personal, ...(cv.personal || {}) };
    out.style = { ...DEFAULT_STYLE, ...(cv.style || {}) };
    out.titles = cv.titles || {};
    out.hidden = cv.hidden || [];
    const keys = SECTIONS.map(s => s.key);
    out.order = (cv.order || []).filter(k => keys.includes(k));
    keys.forEach(k => { if (!out.order.includes(k)) out.order.push(k); });
    ['experience', 'education', 'activities', 'skills', 'certifications', 'languages'].forEach(k => {
      out[k] = (out[k] || []).map(e => ({ ...emptyEntry(k), ...e, id: e.id || uid() }));
    });
    return out;
  }

  function loadAll() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(raw) && raw.length) return raw.map(normalize);
    } catch (e) { /* stockage indisponible */ }
    return [sampleCV()];
  }

  let cvs = loadAll();
  let currentId = (() => { try { return localStorage.getItem(CUR); } catch (e) { return null; } })();
  if (!cvs.find(c => c.id === currentId)) currentId = cvs[0].id;

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cvs));
      localStorage.setItem(CUR, currentId);
    } catch (e) {
      console.warn('Sauvegarde impossible', e);
      window.UI && UI.toast('⚠ Sauvegarde impossible (stockage plein ? photo trop lourde ?)');
    }
  }

  const Store = {
    SECTIONS, DEFAULT_STYLE, uid, emptyEntry, blankCV, sampleCV, normalize,
    all: () => cvs,
    get: id => cvs.find(c => c.id === id),
    current: () => cvs.find(c => c.id === currentId),
    setCurrent(id) { currentId = id; persist(); },
    save(cv) { cv.updatedAt = Date.now(); persist(); },
    create(name, fromSample) {
      const cv = fromSample ? sampleCV() : blankCV(name);
      if (name) cv.name = name;
      cvs.unshift(cv); currentId = cv.id; persist(); return cv;
    },
    duplicate(id) {
      const src = Store.get(id); if (!src) return;
      const copy = normalize(JSON.parse(JSON.stringify(src)));
      copy.id = uid(); copy.name = src.name + ' (copie)';
      cvs.unshift(copy); currentId = copy.id; persist(); return copy;
    },
    remove(id) {
      cvs = cvs.filter(c => c.id !== id);
      if (!cvs.length) cvs = [blankCV()];
      if (!cvs.find(c => c.id === currentId)) currentId = cvs[0].id;
      persist();
    },
    replace(cv) {
      const i = cvs.findIndex(c => c.id === cv.id);
      if (i >= 0) cvs[i] = normalize(cv); else cvs.unshift(normalize(cv));
      persist();
    },
    sectionTitle(cv, key) {
      return (cv.titles && cv.titles[key]) || SECTIONS.find(s => s.key === key).title;
    },
    fullName(cv) { return [cv.personal.firstName, cv.personal.lastName].filter(Boolean).join(' '); },
  };

  window.Store = Store;
})();
