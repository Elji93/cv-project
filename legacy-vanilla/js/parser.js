/* ==========================================================================
   Import rapide : transforme un texte collé (ou du JSON) en CV structuré
   ========================================================================== */
(function () {
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  // Titres de sections reconnus (FR + EN)
  const HEADINGS = {
    summary: ['profil', 'resume', 'a propos', 'objectif', 'summary', 'profile', 'about', 'objective', 'presentation'],
    experience: ['experience', 'experiences', 'experience professionnelle', 'experiences professionnelles', 'parcours professionnel', 'professional experience', 'work experience', 'employment', 'stages', 'experience pro'],
    education: ['formation', 'formations', 'etudes', 'education', 'diplomes', 'parcours academique', 'cursus', 'academic background'],
    activities: ['activites', 'activites & engagements', 'engagements', 'associations', 'vie associative', 'leadership', 'activities', 'extracurricular', 'projets', 'projects', 'benevolat'],
    skills: ['competences', 'competences techniques', 'skills', 'technical skills', 'outils', 'informatique', 'savoir-faire', 'hard skills'],
    certifications: ['certifications', 'certificats', 'certification', 'certificates', 'licences'],
    languages: ['langues', 'languages', 'langue'],
    interests: ["centres d'interet", 'centres d interet', 'interets', 'loisirs', 'hobbies', 'interests', 'divers', 'autres'],
  };

  const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
  const PHONE = /(\+?\d[\d .\-()]{7,}\d)/;
  const LINKEDIN = /(https?:\/\/)?(www\.)?linkedin\.com\/[^\s|,;]+/i;
  const URL = /(https?:\/\/)?(www\.)?[a-z0-9-]+\.(com|fr|io|net|org|dev|me)(\/[^\s|,;]*)?/i;
  const MONTH = '(?:janv?\\.?|fevr?\\.?|févr?\\.?|mars|avr\\.?|mai|juin|juil\\.?|aout|août|sept?\\.?|oct\\.?|nov\\.?|dec\\.?|déc\\.?|jan\\.?|feb\\.?|mar\\.?|apr\\.?|may|jun\\.?|jul\\.?|aug\\.?|janvier|fevrier|février|avril|juillet|septembre|octobre|novembre|decembre|décembre|january|february|march|april|june|july|august|september|october|november|december)';
  const DATE = `(?:${MONTH}\\s*)?(?:\\d{1,2}\\/)?\\d{4}`;
  const RANGE = new RegExp(`(${DATE})\\s*(?:[-–—]|à|a|to|>)\\s*(${DATE}|aujourd'hui|aujourd’hui|present|présent|actuel|en cours|today|now)`, 'i');
  const SINGLE = new RegExp(`(?:^|\\s|\\(|,)(${DATE})(?:\\)|$|\\s)`, 'i');
  const BULLET = /^\s*[-•*–·▪●➢>]\s+/;

  function detectHeading(line) {
    const n = norm(line).replace(/[:\-–—_=#*]+$/g, '').replace(/^[#*\s]+/, '').trim();
    if (!n || n.length > 40) return null;
    for (const [key, words] of Object.entries(HEADINGS)) {
      if (words.includes(n)) return key;
    }
    return null;
  }

  // Sépare une ligne d'en-tête d'entrée : "Entreprise | Poste | Lieu | Dates"
  function parseEntryHead(text) {
    const res = { org: '', role: '', location: '', start: '', end: '' };
    let t = text;
    const r = t.match(RANGE);
    if (r) { res.start = cap(r[1]); res.end = cap(r[2]); t = t.replace(r[0], ' '); }
    else {
      const s = t.match(SINGLE);
      if (s) { res.end = s[1]; t = t.replace(s[1], ' '); }
    }
    t = t.replace(/[()]/g, ' ');
    const roleFirst = /\s(chez|at|@)\s/i.test(t);
    const parts = t.split(/\s[|–—]\s|\s-\s|\||\t|,\s(?=[A-ZÉ])|\s+chez\s+|\s+at\s+|\s+@\s+/).map(x => x.trim()).filter(Boolean);
    if (parts.length >= 1) res.org = parts[0];
    if (parts.length >= 2) res.role = parts[1];
    if (parts.length >= 3) res.location = parts.slice(2).join(', ');
    // Heuristique : le premier élément ressemble à un poste / diplôme -> on inverse
    const looksRole = s => ROLE_WORDS.test(s);
    if (parts.length >= 2 && (roleFirst || (looksRole(res.org) && !looksRole(res.role)))) {
      [res.org, res.role] = [res.role, res.org];
    }
    return res;
  }
  const ROLE_WORDS = /\b(stagiaire|stage|alternan|analyste|analyst|intern|associate|associ[ée]|contr[ôo]leur|auditeur|auditor|manager|charg[ée]|assistant|consultant|junior|senior|directeur|director|responsable|trader|comptable|accountant|gestionnaire|vice[- ]pr[ée]sident|vp|tr[ée]sori|master|licence|bachelor|msc|mba|dipl[ôo]me|\bbac\b|dut|bts|but|cpge|pr[ée]pa|doctorat|phd|programme grande [ée]cole|pge)/i;
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  function parseEntries(block, kind) {
    const out = [];
    let cur = null;
    let afterBlank = false;
    block.forEach(raw => {
      const line = raw.trim();
      if (!line) { afterBlank = true; return; }
      const blank = afterBlank; afterBlank = false;
      if (BULLET.test(line) && cur) {
        cur.details += (cur.details ? '\n' : '') + line.replace(BULLET, '');
        return;
      }
      const hasDate = RANGE.test(line) || SINGLE.test(line);
      const looksLikeSentence = line.length > 90 || /\.$/.test(line);
      if (cur && hasDate && !blank && !cur.start && !cur.end && !cur.details) {
        const h = parseEntryHead(line);
        cur.start = h.start; cur.end = h.end;
        const restTxt = [h.org, h.role].filter(Boolean).join(' ');
        if (restTxt) { if (!cur.role) cur.role = restTxt; else if (!cur.location) cur.location = restTxt; }
        return;
      }
      const startNew = !cur
        || (blank && (cur.org || cur.role))
        || (hasDate && cur.org && (cur.details || cur.role))
        || (!hasDate && cur.details && !looksLikeSentence);
      if (startNew) {
        cur = { ...Store.emptyEntry(kind), ...parseEntryHead(line) };
        out.push(cur);
      } else if (!cur.role && !hasDate) {
        cur.role = line;
      } else if (hasDate && !cur.start && !cur.end) {
        const h = parseEntryHead(line);
        cur.start = h.start; cur.end = h.end;
        if (!cur.role && h.org) cur.role = h.org;
        else if (h.org && !cur.location) cur.location = h.org;
      } else {
        cur.details += (cur.details ? '\n' : '') + line;
      }
    });
    return out;
  }

  function parseText(text) {
    const cv = Store.blankCV('CV importé');
    const allLines = text.replace(/\r/g, '').split('\n');
    const blocks = { header: [] };
    let current = 'header';
    allLines.forEach(l => {
      const h = detectHeading(l);
      if (h) { current = h; blocks[h] = blocks[h] || []; return; }
      blocks[current] = blocks[current] || [];
      blocks[current].push(l);
    });

    // En-tête : nom, titre, coordonnées
    const head = blocks.header.map(l => l.trim()).filter(Boolean);
    const p = cv.personal;
    const rest = [];
    head.forEach(l => {
      let line = l;
      const li = line.match(LINKEDIN); if (li) { p.linkedin = li[0].replace(/^https?:\/\/(www\.)?/, ''); line = line.replace(li[0], ''); }
      const em = line.match(EMAIL); if (em) { p.email = em[0]; line = line.replace(em[0], ''); }
      const ph = line.match(PHONE); if (ph && ph[0].replace(/\D/g, '').length >= 9) { p.phone = ph[0].trim(); line = line.replace(ph[0], ''); }
      const ur = !p.website && line.match(URL); if (ur && !EMAIL.test(ur[0])) { p.website = ur[0]; line = line.replace(ur[0], ''); }
      line = line.replace(/^[\s|,;·•-]+|[\s|,;·•-]+$/g, '').replace(/\s*[|·•]\s*[|·•]\s*/g, ' | ').trim();
      if (line) rest.push(line);
    });
    if (rest[0]) {
      const words = rest[0].split(/\s+/);
      const upperIdx = words.findIndex(w => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w));
      if (upperIdx > 0) { p.firstName = words.slice(0, upperIdx).join(' '); p.lastName = words.slice(upperIdx).join(' '); }
      else if (upperIdx === 0 && words.length > 1) { p.lastName = words[0]; p.firstName = words.slice(1).join(' '); }
      else { p.firstName = words[0]; p.lastName = words.slice(1).join(' '); }
    }
    if (rest[1]) p.title = rest[1];
    if (rest[2]) p.location = rest[2].split('|')[0].trim();

    const txt = k => (blocks[k] || []).map(l => l.trim()).filter(Boolean).join(' ').trim();
    cv.summary = txt('summary');
    cv.interests = (blocks.interests || []).map(l => l.trim().replace(BULLET, '')).filter(Boolean).join(', ');

    ['experience', 'education', 'activities'].forEach(k => { cv[k] = blocks[k] ? parseEntries(blocks[k], k) : []; });

    if (blocks.skills) {
      cv.skills = blocks.skills.map(l => l.trim().replace(BULLET, '')).filter(Boolean).map(l => {
        const m = l.match(/^([^:]{2,30})\s*:\s*(.+)$/);
        return { ...Store.emptyEntry('skills'), category: m ? m[1].trim() : '', items: m ? m[2].trim() : l };
      });
    } else cv.skills = [];

    if (blocks.languages) {
      cv.languages = blocks.languages.join(' | ').split(/\s*[|,;•\n]\s*/).map(x => x.trim()).filter(Boolean).map(x => {
        const m = x.match(/^([A-Za-zÀ-ÿ]+)\s*[:(\-–]\s*([^)]+)\)?$/);
        let level = m ? m[2].trim() : '';
        if ((level.match(/\(/g) || []).length > (level.match(/\)/g) || []).length) level += ')';
        return { ...Store.emptyEntry('languages'), name: m ? m[1] : x, level };
      });
    } else cv.languages = [];

    if (blocks.certifications) {
      cv.certifications = blocks.certifications.map(l => l.trim().replace(BULLET, '')).filter(Boolean).map(l => {
        const y = l.match(/\b(19|20)\d{2}\b/);
        const parts = l.replace(y ? y[0] : '', '').replace(/[()]/g, '').split(/\s[-–—|]\s|,\s/).map(s => s.trim()).filter(Boolean);
        return { ...Store.emptyEntry('certifications'), name: parts[0] || l, issuer: parts[1] || '', date: y ? y[0] : '' };
      });
    } else cv.certifications = [];

    return cv;
  }

  function parse(text) {
    const t = text.trim();
    if (t.startsWith('{')) {
      const obj = JSON.parse(t);
      return Store.normalize(obj);
    }
    return parseText(t);
  }

  const TEMPLATE = `Camille MARTIN
Analyste Financier
camille.martin@email.com | +33 6 12 34 56 78 | Paris | linkedin.com/in/camille-martin

PROFIL
Diplômée d'un Master en Finance, 2 stages en M&A...

EXPÉRIENCE PROFESSIONNELLE
Banque XYZ | Stagiaire Analyste M&A | Paris | Janv. 2025 - Juin 2025
- Participé à 3 mandats de cession (VE 450 M€)
- Construit des modèles DCF et LBO sous Excel

FORMATION
ESSEC Business School | Master in Finance | Cergy | 2023 - 2025
- Cours : Corporate Finance, Valuation

COMPÉTENCES
Techniques : DCF, LBO, comparables, IFRS
Outils : Excel (VBA), Bloomberg, Capital IQ, PowerPoint

CERTIFICATIONS
CFA Level I - CFA Institute - 2024

LANGUES
Français : natif | Anglais : courant (TOEIC 960)

CENTRES D'INTÉRÊT
Marathon, échecs, bénévolat`;

  window.CVParser = { parse, TEMPLATE };
})();
