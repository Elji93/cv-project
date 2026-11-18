/* ==========================================================================
   Rendu HTML de la feuille CV (+ conversion en texte brut)
   ========================================================================== */
(function () {
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const FONT_STACKS = {
    'Calibri': '"Calibri", "Carlito", Arial, sans-serif',
    'Arial': 'Arial, "Liberation Sans", Helvetica, sans-serif',
    'Helvetica': '"Helvetica Neue", Helvetica, Arial, sans-serif',
    'Georgia': 'Georgia, "Times New Roman", serif',
    'Times New Roman': '"Times New Roman", "Liberation Serif", Times, serif',
    'Garamond': '"EB Garamond", Garamond, "Times New Roman", serif',
    'Cambria': 'Cambria, "Caladea", Georgia, serif',
    'Lato': 'Lato, Calibri, Arial, sans-serif',
    'Roboto': 'Roboto, Arial, sans-serif',
    'Open Sans': '"Open Sans", Arial, sans-serif',
    'Source Sans 3': '"Source Sans 3", Arial, sans-serif',
    'Inter': 'Inter, Arial, sans-serif',
    'Merriweather': 'Merriweather, Georgia, serif',
    'Libre Baskerville': '"Libre Baskerville", Georgia, serif',
  };

  // Polices recommandées pour les ATS, et équivalent utilisé dans l'export Word
  const WORD_FONT = {
    'Calibri': 'Calibri', 'Arial': 'Arial', 'Helvetica': 'Arial', 'Georgia': 'Georgia',
    'Times New Roman': 'Times New Roman', 'Garamond': 'Garamond', 'Cambria': 'Cambria',
    'Lato': 'Calibri', 'Roboto': 'Arial', 'Open Sans': 'Calibri', 'Source Sans 3': 'Calibri',
    'Inter': 'Arial', 'Merriweather': 'Georgia', 'Libre Baskerville': 'Georgia',
  };

  const lines = txt => String(txt || '').split('\n').map(l => l.replace(/^\s*[-•*–·▪●]\s*/, '').trim());
  const cleanLines = txt => lines(txt).filter(Boolean);

  function render(cv, opts = {}) {
    const ed = !!opts.editable;
    const p = cv.personal;
    const s = cv.style;

    // Champ (éditable ou non). En mode lecture, un champ vide n'est pas rendu.
    const F = (path, value, ph, tag = 'span', cls = '') => {
      if (!ed && !String(value || '').trim()) return '';
      return `<${tag} class="${cls}"${ed ? ` contenteditable="true" spellcheck="true" data-path="${path}" data-ph="${esc(ph)}"` : ''}>${esc(value)}</${tag}>`;
    };

    // --- En-tête ---
    const contactFields = [
      ['personal.email', p.email, 'email@exemple.com'],
      ['personal.phone', p.phone, 'Téléphone'],
      ['personal.location', p.location, 'Ville'],
      ['personal.linkedin', p.linkedin, 'LinkedIn'],
      ['personal.website', p.website, 'Site web'],
      ['personal.extra', p.extra, 'Autre (permis, mobilité…)'],
    ].filter(([, v]) => ed || String(v || '').trim());
    // En édition, on masque les champs optionnels vides sauf les 3 premiers
    const contacts = contactFields
      .filter(([path, v], i) => !ed || v || i < 4)
      .map(([path, v, ph]) => F(path, v, ph))
      .join('<span class="sep">|</span>');

    const photo = s.showPhoto && p.photo
      ? `<img class="cv-photo ${esc(s.photoShape)}" src="${p.photo}" alt="Photo">`
      : '';

    let html = `
      <header class="cv-header${photo ? ' has-photo' : ''}">
        ${photo}
        <div class="id">
          <h1 class="cv-name">${F('personal.firstName', p.firstName, 'Prénom')}${(ed || (p.firstName && p.lastName)) ? ' ' : ''}${F('personal.lastName', p.lastName, 'Nom')}</h1>
          ${F('personal.title', p.title, 'Intitulé du poste visé', 'div', 'cv-title')}
          <div class="cv-contact">${contacts}</div>
        </div>
      </header>`;

    // --- Sections ---
    cv.order.forEach(key => {
      if (cv.hidden.includes(key)) return;
      const title = Store.sectionTitle(cv, key);
      const body = renderSection(cv, key, ed, F);
      if (!body) return;
      html += `<section class="cv-section" data-section="${key}">
        <h2>${ed ? `<span contenteditable="true" data-path="titles.${key}" data-ph="Titre">${esc(title)}</span>` : esc(title)}</h2>
        ${body}
      </section>`;
    });

    return html;
  }

  function renderSection(cv, key, ed, F) {
    switch (key) {
      case 'summary':
      case 'interests': {
        const v = cv[key];
        if (!ed && !String(v || '').trim()) return '';
        return F(key, v, key === 'summary' ? 'Quelques lignes pour vous présenter…' : 'Sport, associations, voyages…', 'p', key === 'summary' ? 'cv-summary' : '');
      }
      case 'experience':
      case 'education':
      case 'activities': {
        const list = cv[key].filter(e => ed || e.org || e.role || e.details);
        if (!list.length) return '';
        const phOrg = key === 'education' ? 'École / Université' : key === 'activities' ? 'Association / Projet' : 'Entreprise';
        const phRole = key === 'education' ? 'Diplôme, spécialité' : key === 'activities' ? 'Rôle' : 'Poste';
        return list.map(e => {
          const i = cv[key].indexOf(e);
          const base = `${key}.${i}`;
          const det = lines(e.details);
          const detLines = ed ? (det.length ? det : (key === 'education' ? [] : [''])) : det.filter(Boolean);
          const dates = (ed || e.start || e.end)
            ? `<span class="cv-dates">${F(base + '.start', e.start, 'Début')}${(ed || (e.start && e.end)) ? ' – ' : ''}${F(base + '.end', e.end, 'Fin')}</span>`
            : '';
          const bullets = detLines.length
            ? `<ul class="cv-bullets">${detLines.map((l, j) =>
                ed ? `<li contenteditable="true" data-path="${base}.details" data-line="${j}" data-ph="Réalisation chiffrée…">${esc(l)}</li>` : `<li>${esc(l)}</li>`
              ).join('')}</ul>` : '';
          return `<div class="cv-entry" data-entry="${base}">
            <div class="cv-line"><div class="l">${F(base + '.org', e.org, phOrg, 'span', 'cv-org')}</div><div class="r">${F(base + '.location', e.location, 'Lieu', 'span', 'cv-loc')}</div></div>
            <div class="cv-line"><div class="l">${F(base + '.role', e.role, phRole, 'span', 'cv-role')}</div><div class="r">${dates}</div></div>
            ${bullets}
          </div>`;
        }).join('');
      }
      case 'skills': {
        const list = cv.skills.filter(e => ed || e.items);
        if (!list.length) return '';
        return list.map(e => {
          const i = cv.skills.indexOf(e);
          const cat = (ed || e.category) ? `<b>${F(`skills.${i}.category`, e.category, 'Catégorie')}${(ed || e.category) ? ' : ' : ''}</b>` : '';
          return `<div class="cv-skill">${cat}${F(`skills.${i}.items`, e.items, 'Excel, VBA, Bloomberg…')}</div>`;
        }).join('');
      }
      case 'certifications': {
        const list = cv.certifications.filter(e => ed || e.name);
        if (!list.length) return '';
        return `<div class="cv-inline-list">${list.map(e => {
          const i = cv.certifications.indexOf(e);
          const extra = [e.issuer, e.date].filter(Boolean);
          return `<span class="item">${F(`certifications.${i}.name`, e.name, 'Certification')}${ed
            ? ` (${F(`certifications.${i}.issuer`, e.issuer, 'Organisme')}, ${F(`certifications.${i}.date`, e.date, 'Année')})`
            : (extra.length ? ` (${esc(extra.join(', '))})` : '')}</span>`;
        }).join('')}</div>`;
      }
      case 'languages': {
        const list = cv.languages.filter(e => ed || e.name);
        if (!list.length) return '';
        return `<div class="cv-lang">${list.map(e => {
          const i = cv.languages.indexOf(e);
          return `<span class="item"><b>${F(`languages.${i}.name`, e.name, 'Langue')}</b>${(ed || e.level) ? ' : ' : ''}${F(`languages.${i}.level`, e.level, 'Niveau')}</span>`;
        }).join('')}</div>`;
      }
    }
    return '';
  }

  function applyStyle(el, cv) {
    const s = cv.style;
    el.className = `cv-page tpl-${s.template}` +
      (s.titlesUpper ? '' : ' titles-plain') +
      (s.headerLeft ? ' align-left' : '') +
      (s.datesLeft ? ' dates-left' : '');
    el.style.setProperty('--cv-accent', s.accent);
    el.style.setProperty('--cv-font', FONT_STACKS[s.font] || FONT_STACKS.Calibri);
    el.style.setProperty('--cv-size', s.fontSize + 'pt');
    el.style.setProperty('--cv-lh', s.lineHeight);
    el.style.setProperty('--cv-margin', s.margin + 'mm');
    el.style.setProperty('--cv-gap', s.gap);
  }

  // Texte brut du CV (pour le comparateur)
  function toText(cv) {
    const p = cv.personal;
    const out = [Store.fullName(cv), p.title, [p.email, p.phone, p.location, p.linkedin, p.website, p.extra].filter(Boolean).join(' | ')];
    cv.order.forEach(key => {
      if (cv.hidden.includes(key)) return;
      const t = Store.sectionTitle(cv, key);
      const sec = [];
      if (key === 'summary' || key === 'interests') { if (cv[key]) sec.push(cv[key]); }
      else if (['experience', 'education', 'activities'].includes(key)) {
        cv[key].forEach(e => {
          const head = [e.org, e.role, e.location, [e.start, e.end].filter(Boolean).join(' – ')].filter(Boolean).join(' | ');
          if (head) sec.push(head);
          cleanLines(e.details).forEach(l => sec.push('• ' + l));
        });
      } else if (key === 'skills') cv.skills.forEach(e => e.items && sec.push((e.category ? e.category + ' : ' : '') + e.items));
      else if (key === 'certifications') cv.certifications.forEach(e => e.name && sec.push([e.name, e.issuer, e.date].filter(Boolean).join(', ')));
      else if (key === 'languages') cv.languages.forEach(e => e.name && sec.push(e.name + (e.level ? ' : ' + e.level : '')));
      if (sec.length) out.push('', t.toUpperCase(), ...sec);
    });
    return out.filter(x => x != null).join('\n');
  }

  window.CVRender = { render, applyStyle, toText, esc, lines, cleanLines, FONT_STACKS, WORD_FONT };
})();
