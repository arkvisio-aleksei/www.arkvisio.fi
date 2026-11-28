// ============================================================
//  PALVELUSIVUJEN VAIHTO ILMAN SIVUN LATAUSTA
//  Suunnittelu, Toteutus ja Tutkimus: yläosa (paneeli, palkki) pysyy paikallaan,
//  vain sisältö haetaan taustalla ja vaihdetaan liukuen. Otsikot liukuvat hihnalla.
//  Osoiterivi ja takaisin-nappi toimivat normaalisti (history.pushState / popstate).
//  Jos jokin epäonnistuu, sivu avataan tavallisesti.
// ============================================================

(function () {
  const PALVELUT = ['suunnittelu.html', 'tyomaa.html', 'tutkimus.html'];
  const tiedosto = url => new URL(url, location.href).pathname.split('/').pop();
  const onPalvelu = url => { const u = new URL(url, location.href); return u.origin === location.origin && PALVELUT.includes(tiedosto(u.href)); };
  if (!onPalvelu(location.href) || !window.fetch || !window.DOMParser) return;
  const vahennaLiiketta = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sivut haetaan etukäteen, jotta vaihto on välitön
  const valimuisti = new Map();
  const hae = url => {
    const avain = tiedosto(url);
    if (!valimuisti.has(avain)) valimuisti.set(avain, fetch(avain, { credentials: 'same-origin' }).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }));
    return valimuisti.get(avain);
  };
  const esihae = () => PALVELUT.filter(p => p !== tiedosto(location.href)).forEach(p => hae(p).catch(() => valimuisti.delete(p)));
  if ('requestIdleCallback' in window) requestIdleCallback(esihae, { timeout: 2500 }); else setTimeout(esihae, 1200);

  let kaynnissa = false;
  async function vaihda(url, suunta, historiaan) {
    if (kaynnissa) return;
    kaynnissa = true;
    let uusi;
    try { uusi = new DOMParser().parseFromString(await hae(url), 'text/html'); }
    catch (e) { location.href = url; return; }
    const korvaa = sel => { const a = document.querySelector(sel), b = uusi.querySelector(sel); if (a && b) a.replaceWith(document.adoptNode(b)); };
    const paivita = () => {
      document.title = uusi.title;
      korvaa('.palveluhihna');
      korvaa('.murupolku');
      korvaa('main');
      const kuvaus = uusi.querySelector('meta[name="description"]');
      if (kuvaus) document.querySelector('meta[name="description"]').setAttribute('content', kuvaus.content);
      const nyt = tiedosto(url);
      document.querySelectorAll('.alavalikko a.ali').forEach(a => {
        if (tiedosto(a.href) === nyt) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      if (historiaan) history.pushState({ palvelu: nyt }, '', url);
      window.scrollTo({ top: 0, behavior: 'instant' });
      // Sisällön toiminnot uudelleen: hintalaskuri, talon leikkaus, vaiheiden animaatio
      [window.alustaLaskurit, window.alustaLeikkaus, window.alustaVaiheet].forEach(f => { try { f && f(); } catch (e) { console.error(e); } });
    };
    document.documentElement.dataset.siirto = suunta;
    try {
      if (document.startViewTransition && !vahennaLiiketta) await document.startViewTransition(paivita).finished;
      else paivita();
    } catch (e) { /* siirtymä ohitettiin, sisältö on silti vaihdettu */ }
    delete document.documentElement.dataset.siirto;
    kaynnissa = false;
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    if (!onPalvelu(a.href) || new URL(a.href).hash) return;
    if (tiedosto(a.href) === tiedosto(location.href)) { e.preventDefault(); return; }
    e.preventDefault();
    vaihda(a.href, 'eteen', true);
  });
  // Esihaku myös, kun sormi tai hiiri osuu linkkiin
  document.addEventListener('pointerdown', e => { const a = e.target.closest('a[href]'); if (a && onPalvelu(a.href)) hae(a.href).catch(() => {}); }, { passive: true });

  // Pyyhkäisy puhelimessa: vasemmalle = seuraava palvelu, oikealle = edellinen (kiertävä järjestys).
  // Ei reunoilta (Safarin oma takaisin-ele), ei lomakekentistä eikä sivusuunnassa vieritettävistä alueista.
  const vaakaVieritys = el => {
    for (; el && el !== document.body; el = el.parentElement) {
      const ox = getComputedStyle(el).overflowX;
      if ((ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth + 1) return true;
    }
    return false;
  };
  let alku = null;
  document.addEventListener('touchstart', e => {
    alku = null;
    if (e.touches.length !== 1 || (window.visualViewport && visualViewport.scale > 1.05)) return;
    const t = e.touches[0];
    if (t.clientX < 28 || t.clientX > innerWidth - 28) return;
    if (e.target.closest('input, select, textarea, button, .palveluhihna, video') || vaakaVieritys(e.target)) return;
    alku = { x: t.clientX, y: t.clientY, aika: Date.now() };
  }, { passive: true });
  document.addEventListener('touchmove', e => { if (e.touches.length > 1) alku = null; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!alku) return;
    const t = e.changedTouches[0], dx = t.clientX - alku.x, dy = t.clientY - alku.y, aika = Date.now() - alku.aika;
    alku = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.8 || aika > 800) return;
    if (String(getSelection && getSelection()).length) return;
    const n = PALVELUT.length, i = PALVELUT.indexOf(tiedosto(location.href));
    if (i < 0) return;
    vaihda(PALVELUT[(i + (dx < 0 ? 1 : n - 1)) % n], dx < 0 ? 'eteen' : 'taakse', true);
  }, { passive: true });

  history.replaceState({ palvelu: tiedosto(location.href) }, '');
  addEventListener('popstate', () => { if (onPalvelu(location.href)) vaihda(location.href, 'taakse', false); });
})();
