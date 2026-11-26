// ============================================================
//  YHTEISET: mobiilivalikko, yläpalkin tausta, vuosiluku ja osaamisten esiintulo.
//  Käytössä kaikilla sivuilla.
// ============================================================

(function () {
  // Valikon avaus: tekstinappi (mobiili) ja hampurilaisnappi (etusivun kutistunut palkki) ohjaavat samaa valikkoa
  const valikko = document.getElementById('valikko');
  const napit = document.querySelectorAll('[aria-controls="valikko"]');
  const asetaValikko = auki => {
    if (!valikko) return;
    valikko.classList.toggle('auki', auki);
    napit.forEach(n => {
      n.setAttribute('aria-expanded', auki);
      if (n.classList.contains('valikko-nappi')) n.textContent = auki ? 'Sulje' : 'Valikko';
    });
  };
  const suljeValikko = () => asetaValikko(false);
  if (valikko) {
    napit.forEach(n => n.addEventListener('click', () => asetaValikko(!valikko.classList.contains('auki'))));
    valikko.addEventListener('click', e => { if (e.target.closest('a')) suljeValikko(); });
  }
  document.querySelectorAll('[data-vuosi]').forEach(el => el.textContent = new Date().getFullYear());

  // Yläpalkki saa valkoisen taustan, kun sivua on vieritetty. Eri rajat alas (80 px) ja ylös (40 px),
  // ettei tila välky. .yla-tausta ohjaa iPhonen kellon alueen väriä: se näytetään heti alas vieritettäessä
  // ja poistetaan HETI ylös palatessa, kun sivu on vielä liikkeessä (Safari päivittää värin vain vierityksen
  // aikana). Näkyvä liuku ylös tehdään palkin ::before-kerroksella (css/tyylit.css).
  const juuri = document.documentElement;
  const paneeli = document.querySelector('.etusivu .paneeli');
  if (paneeli) {
    // ETUSIVU: harmaa paneeli kutistuu vierityksen tahdissa täydestä korkeudesta matalaksi palkiksi.
    // Paneelin alareuna kulkee sisällön mukana (kutistuu yhtä paljon kuin sivua vieritetään).
    const yla = paneeli.closest('.paakuva');
    const MATALA = 76;
    let tayskorkeus = 0;
    const paivita = () => {
      const matka = Math.max(1, tayskorkeus - MATALA);
      const p = Math.min(1, Math.max(0, window.scrollY / matka));
      paneeli.style.height = (tayskorkeus - matka * p) + 'px';
      juuri.style.setProperty('--p', p.toFixed(4));
      const kompakti = juuri.classList.contains('kompakti');
      if (!kompakti && p >= .97) juuri.classList.add('kompakti');
      else if (kompakti && p < .9) { juuri.classList.remove('kompakti'); suljeValikko(); }
    };
    const mittaa = () => { tayskorkeus = yla.offsetHeight; paivita(); };
    addEventListener('scroll', paivita, { passive: true });
    addEventListener('resize', mittaa);
    mittaa();
  } else {
    // ALASIVUT: valkoinen palkki liukuu esiin vierittäessä
    const tausta = document.querySelector('.yla-tausta');
    const rullattu = () => {
      const y = window.scrollY, paalla = juuri.classList.contains('rullattu');
      if (!paalla && y > 80) {
        if (tausta) { tausta.style.display = 'block'; void tausta.offsetHeight; }  // asetteluun ennen animaatiota
        juuri.classList.add('rullattu');
      } else if (paalla && y < 40) {
        if (tausta) tausta.style.display = 'none';
        juuri.classList.remove('rullattu');
      }
    };
    addEventListener('scroll', rullattu, { passive: true });
    rullattu();
  }

  // Osaamiset liukuvat esiin ja kuvakkeet piirtyvät, kun osio tulee näkyviin.
  // Ilman skriptiä tai "Vähennä liikettä" -asetuksella kaikki näkyy heti.
  const osaamiset = document.querySelectorAll('.osaaminen');
  if (osaamiset.length && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-animaatio');
    osaamiset.forEach((o, i) => {
      o.style.setProperty('--i', i % 3);
      o.querySelectorAll('.ikoni path, .ikoni circle').forEach(viiva => viiva.setAttribute('pathLength', '1'));
    });
    const havainnoija = new IntersectionObserver(merkinnat => merkinnat.forEach(m => {
      if (m.isIntersecting) { m.target.classList.add('esiin'); havainnoija.unobserve(m.target); }
    }), { threshold: .3 });
    osaamiset.forEach(o => havainnoija.observe(o));
  }
})();
