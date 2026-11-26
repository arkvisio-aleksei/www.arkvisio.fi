// ============================================================
//  YHTEISET: mobiilivalikko, yläpalkin tausta, vuosiluku ja osaamisten esiintulo.
//  Käytössä kaikilla sivuilla.
// ============================================================

(function () {
  const valikko = document.getElementById('valikko');
  const valikkoNappi = document.querySelector('.valikko-nappi');
  if (valikko && valikkoNappi) {
    const suljeValikko = () => { valikko.classList.remove('auki'); valikkoNappi.setAttribute('aria-expanded', 'false'); valikkoNappi.textContent = 'Valikko'; };
    valikkoNappi.addEventListener('click', () => {
      const auki = valikko.classList.toggle('auki');
      valikkoNappi.setAttribute('aria-expanded', auki);
      valikkoNappi.textContent = auki ? 'Sulje' : 'Valikko';
    });
    valikko.addEventListener('click', e => { if (e.target.closest('a')) suljeValikko(); });
  }
  document.querySelectorAll('[data-vuosi]').forEach(el => el.textContent = new Date().getFullYear());

  // Yläpalkki saa taustan, kun sivua on vieritetty. Eri rajat alas (40 px) ja ylös (8 px),
  // ettei tila välky edestakaisin yläreunan lähellä (esim. iPhonen jousto-vierityksessä).
  const juuri = document.documentElement;
  let ajastettu = false;
  const rullattu = () => {
    ajastettu = false;
    const y = window.scrollY, paalla = juuri.classList.contains('rullattu');
    if (!paalla && y > 40) juuri.classList.add('rullattu');
    else if (paalla && y < 8) juuri.classList.remove('rullattu');
  };
  addEventListener('scroll', () => { if (!ajastettu) { ajastettu = true; requestAnimationFrame(rullattu); } }, { passive: true });
  rullattu();

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
