// ============================================================
//  KOHDEKARTTA – maapallo, joka zoomautuu Suomeen.
//  Lähekkäiset kohteet yhdistetään ryhmiksi (numero + tyyppien
//  osuudet renkaana). Ryhmää klikkaamalla kartta lähentää.
//  Tarvitsee: d3, topojson, data/kartta-data.js, data/kohteet.js
// ============================================================

window.luoKartta = function (juuri, asetukset = {}) {
  const alue = juuri.querySelector('.kartta-alue');
  const canvas = alue.querySelector('canvas');
  const vihje = alue.querySelector('.kartta-vihje');
  const ctx = canvas.getContext('2d');

  const TYYLI = {
    meri: '#242830',
    ruudukko: 'rgba(244, 241, 236, .05)',
    maa: '#33373F',
    rajat: 'rgba(244, 241, 236, .16)',
    suomi: '#3A3F49',
    suomiReuna: 'rgba(247, 156, 9, .75)',
    reuna: 'rgba(244, 241, 236, .18)',
    halo: '#1F2229',
    teksti: 'rgba(244, 241, 236, .62)',
    tekstiIso: 'rgba(244, 241, 236, .85)',
    ryhma: '#1F2229',
    ryhmaTeksti: '#F4F1EC',
  };
  const FONTTI = '"Jost", "Century Gothic", "Segoe UI", sans-serif';
  const NAKYMA_MAAILMA = { k: 1, keski: [15, 38] };
  const NAKYMA_SUOMI = { k: 7.8, keski: [25.4, 65.0] };
  const K_MIN = .9, K_MAX = 4000;
  // Avauslennon jälkeen Suomi-näkymä on kaukaisin, mihin voi loitontaa.
  // Jos ollaan vielä kauempana (lento keskeytettiin), alarajana on nykyinen zoom: kauemmas ei pääse.
  let kMin = K_MIN;
  const alaraja = () => Math.min(kMin, k);
  const lukitseSuomeen = () => { kMin = NAKYMA_SUOMI.k; };
  const RUUTU = 44;                // ryhmittelyn ruutukoko pikseleinä
  const vahennaLiiketta = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Rajaus lähennettäessä: 'ikkuna' = pyöreä ikkuna, 'haivytys' = reunat häivytetään taustaan,
  // 'tausta' = kartta on koko pääkuvan tausta. Valitaan index.html:ssä: data-rajaus="tausta".
  const RAJAUS = juuri.dataset.rajaus || 'ikkuna';
  const haivytys = RAJAUS === 'haivytys';
  // 'kortti' = pyöristetty kortti, joka on sivulla vain esikatselu; napautus avaa kartan isoon ikkunaan.
  const kortti = RAJAUS === 'kortti';
  const paakuva = juuri.closest('.paakuva');
  const tausta = RAJAUS === 'tausta' && !!paakuva;
  const vapaa = haivytys || tausta || kortti;   // pallo saa kasvaa kehystä suuremmaksi
  alue.classList.toggle('kortti', kortti);
  alue.classList.toggle('haivytys', haivytys); juuri.classList.toggle('haivytys', haivytys);
  juuri.classList.toggle('tausta', tausta); if (tausta) { paakuva.classList.add('kartta-taustana'); paakuva.prepend(canvas); }

  // Kaupungit suunnistamisen tueksi: [nimi, lat, lon, taso] – taso 1 näkyy ensin, taso 3 vasta lähellä.
  const KAUPUNGIT = [
    ['Helsinki', 60.170, 24.941, 1], ['Tampere', 61.498, 23.761, 1], ['Turku', 60.452, 22.267, 1], ['Oulu', 65.012, 25.465, 1],
    ['Jyväskylä', 62.242, 25.747, 1], ['Kuopio', 62.892, 27.678, 1], ['Rovaniemi', 66.503, 25.729, 1], ['Vaasa', 63.096, 21.616, 1],
    ['Joensuu', 62.601, 29.763, 1], ['Tukholma', 59.329, 18.069, 1], ['Tallinna', 59.437, 24.754, 1], ['Oslo', 59.913, 10.752, 1],
    ['Lahti', 60.983, 25.656, 2], ['Pori', 61.485, 21.797, 2], ['Lappeenranta', 61.058, 28.189, 2], ['Seinäjoki', 62.790, 22.840, 2],
    ['Mikkeli', 61.688, 27.272, 2], ['Kajaani', 64.227, 27.728, 2], ['Kotka', 60.467, 26.946, 2], ['Hämeenlinna', 60.996, 24.464, 2],
    ['Kokkola', 63.838, 23.131, 2], ['Savonlinna', 61.868, 28.887, 2], ['Kemi', 65.736, 24.564, 2], ['Kittilä', 67.659, 24.911, 2],
    ['Espoo', 60.205, 24.656, 3], ['Vantaa', 60.294, 25.040, 3], ['Porvoo', 60.393, 25.664, 3], ['Rauma', 61.128, 21.511, 3],
    ['Salo', 60.384, 23.127, 3], ['Lohja', 60.249, 24.065, 3], ['Järvenpää', 60.474, 25.090, 3], ['Hyvinkää', 60.631, 24.861, 3],
    ['Kirkkonummi', 60.124, 24.441, 3], ['Tuusula', 60.403, 25.027, 3], ['Sipoo', 60.377, 25.270, 3], ['Kerava', 60.403, 25.105, 3],
  ];
  const tasonRaja = { 1: 3, 2: 9, 3: 22 };

  // Karttadata
  const D = window.KARTTA_DATA;
  const maailma = { type: 'FeatureCollection', features: topojson.feature(D.maailma, D.maailma.objects.countries).features };
  const rajatMaailma = topojson.mesh(D.maailma, D.maailma.objects.countries, (a, b) => a !== b);
  const pohjola = D.pohjola.features;
  const pohjolaIdt = new Set(pohjola.map(f => f.id));
  const maailmaIlmanPohjolaa = { type: 'FeatureCollection', features: maailma.features.filter(f => !pohjolaIdt.has(f.id)) };

  // Nopeutus: jokainen maa pilkotaan osiin (mantere, saaret), ja jokaisesta
  // osasta tehdään valmiiksi karkeampia versioita. Piirtäessä ohitetaan osat,
  // jotka eivät ole näkyvissä, ja kaukaa katsottuna käytetään karkeaa versiota.
  const TASOT = [0, .003, .008, .02, .05, .12];   // toleranssi asteina; 0 = täysi tarkkuus
  function harvenna(rengas, tol) {
    if (!tol) return rengas;
    const ulos = [rengas[0]];
    for (let i = 1; i < rengas.length - 1; i++) {
      const [a, b] = ulos[ulos.length - 1], [x, y] = rengas[i];
      if (Math.abs(x - a) * Math.cos(y * Math.PI / 180) > tol || Math.abs(y - b) > tol) ulos.push(rengas[i]);
    }
    ulos.push(rengas[rengas.length - 1]);
    return ulos.length >= 4 ? ulos : null;
  }
  // Pitkä rengas pilkotaan pätkiin. Näkymän ulkopuolinen pätkä korvataan
  // suoralla, joka pysyy itsekin ulkopuolella, joten näkyvä kuva ei muutu.
  const PATKA = 64;
  const rajaa = (pisteet, i0, i1) => {
    let lon0 = 180, lat0 = 90, lon1 = -180, lat1 = -90;
    for (let i = i0; i < i1; i++) { const [x, y] = pisteet[i]; if (x < lon0) lon0 = x; if (x > lon1) lon1 = x; if (y < lat0) lat0 = y; if (y > lat1) lat1 = y; }
    return { lon0, lat0, lon1, lat1 };
  };
  function rengasOsiin(pisteet) {
    if (pisteet.length <= PATKA * 3) return { pisteet, patkat: null };
    const patkat = [];
    for (let i = 0; i < pisteet.length - 1; i += PATKA) {
      const i1 = Math.min(i + PATKA, pisteet.length - 1);
      patkat.push({ i0: i, i1, ...rajaa(pisteet, i, i1 + 1) });
    }
    return { pisteet, patkat };
  }
  function osiin(kokoelma) {
    const osat = [];
    for (const f of kokoelma) {
      const g = f.geometry;
      for (const monikulmio of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) {
        const geo = { type: 'Polygon', coordinates: monikulmio };
        const [[lon0, lat0], [lon1, lat1]] = d3.geoBounds(geo);
        const ala = d3.geoArea(geo);
        const tasot = TASOT.map(tol => {
          const ulko = harvenna(monikulmio[0], tol);
          if (!ulko) return null;
          const renkaat = [ulko, ...monikulmio.slice(1).map(r => harvenna(r, tol)).filter(Boolean)];
          // Harvennus ei saa kääntää monikulmiota nurin (silloin koko pallo täyttyisi).
          if ((d3.geoArea({ type: 'Polygon', coordinates: renkaat }) > 2 * Math.PI) !== (ala > 2 * Math.PI)) return null;
          const osina = renkaat.map(rengasOsiin);
          return { geo: { type: 'Polygon', coordinates: renkaat }, renkaat: osina.some(r => r.patkat) ? osina : null };
        });
        osat.push({ lon0, lat0, lon1, lat1, tasot });
      }
    }
    return osat;
  }
  const osatMaailma = osiin(maailma.features);
  const osatMaailmaIlmanPohjolaa = osiin(maailmaIlmanPohjolaa.features);
  const osatPohjolaMuut = osiin(pohjola.filter(f => f.id !== '246'));
  const osatSuomi = osiin(pohjola.filter(f => f.id === '246'));

  // Karkein taso, jonka toleranssi on alle pikselin.
  function taso() {
    const astettaPerPx = (180 / Math.PI) / (sade * k);
    let i = 0;
    while (i < TASOT.length - 1 && TASOT[i + 1] < astettaPerPx * .8) i++;
    return i;
  }
  // Onko lon/lat-laatikko näkyvissä? (nakyvaSade lasketaan kerran kuvaa kohden)
  let nakyvaSade = Math.PI;
  function laatikkoNakyy(r) {
    const lahinLat = Math.max(r.lat0, Math.min(r.lat1, keski[1]));
    // Päivämäärärajan ylittävä laatikko: pituusvälit [lon0, 180] ja [-180, lon1]
    if (r.lon0 > r.lon1) return d3.geoDistance([Math.max(r.lon0, keski[0]), lahinLat], keski) <= nakyvaSade
      || d3.geoDistance([Math.min(r.lon1, keski[0]), lahinLat], keski) <= nakyvaSade;
    if (d3.geoDistance([Math.max(r.lon0, Math.min(r.lon1, keski[0])), lahinLat], keski) <= nakyvaSade) return true;
    // Pohjoisessa lähin kohta ei aina ole yllä arvioitu: tarkistetaan myös reunojen pisteet.
    const lonR = Math.max(r.lon0, Math.min(r.lon1, keski[0]));
    for (const p of [[r.lon0, r.lat0], [r.lon0, r.lat1], [r.lon1, r.lat0], [r.lon1, r.lat1], [lonR, r.lat0], [lonR, r.lat1], [r.lon0, lahinLat], [r.lon1, lahinLat]])
      if (d3.geoDistance(p, keski) <= nakyvaSade) return true;
    return false;
  }
  // Lisää näkyvät osat polkuun.
  function piirraOsat(osat, t) {
    // Ortografisessa projektiossa piste kulmaetäisyydellä θ on säteellä sade·k·sin θ.
    nakyvaSade = Math.asin(Math.min(1, nakyvaAlue() / (sade * k))) + .05;
    for (const o of osat) {
      const taso = o.tasot[t];
      if (!taso || !laatikkoNakyy(o)) continue;
      if (!taso.renkaat || nakyvaSade > .5) { polku(taso.geo); continue; }
      polku({ type: 'Polygon', coordinates: taso.renkaat.map(({ pisteet, patkat }) => {
        if (!patkat) return pisteet;
        const ulos = [];
        for (const p of patkat) {
          if (laatikkoNakyy(p)) for (let i = p.i0; i < p.i1; i++) ulos.push(pisteet[i]);
          else ulos.push(pisteet[p.i0]);
        }
        ulos.push(pisteet[pisteet.length - 1]);
        return ulos;
      }) });
    }
  }
  const ruudukko = d3.geoGraticule10();

  const kohteet = window.KOHTEET.map((k, i) => ({ ...k, i, piste: [k.lon, k.lat] }));
  // Aloitusnäkymä: kaikki kohteet mahtuvat kehykseen väljästi (näytön koon mukaan).
  function kohdeNakyma() {
    if (!kohteet.length || !w) return [NAKYMA_SUOMI.k, NAKYMA_SUOMI.keski];
    const lonit = kohteet.map(j => j.lon), latit = kohteet.map(j => j.lat);
    const lon0 = Math.min(...lonit), lon1 = Math.max(...lonit), lat0 = Math.min(...latit), lat1 = Math.max(...latit);
    const keskiLat = (lat0 + lat1) / 2, rad = Math.PI / 180;
    const leveys = Math.max(.05, (lon1 - lon0) * Math.cos(keskiLat * rad)) * rad, korkeus = Math.max(.05, lat1 - lat0) * rad;
    const kk = Math.min(w * .78 / (sade * leveys), h * .62 / (sade * korkeus));
    return [Math.max(NAKYMA_SUOMI.k, Math.min(400, kk)), [(lon0 + lon1) / 2, keskiLat + (lat1 - lat0) * .08]];
  }
  const tyypit = window.KOHDETYYPIT;
  const tyyppiIdt = Object.keys(tyypit);
  const aktiiviset = new Set(tyyppiIdt);
  const vari = t => (tyypit[t] || {}).vari || '#A9ACB3';

  const proj = d3.geoOrthographic().clipAngle(90).precision(.7);
  const polku = d3.geoPath(proj, ctx);

  let w = 0, h = 0, sade = 0;
  let cx = 0, cy = 0, rx = 0, ry = 0;   // pallon keskipiste ja näkyvän alueen säteet kankaalla
  let kehys = { x0: 0, y0: 0, x1: 0, y1: 0 };   // kehyksen paikka kankaalla
  let rajaX = 0, rajaY = 0, rajaO = 0;  // taustatilassa: kartta häipyy näiden vasemmalla/yläpuolella/oikealla
  let k = NAKYMA_MAAILMA.k, keski = NAKYMA_MAAILMA.keski.slice();
  let osumat = [], animaatio = null, valittu = null, aktiivinen = false;

  // Näkyvän alueen säde pikseleinä kartan keskeltä.
  // Kortti- ja ikkunatilassa koko suorakaide näkyy, joten säde ulottuu kulmiin asti.
  const nakyvaAlue = () => tausta ? Math.hypot(w, h) : haivytys ? Math.max(rx, ry) : kortti ? Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) : sade;

  const asetaProj = () => proj.translate([cx, cy]).scale(sade * k).rotate([-keski[0], -keski[1]]).clipExtent([[-2, -2], [w + 2, h + 2]]);

  function koko() {
    // Taustatilassa kangas on koko pääkuvan kokoinen, joten tarkkuutta rajataan sujuvuuden vuoksi.
    const dpr = Math.min(window.devicePixelRatio || 1, tausta ? 1.5 : 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Pallon koko tulee kehyksestä; häivytystilassa kangas on kehystä isompi.
    sade = Math.min(alue.clientWidth, alue.clientHeight) / 2 - 10;
    // Kangas voi ulottua kehyksen yli eri verran eri suuntiin; pallo pysyy kehyksen keskellä.
    const ab = alue.getBoundingClientRect(), cb = canvas.getBoundingClientRect();
    kehys = { x0: ab.left - cb.left, y0: ab.top - cb.top, x1: ab.right - cb.left, y1: ab.bottom - cb.top };
    cx = (kehys.x0 + kehys.x1) / 2; cy = (kehys.y0 + kehys.y1) / 2;
    rx = Math.min(cx, w - cx); ry = Math.min(cy, h - cy);
    if (haivytys) canvas.style.clipPath = `ellipse(${rx}px ${ry}px at ${cx}px ${cy}px)`;
    if (tausta) {
      // Iskulauseen puoli (tai kapealla sen alapuoli) jätetään tekstille.
      const yla = paakuva.querySelector('.yla');
      const ylaAla = yla ? yla.getBoundingClientRect().bottom - cb.top : 0;
      rajaX = Math.max(0, kehys.x0 - 220); rajaY = Math.max(ylaAla, kehys.y0 - 140);
      // Oikealla kartta häipyy sisällön reunaan (sama marginaali kuin iskulauseella vasemmalla),
      // jotta iskulause ja kartta ovat tasapainossa. Kapealla kartta on tekstin alla koko leveydeltä.
      const sisalto = paakuva.querySelector('.kehys'), sb = sisalto.getBoundingClientRect();
      const sisaltoO = sb.right - cb.left - parseFloat(getComputedStyle(sisalto).paddingRight);
      const vierekkain = rajaX > 0;
      rajaO = vierekkain ? Math.min(w, sisaltoO) : w;
      const oikeaAlku = vierekkain ? Math.max(kehys.x0 + 1, rajaO - 220) : w;
      canvas.style.clipPath = `inset(${rajaY}px ${w - rajaO}px 0 ${rajaX}px)`;
      // Häivytys CSS-maskina: lasketaan kerran, ei joka kuvalla. Kartta häipyy iskulauseen
      // puolelle, oikealle sisällön reunaan ja yläpalkin alta; alhaalla se jatkuu pääkuvan yli ja häipyy.
      const ylaLoppu = rajaY + Math.max(80, kehys.y0 - rajaY);
      const maski = `linear-gradient(to right, transparent ${rajaX}px, #000 ${Math.max(rajaX + 1, kehys.x0)}px, #000 ${oikeaAlku}px, ${vierekkain ? 'transparent' : '#000'} ${rajaO}px), `
        + `linear-gradient(to bottom, transparent ${rajaY}px, #000 ${ylaLoppu}px, #000 ${Math.max(ylaLoppu, h - 320)}px, transparent ${h}px)`;
      canvas.style.maskImage = canvas.style.webkitMaskImage = maski;
      canvas.style.maskComposite = 'intersect'; canvas.style.webkitMaskComposite = 'source-in';
    }
    piirraNyt();
  }

  // ---------- Piirtäminen ----------
  // Piirretään enintään kerran näytön päivitystä kohden, vaikka tapahtumia tulisi enemmän.
  let piirtoPyydetty = false;
  function piirra() {
    if (piirtoPyydetty) return;
    piirtoPyydetty = true;
    requestAnimationFrame(() => { piirtoPyydetty = false; piirraNyt(); });
  }
  function piirraNyt() {
    if (!w) return;
    asetaProj();
    ctx.clearRect(0, 0, w, h);

    // Pyöreä ikkuna: lähennettäessä pallo ei kasva ikkunaa suuremmaksi,
    // vaan kartta tarkentuu ympyrän sisällä.
    const ikkuna = () => { ctx.beginPath(); ctx.arc(cx, cy, sade * Math.min(1, k), 0, Math.PI * 2); };
    ctx.save();
    if (!vapaa) { ikkuna(); ctx.clip(); }
    ctx.save();
    ctx.beginPath(); polku({ type: 'Sphere' }); ctx.fillStyle = TYYLI.meri; ctx.fill(); ctx.clip();
    if (k < 60) { ctx.beginPath(); polku(ruudukko); ctx.strokeStyle = TYYLI.ruudukko; ctx.lineWidth = .8; ctx.stroke(); }

    const tarkka = k > 2, t = taso();
    ctx.beginPath(); piirraOsat(tarkka ? osatMaailmaIlmanPohjolaa : osatMaailma, t); ctx.fillStyle = TYYLI.maa; ctx.fill();
    if (tarkka) {
      ctx.beginPath(); piirraOsat(osatPohjolaMuut, t);
      ctx.fill(); ctx.strokeStyle = TYYLI.rajat; ctx.lineWidth = .8; ctx.stroke();
    } else {
      ctx.beginPath(); polku(rajatMaailma); ctx.strokeStyle = TYYLI.rajat; ctx.lineWidth = .5; ctx.stroke();
    }
    ctx.beginPath(); piirraOsat(osatSuomi, t); ctx.fillStyle = TYYLI.suomi; ctx.fill();
    ctx.strokeStyle = TYYLI.suomiReuna; ctx.lineWidth = k > 2 ? 1.2 : .9; ctx.stroke();
    ctx.restore();

    piirraKohteet();
    ctx.restore();
    if (vapaa) { ctx.beginPath(); polku({ type: 'Sphere' }); } else ikkuna();
    ctx.strokeStyle = TYYLI.reuna; ctx.lineWidth = 1; ctx.stroke();

    // Häivytys: heti kun pallo lähestyy ikkunan reunaa, reuna liukuu taustaan.
    // Häivytysvyöhyke kapenee pallon reunaan, joten kartta pysyy pallon kokoisena.
    // Näkyvä alue on soikio, jotta kartta ei nouse yläpalkin alle.
    const r = Math.min(rx, ry);
    const voima = haivytys ? Math.max(0, Math.min(1, (sade * k - r * .97) / (r * .3))) : 0;
    if (voima) {
      const liuku = ctx.createRadialGradient(0, 0, 1 - .2 * voima, 0, 0, 1);
      liuku.addColorStop(0, 'rgba(0,0,0,1)');
      liuku.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.translate(cx, cy); ctx.scale(rx, ry);
      ctx.fillStyle = liuku; ctx.fillRect(-cx / rx, -cy / ry, w / rx, h / ry);
      ctx.restore();
    }
  }

  const nakyy = p => d3.geoDistance(p, keski) < 1.55;

  const ryhmanSade = n => n === 1 ? 8 : 12 + Math.min(14, Math.log2(n) * 3);

  // Nimiä ei piirretä täppien ja ryhmien alle.
  function piirraKaupungit(ryhmat) {
    if (k < tasonRaja[1]) return;
    const varatut = ryhmat.map(g => { const r = ryhmanSade(g.jasenet.length) + 2; return [g.x - r, g.y - r, g.x + r, g.y + r]; });
    ctx.textBaseline = 'middle';
    for (const [nimi, lat, lon, taso] of KAUPUNGIT) {
      if (k < tasonRaja[taso] || !nakyy([lon, lat])) continue;
      const [x, y] = proj([lon, lat]);
      if (x < -50 || y < -20 || x > w + 50 || y > h + 20) continue;
      const iso = taso === 1;
      ctx.font = `${iso ? 500 : 400} ${iso ? 12 : 11}px ${FONTTI}`;
      const lev = ctx.measureText(nimi).width;
      const laatikko = [x + 6, y - 8, x + 10 + lev, y + 8];
      if (varatut.some(b => !(laatikko[2] < b[0] || laatikko[0] > b[2] || laatikko[3] < b[1] || laatikko[1] > b[3]))) continue;
      varatut.push(laatikko);
      ctx.fillStyle = TYYLI.teksti;
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = iso ? TYYLI.tekstiIso : TYYLI.teksti;
      ctx.fillText(nimi, x + 7, y);
    }
  }

  function piirraKohteet() {
    // 1) Näkyvät kohteet. Ryhmittely perustuu kohteiden keskinäisiin etäisyyksiin (ei näytön ruudukkoon),
    //    joten ryhmät pysyvät samoina karttaa siirrettäessä ja muuttuvat vain zoomatessa.
    const pisteet = [];
    let nakyvia = 0;
    const VARA = RUUTU * 4;
    for (const kohde of kohteet) {
      if (!aktiiviset.has(kohde.tyyppi) || !nakyy(kohde.piste)) continue;
      const [x, y] = proj(kohde.piste);
      if (x < -VARA || y < -VARA || x > w + VARA || y > h + VARA) continue;
      // Taustatilassa lasketaan vain se osa, joka näkyy (ei häivytettyä iskulauseen puolta).
      if (x >= rajaX && y >= rajaY && x <= (tausta ? rajaO : w) && y <= (tausta ? paakuva.clientHeight : h)) nakyvia++;
      pisteet.push({ kohde, x, y });
    }
    // 2) Kohteet liitetään lähimpään ryhmään, jonka siemen on riittävän lähellä. Järjestys on aina sama
    //    (kohteiden oma järjestys), joten tulos ei riipu kartan siirrosta.
    const raja = RUUTU * .9;
    const ryhmat = [];
    for (const p of pisteet) {
      let paras = null, lahin = raja;
      for (const g of ryhmat) { const d = Math.hypot(g.sx - p.x, g.sy - p.y); if (d < lahin) { lahin = d; paras = g; } }
      if (!paras) ryhmat.push({ jasenet: [p.kohde], sx: p.x, sy: p.y, x: p.x, y: p.y, n: 1 });
      else { paras.jasenet.push(p.kohde); paras.x = (paras.x * paras.n + p.x) / (paras.n + 1); paras.y = (paras.y * paras.n + p.y) / (paras.n + 1); paras.n++; }
    }
    piirraKaupungit(ryhmat);
    // 3) Piirretään: yksittäiset täppinä, useampi ryhmänä
    osumat = [];
    const pisteR = 4 + Math.min(3, Math.log2(k + 1));
    for (const r of ryhmat) {
      const n = r.jasenet.length, x = r.x, y = r.y;
      if (n === 1) {
        const kohde = r.jasenet[0], [px, py] = proj(kohde.piste);
        const iso = kohde === valittu ? pisteR + 3 : pisteR;
        ctx.beginPath(); ctx.arc(px, py, iso + 2.5, 0, Math.PI * 2); ctx.fillStyle = TYYLI.halo; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, iso, 0, Math.PI * 2); ctx.fillStyle = vari(kohde.tyyppi); ctx.fill();
        if (kohde === valittu) { ctx.beginPath(); ctx.arc(px, py, iso + 7, 0, Math.PI * 2); ctx.strokeStyle = vari(kohde.tyyppi); ctx.lineWidth = 1.5; ctx.stroke(); }
        osumat.push({ x: px, y: py, r: iso + 6, kohde });
      } else {
        const rr = ryhmanSade(n);
        ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fillStyle = TYYLI.ryhma; ctx.fill();
        // Rengas: tyyppien osuudet
        let alku = -Math.PI / 2;
        for (const t of tyyppiIdt) {
          const osuus = r.jasenet.filter(j => j.tyyppi === t).length / n;
          if (!osuus) continue;
          ctx.beginPath(); ctx.arc(x, y, rr - 2, alku, alku + osuus * Math.PI * 2);
          ctx.strokeStyle = vari(t); ctx.lineWidth = 4; ctx.stroke();
          alku += osuus * Math.PI * 2;
        }
        ctx.fillStyle = TYYLI.ryhmaTeksti; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `600 ${n > 99 ? 11 : 12}px ${FONTTI}`;
        ctx.fillText(n, x, y + .5);
        ctx.textAlign = 'start';
        osumat.push({ x, y, r: rr + 2, ryhma: r.jasenet });
      }
    }
    if (asetukset.nakyvissa) asetukset.nakyvissa(nakyvia);
  }

  // ---------- Liike ----------
  function lenna(kohdeK, kohdeKeski, kesto = 1800) {
    if (animaatio) animaatio.stop();
    kohdeK = Math.max(alaraja(), Math.min(K_MAX, kohdeK));
    if (vahennaLiiketta) { k = kohdeK; keski = kohdeKeski.slice(); piirra(); return; }
    const k0 = k, ik = d3.geoInterpolate(keski, kohdeKeski);
    // Pitkillä matkoilla loitonnetaan välissä, jotta lento hahmottuu.
    const matka = d3.geoDistance(keski, kohdeKeski);
    const kMid = Math.min(k0, kohdeK, Math.max(1, 1.2 / Math.max(matka, .001)));
    animaatio = d3.timer(t => {
      const s = Math.min(1, t / kesto), e = d3.easeCubicInOut(s);
      const kLin = k0 * Math.pow(kohdeK / k0, e);
      const kaari = Math.sin(Math.PI * e);
      k = Math.exp(Math.log(kLin) * (1 - kaari) + Math.log(Math.min(kLin, kMid)) * kaari);
      keski = ik(e); piirraNyt();
      if (s === 1) { animaatio.stop(); animaatio = null; }
    });
  }

  function zoomaaPisteeseen(kerroin, mx, my) {
    const uusiK = Math.max(alaraja(), Math.min(K_MAX, k * kerroin));
    const todellinen = uusiK / k;
    if (mx != null && todellinen > 1) {
      const geo = proj.invert([mx, my]);
      if (geo && nakyy(geo)) keski = d3.geoInterpolate(keski, geo)(1 - 1 / todellinen);
    }
    k = uusiK; piirra();
  }

  function sovitaKohteisiin(jasenet) {
    const lonit = jasenet.map(j => j.lon), latit = jasenet.map(j => j.lat);
    const lon0 = d3.min(lonit), lon1 = d3.max(lonit), lat0 = d3.min(latit), lat1 = d3.max(latit);
    const keskiLat = (lat0 + lat1) / 2;
    const janne = Math.max((lat1 - lat0), (lon1 - lon0) * Math.cos(keskiLat * Math.PI / 180)) * Math.PI / 180;
    const sopiva = janne > 0 ? (Math.min(w, h) * .7) / (sade * janne) : K_MAX;
    lenna(Math.max(k * 2.2, sopiva), [(lon0 + lon1) / 2, keskiLat], 1000);
  }

  // ---------- Vihje ----------
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Street View: avautuu kohteen koordinaateista uuteen välilehteen.
  const svUrl = j => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${j.lat},${j.lon}`;
  const SV_IKONI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2.2"/><path d="M9.5 21v-6l-1.5-1v-3.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V14l-1.5 1v6"/></svg>';
  let kiinni = false;
  function naytaVihje(o, kiinnita = false) {
    kiinni = kiinnita && !!o; vihje.classList.toggle('kiinni', kiinni);
    if (!o) { vihje.hidden = true; return; }
    if (o.kohde) {
      const t = tyypit[o.kohde.tyyppi];
      vihje.innerHTML = `${esc(o.kohde.nimi)}, ${esc(o.kohde.paikka)}<small>${t ? esc(t.nimi) : ''}${o.kohde.vuosi ? ' · ' + o.kohde.vuosi : ''}${o.kohde.esimerkki ? ' · esimerkki' : ''}</small>`
        + (kiinni ? `<a class="sv" href="${svUrl(o.kohde)}" target="_blank" rel="noopener">${SV_IKONI}Street View</a>` : (avoin ? '<small>Klikkaa, niin näet Street View -linkin</small>' : ''));
    } else {
      const samaPaikka = k >= K_MAX * .95;
      const lista = samaPaikka ? `<ul>${o.ryhma.slice(0, 8).map(j => `<li>${kiinni ? `<a class="sv-pieni" href="${svUrl(j)}" target="_blank" rel="noopener">${esc(j.nimi)}, ${esc(j.paikka)}</a>` : `${esc(j.nimi)}, ${esc(j.paikka)}`}</li>`).join('')}${o.ryhma.length > 8 ? `<li>+ ${o.ryhma.length - 8} muuta</li>` : ''}</ul>` : '';
      vihje.innerHTML = `${o.ryhma.length} kohdetta<small>${samaPaikka ? 'Samalla alueella' : 'Klikkaa, niin kartta lähentää'}</small>${lista}`;
    }
    // Vihje sijoitetaan kehykseen; kangas voi alkaa kehyksen ulkopuolelta.
    // Pidetään laatikko kehyksen sisällä: sivuttain reunoista irti, ja jos yläpuolelle ei mahdu, täpän alle.
    vihje.hidden = false; vihje.classList.remove('alle');
    const aw = alue.clientWidth, vl = vihje.offsetWidth, vk = vihje.offsetHeight, x = o.x - kehys.x0, y = o.y - kehys.y0;
    vihje.style.left = Math.max(vl / 2 + 10, Math.min(aw - vl / 2 - 10, x)) + 'px';
    if (y - o.r - vk - 12 < 8) { vihje.classList.add('alle'); vihje.style.top = (y + o.r + 10) + 'px'; }
    else vihje.style.top = (y - o.r + 6) + 'px';
    vihje.hidden = false;
  }
  function osuma(e) {
    const b = canvas.getBoundingClientRect();
    const mx = e.clientX - b.left, my = e.clientY - b.top;
    let paras = null, lahin = Infinity;
    if (kortti) { /* koko kortti on näkyvää aluetta */ } else if (tausta ? mx < rajaX || my < rajaY || mx > rajaO : haivytys ? ((mx - cx) / rx) ** 2 + ((my - cy) / ry) ** 2 > 1 : Math.hypot(mx - cx, my - cy) > sade * Math.min(1, k)) return null;   // näkyvän alueen ulkopuolella
    for (const o of osumat) { const d = Math.hypot(o.x - mx, o.y - my); if (d < o.r && d < lahin) { lahin = d; paras = o; } }
    return paras;
  }

  // ---------- Ohjaus: vetäminen, rulla, nipistys ----------
  const aktivoi = paalle => {
    aktiivinen = paalle; alue.classList.toggle('aktiivinen', paalle);
  };
  const osoittimet = new Map();
  let veto = null, nipistys = null;

  let esiveto = null;
  canvas.addEventListener('pointerdown', e => {
    if (kortti && !avoin) { esiveto = { x: e.clientX, y: e.clientY }; return; }
    if (animaatio) { animaatio.stop(); animaatio = null; }
    osoittimet.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    if (osoittimet.size === 2 && aktiivinen) {
      const [a, b] = [...osoittimet.values()];
      const cb = canvas.getBoundingClientRect();
      const mx = (a.x + b.x) / 2 - cb.left, my = (a.y + b.y) / 2 - cb.top;
      asetaProj();
      nipistys = { d: Math.hypot(a.x - b.x, a.y - b.y), k, geo: proj.invert([mx, my]) };
      veto = null;
    } else if (osoittimet.size === 1) {
      veto = { x: e.clientX, y: e.clientY, keski: keski.slice(), liikkui: false };
    }
  });
  canvas.addEventListener('pointermove', e => {
    if (kortti && !avoin) return;
    if (osoittimet.has(e.pointerId)) osoittimet.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (nipistys && osoittimet.size === 2) {
      const [a, b] = [...osoittimet.values()];
      k = Math.max(Math.min(kMin, nipistys.k), Math.min(K_MAX, nipistys.k * Math.hypot(a.x - b.x, a.y - b.y) / nipistys.d));
      // Kahden sormen siirto: sormien välissä ollut kohta pysyy sormien välissä, kun ne liikkuvat.
      if (nipistys.geo) {
        const cb = canvas.getBoundingClientRect(), keskipiste = [(a.x + b.x) / 2 - cb.left, (a.y + b.y) / 2 - cb.top];
        for (let n = 0; n < 3; n++) {
          asetaProj(); const g = proj.invert(keskipiste); if (!g) break;
          keski = [keski[0] + (nipistys.geo[0] - g[0]), Math.max(-85, Math.min(85, keski[1] + (nipistys.geo[1] - g[1])))];
        }
      }
      vihje.hidden = true; piirra(); return;
    }
    if (!veto) { if (kiinni && !vihje.hidden) return; const o = osuma(e); naytaVihje(o); canvas.style.cursor = o ? 'pointer' : ''; return; }
    const dx = e.clientX - veto.x, dy = e.clientY - veto.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) veto.liikkui = true;
    if (!veto.liikkui) return;
    const astettaPerPx = (180 / Math.PI) / (sade * k);
    const leveysKorjaus = k > 3 ? Math.max(.3, Math.cos(veto.keski[1] * Math.PI / 180)) : 1;
    keski = [veto.keski[0] - dx * astettaPerPx / leveysKorjaus, Math.max(-85, Math.min(85, veto.keski[1] + dy * astettaPerPx))];
    vihje.hidden = true; piirra();
  });
  const lopeta = e => {
    if (kortti && !avoin) {
      const avaa = e.type === 'pointerup' && esiveto && Math.hypot(e.clientX - esiveto.x, e.clientY - esiveto.y) < 10;
      esiveto = null; if (avaa) avaaIkkuna(); return;
    }
    osoittimet.delete(e.pointerId);
    if (osoittimet.size < 2) nipistys = null;
    const napautus = veto && !veto.liikkui;
    veto = null;
    if (!napautus) return;
    aktivoi(true);
    const o = osuma(e);
    if (!o) { naytaVihje(null); return; }
    if (o.ryhma && k < K_MAX * .95) { naytaVihje(null); sovitaKohteisiin(o.ryhma); return; }
    naytaVihje(o, avoin || !kortti);
    if (o.kohde && asetukset.valittu) asetukset.valittu(o.kohde);
  };
  canvas.addEventListener('pointerup', lopeta);
  canvas.addEventListener('pointercancel', lopeta);
  canvas.addEventListener('pointerleave', () => { if (!veto && !kiinni) vihje.hidden = true; if (!avoin) aktivoi(false); });

  canvas.addEventListener('wheel', e => {
    if (kortti && !avoin) return;
    const b = canvas.getBoundingClientRect();
    // Taustatilassa rulla zoomaa vain kehyksen kohdalla, muualla sivu vierii normaalisti.
    if (tausta) { const x = e.clientX - b.left, y = e.clientY - b.top; if (x < kehys.x0 || x > kehys.x1 || y < kehys.y0 || y > kehys.y1) return; }
    // Kun karttaa ei voi enää loitontaa (tai lähentää), rulla vierittää sivua normaalisti.
    if ((e.deltaY > 0 && k <= alaraja() * 1.001) || (e.deltaY < 0 && k >= K_MAX * .999)) return;
    e.preventDefault();
    if (animaatio) { animaatio.stop(); animaatio = null; }
    zoomaaPisteeseen(Math.exp(-e.deltaY * (e.deltaMode === 1 ? .05 : .0018)), e.clientX - b.left, e.clientY - b.top);
    vihje.hidden = true;
  }, { passive: false });
  document.addEventListener('pointerdown', e => { if (avoin) return; if (!alue.contains(e.target) && e.target !== canvas) aktivoi(false); });

  const koonSeuraaja = new ResizeObserver(koko); koonSeuraaja.observe(canvas); koonSeuraaja.observe(alue);
  koko();

  // ---------- Iso ikkuna (korttitila) ----------
  let avoin = false;
  const introt = [];
  let avaaIkkuna = () => {};
  if (kortti) {
    const avausNappi = document.createElement('button');
    avausNappi.type = 'button'; avausNappi.className = 'kartta-avaa';
    avausNappi.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>Avaa kartta';
    alue.append(avausNappi);
    const modaali = document.createElement('div');
    modaali.className = 'kartta-modaali'; modaali.hidden = true;
    modaali.setAttribute('role', 'dialog'); modaali.setAttribute('aria-modal', 'true'); modaali.setAttribute('aria-label', 'Kohteet kartalla');
    modaali.innerHTML = '<div class="kartta-modaali-ikkuna"><div class="kartta-modaali-yla"><p class="ylaotsikko">Kohteemme</p>'
      + '<span class="kartta-modaali-ohje">Vedä ja nipistä. Napauta ryhmää lähentääksesi tai kohdetta avataksesi Street View’n.</span>'
      + '<button class="kartta-sulje" type="button" aria-label="Sulje kartta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'
      + '<div class="kartta-modaali-kehys"><div class="kartta-ohjaimet"><button type="button" data-z="suomi" aria-label="Näytä koko Suomi">Suomi</button>'
      + '<button type="button" data-z="-" aria-label="Loitonna">−</button><button type="button" data-z="+" aria-label="Lähennä">+</button></div></div></div>';
    document.body.append(modaali);
    const kehysEl = modaali.querySelector('.kartta-modaali-kehys');
    const sulje = modaali.querySelector('.kartta-sulje');
    const paikka = document.createComment('kartta');
    const teemaVari = document.querySelector('meta[name="theme-color"]'), teemaAlku = teemaVari ? teemaVari.getAttribute('content') : '';
    let sulkuAjastin = 0;
    avaaIkkuna = () => {
      if (avoin) return;
      avoin = true; clearTimeout(sulkuAjastin); introt.forEach(clearTimeout);
      if (!esitetty) { esitetty = true; lukitseSuomeen(); k = Math.max(k, NAKYMA_SUOMI.k); keski = NAKYMA_SUOMI.keski.slice(); }
      alue.before(paikka); kehysEl.prepend(alue);
      modaali.hidden = false; document.documentElement.classList.add('kartta-auki');
      // Selaimen palkit samaan vaaleaan sävyyn kuin kartan ympärys (puhelimella)
      if (teemaVari && matchMedia('(max-width: 700px)').matches) teemaVari.setAttribute('content', '#F4F1EC');
      koko();
      requestAnimationFrame(() => modaali.classList.add('auki'));
      aktivoi(true); vihje.hidden = true; sulje.focus({ preventScroll: true });
    };
    const suljeIkkuna = () => {
      if (!avoin) return;
      avoin = false; vihje.hidden = true; modaali.classList.remove('auki');
      if (animaatio) { animaatio.stop(); animaatio = null; }
      sulkuAjastin = setTimeout(() => {
        paikka.replaceWith(alue); modaali.hidden = true;
        document.documentElement.classList.remove('kartta-auki'); aktivoi(false);
        if (teemaVari) teemaVari.setAttribute('content', teemaAlku);
        koko();
        lenna(...kohdeNakyma(), 1400);
      }, 220);
    };
    avausNappi.addEventListener('click', avaaIkkuna);
    sulje.addEventListener('click', suljeIkkuna);
    modaali.addEventListener('click', e => { if (e.target === modaali) suljeIkkuna(); });
    document.addEventListener('keydown', e => { if (avoin && e.key === 'Escape') suljeIkkuna(); });
    modaali.querySelector('.kartta-ohjaimet').addEventListener('click', e => {
      const z = e.target.closest('button'); if (!z) return;
      vihje.hidden = true;
      if (z.dataset.z === 'suomi') lenna(NAKYMA_SUOMI.k, NAKYMA_SUOMI.keski, 1200);
      else lenna(k * (z.dataset.z === '+' ? 2 : .5), keski, 450);
    });
  }

  // Avautuessa: maapallo zoomautuu Suomeen, kun kartta tulee näkyviin.
  // Seurataan pallon kehystä, ei kangasta: kankaan häivytysleikkaus pienentäisi näkyvää osuutta
  // (leveällä näytöllä alle rajan, jolloin lento ei koskaan käynnistyisi).
  let esitetty = false;
  new IntersectionObserver((merkinnat, havainnoija) => {
    if (esitetty || !merkinnat.some(m => m.isIntersecting)) return;
    esitetty = true; havainnoija.disconnect();
    introt.push(setTimeout(() => { lenna(NAKYMA_SUOMI.k, NAKYMA_SUOMI.keski, 2400); lukitseSuomeen(); }, 300));
    // Korttitilassa jatketaan Suomesta Uudellemaalle, jossa suurin osa kohteista on.
    if (kortti) introt.push(setTimeout(() => { if (!avoin) lenna(...kohdeNakyma(), 2600); }, 3600));
  }, { threshold: .35 }).observe(alue);

  return {
    suodata(joukko) { aktiiviset.clear(); joukko.forEach(t => aktiiviset.add(t)); piirra(); },
    naytaKohde(i) {
      const kohde = kohteet[i]; if (!kohde) return;
      valittu = kohde; esitetty = true; lukitseSuomeen(); vihje.hidden = true;
      lenna(Math.max(k, 400), kohde.piste, 1800);
    },
  };
};
