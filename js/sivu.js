// ============================================================
//  ETUSIVUN TOIMINNOT: suodattimet, hankelaskuri, kartta.
//  (Valikko ja vuosiluku: js/valikko.js)
// ============================================================

(function () {
  // Kuormitustesti: index.html?testi=1000 korvaa kohteet 1000 satunnaisella kohteella Suomessa.
  const testi = +new URLSearchParams(location.search).get('testi');
  if (testi > 0) window.KOHTEET = luoTestikohteet(Math.min(testi, 20000));

  const tyypit = window.KOHDETYYPIT;
  // Vain tunnetut tyypit kartalle (esim. kuntotutkimukset eivät näy, vaikka ne jäisivät dataan)
  const kohteet = window.KOHTEET = window.KOHTEET.filter(k => tyypit[k.tyyppi]);
  const aktiiviset = new Set(Object.keys(tyypit));

  const muotoile = n => n.toLocaleString('fi-FI').replace(/ /g, ' ');
  document.querySelectorAll('[data-kohteiden-maara]').forEach(el => el.textContent = muotoile(kohteet.length));

  // Hankelaskuri: iso luku liukuu uuteen arvoon, pieni rivi kertoo kartan näkymän.
  const hankeluku = document.querySelector('[data-hankeluku]');
  const nakymassaEl = document.querySelector('[data-nakymassa]');
  const vahennaLiiketta = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lukuNyt = 0, lukuAnim = 0;
  function naytaLuku(kohde) {
    if (!hankeluku) return;
    cancelAnimationFrame(lukuAnim);
    const alku = lukuNyt, t0 = performance.now(), kesto = vahennaLiiketta ? 0 : 900;
    const askel = t => {
      const s = kesto ? Math.min(1, (t - t0) / kesto) : 1;
      lukuNyt = Math.round(alku + (kohde - alku) * (1 - Math.pow(1 - s, 3)));
      hankeluku.textContent = muotoile(lukuNyt);
      if (s < 1) lukuAnim = requestAnimationFrame(askel);
    };
    lukuAnim = requestAnimationFrame(askel);
  }
  let nakymassaViimeksi = -1, valittujaYht = 0;
  function naytaNakymassa(n) {
    if (!nakymassaEl || n === nakymassaViimeksi) return;
    nakymassaViimeksi = n;
    nakymassaEl.textContent = n === valittujaYht ? 'kaikki kartalla näkyvissä' : `joista ${muotoile(n)} kartan näkymässä`;
  }

  // Kartta
  const karttaJuuri = document.querySelector('[data-kartta]');
  const kartta = window.luoKartta(karttaJuuri, { nakyvissa: naytaNakymassa });

  // Suodattimet kartan vieressä
  const maara = t => kohteet.filter(k => k.tyyppi === t).length;
  const suodatinHtml = Object.entries(tyypit).map(([id, t]) =>
    `<button class="suodatin" type="button" aria-pressed="true" data-tyyppi="${id}"><i style="background:${t.vari}"></i>${t.nimi}<span class="maara">${muotoile(maara(id))}</span></button>`
  ).join('');
  document.querySelectorAll('[data-suodattimet]').forEach(r => {
    r.innerHTML = suodatinHtml;
    r.addEventListener('click', e => {
      const b = e.target.closest('.suodatin'); if (!b) return;
      const t = b.dataset.tyyppi;
      aktiiviset.has(t) ? aktiiviset.delete(t) : aktiiviset.add(t);
      paivita();
    });
  });

  function paivita() {
    document.querySelectorAll('.suodatin').forEach(b => b.setAttribute('aria-pressed', aktiiviset.has(b.dataset.tyyppi)));
    kartta.suodata(aktiiviset);
    const valitut = [];
    kohteet.forEach((k, i) => { if (aktiiviset.has(k.tyyppi)) valitut.push(i); });
    if (valitut.length !== valittujaYht) { valittujaYht = valitut.length; nakymassaViimeksi = -1; naytaLuku(valittujaYht); }
  }
  paivita();

  function luoTestikohteet(n) {
    const suomi = window.KARTTA_DATA.pohjola.features.find(f => f.id === '246');
    const tyyppiIdt = Object.keys(window.KOHDETYYPIT);
    const keskukset = [[24.94, 60.17, .22, .45], [23.76, 61.50, .15, .1], [22.27, 60.45, .12, .08], [25.47, 65.01, .12, .05], [25.66, 60.98, .1, .05]];
    const satunnainenNormaali = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
    const tulos = [];
    while (tulos.length < n) {
      let lon, lat, x = Math.random(), kum = 0, kesk = null;
      for (const c of keskukset) { kum += c[3]; if (x < kum) { kesk = c; break; } }
      if (kesk) { lon = kesk[0] + satunnainenNormaali() * kesk[2] * 1.8; lat = kesk[1] + satunnainenNormaali() * kesk[2]; }
      else { lon = 20.6 + Math.random() * 11; lat = 59.8 + Math.random() * 10.2; if (Math.random() > (lat < 62 ? 1 : lat < 65 ? .4 : .15)) continue; }
      if (!d3.geoContains(suomi, [lon, lat])) continue;
      tulos.push({ nimi: 'Testikohde ' + (tulos.length + 1), paikka: 'Satunnainen sijainti', tyyppi: tyyppiIdt[Math.floor(Math.random() * tyyppiIdt.length)], lat: +lat.toFixed(4), lon: +lon.toFixed(4), vuosi: 1993 + Math.floor(Math.random() * 33), esimerkki: true });
    }
    return tulos;
  }
})();
