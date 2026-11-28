// ============================================================
//  TALO LEIKKAUKSENA – tutkimussivun leikkauspiirros (kiinteä kuvakulma).
//  Sama piirrostyyli kuin hintalaskurin aksonometriassa (js/akso.js); vinoprojektio,
//  jossa leikkauspinta näkyy suoraan edestä ja syvyys viistosti taaksepäin.
//  Talo leikataan pituussuunnassa: leikkauspinnassa näkyvät katon profiili,
//  välipohjat, seinien eristeet ja perustus maan alla. Piirros muuttuu valintojen
//  mukaan (kohde, rakennusvuosi, alapohja, kerrokset), ja numeroidut tarkastuskohdat
//  on kiinnitetty suoraan piirroksen rakenteisiin.
//  Valinnat ovat samat kuin hintalaskurissa (data/hinnasto.js) ja pysyvät sen kanssa
//  samoina (tapahtumat laskuri:aseta / laskuri:muutos).
//  Kuvat ja videot kohtiin: data/leikkaus-media.js
//  Sivulla: <div data-leikkaus></div>
// ============================================================

// Käynnistys funktiona, jotta palvelusivun sisällön vaihtuessa (js/palvelusiirto.js) se voidaan ajaa uudelleen.
window.alustaLeikkaus = function () {
  const juuri = document.querySelector('[data-leikkaus]');
  const L = window.HINNASTO && window.HINNASTO.laskurit && window.HINNASTO.laskurit.tutkimus;
  if (!juuri || !L) return;
  const laskuri = document.querySelector('[data-laskuri="tutkimus"]');
  const lisavalinta = id => L.lisavalinnat.find(v => v.id === id);
  const vahenna = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Projektio: vinoprojektio, jossa leikkauspinta näkyy suoraan edestä ----------
  // Syvyys (etäisyys leikkauspinnasta taaksepäin) piirtyy viistosti oikealle ylös lyhennettynä.
  const M = 10, KX = .5 * Math.cos(35 * Math.PI / 180), KY = .5 * Math.sin(35 * Math.PI / 180);
  let YC = 0;
  const P = (x, y, z) => { const s = YC - y; return [(x + s * KX) * M, (-z - s * KY) * M]; };

  // ---------- Värit: paperisävyt kuten hintalaskurin piirroksessa ----------
  const YLA = '#FFFFFF', ETU = '#F6F3EC', OIK = '#E3DDD1', SISA = '#FBFAF7', LATTIA = '#F3EFE7',
    KATE = '#EFEAE1', KATE_O = '#DED7CA', PUU = '#EFE6D6', BETONI = 'url(#lk-betoni)', ERISTE = 'url(#lk-eriste)',
    MAA = 'url(#lk-maa)', SORA = 'url(#lk-sora)', LAATTA = 'url(#lk-laatta)', LASI = '#C9CED3', RISKI = '#F3B45E', TUMMA = '#8E8A82';

  // ---------- Tila ----------
  const tila = { kohde: 'okt', vuosi: 'v79', perustus: 'laatta', kerrokset: '15', palvelut: ['kunto'] };
  let valittu = null;

  const malliTila = t => {
    const K = t.kohde;
    const kerr = K === 'okt' ? t.kerrokset : K === 'yhtio' ? '4' : '1';
    const perustus = K === 'yhtio' ? 'kellari' : t.perustus;
    let kalt = { v59: 38, v79: 14, v99: 27, v00: 27 }[t.vuosi] || 27;
    if (kerr === '15') kalt = Math.max(kalt, 40);
    if (K === 'mokki') kalt = Math.max(kalt, 30);
    return { K, kerr, perustus, vuosi: t.vuosi, kalt: K === 'yhtio' ? 0 : kalt,
      vale: perustus === 'laatta' && (t.vuosi === 'v79' || t.vuosi === 'v99'),
      hormi: K !== 'yhtio' && (t.vuosi === 'v59' || t.vuosi === 'v79'),
      vanha: t.vuosi === 'v59' || t.vuosi === 'v79', ennen94: t.vuosi !== 'v00' };
  };

  // ============================================================
  //  PIIRROS: x = leveys (päätykolmion suunta), y = syvyys, z = ylös.
  //  Talosta piirretään takaosa y ≤ yc; leikkauspinta on tasossa y = yc.
  //  Näkyvät pinnat: katto (+z), oikea (+x) ja etu/leikkaus (+y).
  // ============================================================
  function piirros(d) {
    const MITAT = { okt: [8.6, 11, 6.6], rivi: [9, 20, 6.4], mokki: [7, 8.4, 5.2], yhtio: [12, 18, 8.6] };
    const [W, D, yc] = MITAT[d.K];
    YC = yc;
    const t = d.K === 'yhtio' ? .45 : .35;
    const tn = Math.tan(d.kalt * Math.PI / 180);
    const osat = [], kohdat = {};
    let rajat = [Infinity, Infinity, -Infinity, -Infinity];
    const laajenna = pts => pts.forEach(p => { const q = P(...p); rajat = [Math.min(rajat[0], q[0]), Math.min(rajat[1], q[1]), Math.max(rajat[2], q[0]), Math.max(rajat[3], q[1])]; });
    const poly = (pts, fill, cls = '') => { laajenna(pts); osat.push(`<polygon${cls ? ` class="${cls}"` : ''} fill="${fill}" points="${pts.map(p => P(...p).map(v => v.toFixed(1)).join(',')).join(' ')}"/>`); };
    const viiva = (pts, cls) => { laajenna(pts); osat.push(`<polyline class="${cls}" points="${pts.map(p => P(...p).map(v => v.toFixed(1)).join(',')).join(' ')}"/>`); };
    // Laatikko leikattuna tasoon y = yc. f = { yla, oik, etu, leik } (leik = leikkauspinnan täyttö)
    const laatikko = (x0, x1, y0, y1, z0, z1, f = {}) => {
      y1 = Math.min(y1, yc);
      if (x1 - x0 < .005 || y1 - y0 < .005 || z1 - z0 < .005) return;
      const leikattu = y1 >= yc - 1e-6;
      const etu = leikattu ? (f.leik || f.etu || ETU) : (f.etu || ETU);
      if (etu) poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], etu, leikattu && f.leik ? 'k' : '');
      if (f.oik !== null) poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], f.oik || OIK);
      if (f.yla !== null) poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], f.yla || YLA);
    };
    // Suorakaide tasolla: 'x' (x = vakio, näkyy oikealta) tai 'y' (y = vakio, näkyy edestä)
    const ruutu = (taso, arvo, a0, a1, z0, z1, fill, cls) => poly(taso === 'x'
      ? [[arvo, a0, z0], [arvo, a1, z0], [arvo, a1, z1], [arvo, a0, z1]]
      : [[a0, arvo, z0], [a1, arvo, z0], [a1, arvo, z1], [a0, arvo, z1]], fill, cls);
    const kohta = (id, p) => { if (p) kohdat[id] = P(...p); };

    // ---------- Kerroskorkeudet ----------
    const korkeudet = { '1': [2.7], '15': [2.6, 1.2], '2': [2.6, 2.6], '4': [2.9, 2.9, 2.9, 2.9] }[d.kerr] || [2.7];
    const VALI = d.K === 'yhtio' ? .35 : .3;
    const zf0 = d.perustus === 'rossi' ? 1.0 : d.perustus === 'kellari' ? .6 : .45;
    const tasot = []; { let z = zf0; korkeudet.forEach(h => { tasot.push({ z, h }); z += h + VALI; }); }
    const N = tasot.length, ylin = tasot[N - 1], zt = ylin.z + ylin.h;      // seinien yläreuna
    const syva = d.perustus === 'kellari' ? 3.4 : 1.7;
    const hx = W * .36, hy = yc * .42;                                        // hormin paikka

    // ---------- Maa ----------
    const mR = 2.4;
    poly([[-mR, -mR, 0], [W + mR, -mR, 0], [W + mR, yc, 0], [-mR, yc, 0]], LATTIA);
    for (let x = -mR + 1; x < W + mR; x += 1) viiva([[x, -mR, 0], [x, yc, 0]], 'lk-ruudukko');
    for (let y = -mR + 1; y < yc; y += 1) viiva([[-mR, y, 0], [W + mR, y, 0]], 'lk-ruudukko');
    ruutu('y', yc, -mR, W + mR, -syva, 0, MAA, 'k');
    ruutu('x', W + mR, -mR, yc, -syva, 0, MAA);

    // ---------- Perustus ----------
    const anturat = (zAla, zYla, lev) => { laatikko(-.15, lev, 0, yc, zAla, zYla, { leik: BETONI }); laatikko(W - lev, W + .15, 0, yc, zAla, zYla, { leik: BETONI }); };
    let pohja;
    if (d.perustus === 'kellari') {
      const zb = -2.45;
      laatikko(-.25, W + .25, 0, yc, zb - .65, zb - .3, { leik: SORA });
      anturat(zb - .3, zb, t + .35);
      laatikko(0, W, 0, yc, zb - .3, zb, { leik: BETONI, yla: LATTIA });
      laatikko(0, t, 0, yc, zb, zf0 - .3, { leik: BETONI, oik: SISA });
      laatikko(t, W - t, 0, t, zb, zf0 - .3, { leik: BETONI, etu: SISA });
      // Lämmityskattila ja hyllyt kellarissa
      laatikko(t + .3, t + 1.2, yc - 2.2, yc - 1.4, zb, zb + 1.7, { leik: '#ECE7DE' });
      laatikko(W * .5, W * .5 + 2.2, t, t + .45, zb, zb + 1.9, { leik: PUU });
      laatikko(W - t, W, 0, yc, zb, zf0 - .3, { leik: BETONI });
      laatikko(0, W, 0, yc, zf0 - .3, zf0, { leik: BETONI, yla: LATTIA });
      pohja = zb - .5;
      kohta('alapohja', [W * .3, yc - .3, zb + 1.5]);
      kohta('energia', [t + .75, yc - 1.4, zb + 1.1]);
    } else if (d.perustus === 'rossi') {
      anturat(-1.2, -.9, t + .3);
      laatikko(t, W - t, 0, yc, -.45, -.2, { leik: SORA, yla: '#EAE4D8' });
      laatikko(0, t, 0, yc, -.9, zf0 - .3, { leik: BETONI, oik: SISA });
      laatikko(t, W - t, 0, t, -.2, zf0 - .3, { leik: BETONI, etu: SISA });
      laatikko(W - t, W, 0, yc, -.9, zf0 - .3, { leik: BETONI });
      for (let y = .8; y < yc - .6; y += 2.4) ruutu('x', W, y, y + .45, .3, .5, TUMMA);         // tuuletusaukot
      laatikko(0, W, 0, yc, zf0 - .3, zf0, { leik: ERISTE, yla: LATTIA });
      pohja = -1.05;
      kohta('alapohja', [W * .5, yc - .2, .15]);
    } else {
      laatikko(-.1, W + .1, 0, yc, -.75, -.45, { leik: SORA });
      anturat(-.9, -.55, t + .3);
      const sokYla = d.vale ? .05 : zf0;
      laatikko(0, t, 0, yc, -.55, sokYla, { leik: BETONI });
      laatikko(W - t, W, 0, yc, -.55, sokYla, { leik: BETONI });
      laatikko(t, W - t, 0, yc, -.45, -.15, { leik: SORA, yla: null });
      laatikko(t, W - t, 0, yc, -.15, .15, { leik: ERISTE, yla: null });
      laatikko(t, W - t, 0, yc, .15, zf0, { leik: BETONI, yla: LATTIA });
      pohja = -.75;
      kohta('alapohja', [W * .45, yc, .3]);
    }
    // Salaojaputket perustusten vieressä
    [-.45, W + .45].forEach(x => { const c = P(x, yc, pohja + .05); laajenna([[x, yc, pohja]]); osat.push(`<circle class="lk-salaoja" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${(.14 * M).toFixed(1)}"/>`); });
    kohta('salaoja', [-.45, yc, pohja + .05]);

    // ---------- Kerrokset ----------
    let markaP = null, asbP = null, tekP = null;
    tasot.forEach(({ z, h }, i) => {
      const katto15 = d.kerr === '15' && i === N - 1;
      const z1 = z + h;
      // Vasen seinä ja takaseinä (sisäpinnat näkyvät leikkauksen läpi)
      const wz0 = i === 0 && d.vale ? .05 : z;
      laatikko(0, t, 0, yc, wz0, z1, { leik: ERISTE, oik: SISA });
      laatikko(t, W - t, 0, t, wz0, z1, { leik: ERISTE, etu: SISA });
      if (!katto15) [W * .28, W * .62].forEach(x => ruutu('y', t, x - .6, x + .6, z + .9, z + 2.15, LASI));
      // Hormi ja tulisija
      if (d.hormi) {
        laatikko(hx, hx + .6, hy, hy + .6, z, z1 + (i < N - 1 ? VALI : 0), { leik: '#E6DDD0' });
        if (i === 0) laatikko(hx - .2, hx + .8, hy + .6, hy + 1.2, z, z + 1.1, { leik: '#E6DDD0' });
      }
      // Kalusteet: märkätila, keittiö, tekninen tila
      if (i === 0 || (d.K === 'yhtio' && i === 1)) {
        const xa = W - t - 2.3;
        ruutu('y', t + .002, xa, W - t, z, z + h * .9, LAATTA);
        poly([[xa, t, z + .01], [W - t, t, z + .01], [W - t, t + 2.1, z + .01], [xa, t + 2.1, z + .01]], LAATTA);
        laatikko(xa - .1, xa, t, t + 2.1, z, z + 2.1, { leik: SISA, oik: SISA });
        laatikko(W - t - 1.0, W - t, t, t + .9, z, z + .55, { yla: YLA });
        if ((i === 0 && d.K !== 'yhtio') || i === 1) markaP = [W - t - 1.2, t + 1.1, z + .6];
      }
      if (i === 0) {
        laatikko(t, t + .62, yc - 3.4, yc - .9, z, z + .9, { yla: YLA, leik: SISA });
        asbP = [t + .31, yc - 1.2, z + .9];
        // Tekninen tila lähellä leikkauspintaa, jotta se ei jää yläpohjan taakse
        if (d.perustus !== 'kellari') { const xa = W * .46, ya = yc - 3.4, yb2 = yc - 2.7; laatikko(xa, xa + .8, ya, yb2, z, z + 1.5, { leik: '#ECE7DE' }); tekP = [xa + .4, yb2, z + 1.0]; }
      }
      // Oikea ulkoseinä ikkunoineen ja välipohja seuraavaan kerrokseen
      laatikko(W - t, W, 0, yc, wz0, z1, { leik: ERISTE });
      if (!katto15) [yc * .28, yc * .72].forEach(y => ruutu('x', W, y - .6, y + .6, z + .9, z + 2.15, LASI));
      if (i === 0 && d.vale) {
        laatikko(W - t + .04, W - .04, 0, yc, .05, .2, { leik: RISKI, oik: RISKI, yla: RISKI });     // alajuoksu lattiapinnan alapuolella
        ruutu('x', W + .05, 0, yc, 0, zf0, '#E4DFD6');                                             // valesokkelin ohut levy
        kohta('vale', [W - t / 2, yc, .14]);
      }
      if (d.K === 'yhtio' && i > 0) {
        laatikko(W, W + 1.4, yc * .25, yc * .25 + 2.6, z - .25, z - .05, { leik: BETONI });
        ruutu('x', W + 1.4, yc * .25, yc * .25 + 2.6, z - .05, z + 1.0, 'rgba(201, 206, 211, .55)');
      }
      if (i < N - 1) laatikko(0, W, 0, yc, z1, z1 + VALI, { leik: d.K === 'yhtio' ? BETONI : ERISTE, yla: LATTIA });
    });
    if (d.K === 'yhtio') kohta('julkisivu', [W + .7, yc * .25 + 1.3, tasot[2].z]);
    kohta('ulkoseina', [t / 2, yc, zf0 + 1.6]);          // vasemman ulkoseinän leikkauspinta
    kohta('markatila', markaP);
    kohta('asbesti', asbP || markaP);
    if (tekP) kohta('energia', tekP);

    // ---------- Yläpohja ja vesikatto ----------
    let katonHuippu = zt;
    if (d.K === 'yhtio') {
      laatikko(0, W, 0, yc, zt, zt + .55, { leik: ERISTE, yla: KATE });
      laatikko(0, .3, 0, yc, zt + .55, zt + .95, { leik: BETONI });
      laatikko(.3, W - .3, 0, .3, zt + .55, zt + .95, { leik: BETONI });
      laatikko(W * .35, W * .35 + 2.6, 1.2, 3.6, zt + .55, zt + 2.5, { leik: '#ECE7DE' });              // konehuone
      laatikko(W - .3, W, 0, yc, zt + .55, zt + .95, { leik: BETONI });
      katonHuippu = zt + 2.5;
      kohta('katto', [W * .7, yc * .55, zt + .55]);
      kohta('iv', [W * .35 + 1.3, 2.4, zt + 2.5]);
    } else {
      const e = .5, rt = d.kerr === '15' ? .45 : .3, xr = W / 2;
      const zHarja = zt + xr * tn;                        // harjan alapinta
      const zr = x => zt + (x <= xr ? x : W - x) * tn;   // katon alapinta kohdassa x
      const ylaZ = x => zr(x) + rt;                       // katon yläpinta
      // Kylmä ullakko: yläpohjan eriste; 1½-kerroksisessa vinokaton yläosan välikatto
      const ullakko = d.kerr !== '15';
      if (ullakko) laatikko(t, W - t, t, yc, zt - .05, zt + .4, { leik: ERISTE, yla: '#FBF5E8' });
      else laatikko(xr - 1.4, xr + 1.4, t, yc, zt + 1.55, zt + 1.8, { leik: ERISTE, yla: SISA });
      // Takapäädyn sisäpinta näkyy leikkauksen läpi
      const zp = ullakko ? zt + .4 : zt;
      poly([[t, t, zp], [W - t, t, zp], [W - t, t, Math.max(zp, zr(W - t))], [xr, t, zHarja], [t, t, Math.max(zp, zr(t))]], SISA);
      // Ullakon ilmanvaihtokone (2000-luku)
      if (d.vuosi === 'v00') {
        if (ullakko) { laatikko(W * .58, W * .58 + 1.2, yc - 2.0, yc - 1.0, zt + .4, zt + 1.05, { leik: '#ECE7DE' }); kohta('iv', [W * .58 + .6, yc - 1.5, zt + 1.05]); }
        else { const z = ylin.z; laatikko(W - t - 1.3, W - t - .1, t, t + .7, z, z + .8, { leik: '#ECE7DE' }); kohta('iv', [W - t - .7, t + .7, z + .8]); }
      }
      if (d.hormi) laatikko(hx, hx + .6, hy, hy + .6, zt, zr(hx + .6), { leik: '#E6DDD0' });
      // Lappeet: vasen (taka) ja oikea, sitten leikkausprofiili
      poly([[-e, 0, ylaZ(0) - e * tn], [-e, yc, ylaZ(0) - e * tn], [xr, yc, ylaZ(xr)], [xr, 0, ylaZ(xr)]], KATE);
      if (d.hormi) { const zh = ylaZ(hx + .6) + .9; laatikko(hx, hx + .6, hy, hy + .6, ylaZ(hx), zh, {}); katonHuippu = zh; kohta('iv', [hx + .3, hy + .3, zh]); }
      poly([[xr, 0, ylaZ(xr)], [xr, yc, ylaZ(xr)], [W + e, yc, ylaZ(W) - e * tn], [W + e, 0, ylaZ(W) - e * tn]], KATE_O);
      if (d.vuosi === 'v99') {   // koneellisen poiston huippuimuri lappeella
        const x = W * .58, y = yc * .3;
        laatikko(x, x + .45, y, y + .45, ylaZ(x + .45) - .1, ylaZ(x + .45) + .6, { yla: '#B9BDC4' });
        kohta('iv', [x + .22, y + .22, ylaZ(x + .45) + .6]);
      }
      const ulko = [[-e, yc, ylaZ(0) - e * tn], [xr, yc, ylaZ(xr)], [W + e, yc, ylaZ(W) - e * tn]];
      const sisa = [[W + e, yc, zr(W) - e * tn], [xr, yc, zHarja], [-e, yc, zr(0) - e * tn]];
      poly([...ulko, ...sisa], ullakko ? PUU : ERISTE, 'k');
      // Rivitalossa takaseinä on huoneistojen välinen palomuuri, joka jatkuu vesikattoon asti
      if (d.K === 'rivi') kohta('palomuuri', [W * .45, t, zf0 + .7]);
      katonHuippu = Math.max(katonHuippu, ylaZ(xr));
      kohta('katto', [W * .8, yc * .62, ylaZ(W * .8)]);
      kohta('ylapohja', ullakko ? [W * .3, yc, zt + .2] : [W * .2, yc, zr(W * .2) + rt / 2]);
    }
    if (!kohdat.iv) kohta('iv', [hx + .3, hy + .3, katonHuippu]);
    return { svg: osat.join(''), rajat, kohdat };
  }

  // ---------- Tarkastuskohdat: nimet ja tekstit valintojen mukaan ----------
  function kohtaLista(d) {
    const lista = [];
    const k = (id, nimi, teksti, palvelut, varoitus) => lista.push({ id, nimi, teksti, palvelut, varoitus: !!varoitus });
    if (d.K === 'yhtio') {
      k('katto', 'Tasakatto', 'Kattokaivot, vedenpoisto, kattohuovan saumat ja läpiviennit. Tasakatto on taloyhtiön tavallisimpia vuotokohtia, joten se tarkastetaan aina huolellisesti.', ['kunto', 'vaur'], true);
      k('iv', 'Ilmanvaihto ja konehuone', 'Konehuoneen laitteet, huippuimurit ja kanavien läpiviennit. Arvioimme ilmanvaihdon toimivuutta asunnoissa aistinvaraisesti ja kirjaamme puhdistus- ja säätötarpeet.', ['kunto', 'ener']);
      k('julkisivu', 'Julkisivu ja parvekkeet', 'Betonin rapautuminen, raudoitteiden suojabetoni, parvekelaattojen vedenpoisto ja kaiteiden kiinnitykset. Tarvittaessa suosittelemme julkisivun kuntotutkimusta.', ['kunto', 'vaur']);
      k('markatila', 'Märkätilat ja putkistot', 'Märkätilojen pintakosteus, vedeneristykset ja putkistojen ikä. Havainnot ovat pohja linjasaneerauksen ajoitukselle ja suunnittelulle.', ['kunto', 'kost', 'vaur']);
    } else {
      const loiva = d.kalt < 20;
      k('katto', loiva ? 'Loiva vesikatto' : 'Vesikatto', 'Katteen kunto, läpiviennit, kattoturvatuotteet sekä räystäät ja sadevesijärjestelmä. Katolle noustaan, kun se on turvallista.' + (loiva ? ' Loivalla katolla vesi poistuu hitaasti, joten läpiviennit ja aluskate tarkastetaan erityisen huolellisesti.' : ''), ['kunto'], loiva);
      k('ylapohja', 'Yläpohja', 'Ullakolla tarkastetaan lämmöneristeet, tuuletus, aluskate ja mahdolliset vuoto- ja kosteusjäljet.' + (d.vuosi === 'v59' ? ' Vanhoissa taloissa eristeenä on usein sahanpuru, joka painuu ja voi kerätä kosteutta.' : ''), ['kunto', 'kost']);
      if (d.vuosi === 'v00') k('iv', 'Ilmanvaihtokone', 'Lämmöntalteenottokoneen kunto, suodattimet ja huoltohistoria sekä kanavien eristys kylmässä ullakkotilassa. Kondenssi eristämättömissä kanavissa on yleinen kosteuslähde.', ['kunto', 'ener']);
      else if (d.vuosi === 'v99') k('iv', 'Koneellinen poisto', 'Huippuimuri, poistoventtiilit ja korvausilman reitit. Puutteellinen korvausilma näkyy alipaineena: ovet vetävät ja kosteus tiivistyy ikkunoihin.', ['kunto', 'ener']);
      else k('iv', 'Painovoimainen ilmanvaihto', 'Hormit, hormien pellit ja tulisijojen liitokset. Painovoimainen ilmanvaihto heikkenee kesällä ja tiiviiksi remontoidussa talossa – tarkastamme myös nuohouksen ja hormien kunnon.', ['kunto', 'ener']);
      k('markatila', d.K === 'rivi' ? 'Märkätilat' : 'Märkätilat ja sauna', 'Vedeneristys, lattiakaadot, kaivot ja läpiviennit. Pintakosteusmittarilla käydään läpi seinät ja lattia – kosteus näkyy usein vasta mittarilla.', ['kunto', 'kost', 'vaur']);
      k('ulkoseina', 'Ulkoseinät ja ikkunat', 'Julkisivu, ikkunoiden ja ovien liittymät, räystäät ja sokkelin korkeus maanpinnasta. Kuntotarkastus on rakenteita rikkomaton; epäselvät kohdat ohjataan rakennetutkimukseen.', ['kunto', 'vaur']);
      if (d.K === 'rivi') k('palomuuri', 'Huoneistojen väliseinät', 'Palomuurin jatkuminen vesikattoon asti ja liittymien tiiviys. Puutteet vaikuttavat sekä paloturvallisuuteen että ääneneristykseen.', ['kunto']);
    }
    if (d.perustus === 'kellari') k('alapohja', 'Kellarin seinät ja lattia', 'Maanvastaiset seinät ja lattia ovat alttiita kapillaari- ja valumavedelle. Mittaamme pintakosteudet ja arvioimme vedeneristyksen ja salaojituksen toimivuutta.' + (d.vanha ? ' Vanhoissa kellareissa vedeneristys puuttuu usein kokonaan.' : ''), ['kunto', 'kost', 'vaur'], d.vanha);
    else if (d.perustus === 'rossi') k('alapohja', 'Rossipohja', 'Ryömintätilan tuuletus, maapohjan kosteus ja puurakenteiden kunto. Tarkastamme tilan luukusta ja mittaamme ilman suhteellisen kosteuden; mikrobivauriot ovat rossipohjissa yleisiä.', ['kunto', 'kost', 'vaur'], d.vanha);
    else k('alapohja', 'Maanvarainen laatta', 'Lattiapinnoitteiden alta mitataan kosteutta erityisesti märkätilojen vierestä ja ulkoseinien läheltä. Kapillaarikatko ja eristys laatan alla ratkaisevat, nouseeko maaperän kosteus rakenteisiin.', ['kunto', 'kost']);
    if (d.vale) k('vale', 'Valesokkeli', 'Valesokkelissa puurungon alajuoksu on lattiapinnan alapuolella, maanpinnan tuntumassa ohuen betonilevyn takana. Rakenne on 1960–80-lukujen tunnetuin kosteusvaurioiden paikka – suosittelemme rakennetutkimusta.', ['kunto', 'vaur'], true);
    k('salaoja', 'Salaojat ja sadevedet', 'Maanpinnan kallistukset, syöksytorvet ja sadevesikaivot. Salaojien kuntoa arvioidaan iän ja tarkastuskaivojen perusteella.' + (d.vanha ? ' Yli 40 vuotta vanhat salaojat ovat usein käyttöikänsä lopussa.' : ''), ['kunto'], d.vanha);
    if (d.ennen94) k('asbesti', 'Asbesti ja haitta-aineet', 'Ennen vuotta 1994 rakennettujen tai remontoitujen tilojen laattojen liimoissa, tasoitteissa, kiteissä ja eristeissä voi olla asbestia. Kartoitus tehdään ennen remonttia – otamme näytteet tarvittaessa.', ['vaur'], true);
    k('energia', 'Lämmitys ja energia', 'Lämmitysjärjestelmä, käyttövesi, eristystaso ja ikkunat. Energiatodistus tarvitaan myynti- ja vuokrailmoituksiin, ja se on voimassa 10 vuotta.', ['ener', 'kunto']);
    return lista;
  }

  // ============================================================
  //  KÄYTTÖLIITTYMÄ
  // ============================================================
  const ryhma = (id, otsikko, vaihtoehdot) => `
      <div class="lk-ryhma" data-ryhma="${id}"><span class="lk-ryhma-nimi">${otsikko}</span>
        <div class="lk-pillerit">${vaihtoehdot.map(o => `<button type="button" class="lk-pilleri" data-arvo="${o.id}" aria-pressed="false">${o.nimi}</button>`).join('')}</div>
      </div>`;
  juuri.classList.add('lk');
  juuri.innerHTML = `
    <div class="lk-valinnat">
      ${ryhma('kohde', 'Kohde', L.kohteet)}
      ${ryhma('vuosi', 'Rakennettu', lisavalinta('vuosi').vaihtoehdot)}
      ${ryhma('perustus', 'Alapohja', lisavalinta('perustus').vaihtoehdot)}
      ${ryhma('kerrokset', 'Kerrokset', lisavalinta('kerrokset').vaihtoehdot)}
    </div>
    <div class="lk-runko">
      <div class="lk-nayttamo">
        <svg class="lk-svg" role="img" aria-label="Talon leikkauskuva, jossa numeroidut tarkastuskohdat" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="lk-maa" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#F1ECE3"/><line x1="0" y1="0" x2="0" y2="7" stroke="#D6CEBF" stroke-width="1"/></pattern>
            <pattern id="lk-sora" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#EEE9E0"/><circle cx="1.8" cy="1.8" r=".9" fill="#C9C0B1"/><circle cx="4.6" cy="4.4" r=".7" fill="#C9C0B1"/></pattern>
            <pattern id="lk-eriste" width="8" height="5" patternUnits="userSpaceOnUse"><rect width="8" height="5" fill="#FBF5E8"/><path d="M0 2.5Q2 0 4 2.5T8 2.5" fill="none" stroke="#DCCDB0" stroke-width=".7"/></pattern>
            <pattern id="lk-betoni" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#E9E5DD"/><circle cx="2" cy="3" r=".7" fill="#CFC7B8"/><circle cx="6.5" cy="7" r=".5" fill="#CFC7B8"/><circle cx="7" cy="1.5" r=".4" fill="#CFC7B8"/></pattern>
            <pattern id="lk-laatta" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#EEF1F2"/><path d="M0 0H5M0 0V5" stroke="#D3DADD" stroke-width=".6"/></pattern>
          </defs>
          <g class="lk-malli"></g>
        </svg>
        <div class="lk-pisteet"></div>
      </div>
      <div class="lk-tiedot">
        <div class="lk-kortti" aria-live="polite"></div>
        <ol class="lk-lista"></ol>
      </div>
    </div>`;
  const $ = s => juuri.querySelector(s);
  const svg = $('.lk-svg'), ryhmaMalli = $('.lk-malli'), pisteet = $('.lk-pisteet'), nayttamo = $('.lk-nayttamo');
  const lista = $('.lk-lista'), kortti = $('.lk-kortti');

  let d = malliTila(tila), kuva = piirros(d), kohdat = kohtaLista(d), vb = [0, 0, 1, 1];

  // ---------- Piirto ja täppien paikat ----------
  function piirra() {
    ryhmaMalli.innerHTML = kuva.svg;
    const r = kuva.rajat, pad = 18;
    vb = [r[0] - pad, r[1] - pad - 14, r[2] - r[0] + 2 * pad, r[3] - r[1] + 2 * pad + 14];
    svg.setAttribute('viewBox', vb.map(v => v.toFixed(1)).join(' '));
    sijoita();
  }
  function sijoita() {
    const w = nayttamo.clientWidth || 1, h = nayttamo.clientHeight || 1;
    const m = Math.min(w / vb[2], h / vb[3]), ox = (w - vb[2] * m) / 2, oy = (h - vb[3] * m) / 2;
    pisteet.querySelectorAll('[data-kohta]').forEach(b => {
      const p = kuva.kohdat[b.dataset.kohta];
      if (!p) return;
      const px = ox + (p[0] - vb[0]) * m, py = oy + (p[1] - vb[1]) * m;
      b.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      b.classList.toggle('vasen', px > w * .62);
    });
  }

  // ---------- Kohdat: numerot kuvassa, lista ja kortti ----------
  const palveluNimi = id => (L.palvelut.find(p => p.id === id) || {}).nimi || id;
  function paivitaKohdat() {
    const nakyvat = kohdat.filter(k => kuva.kohdat[k.id]);
    if (!nakyvat.find(k => k.id === valittu)) valittu = (nakyvat.find(k => k.varoitus) || nakyvat[0]).id;
    const tunniste = nakyvat.map(k => k.id + k.nimi + k.varoitus).join('|');
    if (tunniste !== pisteet.dataset.tunniste) {
      pisteet.dataset.tunniste = tunniste;
      pisteet.innerHTML = nakyvat.map((k, i) => `<button type="button" class="lk-piste${k.varoitus ? ' varoitus' : ''}" data-kohta="${k.id}" aria-label="${i + 1}. ${k.nimi}"><span class="lk-piste-nro">${i + 1}</span><span class="lk-piste-nimi">${k.nimi}</span></button>`).join('');
      lista.innerHTML = nakyvat.map((k, i) => `<li><button type="button" class="lk-rivi${k.varoitus ? ' varoitus' : ''}" data-kohta="${k.id}"><span class="lk-rivi-nro">${i + 1}</span><span>${k.nimi}</span></button></li>`).join('');
    }
    const kk = nakyvat.find(k => k.id === valittu), nro = nakyvat.indexOf(kk) + 1;
    juuri.querySelectorAll('[data-kohta]').forEach(b => {
      const on = b.dataset.kohta === valittu, kohde = nakyvat.find(k => k.id === b.dataset.kohta);
      b.classList.toggle('valittu', on);
      b.classList.toggle('himmea', !!kohde && !kohde.palvelut.some(p => tila.palvelut.includes(p)));
      if (b.classList.contains('lk-rivi')) b.setAttribute('aria-current', on ? 'true' : 'false');
    });
    // Kuva tai video kohdasta (data/leikkaus-media.js); muuten varattu paikka
    const media = (window.LEIKKAUS_MEDIA || {})[kk.id] || {};
    const mediaHtml = media.video
      ? `<video src="${media.video}"${media.kuva ? ` poster="${media.kuva}"` : ''} muted loop playsinline autoplay controls></video>`
      : media.kuva ? `<img src="${media.kuva}" alt="${kk.nimi}" loading="lazy">`
      : `<span class="lk-media-tyhja"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg>Kuva tai video tulossa</span>`;
    kortti.innerHTML = `
      <figure class="lk-media${media.video || media.kuva ? '' : ' tyhja'}">${mediaHtml}${media.teksti ? `<figcaption>${media.teksti}</figcaption>` : ''}</figure>
      <p class="lk-kortti-yla"><span class="lk-kortti-nro${kk.varoitus ? ' varoitus' : ''}">${nro}</span>${kk.varoitus ? 'Riskirakenne' : 'Tarkastuskohta'}</p>
      <h3>${kk.nimi}</h3>
      <p>${kk.teksti}</p>
      <p class="lk-kortti-palvelut">${kk.palvelut.map(p => `<span${tila.palvelut.includes(p) ? ' class="on"' : ''}>${palveluNimi(p)}</span>`).join('')}</p>`;
  }
  function paivitaNapit() {
    juuri.querySelectorAll('[data-ryhma]').forEach(r => {
      const id = r.dataset.ryhma, v = lisavalinta(id);
      r.hidden = !!(v && v.kohteet && !v.kohteet.includes(tila.kohde));
      r.querySelectorAll('[data-arvo]').forEach(b => b.setAttribute('aria-pressed', b.dataset.arvo === (id === 'perustus' ? d.perustus : tila[id])));
    });
  }

  // ---------- Tila muuttuu (omat napit tai laskuri) ----------
  function paivita() {
    d = malliTila(tila); kuva = piirros(d); kohdat = kohtaLista(d);
    paivitaNapit();
    piirra();
    paivitaKohdat();
    sijoita();
    if (!vahenna) { nayttamo.classList.remove('lk-vaihto'); void nayttamo.offsetWidth; nayttamo.classList.add('lk-vaihto'); }
  }
  const kerroLaskurille = () => laskuri && laskuri.dispatchEvent(new CustomEvent('laskuri:aseta', {
    detail: { kohde: tila.kohde, valinnat: { vuosi: tila.vuosi, perustus: tila.perustus, kerrokset: tila.kerrokset } } }));

  $('.lk-valinnat').addEventListener('click', e => {
    const b = e.target.closest('[data-arvo]'); if (!b) return;
    tila[b.closest('[data-ryhma]').dataset.ryhma] = b.dataset.arvo;
    paivita();
    kerroLaskurille();
  });
  if (laskuri) laskuri.addEventListener('laskuri:muutos', e => {
    const x = e.detail, v = x.valinnat || {};
    const ero = x.kohde !== tila.kohde || v.vuosi !== tila.vuosi || v.perustus !== tila.perustus || v.kerrokset !== tila.kerrokset || x.palvelut.join() !== tila.palvelut.join();
    if (!ero) return;
    Object.assign(tila, { kohde: x.kohde, vuosi: v.vuosi || tila.vuosi, perustus: v.perustus || tila.perustus, kerrokset: v.kerrokset || tila.kerrokset, palvelut: x.palvelut.slice() });
    paivita();
  });
  juuri.addEventListener('click', e => {
    const b = e.target.closest('[data-kohta]'); if (!b) return;
    valittu = b.dataset.kohta;
    paivitaKohdat();
  });

  if ('ResizeObserver' in window) new ResizeObserver(sijoita).observe(nayttamo); else addEventListener('resize', sijoita);

  // Aloitus
  if (laskuri && laskuri.laskuriTila) tila.palvelut = laskuri.laskuriTila.palvelut.slice();
  paivitaNapit();
  piirra();
  paivitaKohdat();
  sijoita();
  kerroLaskurille();
};
window.alustaLeikkaus();
