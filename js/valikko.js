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
  // Kansivideon kallistus (vain puhelin): kallistus vasemmalle/oikealle panoroi videota sivusuunnassa
  // sen omien rajojen sisällä (object-position), ei suurennusta. iPhone vaatii luvan napautuksella (.liike-nappi).
  (() => {
    const video = document.querySelector('.kansivideo');
    if (!video || !matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const KESKI = 60, MATKA = 40;                    // object-position x: 60 % ± 40 % (20 %…100 %)
    let tx = KESKI, x = KESKI, kaynnissa = false, lahto = null;
    const piirra = () => {
      x += (tx - x) * .25;                           // nopea mutta pehmeä seuranta
      video.style.objectPosition = `${x.toFixed(2)}% 50%`;
      if (Math.abs(tx - x) > .05) requestAnimationFrame(piirra); else kaynnissa = false;
    };
    const suunta = e => {
      if (e.gamma == null) return;
      if (lahto === null) lahto = e.gamma;           // ensimmäinen lukema = lähtöasento
      const n = Math.max(-1, Math.min(1, (e.gamma - lahto) / 15));
      tx = KESKI + n * MATKA;
      if (!kaynnissa) { kaynnissa = true; requestAnimationFrame(piirra); }
    };
    const kuuntele = () => addEventListener('deviceorientation', suunta, { passive: true });
    const nappi = document.querySelector('.liike-nappi');
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      if (nappi) {                                   // iPhone: lupa napautuksella
        nappi.hidden = false;
        nappi.addEventListener('click', () => {
          DeviceOrientationEvent.requestPermission().then(t => { if (t === 'granted') { kuuntele(); nappi.hidden = true; } }).catch(() => {});
        });
      }
    } else if ('ondeviceorientation' in window) kuuntele();   // Android
  })();

  // Kansivideo: "Vähennä liikettä" -asetuksella video pysäytetään (kansikuva näkyy)
  const kansivideo = document.querySelector('.kansivideo');
  if (kansivideo && matchMedia('(prefers-reduced-motion: reduce)').matches) { kansivideo.removeAttribute('autoplay'); kansivideo.pause(); }
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
      if (!kompakti && y >= raja - 40) { vaihdaTila(true); }
      else if (kompakti && y < raja - 90) { vaihdaTila(false); }
    };
    // Tilanvaihto ilman valikon siirtymiä (vaakalinkit <-> pudotusvalikko vaihtuvat välittömästi)
    let vaihtoAjastin;
    const vaihdaTila = kompaktiksi => {
      juuri.classList.add('tilavaihto');
      suljeHeti();
      juuri.classList.toggle('kompakti', kompaktiksi);
      void juuri.offsetHeight;
      clearTimeout(vaihtoAjastin);
      vaihtoAjastin = setTimeout(() => juuri.classList.remove('tilavaihto'), 80);
    };
    const mittaa = () => {
      // Alasivuilla paneelin korkeus tulee sisällöstä: kerrotaan se CSS:lle (sticky-paneelin yläraja ja animaatiot)
      if (document.body.classList.contains('alasivu')) document.body.style.setProperty('--paneeli-korkeus', paneeli.offsetHeight + 'px');
      const palkki = parseFloat(getComputedStyle(document.body).getPropertyValue('--palkki')) || 64;
      raja = paneeli.offsetHeight - palkki;
      viimeLeveys = innerWidth;
      paivita();
    };
    // Hampurilainen videon ollessa esillä: vieritetään rauhallisesti (oma pehmeä animaatio ~1,4 s)
    // video piiloon ja avataan valikko vasta, kun vieritys on valmis.
    const pehmeaVieritys = (kohde, kesto, valmis) => {
      const alku = window.scrollY, matka = kohde - alku, t0 = performance.now();
      // Sivun oma pehmeä vieritys (CSS scroll-behavior) pois animaation ajaksi, muuten Safari käyttää omaa nopeaa vieritystään
      const html = document.documentElement, ennen = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      const pehmennys = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;   // hidas alku ja loppu
      const askel = nyt => {
        const t = Math.min(1, (nyt - t0) / kesto);
        window.scrollTo(0, alku + matka * pehmennys(t));
        if (t < 1) requestAnimationFrame(askel);
        else { html.style.scrollBehavior = ennen; if (valmis) valmis(); }
      };
      requestAnimationFrame(askel);
    };
    avaaPienena = () => {
      if (juuri.classList.contains('kompakti')) return false;
      pehmeaVieritys(raja + 2, 1400, () => setTimeout(() => asetaValikko(true), 120));
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
