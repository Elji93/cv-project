/* ==========================================================================
   Exports : PDF (impression navigateur = texte réel, lisible par les ATS)
             Word .docx (bibliothèque docx, document natif une colonne)
   ========================================================================== */
(function () {
  const fileBase = cv => {
    const n = Store.fullName(cv) || cv.name || 'CV';
    return ('CV_' + n).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_').replace(/_+/g, '_');
  };

  // ---------- PDF ----------
  function exportPDF(cv, beforePrint, afterPrint) {
    const oldTitle = document.title;
    document.title = fileBase(cv);           // nom de fichier proposé par le navigateur
    beforePrint && beforePrint();
    const done = () => {
      document.title = oldTitle;
      afterPrint && afterPrint();
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 60);
  }

  // ---------- Word ----------
  function dataUrlToBytes(dataUrl) {
    const b64 = dataUrl.split(',')[1] || '';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  // docx enregistre les images en .png : on convertit la photo pour que Word l'ouvre sans souci
  function toPngDataUrl(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  async function exportDOCX(cv) {
    if (!window.docx) throw new Error("La bibliothèque Word n'est pas chargée (connexion internet ?)");
    const D = window.docx;
    const s = cv.style, p = cv.personal;
    const font = CVRender.WORD_FONT[s.font] || 'Calibri';
    const size = Math.round(s.fontSize * 2);          // demi-points
    const accent = s.accent.replace('#', '').toUpperCase();
    const mm = v => Math.round(v * 56.7);             // mm -> twips
    const margin = mm(s.margin);
    const pageW = 11906;
    const contentW = pageW - margin * 2;
    const gap = s.gap;
    const line = Math.round(240 * s.lineHeight * 0.92);
    const centered = !s.headerLeft && s.template !== 'modern';
    const tabs = [{ type: D.TabStopType.RIGHT, position: contentW }];
    const T = (text, o = {}) => new D.TextRun({ text, font, size, ...o });

    const children = [];

    // En-tête (photo flottante à droite pour ne pas casser le flux de texte)
    const nameRuns = [];
    const png = s.showPhoto && p.photo ? await toPngDataUrl(p.photo) : null;
    if (png) {
      try {
        nameRuns.push(new D.ImageRun({
          data: dataUrlToBytes(png),
          transformation: { width: 96, height: 96 },
          floating: {
            horizontalPosition: { relative: D.HorizontalPositionRelativeFrom.MARGIN, align: D.HorizontalPositionAlign.RIGHT },
            verticalPosition: { relative: D.VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
            wrap: { type: D.TextWrappingType.SQUARE, side: D.TextWrappingSide.LEFT },
            margins: { left: 114300 },
          },
        }));
      } catch (e) { console.warn('Photo ignorée', e); }
    }
    const fullName = Store.fullName(cv);
    const nameUpper = s.template === 'classic' || s.template === 'compact';
    nameRuns.push(T(fullName, { bold: true, size: Math.round(size * (s.template === 'compact' ? 1.7 : 1.9)), color: (s.template === 'modern' || s.template === 'elegant') ? accent : '1A1A1A', allCaps: nameUpper, smallCaps: s.template === 'elegant' }));
    children.push(new D.Paragraph({ children: nameRuns, alignment: centered ? D.AlignmentType.CENTER : D.AlignmentType.LEFT, spacing: { after: 40 } }));
    if (p.title) children.push(new D.Paragraph({ children: [T(p.title, { bold: true, size: Math.round(size * 1.12), color: s.template === 'classic' ? accent : undefined })], alignment: centered ? D.AlignmentType.CENTER : D.AlignmentType.LEFT, spacing: { after: 40 } }));
    const contact = [p.email, p.phone, p.location, p.linkedin, p.website, p.extra].filter(Boolean).join('  |  ');
    if (contact) children.push(new D.Paragraph({
      children: [T(contact, { size: Math.round(size * .95) })],
      alignment: centered ? D.AlignmentType.CENTER : D.AlignmentType.LEFT,
      spacing: { after: Math.round(120 * gap) },
      border: s.template === 'modern' ? { bottom: { style: D.BorderStyle.SINGLE, size: 18, color: accent, space: 4 } } : undefined,
    }));

    const heading = title => new D.Paragraph({
      children: [T(title, { bold: true, color: accent, allCaps: s.titlesUpper && s.template !== 'modern' && s.template !== 'elegant', smallCaps: s.template === 'elegant', size: Math.round(size * 1.08) })],
      spacing: { before: Math.round(160 * gap), after: Math.round(70 * gap) },
      border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: s.template === 'modern' ? 'C9CED6' : accent, space: 1 } },
      shading: s.template === 'compact' ? { type: D.ShadingType.CLEAR, fill: 'EEF2F7', color: 'auto' } : undefined,
      keepNext: true,
    });
    const twoCol = (left, right, o = {}) => new D.Paragraph({
      children: [...left, ...(right ? [T('\t' + right, o.rightRun || {})] : [])],
      tabStops: tabs, spacing: { after: 0, line }, keepNext: true,
    });
    const bullet = txt => new D.Paragraph({ children: [T(txt)], bullet: { level: 0 }, spacing: { after: 0, line } });
    const para = (runs, after = 40) => new D.Paragraph({ children: runs, spacing: { after: Math.round(after * gap), line }, alignment: D.AlignmentType.JUSTIFIED });

    cv.order.forEach(key => {
      if (cv.hidden.includes(key)) return;
      const title = Store.sectionTitle(cv, key);
      const block = [];
      if (key === 'summary' || key === 'interests') {
        if (cv[key] && cv[key].trim()) block.push(para([T(cv[key].trim())]));
      } else if (['experience', 'education', 'activities'].includes(key)) {
        cv[key].filter(e => e.org || e.role || e.details).forEach((e, idx, arr) => {
          const dates = [e.start, e.end].filter(Boolean).join(' – ');
          block.push(twoCol([T(e.org || '', { bold: true, color: s.template === 'modern' ? accent : undefined })], e.location));
          if (e.role || dates) block.push(twoCol([T(e.role || '', { italics: true })], dates));
          CVRender.cleanLines(e.details).forEach(l => block.push(bullet(l)));
          if (idx < arr.length - 1) block.push(new D.Paragraph({ children: [], spacing: { after: Math.round(60 * gap), line: 120 } }));
        });
      } else if (key === 'skills') {
        cv.skills.filter(e => e.items).forEach(e => block.push(para([...(e.category ? [T(e.category + ' : ', { bold: true })] : []), T(e.items)], 20)));
      } else if (key === 'certifications') {
        const items = cv.certifications.filter(e => e.name).map(e => e.name + ([e.issuer, e.date].filter(Boolean).length ? ` (${[e.issuer, e.date].filter(Boolean).join(', ')})` : ''));
        if (items.length) block.push(para([T(items.join('  ·  '))]));
      } else if (key === 'languages') {
        const runs = [];
        cv.languages.filter(e => e.name).forEach((e, i) => {
          if (i) runs.push(T('   |   '));
          runs.push(T(e.name, { bold: true }));
          if (e.level) runs.push(T(' : ' + e.level));
        });
        if (runs.length) block.push(para(runs));
      }
      if (block.length) children.push(heading(title), ...block);
    });

    const doc = new D.Document({
      creator: fullName || 'CV Studio',
      title: 'CV ' + fullName,
      styles: { default: { document: { run: { font, size } } } },
      sections: [{
        properties: { page: { size: { width: pageW, height: 16838 }, margin: { top: Math.round(margin * .85), bottom: Math.round(margin * .85), left: margin, right: margin } } },
        children,
      }],
    });
    const blob = await D.Packer.toBlob(doc);
    download(blob, fileBase(cv) + '.docx');
  }

  function exportJSON(cv) {
    download(new Blob([JSON.stringify(cv, null, 2)], { type: 'application/json' }), fileBase(cv) + '.json');
  }

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  window.CVExport = { exportPDF, exportDOCX, exportJSON };
})();
