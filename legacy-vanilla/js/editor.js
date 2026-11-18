/* ==========================================================================
   Éditeur : formulaire en carrousel, édition directe sur la feuille,
   panneau de style, gestion multi-CV, exports
   ========================================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = CVRender.esc;

  let cv = Store.current();
  let currentSection = 'personal';
  let zoom = null; // null = adapter à la largeur

  // ---------- Utilitaires ----------
  const UI = window.UI = {
    toast(msg) {
      const t = $('#toast'); t.textContent = msg; t.classList.add('show');
      clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
    },
  };
  const debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
  const saveSoon = debounce(() => Store.save(cv), 300);
  const previewSoon = debounce(() => renderPreview(), 120);

  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
  function setPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] = o[k] ?? {}), obj);
    target[last] = value;
  }

  // ======================================================================
  //  APERÇU
  // ======================================================================
  const page = $('#cv-page');
  const PAGE_H_PX = 297 * 96 / 25.4;

  function renderPreview() {
    CVRender.applyStyle(page, cv);
    page.innerHTML = CVRender.render(cv, { editable: true });
    checkFit();
    applyZoom();
  }

  function checkFit() {
    const h = page.scrollHeight;
    const over = h > PAGE_H_PX + 2;
    const badge = $('#fit-badge');
    badge.classList.toggle('over', over);
    badge.textContent = over ? `⚠ Dépasse la page A4 (+${Math.round((h / PAGE_H_PX - 1) * 100)} %)` : '✓ Tient sur 1 page A4';
    $('#page-limit').hidden = !over;
    return !over;
  }

  function autoFit() {
    const s = cv.style;
    const steps = [
      () => s.gap > 0.6 && (s.gap = +(s.gap - 0.1).toFixed(2)),
      () => s.lineHeight > 1.1 && (s.lineHeight = +(s.lineHeight - 0.05).toFixed(2)),
      () => s.fontSize > 9 && (s.fontSize = +(s.fontSize - 0.25).toFixed(2)),
      () => s.margin > 10 && (s.margin = s.margin - 1),
      () => s.fontSize > 8.5 && (s.fontSize = +(s.fontSize - 0.25).toFixed(2)),
    ];
    // On réduit chaque paramètre à tour de rôle pour garder un rendu équilibré
    let guard = 0, turn = 0;
    renderPreview();
    while (!checkFit() && guard++ < 80) {
      let changed = false;
      for (let k = 0; k < steps.length; k++) {
        const idx = (turn + k) % steps.length;
        if (steps[idx]()) { turn = idx + 1; changed = true; break; }
      }
      if (!changed) break;
      CVRender.applyStyle(page, cv);
    }
    renderPreview(); renderStyleForm(); Store.save(cv);
    UI.toast(checkFit() ? 'CV ajusté sur une page ✓' : 'Encore trop long : raccourcissez quelques lignes ou masquez une section.');
  }

  function applyZoom() {
    const area = $('#preview-area');
    const pageW = 210 * 96 / 25.4;
    const z = zoom ?? Math.min(1.2, Math.max(0.35, (area.clientWidth - 48) / pageW));
    const scaler = $('#page-scaler');
    scaler.style.transform = `scale(${z})`;
    scaler.style.width = pageW + 'px';
    scaler.style.height = (Math.max(page.scrollHeight, PAGE_H_PX) * z) + 'px';
    scaler.style.transformOrigin = 'top left';
    scaler.style.marginRight = (pageW * (z - 1)) + 'px';
    $('#zoom-val').textContent = Math.round(z * 100) + '%';
  }

  // ---------- Édition directe sur la feuille ----------
  page.addEventListener('input', e => {
    const el = e.target.closest('[data-path]');
    if (!el) return;
    const path = el.dataset.path;
    if (el.dataset.line != null) {
      const all = $$(`[data-path="${path}"][data-line]`, page);
      setPath(cv, path, all.map(li => li.innerText.replace(/\n/g, ' ').trim()).join('\n'));
    } else {
      setPath(cv, path, el.innerText.replace(/\n/g, ' ').trim());
    }
    saveSoon(); formSoon(); checkFit(); applyZoom();
  });
  const formSoon = debounce(() => { if (!$('#section-form').contains(document.activeElement)) renderForm(); renderSwitcher(); }, 500);

  page.addEventListener('keydown', e => {
    const el = e.target.closest('[data-path]');
    if (!el) return;
    if (el.dataset.line != null) {
      const path = el.dataset.path;
      const idx = +el.dataset.line;
      const arr = CVRender.lines(getPath(cv, path));
      if (e.key === 'Enter') {
        e.preventDefault();
        arr.splice(idx + 1, 0, '');
        setPath(cv, path, arr.join('\n'));
        renderPreview(); focusLine(path, idx + 1);
      } else if (e.key === 'Backspace' && !el.innerText.trim() && arr.length > 1) {
        e.preventDefault();
        arr.splice(idx, 1);
        setPath(cv, path, arr.join('\n'));
        renderPreview(); focusLine(path, Math.max(0, idx - 1), true);
      }
      return;
    }
    if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
  });
  page.addEventListener('paste', e => {
    if (!e.target.closest('[contenteditable]')) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s*\n\s*/g, ' ');
    document.execCommand('insertText', false, text);
  });
  page.addEventListener('focusout', () => { Store.save(cv); renderForm(); });

  function focusLine(path, i, end) {
    const el = $(`[data-path="${path}"][data-line="${i}"]`, page);
    if (!el) return;
    el.focus();
    if (end) {
      const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    }
  }

  // ======================================================================
  //  FORMULAIRE (carrousel de sections)
  // ======================================================================
  const SEC = key => Store.SECTIONS.find(s => s.key === key);
  const carouselKeys = () => ['personal', ...cv.order];
  const labelOf = key => key === 'personal' ? 'Infos perso' : SEC(key).label;
  const countOf = key => Array.isArray(cv[key]) ? cv[key].length : null;

  function renderCarousel() {
    $('#car-track').innerHTML = carouselKeys().map(k => {
      const c = countOf(k);
      return `<button class="chip ${k === currentSection ? 'active' : ''}" data-sec="${k}">${esc(labelOf(k))}${c != null ? `<span class="count">${c}</span>` : ''}</button>`;
    }).join('');
    const active = $('#car-track .chip.active');
    active && active.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  $('#car-track').addEventListener('click', e => {
    const b = e.target.closest('[data-sec]'); if (!b) return;
    goSection(b.dataset.sec);
  });
  $('#car-prev').onclick = () => stepSection(-1);
  $('#car-next').onclick = () => stepSection(1);
  function stepSection(d) {
    const keys = carouselKeys();
    const i = keys.indexOf(currentSection);
    goSection(keys[(i + d + keys.length) % keys.length]);
  }
  function goSection(k) {
    currentSection = k; renderForm();
    $('#panel-content').scrollTop = 0;
    const sec = page.querySelector(`[data-section="${k}"]`) || (k === 'personal' && page.querySelector('.cv-header'));
    sec && sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const input = (path, label, ph = '', type = 'text', hint = '') => `
    <div class="field"><label>${label}</label>
      <input type="${type}" data-bind="${path}" value="${esc(getPath(cv, path) || '')}" placeholder="${esc(ph)}">
      ${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
  const area = (path, label, ph = '', hint = '', rows = 4) => `
    <div class="field"><label>${label}</label>
      <textarea rows="${rows}" data-bind="${path}" placeholder="${esc(ph)}">${esc(getPath(cv, path) || '')}</textarea>
      ${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;

  function sectionHeader(key) {
    const keys = carouselKeys();
    const i = keys.indexOf(key);
    if (key === 'personal') return `<div class="section-head"><h3>Informations personnelles</h3><span class="section-step">${i + 1}/${keys.length}</span></div>`;
    const hidden = cv.hidden.includes(key);
    return `<div class="section-head"><h3>${esc(SEC(key).label)}</h3>
        <label class="inline-hint"><input type="checkbox" data-toggle-hidden="${key}" ${hidden ? '' : 'checked'}> Afficher</label>
        <span class="section-step">${i + 1}/${keys.length}</span></div>
      ${input('titles.' + key, 'Titre affiché sur le CV', SEC(key).title)}`;
  }
  function sectionNav() {
    const keys = carouselKeys(); const i = keys.indexOf(currentSection);
    return `<div class="section-nav">
      <button class="btn sm" data-step="-1" ${i === 0 ? 'disabled' : ''}>‹ ${i > 0 ? esc(labelOf(keys[i - 1])) : ''}</button>
      <button class="btn sm primary" data-step="1" ${i === keys.length - 1 ? 'disabled' : ''}>${i < keys.length - 1 ? esc(labelOf(keys[i + 1])) : ''} ›</button>
    </div>`;
  }

  const TIPS = {
    summary: "2 à 3 lignes : poste visé, formation, expériences clés et compétences. Reprenez les mots-clés de l'offre.",
    experience: 'Une ligne par réalisation, commencez par un verbe d\'action (Analysé, Modélisé, Piloté…) et chiffrez (M€, %, nombre de deals).',
    education: 'Du plus récent au plus ancien. Ajoutez mentions, classement, cours pertinents (Corporate Finance, Valuation…).',
    activities: 'Associations, projets, responsabilités : montrez leadership et résultats chiffrés.',
    skills: 'Regroupez par catégorie (Techniques, Outils, Logiciels…). Utilisez les mêmes termes que l\'offre : les ATS cherchent des correspondances exactes.',
    certifications: 'CFA, AMF, FRM, Bloomberg Market Concepts, VBA… avec l\'année.',
    languages: 'Précisez un niveau objectif : natif, courant, CECRL (C1/B2) ou score (TOEIC, IELTS).',
    interests: 'Restez concret et différenciant (sport à haut niveau, engagement associatif).',
  };

  function renderForm() {
    renderCarousel();
    const k = currentSection;
    let html = `<div class="section-panel">${sectionHeader(k)}`;
    if (TIPS[k]) html += `<div class="note">💡 ${TIPS[k]}</div>`;

    if (k === 'personal') {
      const ph = cv.personal.photo;
      html += `
        <div class="photo-box">
          <div class="photo-thumb" style="${ph ? `background-image:url(${ph})` : ''}">${ph ? '' : 'Photo'}</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label class="btn sm">📷 ${ph ? 'Changer la photo' : 'Ajouter une photo'}<input type="file" id="photo-input" accept="image/*" hidden></label>
            ${ph ? `<label class="inline-hint"><input type="checkbox" id="photo-show" ${cv.style.showPhoto ? 'checked' : ''}> Afficher sur le CV</label>
            <button class="btn sm danger" id="photo-del">Supprimer</button>` : ''}
          </div>
        </div>
        <div class="note warn" style="font-size:12px">La photo est courante en France mais déconseillée pour les candidatures UK/US/Canada. Les ATS l'ignorent : elle ne pénalise pas la lecture du texte.</div>
        <div class="row">${input('personal.firstName', 'Prénom')}${input('personal.lastName', 'Nom')}</div>
        ${input('personal.title', 'Titre / poste visé', 'Analyste Financier — Stage de fin d\'études', 'text', 'Reprenez l\'intitulé exact de l\'offre : c\'est un critère fort des ATS.')}
        <div class="row">${input('personal.email', 'Email', 'prenom.nom@email.com', 'email')}${input('personal.phone', 'Téléphone', '+33 6 …', 'tel')}</div>
        <div class="row">${input('personal.location', 'Ville', 'Paris, France')}${input('personal.linkedin', 'LinkedIn', 'linkedin.com/in/…')}</div>
        <div class="row">${input('personal.website', 'Site / GitHub', '')}${input('personal.extra', 'Autre', 'Permis B, mobilité…')}</div>`;
    } else {
      const type = SEC(k).type;
      if (type === 'text') {
        html += area(k, k === 'summary' ? 'Texte du profil' : 'Centres d\'intérêt', '', '', k === 'summary' ? 5 : 3);
      } else if (type === 'entries') {
        const isEdu = k === 'education';
        html += cv[k].map((e, i) => `
          <div class="entry" data-entry-idx="${i}">
            <div class="entry-head">
              <strong>${esc(e.org || e.role || (isEdu ? 'Nouvelle formation' : 'Nouvelle entrée'))}</strong>
              <button class="btn icon sm" data-move="${i}" data-dir="-1" title="Monter" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button class="btn icon sm" data-move="${i}" data-dir="1" title="Descendre" ${i === cv[k].length - 1 ? 'disabled' : ''}>↓</button>
              <button class="btn icon sm danger" data-del="${i}" title="Supprimer">✕</button>
            </div>
            <div class="entry-body">
              <div class="row">${input(`${k}.${i}.org`, isEdu ? 'École / Université' : k === 'activities' ? 'Organisation' : 'Entreprise')}${input(`${k}.${i}.role`, isEdu ? 'Diplôme / spécialité' : 'Poste / rôle')}</div>
              <div class="row-3">${input(`${k}.${i}.location`, 'Lieu')}${input(`${k}.${i}.start`, 'Début', 'Sept. 2024')}${input(`${k}.${i}.end`, 'Fin', 'Présent')}</div>
              ${area(`${k}.${i}.details`, isEdu ? 'Détails (une ligne = une puce)' : 'Réalisations (une ligne = une puce)', isEdu ? 'Cours, mention, classement…' : 'Analysé…\nModélisé…\nPiloté…')}
            </div>
          </div>`).join('');
        html += `<button class="btn" data-add="${k}">＋ Ajouter ${isEdu ? 'une formation' : k === 'activities' ? 'une activité' : 'une expérience'}</button>`;
      } else if (type === 'skills') {
        html += cv.skills.map((e, i) => `
          <div class="entry"><div class="entry-head"><strong>${esc(e.category || 'Groupe de compétences')}</strong>
            <button class="btn icon sm" data-move="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn icon sm" data-move="${i}" data-dir="1" ${i === cv.skills.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn icon sm danger" data-del="${i}">✕</button></div>
            ${input(`skills.${i}.category`, 'Catégorie', 'Techniques / Outils / Logiciels')}
            ${area(`skills.${i}.items`, 'Compétences (séparées par des virgules)', 'DCF, LBO, Excel (VBA), Bloomberg', '', 2)}
          </div>`).join('');
        html += `<button class="btn" data-add="skills">＋ Ajouter un groupe</button>`;
      } else if (type === 'langs') {
        html += `<datalist id="lvl"><option>Langue maternelle</option><option>Bilingue</option><option>Courant (C1)</option><option>Avancé (C1)</option><option>Intermédiaire (B2)</option><option>Notions (A2)</option></datalist>`;
        html += cv.languages.map((e, i) => `
          <div class="entry"><div class="entry-head"><strong>${esc(e.name || 'Langue')}</strong>
            <button class="btn icon sm" data-move="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn icon sm" data-move="${i}" data-dir="1" ${i === cv.languages.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn icon sm danger" data-del="${i}">✕</button></div>
            <div class="row">${input(`languages.${i}.name`, 'Langue', 'Anglais')}
            <div class="field"><label>Niveau</label><input list="lvl" data-bind="languages.${i}.level" value="${esc(e.level)}" placeholder="Courant (TOEIC 950)"></div></div>
          </div>`).join('');
        html += `<button class="btn" data-add="languages">＋ Ajouter une langue</button>`;
      } else if (type === 'certs') {
        html += cv.certifications.map((e, i) => `
          <div class="entry"><div class="entry-head"><strong>${esc(e.name || 'Certification')}</strong>
            <button class="btn icon sm" data-move="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn icon sm" data-move="${i}" data-dir="1" ${i === cv.certifications.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn icon sm danger" data-del="${i}">✕</button></div>
            ${input(`certifications.${i}.name`, 'Intitulé', 'CFA Level I')}
            <div class="row">${input(`certifications.${i}.issuer`, 'Organisme', 'CFA Institute')}${input(`certifications.${i}.date`, 'Année', '2025')}</div>
          </div>`).join('');
        html += `<button class="btn" data-add="certifications">＋ Ajouter une certification</button>`;
      }
    }
    html += sectionNav() + '</div>';
    $('#section-form').innerHTML = html;
  }

  // Délégation d'événements du formulaire
  const form = $('#section-form');
  form.addEventListener('input', e => {
    const b = e.target.dataset.bind;
    if (b) {
      setPath(cv, b, e.target.value);
      saveSoon(); previewSoon();
      if (/\.(org|role|name|category)$/.test(b)) {
        const head = e.target.closest('.entry')?.querySelector('.entry-head strong');
        if (head && e.target.value) head.textContent = e.target.value;
      }
      if (b === 'personal.firstName' || b === 'personal.lastName') renderSwitcherSoon();
    }
  });
  const renderSwitcherSoon = debounce(() => renderSwitcher(), 400);
  form.addEventListener('change', e => {
    if (e.target.dataset.toggleHidden) {
      const k = e.target.dataset.toggleHidden;
      cv.hidden = e.target.checked ? cv.hidden.filter(x => x !== k) : [...cv.hidden, k];
      commit();
    }
    if (e.target.id === 'photo-show') { cv.style.showPhoto = e.target.checked; commit(); renderStyleForm(); }
    if (e.target.id === 'photo-input' && e.target.files[0]) loadPhoto(e.target.files[0]);
  });
  form.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    const k = currentSection;
    if (t.dataset.step) return stepSection(+t.dataset.step);
    if (t.dataset.add) { cv[t.dataset.add].push(Store.emptyEntry(t.dataset.add)); commit(); form.querySelector('.entry:last-of-type input')?.focus(); return; }
    if (t.dataset.del != null) {
      const i = +t.dataset.del; const item = cv[k][i];
      if ((item.org || item.role || item.name || item.items || item.details) && !confirm('Supprimer cet élément ?')) return;
      cv[k].splice(i, 1); commit(); return;
    }
    if (t.dataset.move != null) {
      const i = +t.dataset.move, j = i + +t.dataset.dir;
      [cv[k][i], cv[k][j]] = [cv[k][j], cv[k][i]]; commit(); return;
    }
    if (t.id === 'photo-del') { cv.personal.photo = ''; cv.style.showPhoto = false; commit(); renderStyleForm(); }
  });

  function loadPhoto(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // recadrage carré centré, compressé pour tenir dans le stockage local
        const size = 360, c = document.createElement('canvas');
        c.width = c.height = size;
        const m = Math.min(img.width, img.height);
        const sx = (img.width - m) / 2, sy = Math.max(0, (img.height - m) / 2 - (img.height - m) * 0.15);
        c.getContext('2d').drawImage(img, sx, sy, m, m, 0, 0, size, size);
        cv.personal.photo = c.toDataURL('image/jpeg', 0.85);
        cv.style.showPhoto = true;
        commit(); renderStyleForm();
        UI.toast('Photo ajoutée');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function commit() { Store.save(cv); renderForm(); renderPreview(); }

  // ======================================================================
  //  MISE EN FORME
  // ======================================================================
  const TEMPLATES = [
    ['classic', 'Finance classique', 'Nom centré, filets fins — banques, Big 4'],
    ['compact', 'Compact', 'Très dense — M&A, PE, profils chargés'],
    ['modern', 'Moderne', 'Titres colorés, en-tête aligné à gauche'],
    ['elegant', 'Élégant', 'Petites capitales, double filet — gestion d\'actifs'],
  ];
  const COLORS = ['#1f3a5f', '#111111', '#2f6fb3', '#0f6b74', '#1e5b47', '#7b1e2b', '#5b2a86', '#8a6d1d', '#4a5568'];
  const FONTS_ATS = ['Calibri', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Garamond', 'Cambria'];
  const FONTS_WEB = ['Lato', 'Roboto', 'Open Sans', 'Source Sans 3', 'Inter', 'Merriweather', 'Libre Baskerville'];

  function renderStyleForm() {
    const s = cv.style;
    const range = (key, label, min, max, step, unit) => `
      <div class="range-row"><label for="r-${key}">${label}</label>
        <input type="range" id="r-${key}" data-style="${key}" min="${min}" max="${max}" step="${step}" value="${s[key]}">
        <output>${s[key]}${unit}</output></div>`;
    const toggle = (key, label) => `<label class="toggle-row"><span>${label}</span><input type="checkbox" data-style-bool="${key}" ${s[key] ? 'checked' : ''}></label>`;

    $('#style-form').innerHTML = `
      <div class="style-group"><h4>Modèle</h4><div class="tpl-grid">
        ${TEMPLATES.map(([k, n, d]) => `<button class="tpl-card ${s.template === k ? 'active' : ''}" data-tpl="${k}"><b>${n}</b><span>${d}</span></button>`).join('')}
      </div></div>

      <div class="style-group"><h4>Couleur d'accent</h4><div class="swatches">
        ${COLORS.map(c => `<button class="swatch ${s.accent.toLowerCase() === c ? 'active' : ''}" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}
        <input type="color" id="color-custom" value="${s.accent}" title="Couleur personnalisée">
      </div></div>

      <div class="style-group"><h4>Police</h4>
        <div class="field"><select id="font-select">
          <optgroup label="Recommandées ATS / Word">${FONTS_ATS.map(f => `<option ${s.font === f ? 'selected' : ''} style="font-family:${CVRender.FONT_STACKS[f]}">${f}</option>`).join('')}</optgroup>
          <optgroup label="Polices web (converties en police Word standard à l'export)">${FONTS_WEB.map(f => `<option ${s.font === f ? 'selected' : ''}>${f}</option>`).join('')}</optgroup>
        </select></div>
        ${range('fontSize', 'Taille du texte', 8.5, 12, 0.25, ' pt')}
        ${range('lineHeight', 'Interligne', 1, 1.6, 0.05, '')}
        ${range('gap', 'Espacement', 0.5, 1.6, 0.05, '×')}
        ${range('margin', 'Marges', 8, 25, 1, ' mm')}
        <button class="btn sm" id="style-fit">⤢ Ajuster automatiquement sur 1 page</button>
      </div>

      <div class="style-group"><h4>Options</h4>
        ${toggle('titlesUpper', 'Titres de section en majuscules')}
        ${toggle('headerLeft', 'En-tête aligné à gauche')}
        ${toggle('showPhoto', 'Afficher la photo')}
        <label class="toggle-row"><span>Forme de la photo</span>
          <select id="photo-shape" style="border:1px solid var(--line);border-radius:6px;padding:3px">
            <option value="round" ${s.photoShape === 'round' ? 'selected' : ''}>Ronde</option>
            <option value="rounded" ${s.photoShape === 'rounded' ? 'selected' : ''}>Coins arrondis</option>
            <option value="square" ${s.photoShape === 'square' ? 'selected' : ''}>Carrée</option>
          </select></label>
        ${!cv.personal.photo ? '<p class="inline-hint">Ajoutez une photo dans Contenu › Infos perso.</p>' : ''}
      </div>

      <div class="style-group"><h4>Ordre et visibilité des sections</h4>
        <ul class="order-list">
          ${cv.order.map((k, i) => `<li class="${cv.hidden.includes(k) ? 'hidden-sec' : ''}">
            <input type="checkbox" data-vis="${k}" ${cv.hidden.includes(k) ? '' : 'checked'} title="Afficher / masquer">
            <input type="text" data-title="${k}" value="${esc(Store.sectionTitle(cv, k))}">
            <button class="btn icon sm" data-order="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn icon sm" data-order="${i}" data-dir="1" ${i === cv.order.length - 1 ? 'disabled' : ''}>↓</button>
          </li>`).join('')}
        </ul>
        <p class="inline-hint">Conseil finance : pour un étudiant, placez Formation avant Expérience ; pour un profil expérimenté, l'inverse.</p>
      </div>

      <div class="style-group"><button class="btn sm" id="style-reset">Réinitialiser la mise en forme</button></div>`;
  }

  const sf = $('#style-form');
  sf.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.style) {
      cv.style[t.dataset.style] = parseFloat(t.value);
      t.nextElementSibling.textContent = t.value + ({ fontSize: ' pt', margin: ' mm', gap: '×' }[t.dataset.style] || '');
      saveSoon(); renderPreview();
    }
    if (t.id === 'color-custom') { cv.style.accent = t.value; saveSoon(); renderPreview(); }
    if (t.dataset.title) { cv.titles[t.dataset.title] = t.value; saveSoon(); previewSoon(); }
  });
  sf.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'font-select') cv.style.font = t.value;
    else if (t.id === 'photo-shape') cv.style.photoShape = t.value;
    else if (t.dataset.styleBool) {
      cv.style[t.dataset.styleBool] = t.checked;
      if (t.dataset.styleBool === 'showPhoto' && t.checked && !cv.personal.photo) { UI.toast('Ajoutez d\'abord une photo (Contenu › Infos perso)'); }
    } else if (t.dataset.vis) {
      const k = t.dataset.vis;
      cv.hidden = t.checked ? cv.hidden.filter(x => x !== k) : [...cv.hidden, k];
    } else if (t.id === 'color-custom') { renderStyleForm(); }
    else return;
    Store.save(cv); renderPreview(); renderStyleForm(); renderForm();
  });
  sf.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.tpl) cv.style.template = t.dataset.tpl;
    else if (t.dataset.color) cv.style.accent = t.dataset.color;
    else if (t.dataset.order != null) {
      const i = +t.dataset.order, j = i + +t.dataset.dir;
      [cv.order[i], cv.order[j]] = [cv.order[j], cv.order[i]];
    } else if (t.id === 'style-fit') return autoFit();
    else if (t.id === 'style-reset') { cv.style = { ...Store.DEFAULT_STYLE, showPhoto: cv.style.showPhoto }; }
    else return;
    Store.save(cv); renderPreview(); renderStyleForm(); renderForm();
  });

  // ======================================================================
  //  MULTI-CV
  // ======================================================================
  function renderSwitcher() {
    $('#cv-select').innerHTML = Store.all().map(c => `<option value="${c.id}" ${c.id === cv.id ? 'selected' : ''}>${esc(c.name)}${Store.fullName(c) ? ' — ' + esc(Store.fullName(c)) : ''}</option>`).join('');
    $('#btn-match').href = `match.html?cv=${encodeURIComponent(cv.id)}`;
    $('#nav-match').href = `match.html?cv=${encodeURIComponent(cv.id)}`;
  }
  function switchTo(id) {
    Store.save(cv);
    Store.setCurrent(id); cv = Store.current();
    renderAll();
  }
  $('#cv-select').addEventListener('change', e => switchTo(e.target.value));

  const openModal = id => { $(id).classList.add('open'); };
  $$('.modal-backdrop').forEach(m => m.addEventListener('click', e => {
    if (e.target === m || e.target.hasAttribute('data-close')) m.classList.remove('open');
  }));
  $('#btn-new').onclick = () => { $('#new-name').value = ''; openModal('#modal-new'); setTimeout(() => $('#new-name').focus(), 50); };
  $('#new-ok').onclick = () => {
    const name = $('#new-name').value.trim();
    const from = $('#new-from').value;
    let n;
    if (from === 'dup') { n = Store.duplicate(cv.id); if (name) n.name = name; }
    else n = Store.create(name || (from === 'sample' ? '' : 'CV ' + (Store.all().length + 1)), from === 'sample');
    Store.save(n);
    $('#modal-new').classList.remove('open');
    cv = Store.current(); currentSection = 'personal'; renderAll();
    UI.toast('CV créé ✓');
  };

  function renderManage() {
    $('#cv-list').innerHTML = Store.all().map(c => `
      <li class="${c.id === cv.id ? 'current' : ''}" data-id="${c.id}">
        <div class="meta"><b>${esc(c.name)}</b><small>${esc(Store.fullName(c) || 'Sans nom')} · modifié le ${new Date(c.updatedAt).toLocaleDateString('fr-FR')}</small></div>
        <button class="btn sm" data-act="open">Ouvrir</button>
        <button class="btn sm" data-act="rename">Renommer</button>
        <button class="btn sm" data-act="dup">Dupliquer</button>
        <button class="btn sm danger" data-act="del">Supprimer</button>
      </li>`).join('');
  }
  $('#btn-manage').onclick = () => { renderManage(); openModal('#modal-manage'); };
  $('#cv-list').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const id = b.closest('li').dataset.id; const c = Store.get(id);
    if (b.dataset.act === 'open') { switchTo(id); $('#modal-manage').classList.remove('open'); return; }
    if (b.dataset.act === 'rename') { const n = prompt('Nouveau nom du CV', c.name); if (n && n.trim()) { c.name = n.trim(); Store.save(c); } }
    if (b.dataset.act === 'dup') { Store.duplicate(id); cv = Store.current(); renderAll(); }
    if (b.dataset.act === 'del') {
      if (!confirm(`Supprimer définitivement « ${c.name} » ? Cette action est irréversible.`)) return;
      Store.remove(id); cv = Store.current(); renderAll();
    }
    renderManage(); renderSwitcher();
  });

  // ======================================================================
  //  IMPORT / EXPORT
  // ======================================================================
  function importInto(target) {
    const txt = $('#import-text').value;
    if (!txt.trim()) return UI.toast('Collez d\'abord un texte');
    let parsed;
    try { parsed = CVParser.parse(txt); } catch (e) { return UI.toast('Format illisible : ' + e.message); }
    if (target === 'new') {
      parsed.id = Store.uid();
      parsed.name = Store.fullName(parsed) ? 'CV ' + Store.fullName(parsed) : 'CV importé';
      Store.replace(parsed); Store.setCurrent(parsed.id);
    } else {
      if (!confirm('Remplacer le contenu du CV actuel ? (la mise en forme est conservée)')) return;
      const keep = { id: cv.id, name: cv.name, style: cv.style, order: cv.order, titles: cv.titles, hidden: cv.hidden };
      if (!parsed.personal.photo) parsed.personal.photo = cv.personal.photo;
      Store.replace({ ...parsed, ...keep });
    }
    cv = Store.current(); currentSection = 'personal';
    renderAll(); switchMode('content');
    UI.toast('Import terminé — vérifiez chaque section ✓');
  }
  $('#imp-current').onclick = () => importInto('current');
  $('#imp-new').onclick = () => importInto('new');
  $('#imp-example').onclick = () => { $('#import-text').value = CVParser.TEMPLATE; };
  $('#imp-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => { $('#import-text').value = t; UI.toast('Fichier chargé : cliquez sur « Créer un nouveau CV » ou « Remplir le CV actuel »'); });
    e.target.value = '';
  };
  $('#exp-json').onclick = () => CVExport.exportJSON(cv);

  $('#btn-pdf').onclick = () => {
    if (!checkFit() && !confirm('Votre CV dépasse une page A4 : la partie qui dépasse sera coupée. Utilisez « Ajuster sur 1 page ». Continuer quand même ?')) return;
    UI.toast('Dans la fenêtre d\'impression, choisissez « Enregistrer au format PDF »');
    CVExport.exportPDF(cv,
      () => { page.innerHTML = CVRender.render(cv, { editable: false }); },
      () => renderPreview());
  };
  $('#btn-docx').onclick = async () => {
    try { await CVExport.exportDOCX(cv); UI.toast('Fichier Word téléchargé ✓'); }
    catch (e) { console.error(e); UI.toast('Erreur export Word : ' + e.message); }
  };

  // ======================================================================
  //  DIVERS
  // ======================================================================
  function switchMode(m) {
    $$('.mode-tabs button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    $$('.mode-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + m));
    if (m === 'style') renderStyleForm();
  }
  $$('.mode-tabs button').forEach(b => b.onclick = () => switchMode(b.dataset.mode));

  $('#btn-fit').onclick = autoFit;
  $('#zoom-in').onclick = () => { zoom = Math.min(2, (zoom ?? currentZoom()) + 0.1); applyZoom(); };
  $('#zoom-out').onclick = () => { zoom = Math.max(0.3, (zoom ?? currentZoom()) - 0.1); applyZoom(); };
  $('#zoom-fit').onclick = () => { zoom = null; applyZoom(); };
  const currentZoom = () => parseFloat($('#zoom-val').textContent) / 100;
  window.addEventListener('resize', debounce(applyZoom, 100));
  window.addEventListener('beforeunload', () => Store.save(cv));

  function renderAll() {
    renderSwitcher(); renderForm(); renderStyleForm(); renderPreview();
  }

  // Polices web chargées après coup : on re-mesure la page
  renderAll();
  document.fonts && document.fonts.ready.then(() => { checkFit(); applyZoom(); });
})();
