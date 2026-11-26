// ============================================================
//  YHTEISET: mobiilivalikko, yläpalkin tausta, vuosiluku ja osaamisten esiintulo.
//  Käytössä kaikilla sivuilla.
// ============================================================

(function () {
  // Valikon avaus: tekstinappi (mobiili) ja hampurilaisnappi (etusivun kutistunut palkki) ohjaavat samaa valikkoa
  const juuriEl = document.documentElement;
  let avaaPienena = null;   // etusivu asettaa (alla)
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
  // Sulkeminen ilman animaatiota (kun valikko on jo piilossa palkin takana eikä sen saa välähtää)
  const suljeHeti = () => {
    if (!valikko || !valikko.classList.contains('auki')) return;
    const osat = [valikko, ...valikko.querySelectorAll('a')];
    osat.forEach(o => { o.style.transition = 'none'; });
    suljeValikko();
    void valikko.offsetHeight;
    setTimeout(() => osat.forEach(o => { o.style.transition = ''; }), 60);
  };
  if (valikko) {
    napit.forEach(n => n.addEventListener('click', () => {
      const auki = valikko.classList.contains('auki');
      // Etusivu: jos kansikuva on näkyvissä, vieritetään ensin kuva piiloon ja avataan valikko vasta pienestä palkista
      if (!auki && avaaPienena && avaaPienena()) return;
      asetaValikko(!auki);
    }));
    valikko.addEventListener('click', e => {
      if (!e.target.closest('a')) return;
      // Etusivun iso palkki (kaikilla näytöillä): valikkoa ei suljeta erikseen, vaan se vierii paneelin mukana palkin taakse
      // ja suljetaan huomaamatta palkin kutistuessa (ei päällekkäisiä animaatioita). Varmistus, jos sivu ei vieri.
      const isoPalkki = document.body.classList.contains('etusivu') && !juuriEl.classList.contains('kompakti');
      if (isoPalkki) setTimeout(() => { if (!juuriEl.classList.contains('kompakti')) suljeValikko(); }, 1000);
      else suljeValikko();
    });
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
    // Paneelin korkeus (CSS: --paneeli-korkeus) mitataan vain latautuessa ja koon muuttuessa (ei vierittäessä).
    let raja = 0, viimeLeveys = 0;
    // Uudet selaimet ajavat logon pienennyksen CSS:n vieritysanimaationa; muille --k skriptillä
    const vieritysAnimaatio = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
    const paivita = () => {
      const y = window.scrollY, kompakti = juuri.classList.contains('kompakti');
      // Logon pienennys ja palkkirivin nousu seuraavat vieritystä (vain transform, ei asettelun laskentaa)
      if (!vieritysAnimaatio) {
        juuri.style.setProperty('--k', Math.min(1, Math.max(0, y / Math.max(1, raja))).toFixed(3));
        juuri.style.setProperty('--vy', Math.min(Math.max(0, y), raja).toFixed(1));   // isosta palkista avattu valikko vierii mukana
      }
      // Isosta palkista avattu valikko on tässä vaiheessa jo palkin takana: suljetaan se, kun palkki kutistuu
      if (!kompakti && y >= raja - 40) { suljeHeti(); juuri.classList.add('kompakti'); }
      else if (kompakti && y < raja - 90) { juuri.classList.remove('kompakti'); suljeValikko(); }
    };
    const mittaa = () => {
      const palkki = parseFloat(getComputedStyle(document.body).getPropertyValue('--palkki')) || 64;
      raja = paneeli.offsetHeight - palkki;
      viimeLeveys = innerWidth;
      paivita();
    };
    avaaPienena = () => {
      if (juuri.classList.contains('kompakti')) return false;
      window.scrollTo({ top: raja + 2, behavior: 'smooth' });
      let kerrat = 0;
      const odota = () => {
        if (juuri.classList.contains('kompakti')) asetaValikko(true);
        else if (kerrat++ < 40) setTimeout(odota, 50);
      };
      setTimeout(odota, 50);
      return true;
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
