// ============================================================
//  AKSONOMETRIA – hintalaskurin piirros, joka muuttuu valintojen mukaan.
//  Viivapiirros isometrisessä projektiossa: rakennus, maanpinnan ruudukko
//  ja varjo. Kerrokset pinotaan yksi kerrallaan; kun valinta
//  muuttuu, vain uudet osat putoavat paikalleen ja näkymä liukuu uuteen kokoon.
//  Käyttö: window.piirraAkso(elementti, h)
//    h = { laji, kohde, m2, vertailu, tontti, kerrokset, lisatilat, rakennukset, perustus, palvelut }
// ============================================================

(function () {
  const C = Math.cos(Math.PI / 6), S = .5, M = 10;      // projektio, 1 m = 10 yksikköä
  const vahennaLiiketta = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const P = (x, y, z) => [(x - y) * C * M, ((x + y) * S - z) * M];
  const pist = pts => pts.map(p => { const q = P(...p); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ');

  // ---------- Piirrin: kerää osat ja niiden rajat ----------
  function luoPiirros() {
    const osat = [];           // { k: avain, svg }
    let nyky = null, rajat = [Infinity, Infinity, -Infinity, -Infinity];
    const laajenna = pts => pts.forEach(p => { const q = P(...p); rajat = [Math.min(rajat[0], q[0]), Math.min(rajat[1], q[1]), Math.max(rajat[2], q[0]), Math.max(rajat[3], q[1])]; });
    const lisaa = s => { if (!nyky) osa('_'); nyky.svg += s; };
    function osa(k) { nyky = { k, svg: '' }; osat.push(nyky); }
    const poly = (pts, cls, rajaan = true) => { if (rajaan) laajenna(pts); lisaa(`<polygon class="${cls}" points="${pist(pts)}"/>`); };
    const viiva = (pts, cls) => { laajenna(pts); lisaa(`<polyline class="${cls}" points="${pist(pts)}"/>`); };
    return { osat, osa, poly, viiva, lisaa, laajenna, rajat: () => rajat };
  }

  // Laatikko: näkyvät sivut +y (vasen, valoisa), +x (oikea, varjossa) ja katto.
  function laatikko(d, x0, y0, z0, w, s, h, l = '') {
    const x1 = x0 + w, y1 = y0 + s, z1 = z0 + h;
    d.poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], 'ax-v ' + l);
    d.poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], 'ax-o ' + l);
    d.poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], 'ax-y ' + l);
  }
  // Suorakaide seinässä: sivu 'v' (y = vakio) tai 'o' (x = vakio); a..b vaakasuunnassa, c..e korkeus.
  function aukko(d, sivu, taso, a, b, c, e, cls = 'ax-ikkuna') {
    d.poly(sivu === 'v' ? [[a, taso, c], [b, taso, c], [b, taso, e], [a, taso, e]] : [[taso, a, c], [taso, b, c], [taso, b, e], [taso, a, e]], cls);
  }
  // Ikkunarivi seinään tasaisin välein
  function ikkunarivi(d, sivu, taso, alku, pituus, z, korkeus = 1.3, leveys = 1.1, vali = 2.7, ohita = -1) {
    const n = Math.max(1, Math.floor(pituus / vali));
    for (let i = 0; i < n; i++) {
      if (i === ohita) continue;
      const kx = alku + pituus * (i + .5) / n;
      aukko(d, sivu, taso, kx - leveys / 2, kx + leveys / 2, z, z + korkeus);
    }
  }
  // Harjakatto. akseli 'x': harja x-suunnassa, pääty oikealla. 'y': harja y-suunnassa, pääty vasemmalla.
  function harjakatto(d, x0, y0, w, s, z, r, akseli, l = '', e = 0) {
    const x1 = x0 + w, y1 = y0 + s;
    if (akseli === 'x') {
      const ym = y0 + s / 2;
      d.poly([[x0, y0 - e, z], [x1, y0 - e, z], [x1, ym, z + r], [x0, ym, z + r]], 'ax-katto-t ' + l);
      d.poly([[x1, y0, z], [x1, y1, z], [x1, ym, z + r]], 'ax-o ' + l);
      d.poly([[x0, y1 + e, z], [x1, y1 + e, z], [x1, ym, z + r], [x0, ym, z + r]], 'ax-katto ' + l);
    } else {
      const xm = x0 + w / 2;
      d.poly([[x0 - e, y0, z], [x0 - e, y1, z], [xm, y1, z + r], [xm, y0, z + r]], 'ax-katto-t ' + l);
      d.poly([[x1 + e, y0, z], [x1 + e, y1, z], [xm, y1, z + r], [xm, y0, z + r]], 'ax-katto-o ' + l);
      d.poly([[x0, y1, z], [x1, y1, z], [xm, y1, z + r]], 'ax-v ' + l);
    }
  }
  // Pulpettikatto: korkein reuna takana (y0), laskee eteen.
  function pulpetti(d, x0, y0, w, s, z, nousu, l = '', e = 0) {
    const x1 = x0 + w, y1 = y0 + s;
    d.poly([[x1, y0, z], [x1, y1, z], [x1, y0, z + nousu]], 'ax-o ' + l);
    d.poly([[x0 - e, y0 - e, z + nousu], [x1 + e, y0 - e, z + nousu], [x1 + e, y1 + e, z], [x0 - e, y1 + e, z]], 'ax-katto ' + l);
  }
  // Tasakatto ja räystäslinja (kaide)
  function tasakatto(d, x0, y0, w, s, z, l = '') {
    const i = Math.min(.35, w * .05);
    d.poly([[x0 + i, y0 + i, z], [x0 + w - i, y0 + i, z], [x0 + w - i, y0 + s - i, z], [x0 + i, y0 + s - i, z]], 'ax-kaide ' + l);
  }

  // ---------- Mitat ----------
  const RAKENNE = {   // kerroskorkeus, sivusuhde, kattotyyppi
    okt:        { kk: 3.0, suhde: 1.7, katto: 'harja', akseli: 'x', kalt: .55 },
    pari:       { kk: 3.0, suhde: 2.6, katto: 'harja', akseli: 'x', kalt: .5 },
    mokki:      { kk: 2.9, suhde: 1.35, katto: 'harja', akseli: 'y', kalt: .85 },
    sauna:      { kk: 2.5, suhde: 1.4, katto: 'pulpetti' },
    laaj:       { kk: 3.0, suhde: 1.2, katto: 'harja', akseli: 'x', kalt: .5 },
    korj:       { kk: 3.0, suhde: 1.6, katto: 'harja', akseli: 'x', kalt: .55 },
    kerrostalo: { kk: 3.1, suhde: 2.3, katto: 'tasa' },
    liike:      { kk: 3.8, suhde: 1.6, katto: 'tasa' },
    halli:      { kk: 4.5, suhde: 1.7, katto: 'harja', akseli: 'x', kalt: .12 },
  };
  const tutkimusKohde = { okt: 'okt', rivi: 'pari', mokki: 'mokki', yhtio: 'kerrostalo' };

  function malli(h) {
    const kohde = (h.laji === 'tutkimus' ? tutkimusKohde[h.kohde] : h.kohde) || 'okt';
    const R = RAKENNE[kohde] || RAKENNE.okt;
    // Työmaalaskurissa ei kysytä kerroksia: käytetään kohdetyypin tavallista korkeutta.
    let kerrokset = +h.kerrokset || { kerrostalo: 5, liike: 2 }[kohde] || 1, ullakko = false, kellari = false;
    if (h.laji === 'tutkimus') {
      kerrokset = kohde === 'kerrostalo' ? 4 : h.kerrokset === '2' ? 2 : 1;
      ullakko = h.kerrokset === '15';
      kellari = h.perustus === 'kellari';
    } else {
      const lt = h.lisatilat || [];
      ullakko = lt.includes('ullakko'); kellari = lt.includes('kellari');
      if (!['okt', 'pari', 'mokki', 'kerrostalo', 'liike', 'halli'].includes(kohde)) kerrokset = 1;
    }
    if (kohde === 'halli') kerrokset = Math.min(kerrokset, 6);
    const laajAla = kohde === 'laaj' ? 120 : 0;   // laajennuksessa nykyinen talo + uusi osa
    const ala = Math.max(8, (kohde === 'laaj' ? h.m2 : h.m2 / (kerrokset + (ullakko ? .5 : 0))));
    const w = Math.sqrt(ala * R.suhde), s = ala / w;
    // Tontti mitoitetaan kohdetyypin oletuskoosta, jotta koon muutos näkyy piirroksessa.
    const vertailuAla = Math.max(8, (kohde === 'laaj' ? laajAla + h.vertailu : h.vertailu / Math.max(1, kerrokset)));
    return { kohde, R, kerrokset, ullakko, kellari, w, s, vertailuAla, laajAla, rinne: h.tontti === 'rinne',
             rakennuksia: kohde === 'laaj' ? 1 : Math.max(1, +h.rakennukset || 1), laji: h.laji, perustus: h.perustus };
  }

  // ---------- Rakennus ----------
  function rakennus(d, m, x0, y0, w, s, pohja, l = '', etu = '') {
    const R = m.R, kk = R.kk, x1 = x0 + w, y1 = y0 + s;
    const sokkeli = m.laji === 'tutkimus' && m.perustus === 'rossi' ? .9 : .4;
    d.osa(etu + 'sokkeli'); laatikko(d, x0, y0, pohja, w, s, sokkeli, 'ax-sokkeli ' + l);
    if (m.laji === 'tutkimus' && m.perustus === 'rossi')
      for (let x = x0 + 1.2; x < x1 - .6; x += 2.4) aukko(d, 'v', y1, x, x + .5, pohja + .35, pohja + .6, 'ax-tuuletus');
    let z = pohja + sokkeli;
    const nauhat = m.kerrokset > 24;   // korkeissa taloissa ikkunat nauhoina (kevyempi piirtää)
    for (let k = 0; k < m.kerrokset; k++) {
      d.osa(etu + 'k' + k);
      laatikko(d, x0, y0, z, w, s, kk, l);
      if (m.kohde === 'halli') {
        if (k === 0) {
          const n = Math.max(1, Math.round(w / 9));
          for (let i = 0; i < n; i++) {
            const kx = x0 + w * (i + .5) / n;
            aukko(d, 'v', y1, kx - 1.8, kx + 1.8, z, z + 3.6, 'ax-ovi');
            for (let j = 1; j < 5; j++) d.viiva([[kx - 1.8, y1, z + j * .72], [kx + 1.8, y1, z + j * .72]], 'ax-ohut');
          }
        }
        aukko(d, 'o', x1, y0 + .8, y1 - .8, z + kk - 1.3, z + kk - .6, 'ax-ikkuna');
      } else if (m.kohde === 'liike') {
        const korkeus = k === 0 ? kk - 1 : 1.5;
        aukko(d, 'v', y1, x0 + .6, x1 - .6, z + (k === 0 ? .2 : 1), z + (k === 0 ? .2 : 1) + korkeus, 'ax-lasi');
        aukko(d, 'o', x1, y0 + .6, y1 - .6, z + (k === 0 ? .2 : 1), z + (k === 0 ? .2 : 1) + korkeus, 'ax-lasi');
        if (k === 0) for (let x = x0 + 3; x < x1 - 1; x += 3) d.viiva([[x, y1, z + .2], [x, y1, z + kk - .8]], 'ax-ohut');
      } else if (nauhat) {
        aukko(d, 'v', y1, x0 + .5, x1 - .5, z + .9, z + 2.1, 'ax-ikkuna');
        aukko(d, 'o', x1, y0 + .5, y1 - .5, z + .9, z + 2.1, 'ax-ikkuna');
      } else {
        const ovi = k === 0 && m.kohde !== 'kerrostalo' ? 0 : -1;
        ikkunarivi(d, 'v', y1, x0, w, z + .9, 1.3, 1.1, m.kohde === 'kerrostalo' ? 2.4 : 2.8, ovi);
        ikkunarivi(d, 'o', x1, y0, s, z + .9, 1.3, 1.1, 2.8);
        if (k === 0) {
          const n = Math.max(1, Math.floor(w / (m.kohde === 'kerrostalo' ? 2.4 : 2.8)));
          const kx = m.kohde === 'kerrostalo' ? x0 + w / 2 : x0 + w * .5 / n;
          aukko(d, 'v', y1, kx - .55, kx + .55, z, z + 2.1, 'ax-ovi');
          if (m.kohde === 'pari') { const kx2 = x0 + w * (n - .5) / n; aukko(d, 'v', y1, kx2 - .55, kx2 + .55, z, z + 2.1, 'ax-ovi'); }
        }
        // Kerrostalon parvekkeet
        if (m.kohde === 'kerrostalo' && k > 0 && m.kerrokset <= 30) {
          for (let x = x0 + 1.2; x < x1 - 3; x += w / Math.max(2, Math.round(w / 7))) {
            laatikko(d, x, y1, z, 2.6, 1.3, .18, 'ax-laatta');
            d.poly([[x, y1 + 1.3, z + .18], [x + 2.6, y1 + 1.3, z + .18], [x + 2.6, y1 + 1.3, z + 1.1], [x, y1 + 1.3, z + 1.1]], 'ax-kaidelasi');
          }
        }
      }
      if (m.kohde === 'pari') d.viiva([[x0 + w / 2, y1, z], [x0 + w / 2, y1, z + kk]], 'ax-ohut');
      z += kk;
    }
    // Katto
    const katto = 'katto' + m.kerrokset + (m.ullakko ? 'u' : '');
    d.osa(etu + katto);
    if (R.katto === 'tasa') {
      tasakatto(d, x0, y0, w, s, z, l);
      if (m.kohde === 'kerrostalo') laatikko(d, x0 + w * .55, y0 + s * .3, z, Math.min(5, w * .2), Math.min(4, s * .35), 2.2, l);
      else laatikko(d, x0 + w * .6, y0 + s * .25, z, Math.min(3, w * .18), Math.min(2.4, s * .3), 1.2, l);
    } else if (R.katto === 'pulpetti') {
      pulpetti(d, x0, y0, w, s, z, .8, l);
      laatikko(d, x0 + w * .25, y0 + s * .2, z + .5, .5, .5, 1.3, 'ax-hormi ' + l);
    } else {
      const leveys = R.akseli === 'x' ? s : w;
      let r = leveys * R.kalt * .5;
      if (m.ullakko) r = Math.max(r, leveys * .55);
      if (m.ullakko) {
        // Asuinullakko: korkeampi seinä (polvi) ja ikkuna päädyssä
        laatikko(d, x0, y0, z, w, s, 1.1, l); z += 1.1;
      }
      harjakatto(d, x0, y0, w, s, z, r, R.akseli, l);
      if (m.ullakko) {
        if (R.akseli === 'x') aukko(d, 'o', x1, y0 + s / 2 - .55, y0 + s / 2 + .55, z + .3, z + 1.5);
        else aukko(d, 'v', y1, x0 + w / 2 - .55, x0 + w / 2 + .55, z + .3, z + 1.5);
      }
      if (m.kohde === 'okt' || m.kohde === 'mokki' || m.kohde === 'korj') {
        const hx = R.akseli === 'x' ? x0 + w * .3 : x0 + w * .3, hy = R.akseli === 'x' ? y0 + s * .35 : y0 + s * .4;
        laatikko(d, hx, hy, z + r * .35, .55, .55, r * .75 + .6, 'ax-hormi ' + l);
      }
      if (m.kohde === 'pari' && R.akseli === 'x') d.viiva([[x0 + w / 2, y1 + .45, z], [x0 + w / 2, y0 + s / 2, z + r]], 'ax-ohut');
    }
    return z;
  }

  // Pieni lisärakennus (autotalli, sauna, vierasmaja)
  function lisarakennus(d, x0, y0, i) {
    const w = 5 + (i % 2) * 1.5, s = 4;
    d.osa('lisa' + i);
    laatikko(d, x0, y0, 0, w, s, .3, 'ax-sokkeli');
    laatikko(d, x0, y0, .3, w, s, 2.5);
    aukko(d, 'v', y0 + s, x0 + .8, x0 + 1.8, .3, 2.3, 'ax-ovi');
    aukko(d, 'v', y0 + s, x0 + w - 2.2, x0 + w - 1, 1.2, 2.2);
    pulpetti(d, x0, y0, w, s, 2.8, .6);
    return { w, s };
  }

  function rakenna(h) {
    const m = malli(h), d = luoPiirros();
    const rak = [];   // kaikki rakennukset [x0, y0, w, s, korkeus]
    // Sijoittelu: päärakennus origossa, lisärakennukset vasemmalle taakse.
    const x0 = 0, y0 = 0;
    const lisat = [];
    for (let i = 1; i < m.rakennuksia; i++) lisat.push({ x: -2 - i * 8.5, y: -3 + (i % 2) * 1.5 });
    // Tontti: kohdetyypin oletuskoon mukaan, laajenee jos rakennus ei mahdu.
    const vw = Math.sqrt(m.vertailuAla * m.R.suhde), vs = m.vertailuAla / vw;
    const kokoW = Math.max(vw, m.w + m.laajAla / Math.max(1, m.s)), kokoS = Math.max(vs, m.s);
    const reuna = Math.max(3, Math.min(11, Math.sqrt(kokoW * kokoS) * .32));
    const gx0 = Math.min(x0, ...lisat.map(l => l.x)) - reuna, gy0 = Math.min(y0, ...lisat.map(l => l.y)) - reuna * .8;
    const gx1 = x0 + kokoW * 1.08 + reuna * (m.laji === 'tyomaa' && ['kerrostalo', 'liike', 'halli'].includes(m.kohde) ? 1.6 : 1), gy1 = y0 + kokoS + reuna * 1.25;
    const lasku = m.rinne ? Math.min(3.2, (gx1 - gx0) * .12) : 0;
    const maa = x => m.rinne ? -lasku * (x - gx0) / (gx1 - gx0) : 0;

    // Maa ja ruudukko
    d.osa('maa');
    d.poly([[gx0, gy0, maa(gx0)], [gx1, gy0, maa(gx1)], [gx1, gy1, maa(gx1)], [gx0, gy1, maa(gx0)]], 'ax-maa');
    const ruutu = (gx1 - gx0) > 90 ? 10 : (gx1 - gx0) > 40 ? 5 : (gx1 - gx0) > 18 ? 2 : 1;
    for (let x = Math.ceil(gx0 / ruutu) * ruutu; x < gx1; x += ruutu) d.viiva([[x, gy0, maa(x)], [x, gy1, maa(x)]], 'ax-ruudukko');
    for (let y = Math.ceil(gy0 / ruutu) * ruutu; y < gy1; y += ruutu) d.viiva([[gx0, y, maa(gx0)], [gx1, y, maa(gx1)]], 'ax-ruudukko');
    // Katkoviivaiset rajamerkit tontin kulmissa
    const kulma = Math.min(3, (gx1 - gx0) * .08);
    d.viiva([[gx0 + .6, gy1 + 1.2, maa(gx0)], [gx0 + .6 + kulma, gy1 + 1.2, maa(gx0)]], 'ax-mitta');
    d.viiva([[gx1 + 1.2, gy0 + .6, maa(gx1)], [gx1 + 1.2, gy0 + .6 + kulma, maa(gx1)]], 'ax-mitta');
    d.viiva([[gx1 + 1.2, gy1 - kulma, maa(gx1)], [gx1 + 1.2, gy1 + 1.2, maa(gx1)], [gx1 - kulma, gy1 + 1.2, maa(gx1)]], 'ax-mitta');

    const pohja = maa(x0);   // rakennus nojaa ylärinteeseen
    const korkeus = m.R.kk * m.kerrokset + 2;
    // Varjot (valo vasemmalta takaa)
    d.osa('varjo');
    const varjo = (x, y, w, s, hh) => {
      const sx = -hh * .12, sy = Math.min(hh * .55, gy1 - y - s - .2);
      d.poly([[x, y, pohja], [x + w, y, pohja], [x + w + sx, y + s + sy, pohja], [x + sx, y + s + sy, pohja], [x, y + s, pohja]].map(p => [p[0], p[1], maa(p[0])]), 'ax-varjo', false);
    };
    lisat.forEach(l => varjo(l.x, l.y, 6, 4, 3));
    varjo(x0, y0, m.w + (m.laajAla ? Math.sqrt(m.laajAla * 1.6) : 0), m.s, korkeus);

    // Kellari katkoviivoin maan alla (rinteessä alarinteen puoli on näkyvissä)
    if (m.kellari) {
      d.osa('kellari');
      const kz = pohja - 2.9, w = m.w, s = m.s;
      const pts = [[x0, y0 + s, kz], [x0 + w, y0 + s, kz], [x0 + w, y0, kz]];
      d.viiva(pts, 'ax-piilo');
      d.viiva([[x0, y0 + s, kz], [x0, y0 + s, pohja]], 'ax-piilo');
      d.viiva([[x0 + w, y0 + s, kz], [x0 + w, y0 + s, pohja]], 'ax-piilo');
      d.viiva([[x0 + w, y0, kz], [x0 + w, y0, pohja]], 'ax-piilo');
      d.viiva([[x0, y0, kz], [x0 + w, y0, kz]], 'ax-piilo ax-piilo-taka');
      d.viiva([[x0, y0, kz], [x0, y0 + s, kz]], 'ax-piilo ax-piilo-taka');
    }
    // Lisärakennukset takaa eteen
    lisat.forEach((l, i) => lisarakennus(d, l.x, l.y, i + 1));

    // Työmaa: nosturi takana
    const iso = ['kerrostalo', 'liike', 'halli'].includes(m.kohde);
    if (m.laji === 'tyomaa' && iso) {
      d.osa('nosturi');
      const nx = x0 + m.w + 3, ny = y0 - 2.5, nk = korkeus + 9, puomi = Math.max(18, m.w * .9);
      d.viiva([[nx, ny, pohja], [nx, ny, nk]], 'ax-nosturi');
      d.viiva([[nx + 1, ny, pohja], [nx + 1, ny, nk]], 'ax-nosturi');
      for (let z = pohja; z < nk - 1.5; z += 2) d.viiva([[nx, ny, z], [nx + 1, ny, z + 2]], 'ax-ohut');
      d.viiva([[nx - puomi, ny, nk], [nx + 6, ny, nk]], 'ax-nosturi');
      d.viiva([[nx - puomi, ny, nk], [nx + .5, ny, nk + 3.5], [nx + 6, ny, nk]], 'ax-ohut');
      d.viiva([[nx - puomi * .6, ny, nk], [nx - puomi * .6, ny, nk - 7]], 'ax-ohut');
    }

    // Päärakennus (rinteessä näkyvä sokkeli alarinteen puolella)
    if (m.rinne) {
      d.osa('rinne');
      const ala = maa(x0 + m.w);
      d.poly([[x0, y0 + m.s, pohja], [x0 + m.w, y0 + m.s, pohja], [x0 + m.w, y0 + m.s, ala]], 'ax-sokkeli ax-v');
      d.poly([[x0 + m.w, y0, ala], [x0 + m.w, y0 + m.s, ala], [x0 + m.w, y0 + m.s, pohja], [x0 + m.w, y0, pohja]], 'ax-sokkeli ax-o');
      if (m.kellari) aukko(d, 'o', x0 + m.w, y0 + m.s * .3, y0 + m.s * .7, ala + .5, Math.min(pohja - .2, ala + 1.9));
    }
    const vanhaL = m.kohde === 'korj' ? 'ax-korjattava' : '';
    if (m.kohde === 'laaj') {
      // Nykyinen talo harmaana ja uusi osa korostettuna sen oikealla puolella
      const vw = Math.sqrt(m.laajAla * 1.6), vs = m.laajAla / vw;
      rakennus(d, Object.assign({}, m, { kohde: 'okt', R: RAKENNE.okt, ullakko: false }), x0, y0, vw, vs, pohja, 'ax-vanha', 'v');
      const ls = Math.min(vs * .8, Math.max(3, Math.sqrt(m.w * m.s / 1.2))), lw = (m.w * m.s) / ls;
      const lm = Object.assign({}, m, { kohde: 'laaj', R: { kk: 3, katto: 'pulpetti' }, kerrokset: 1, ullakko: false });
      rakennus(d, lm, x0 + vw, y0 + (vs - ls) / 2, lw, ls, maa(x0 + vw), 'ax-uusi', 'u');
    } else {
      rakennus(d, m, x0, y0, m.w, m.s, pohja, vanhaL);
    }

    // Työmaa: telineet etujulkisivulla
    if (m.laji === 'tyomaa') {
      d.osa('telineet');
      const yt = y0 + m.s + .8, top = pohja + .4 + m.R.kk * Math.min(m.kerrokset, 40);
      const leveys = m.kohde === 'laaj' ? Math.sqrt(m.laajAla * 1.6) + (m.w * m.s) / Math.min(4, m.s) : m.w;
      const askel = Math.max(2.5, leveys / 10);
      for (let x = x0; x <= x0 + leveys + .01; x += askel) d.viiva([[x, yt, pohja], [x, yt, top]], 'ax-teline');
      for (let z = pohja + 2; z <= top + .01; z += Math.max(2, m.R.kk)) d.viiva([[x0, yt, z], [x0 + leveys, yt, z]], 'ax-teline');
    }

    return { osat: d.osat, rajat: d.rajat(), avain: [m.kohde, m.rinne, m.laji].join('|') };
  }

  // ---------- Näkymän liuku ----------
  function sovita(r) {
    const pad = 14, w0 = r[2] - r[0] + pad * 2, h0 = r[3] - r[1] + pad * 2, suhde = 4 / 3;
    const w = Math.max(w0, h0 * suhde), h = w / suhde;
    return [(r[0] + r[2]) / 2 - w / 2, (r[1] + r[3]) / 2 - h / 2, w, h];
  }
  function liu(el, svg, kohde) {
    const alku = el._vb || kohde;
    cancelAnimationFrame(el._vbAnim);
    if (vahennaLiiketta || !el._vb) { el._vb = kohde; svg.setAttribute('viewBox', kohde.join(' ')); return; }
    const t0 = performance.now(), kesto = 520;
    const askel = t => {
      const s = Math.min(1, (t - t0) / kesto), e = 1 - Math.pow(1 - s, 3);
      el._vb = alku.map((a, i) => a + (kohde[i] - a) * e);
      svg.setAttribute('viewBox', el._vb.map(v => v.toFixed(1)).join(' '));
      if (s < 1) el._vbAnim = requestAnimationFrame(askel);
    };
    el._vbAnim = requestAnimationFrame(askel);
  }

  window.piirraAkso = function (el, h) {
    const tulos = rakenna(h);
    const vanhat = el._avaimet || new Set();
    const vaihtui = el._avain !== tulos.avain;
    let uusi = 0;
    const html = tulos.osat.map(o => {
      const k = o.k;
      const animoi = el._avain && !vahennaLiiketta && (vaihtui ? k !== 'maa' && k !== 'varjo' : !vanhat.has(k));
      return `<g class="ax-osa${animoi ? ' ax-uusi-osa' : ''}"${animoi ? ` style="--i:${Math.min(uusi++, 16)}"` : ''}>${o.svg}</g>`;
    }).join('');
    let svg = el.querySelector('svg');
    if (!svg) { el.innerHTML = '<svg class="akso-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Havainnekuva valitusta kohteesta"></svg>'; svg = el.firstChild; }
    svg.innerHTML = html;
    liu(el, svg, sovita(tulos.rajat));
    el._avaimet = new Set(tulos.osat.map(o => o.k));
    el._avain = tulos.avain;
  };
})();
