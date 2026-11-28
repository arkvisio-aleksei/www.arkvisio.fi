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

  history.replaceState({ palvelu: tiedosto(location.href) }, '');
  addEventListener('popstate', () => { if (onPalvelu(location.href)) vaihda(location.href, 'taakse', false); });
})();
