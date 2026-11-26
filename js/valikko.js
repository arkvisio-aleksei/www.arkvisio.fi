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
  const paneeli = document.querySelector('.etusivu .paakuva');
  if (paneeli) {
    // ETUSIVU: paneeli on CSS:ssä position: sticky, joten selain vierittää sen itse (sulava).
    // Tässä vain vaihdetaan tila kerran, kun paneeli on tarttunut matalaksi palkiksi:
    // html.kompakti = logo pienenee ja hampurilaisnappi tulee valikon tilalle.
    // Paneelin korkeus mitataan vain latautuessa ja koon muuttuessa (ei vierittäessä):
    // iskulauseen ylä- ja alapuolelle sama tila kuin sen sivuille (24–140 px).
    const otsikko = paneeli.querySelector('h1');
    const YLAPALKKI = 76;
    let raja = 0, viimeLeveys = 0;
    const paivita = () => {
      const y = window.scrollY, kompakti = juuri.classList.contains('kompakti');
      if (!kompakti && y >= raja - 40) juuri.classList.add('kompakti');
      else if (kompakti && y < raja - 90) { juuri.classList.remove('kompakti'); suljeValikko(); }
    };
    const mittaa = () => {
      const tyyli = document.body.style;
      if (otsikko) {
        const rako = Math.min(140, Math.max(24, (paneeli.clientWidth - otsikko.offsetWidth) / 2));
        tyyli.setProperty('--paneeli-korkeus', Math.round(YLAPALKKI + rako * 2 + otsikko.offsetHeight) + 'px');
      }
      const palkki = parseFloat(getComputedStyle(document.body).getPropertyValue('--palkki')) || 64;
      raja = paneeli.offsetHeight - palkki;
      viimeLeveys = innerWidth;
      paivita();
    };
    addEventListener('scroll', paivita, { passive: true });
    // iPhonen osoitepalkki muuttaa korkeutta vierittäessä: mitataan uudelleen vain leveyden muuttuessa
    addEventListener('resize', () => { if (innerWidth !== viimeLeveys) mittaa(); });
    mittaa();
    if (document.fonts) document.fonts.ready.then(mittaa);   // fontti muuttaa iskulauseen kokoa
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
