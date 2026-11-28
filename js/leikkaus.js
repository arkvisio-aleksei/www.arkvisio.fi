// ============================================================
//  TALON LEIKKAUS – tutkimussivun pyöritettävä aksonometrinen leikkaus.
//  Malli rakentuu valintojen mukaan (kohde, rakennusvuosi, alapohja,
//  kerrokset) ja näyttää numeroidut tarkastuskohdat ja riskirakenteet.
//  Valinnat ovat samat kuin hintalaskurissa (data/hinnasto.js) ja pysyvät
//  sen kanssa samoina (tapahtumat laskuri:aseta / laskuri:muutos).
//  Piirto: kuperat kappaleet, katsojan puoleinen puolikas leikataan pois
//  pystytasolla, maalarin algoritmi kerroksittain. Ei kirjastoja.
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

  // ---------- Värit (sivun väreihin sopivat) ----------
  const VALK = '#FBFAF7', PUU = '#E8DAC0', BET = '#CBC6BD', BETK = '#A9A398', LAATTA = '#D2DFE4', KATTO = '#4A505C',
    IKK = '#BCD0D9', TUMMA = '#3A3F49', LAUDE = '#D8B37E', RISKI = '#E0785A';
  // Piirros samaan tyyliin kuin hintalaskurin aksonometria: värit muunnetaan vaaleiksi paperisävyiksi
  // (tummuus säilyy), ikkunat lasin sävyisinä ja riskirakenteet oranssilla korostettuina.
  const ERIKOIS = { [IKK]: '#C9CED3', '#C9D8DE': '#C9CED3', [RISKI]: '#F3B45E' };
  const paperi = hex => {
    if (ERIKOIS[hex]) return ERIKOIS[hex];
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const l = Math.max(0, Math.min(1, ((.3 * r + .59 * g + .11 * b) - .25) / .72));
    const tumma = [214, 206, 192], vaalea = [255, 255, 255];
    return '#' + tumma.map((c, i) => Math.round(c + (vaalea[i] - c) * l).toString(16).padStart(2, '0')).join('');
  };
  const ERISTE = 'url(#lk-eriste)', MAA = 'url(#lk-maa)', SORA = 'url(#lk-sora)';
  const FASADI = { okt: '#E4DCCD', rivi: '#E4DCCD', mokki: '#CDB99B', yhtio: '#DAD5CC' };
  const VALO = (() => { const v = [-.35, .85, .45], p = Math.hypot(...v); return v.map(x => x / p); })();
  const S = 24;            // piirroksen mittakaava px / m
  const LEIK = .15;        // leikkaustason etäisyys keskeltä katsojaa kohti (m)

  // ---------- Tila ----------
  const tila = { kohde: 'okt', vuosi: 'v79', perustus: 'laatta', kerrokset: '15', palvelut: ['kunto'] };
  let valittu = null;

  const diskreetti = t => ({
    K: t.kohde,
    kerr: t.kohde === 'okt' ? t.kerrokset : t.kohde === 'yhtio' ? '4' : '1',
    perustus: t.kohde === 'yhtio' ? 'kellari' : t.perustus,
    vuosi: t.vuosi,
  });
  const tavoite = t => {
    const d = diskreetti(t);
    let kalt = { v59: 38, v79: 14, v99: 27, v00: 27 }[d.vuosi] || 27;
    if (d.kerr === '15') kalt = Math.max(kalt, 40);
    if (d.K === 'yhtio') kalt = 0;
    return {
      W: { okt: 10.5, rivi: 19, mokki: 8, yhtio: 16 }[d.K],
      D: { okt: 8.4, rivi: 8.6, mokki: 6.6, yhtio: 11 }[d.K],
      kalt,
      fH: d.K === 'yhtio' ? .6 : { laatta: .35, rossi: .9, kellari: .5 }[d.perustus],
      bD: d.perustus === 'kellari' ? (d.K === 'yhtio' ? 3 : 2.6) : 0,
      vale: d.perustus === 'laatta' && (d.vuosi === 'v79' || d.vuosi === 'v99') ? 1 : 0,
    };
  };

  // ============================================================
  //  MALLI: kappaleet { v: kärkipisteet, f: tahkot, o: asetukset }
  //  o.kerros = piirtokerros, o.vari / yla / ala / ulko = tahkojen värit,
  //  o.kansi = leikkauspinnan täyttö, o.haudattu = maan alla (vain leikkauspinta),
  //  o.sisa = näytetään vain sisäpinnat (kellari), o.kuori = ulkovaippa (haamuviiva),
  //  o.isa = kappale, jonka pintaan tämä kiinnittyy (ikkunat, laatoitus).
  // ============================================================
  function rakenna(d, n) {
    const K = [], kohdat = [];
    let kerros = 0;
    const BOX = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    const kpl = (v, f, o) => { const k = { v, f, o: Object.assign({ kerros }, o) }; K.push(k); return k; };
    const ltk = (xa, xb, ya, yb, za, zb, o = {}) => {
      if (xb - xa < .005 || yb - ya < .005 || zb - za < .005) return null;
      return kpl([[xa, ya, za], [xb, ya, za], [xb, ya, zb], [xa, ya, zb], [xa, yb, za], [xb, yb, za], [xb, yb, zb], [xa, yb, zb]], BOX, o);
    };
    // Poikkileikkaus (z, y) pursotettuna x-suunnassa (katot, päätykolmiot)
    const prisma = (pp, xa, xb, o = {}) => {
      const m = pp.length, v = [...pp.map(q => [xa, q[1], q[0]]), ...pp.map(q => [xb, q[1], q[0]])];
      const f = [[...Array(m).keys()], [...Array(m).keys()].map(i => i + m)];
      for (let i = 0; i < m; i++) f.push([i, (i + 1) % m, (i + 1) % m + m, i + m]);
      return kpl(v, f, o);
    };
    // Maanpinnan ylittävä kappale jaetaan kahtia: maanalainen osa saa asetukset "alla"
    const maaLtk = (xa, xb, ya, yb, za, zb, o, alla) => {
      let k = null;
      if (ya < 0) k = ltk(xa, xb, ya, Math.min(0, yb), za, zb, Object.assign({}, o, alla));
      if (yb > 0) k = ltk(xa, xb, Math.max(0, ya), yb, za, zb, o) || k;
      return k;
    };
    // Suorakaiteen kehä (ulkoseinät, sokkeli): [etu z1, taka z0, vasen x0, oikea x1]
    const keha = (xa, xb, za, zb, ya, yb, t, o, alla) => {
      const f = alla ? (a, b, c, e, g, h) => maaLtk(a, b, c, e, g, h, o, alla) : (a, b, c, e, g, h) => ltk(a, b, c, e, g, h, o);
      return [f(xa, xb, ya, yb, zb - t, zb), f(xa, xb, ya, yb, za, za + t), f(xa, xa + t, ya, yb, za + t, zb - t), f(xb - t, xb, ya, yb, za + t, zb - t)];
    };
    const kohta = (id, nimi, p, teksti, palvelut, varoitus) => kohdat.push({ id, nimi, p, teksti, palvelut, varoitus: !!varoitus });

    const { W, D } = n, t = d.K === 'yhtio' ? .4 : .3;
    const x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
    const tn = Math.tan(n.kalt * Math.PI / 180);
    const fasadi = FASADI[d.K];
    const vanha = d.vuosi === 'v59' || d.vuosi === 'v79';
    const ennen94 = d.vuosi !== 'v00';

    // ---------- Kerroskorkeudet ----------
    const korkeudet = { '1': [2.7], '15': [2.6, 1.35], '2': [2.6, 2.6], '4': [2.9, 2.9, 2.9, 2.9] }[d.kerr] || [2.7];
    const N = korkeudet.length, tasot = [];
    let y = n.fH;
    korkeudet.forEach(h => { tasot.push({ yb: y, h }); y += h + .3; });
    const yt = tasot[N - 1].yb + tasot[N - 1].h;           // ulkoseinien yläreuna
    const KATTOK = d.kerr === '15' ? 4 + 2 * (N - 1) : 4 + 2 * N;

    // ---------- 0: maa (leikkauspinnassa maan viivoitus) ----------
    const mR = 2.2, eB = -Math.max(1.6, n.bD + 1.0);
    kerros = 0;
    ltk(x0 - mR, x1 + mR, eB, 0, z0 - mR, z1 + mR, { vari: '#D2C5AF', yla: '#E3E0D3', kansi: MAA });

    // ---------- 1–2: perustukset ----------
    const HAUD = { haudattu: true, kerros: 1 };
    let pohja;
    kerros = 2;
    if (d.perustus === 'kellari') {
      const b = -n.bD, SISA = { sisa: [0, b / 2, 0] };
      ltk(x0 - .3, x1 + .3, b - .65, b - .3, z0 - .3, z1 + .3, Object.assign({ kansi: SORA }, HAUD));
      ltk(x0, x1, b - .3, b, z0, z1, Object.assign({ vari: BET, yla: '#DAD5CC', kansi: BETK }, SISA));
      keha(x0, x1, z0, z1, b, n.fH - .3, t, { vari: '#E2DED6', ulko: BET, kansi: BETK, kuori: true }, SISA);
      keha(x0 - .2, x1 + .2, z0 - .2, z1 + .2, b - .35, b, t + .4, Object.assign({ kansi: BETK }, HAUD));
      ltk(x0, x1, n.fH - .3, n.fH, z0, z1, { vari: BET, yla: PUU, kansi: BETK, kerros: 3 });
      pohja = b - .2;
      // Kellarin sisältö: lämmitys / varastot
      if (d.K === 'yhtio') {
        ltk(x1 - t - 1.6, x1 - t - .2, b, b + 1.8, z0 + t + .1, z0 + t + .9, { vari: '#E9E6E0', yla: '#F3F1EC', kansi: '#D9D4CA' });
        for (let x = x0 + t + .3; x < -1; x += 1.6) ltk(x, x + .06, b, b + 2.1, z0 + t, z0 + t + 2.2, { vari: '#CFC9BF' });
        ltk(x0 + t, -1.2, b, b + 2.1, z0 + t + 2.2, z0 + t + 2.26, { vari: '#CFC9BF' });
      } else {
        ltk(x0 + t + .3, x0 + t + 1.1, b, b + 1.6, z0 + t + .2, z0 + t + .9, { vari: '#E9E6E0', yla: '#F3F1EC', kansi: '#D9D4CA' });
        ltk(x0 + t + 1.4, x0 + t + 3.2, b, b + 1.9, z0 + t, z0 + t + .45, { vari: '#D9CBB2' });
      }
    } else if (d.perustus === 'rossi') {
      const sok = keha(x0, x1, z0, z1, -.9, n.fH - .3, .25, { vari: BET, kansi: BETK, kuori: true }, HAUD);
      keha(x0 - .15, x1 + .15, z0 - .15, z1 + .15, -1.15, -.9, .55, Object.assign({ kansi: BETK }, HAUD));
      // Tuuletusaukot sokkelissa
      const aukko = n.fH * .45;
      for (let x = x0 + 1.4; x < x1 - 1; x += 2.6) {
        ltk(x, x + .32, aukko, aukko + .16, z0 - .02, z0 + .27, { vari: TUMMA, kansi: TUMMA, isa: sok[1] });
        ltk(x, x + .32, aukko, aukko + .16, z1 - .27, z1 + .02, { vari: TUMMA, kansi: TUMMA, isa: sok[0] });
      }
      ltk(x0 + .25, x1 - .25, 0, .04, z0 + .25, z1 - .25, { vari: '#CFC8BC', yla: SORA, bias: -.5 });
      ltk(x0, x1, n.fH - .3, n.fH, z0, z1, { vari: PUU, yla: PUU, ulko: fasadi, kansi: ERISTE, kerros: 3 });
      pohja = -1.1;
    } else {
      ltk(x0 - .1, x1 + .1, -.75, -.4, z0 - .1, z1 + .1, Object.assign({ kansi: SORA }, HAUD));
      ltk(x0 + t, x1 - t, -.4, -.15, z0 + t, z1 - t, Object.assign({ kansi: ERISTE }, HAUD));
      const sokYla = n.fH - (n.fH - .05) * n.vale;
      keha(x0, x1, z0, z1, -.9, sokYla, t, { vari: BET, kansi: BETK, kuori: true }, HAUD);
      maaLtk(x0 + t, x1 - t, -.15, n.fH, z0 + t, z1 - t, { vari: BET, yla: PUU, kansi: BETK, kerros: 3 }, HAUD);
      if (n.vale > .02) {   // valesokkeli: ohut betonilevy puurungon edessä
        keha(x0 - .06, x1 + .06, z0 - .06, z1 + .06, sokYla, sokYla + (n.fH + .05 - sokYla), .06, { vari: BET, kansi: BETK, kuori: true, bias: .2 });
      }
      pohja = -.95;
    }
    // Salaojat perustusten vierellä (vain leikkauspinnassa)
    keha(x0 - .65, x1 + .65, z0 - .65, z1 + .65, pohja - .08, pohja + .08, .16, Object.assign({ kansi: '#4E5562' }, HAUD));

    // ---------- Kerrokset ----------
    const ikkuna = (sivu, keski, lev, ya, yb, seina) => {
      if (!seina) return;
      const o = { vari: IKK, kansi: IKK, isa: seina }, a = keski - lev / 2, b = keski + lev / 2;
      if (sivu === 'z0') ltk(a, b, ya, yb, z0 - .03, z0 + t + .03, o);
      if (sivu === 'z1') ltk(a, b, ya, yb, z1 - t - .03, z1 + .03, o);
      if (sivu === 'x0') ltk(x0 - .03, x0 + t + .03, ya, yb, a, b, o);
      if (sivu === 'x1') ltk(x1 - t - .03, x1 + .03, ya, yb, a, b, o);
    };
    const SIVU = { z1: 0, z0: 1, x0: 2, x1: 3 };
    // Märkätila nurkkaan (xa…xb, za…zb): väliseinät, laatoitus, amme ja allas
    const markatila = (xa, xb, za, zb, yb, h, seinat, amme) => {
      ltk(xa - .1, xb, yb, yb + h, zb, zb + .1, { vari: VALK, kansi: '#E4DED3' });
      ltk(xa - .1, xa, yb, yb + h, za, zb, { vari: VALK, kansi: '#E4DED3' });
      ltk(xa, xb, yb, yb + .03, za, zb, { vari: LAATTA, kerros: kerros - 1, bias: .1 });
      if (seinat) {
        ltk(xa, xb, yb, yb + h * .92, za, za + .02, { vari: LAATTA, isa: seinat[1] });
        ltk(xb - .02, xb, yb, yb + h * .92, za, zb, { vari: LAATTA, isa: seinat[3] });
      }
      if (amme) ltk(xb - 1.7, xb, yb, yb + .55, za, za + .75, { vari: '#FFFFFF', yla: '#EEF3F5', kansi: '#E6ECEE' });
      else ltk(xb - .95, xb, yb, yb + 2.0, za, za + .95, { vari: '#E8F0F3', kansi: '#CFDCE1' });
      ltk(xa + .15, xa + .75, yb + .55, yb + .85, za, za + .5, { vari: '#FFFFFF', kansi: '#E6ECEE' });
      return [(xa + xb) / 2, yb + .9, (za + zb) / 2];
    };
    const sauna = (xa, xb, za, zb, yb, h) => {
      ltk(xa - .1, xb, yb, yb + h, zb, zb + .1, { vari: '#E7D3B3', kansi: '#D7C3A3' });
      ltk(xa - .1, xa, yb, yb + h, za, zb, { vari: '#E7D3B3', kansi: '#D7C3A3' });
      ltk(xa, xb, yb + 1.0, yb + 1.08, za, za + .65, { vari: LAUDE });
      ltk(xa, xb, yb + .5, yb + .58, za + .65, za + 1.0, { vari: LAUDE });
      ltk(xa + .15, xa + .6, yb, yb + .85, zb - .6, zb - .15, { vari: TUMMA, kansi: TUMMA });
    };
    const keittio = (xa, xb, za, yb) => {
      ltk(xa, xb, yb, yb + .9, za, za + .6, { vari: '#F3F1EC', yla: '#B8B2A8', kansi: '#E2DDD3' });
      ltk(xa, xb, yb + 1.5, yb + 2.2, za, za + .35, { vari: '#F3F1EC', kansi: '#E2DDD3' });
    };
    const sohva = (xa, za, yb) => {
      ltk(xa, xa + 2.2, yb, yb + .42, za, za + .9, { vari: '#9AA3AE', kansi: '#8A939E' });
      ltk(xa, xa + 2.2, yb + .42, yb + .8, za + .7, za + .9, { vari: '#9AA3AE', kansi: '#8A939E' });
    };
    const poyta = (xa, xb, za, zb, yb) => {
      ltk((xa + xb) / 2 - .1, (xa + xb) / 2 + .1, yb, yb + .72, (za + zb) / 2 - .1, (za + zb) / 2 + .1, { vari: TUMMA });
      ltk(xa, xb, yb + .72, yb + .76, za, zb, { vari: '#D9C7A6', kansi: '#C9B48F' });
    };
    const sanky = (xa, za, yb, lev = 1.6) => {
      ltk(xa, xa + lev, yb, yb + .5, za, za + 2.0, { vari: '#FFFFFF', yla: '#F1EEE8', kansi: '#E8E3DA' });
      ltk(xa, xa + lev, yb, yb + 1.0, za, za + .08, { vari: '#D9C7A6' });
    };
    const valiseina = (xa, xb, za, zb, yb, h) => ltk(xa, xb, yb, yb + h, za, zb, { vari: VALK, kansi: '#E4DED3' });

    let markaP = null, tekP = null, keittioP = null, savuhormi = null;
    const hormi = d.K !== 'yhtio' && vanha;
    const hx = d.K === 'rivi' ? -W / 3 + .3 : 0;             // hormin paikka
    tasot.forEach(({ yb, h }, i) => {
      const katto15 = i === N - 1 && d.kerr === '15';
      if (i > 0) { kerros = 3 + 2 * i; ltk(x0, x1, yb - .3, yb, z0, z1, { vari: VALK, ulko: fasadi, yla: PUU, kansi: d.K === 'yhtio' ? BETK : ERISTE }); }
      kerros = 4 + 2 * i;
      const wy0 = i === 0 && d.perustus === 'laatta' ? n.fH - (n.fH - .05) * n.vale : yb;
      const seinat = keha(x0, x1, z0, z1, wy0, yb + h, t, { vari: VALK, ulko: fasadi, kansi: ERISTE, kuori: true });
      if (i === 0 && n.vale > .02) {      // alajuoksu lattiapinnan alapuolella = riskikohta
        const juoksu = keha(x0 + .06, x1 - .06, z0 + .06, z1 - .06, wy0, wy0 + .15, t - .12, { vari: RISKI, kansi: RISKI });
        juoksu.forEach((k, j) => { if (k && seinat[j]) k.o.isa = seinat[j]; });
      }
      const iy = [yb + .9, yb + Math.min(h - .4, 2.15)];
      const ikk = (lista) => !katto15 && lista.forEach(([s, c, l]) => ikkuna(s, c, l, iy[0], iy[1], seinat[SIVU[s]]));
      // Hormi ja tulisija (painovoimainen ilmanvaihto)
      if (hormi) ltk(hx - .35, hx + .35, yb - (i ? .3 : 0), yb + h, -.55, .15, { vari: '#CDB9A4', kansi: '#B08F75' });
      if (hormi && i === 0) ltk(hx - .55, hx + .55, yb, yb + 1.2, .15, .75, { vari: '#CDB9A4', yla: '#B8A48E', kansi: '#B08F75' });

      if (d.K === 'okt') {
        if (i === 0) {
          const xa = x1 - t - 2.4, za = z0 + t + 2.2, xs = xa - 2.0;
          markaP = markatila(xa, x1 - t, z0 + t, za, yb, h, seinat, true);
          sauna(xs, xa - .1, z0 + t, za, yb, h);
          keittio(x0 + t, x0 + t + 2.6, z0 + t, yb);
          keittioP = [x0 + t + 1.3, yb + .1, z0 + t + 1.0];
          ltk(xs - 1.0, xs - .2, yb, yb + 1.9, z0 + t, z0 + t + .7, { vari: '#ECEAE5', kansi: '#DAD5CC' });
          tekP = [xs - .6, yb + 1.2, z0 + t + .35];
          poyta(x0 + 1.6, x0 + 3.2, -.3, .7, yb);
          sohva(x0 + t + .3, z1 - t - 1.9, yb);
          valiseina(xs - .2, x1 - t, z1 - t - 3.0, z1 - t - 2.9, yb, h);
          sanky(x1 - t - 2.1, z1 - t - 2.2, yb);
          ikk([['z0', -1.4, 1.3], ['z1', -3.0, 1.4], ['z1', -.6, 1.0], ['z1', 2.6, 1.6], ['x0', .6, 1.4], ['x1', 1.6, 1.2]]);
        } else if (katto15) {
          valiseina(.4, .5, z0 + 1.4, z1 - 1.4, yb, 2.3);
          sanky(x0 + t + .5, -1.0, yb);
          markatila(x1 - t - 2.2, x1 - t, -1.6, .2, yb, 2.3, null, false);
        } else {
          const xa = x1 - t - 2.4, za = z0 + t + 2.2;
          markatila(xa, x1 - t, z0 + t, za, yb, h, seinat, false);
          valiseina(.4, .5, z0 + t, z1 - t - 1.5, yb, h);
          sanky(x0 + t + .4, z0 + t, yb);
          sanky(x0 + t + .4, z1 - t - 2.1, yb, 1.0);
          ikk([['z0', -2.6, 1.2], ['z1', -2.6, 1.2], ['z1', 1.6, 1.4], ['x0', 0, 1.2], ['x1', 1.6, 1.0]]);
        }
      } else if (d.K === 'rivi') {
        const U = W / 3;
        [-1, 0, 1].forEach(u => {
          const xc = u * U, xa = xc + .5, xb = xc + U / 2 - .12;
          const p = markatila(xa, xb, z0 + t, z0 + t + 2.1, yb, h, u === 1 ? seinat : null, false);
          if (u === 1) markaP = p;
          keittio(xc - U / 2 + .15, xc - U / 2 + 2.4, z0 + t, yb);
          if (u === 0) keittioP = [xc - U / 2 + 1.2, yb + .1, z0 + t + 1.0];
          sohva(xc - U / 2 + .4, z1 - t - 1.9, yb);
          ikk([['z0', xc - 1.6 + .6, 1.1], ['z1', xc - 1.4, 1.4], ['z1', xc + 1.5, 1.0]]);
        });
        [-U / 2, U / 2].forEach(xf => ltk(xf - .12, xf + .12, yb, yb + h, z0 + t, z1 - t, { vari: '#DCD7CE', kansi: BETK }));
        tekP = [U / 2 + .6, yb + 1.2, z0 + t + .3];
        ltk(U / 2 + .15, U / 2 + .9, yb, yb + 1.9, z0 + t, z0 + t + .6, { vari: '#ECEAE5', kansi: '#DAD5CC' });
        ikk([['x0', 0, 1.2], ['x1', 1.5, 1.2]]);
      } else if (d.K === 'mokki') {
        const xa = x1 - t - 1.8, za = z0 + t + 2.0;
        markaP = markatila(xa, x1 - t, z0 + t, za, yb, h, seinat, false);
        sauna(xa - 1.9, xa - .1, z0 + t, za, yb, h);
        keittio(x0 + t, x0 + t + 2.0, z0 + t, yb);
        keittioP = [x0 + t + 1.0, yb + .1, z0 + t + 1.0];
        tekP = [x0 + t + .5, yb + 1.0, z0 + t + 2.6];
        poyta(x0 + .9, x0 + 2.3, .2, 1.1, yb);
        ikk([['z0', -1.6, 1.0], ['z1', -1.8, 2.2], ['z1', 1.6, 1.2], ['x0', .4, 1.2], ['x1', 1.4, .8]]);
      } else {
        // Kerrostalo: kaksi asuntoa kerroksessa, märkätilat keskellä, parvekkeet oikealla
        ltk(-.12, .12, yb, yb + h, z0 + t, z1 - t, { vari: '#DCD7CE', kansi: BETK });
        const p = markatila(.12 + .2, 2.6, z0 + t, z0 + t + 2.2, yb, h, null, false);
        markatila(-2.6, -.32, z0 + t, z0 + t + 2.2, yb, h, null, false);
        if (i === 1) markaP = p;
        if (i === 0) keittioP = [x0 + t + 1.4, yb + .1, z0 + t + 1.0];
        keittio(x0 + t, x0 + t + 2.8, z0 + t, yb);
        keittio(x1 - t - 2.8, x1 - t, z0 + t, yb);
        sohva(x0 + t + .5, z1 - t - 1.9, yb);
        if (i < N) {
          ltk(x1, x1 + 1.5, yb - .25, yb - .05, -2.2, 1.6, { vari: BET, yla: '#D6D1C8', kansi: BETK });
          ltk(x1 + 1.42, x1 + 1.5, yb - .05, yb + 1.05, -2.2, 1.6, { vari: '#C9D8DE', kansi: '#AFC1C8' });
        }
        ikk([['z0', -3.6, 1.2], ['z0', 3.6, 1.2], ['z1', -6, 1.6], ['z1', -2.5, 1.6], ['z1', 2.5, 1.6], ['z1', 6, 1.6], ['x0', -2.5, 1.4], ['x0', 2.5, 1.4], ['x1', -.3, 1.0], ['x1', 3.5, 1.4]]);
      }
    });

    // ---------- Yläpohja ja vesikatto ----------
    let yr;
    if (d.K === 'yhtio') {
      kerros = 3 + 2 * N;
      ltk(x0, x1, yt, yt + .5, z0, z1, { vari: BET, ulko: fasadi, yla: KATTO, kansi: ERISTE, kuori: true });
      kerros = KATTOK;
      keha(x0, x1, z0, z1, yt + .5, yt + 1.0, t, { vari: '#E2DED6', ulko: fasadi, yla: '#8A8F98', kansi: BETK, kuori: true });
      ltk(-3.5, -.5, yt + .5, yt + 2.6, z0 + 1.2, z0 + 3.8, { vari: '#E4E0D8', yla: '#8A8F98', kansi: BETK });
      yr = yt + 2.6;
    } else {
      const e = .5, rt = .35, harja = yt + D / 2 * tn;
      yr = harja + rt;
      if (d.kerr !== '15') {
        kerros = 3 + 2 * N;
        ltk(x0 + t, x1 - t, yt - .25, yt, z0 + t, z1 - t, { vari: VALK, yla: '#E8E2D6', kansi: ERISTE });
        const zi = Math.max(1, Math.min(D / 2 - t, D / 2 - .32 / Math.max(tn, .05) - .05));
        ltk(x0 + t, x1 - t, yt, yt + .3, -zi, zi, { vari: '#F2DCA4', yla: '#F2DCA4', kansi: ERISTE });
      }
      kerros = KATTOK;
      [1, -1].forEach(sg => prisma([[sg * (D / 2 + e), yt - e * tn], [0, harja], [0, harja + rt], [sg * (D / 2 + e), yt - e * tn + rt]], x0 - e, x1 + e,
        { vari: '#E6D9C0', yla: KATTO, kansi: ERISTE, kuori: true }));
      const kolmio = [[z0, yt], [z1, yt], [0, harja]];
      prisma(kolmio, x0, x0 + t, { vari: VALK, ulko: fasadi, kansi: ERISTE, kuori: true });
      prisma(kolmio, x1 - t, x1, { vari: VALK, ulko: fasadi, kansi: ERISTE, kuori: true });
      if (d.K === 'rivi') [-W / 6, W / 6].forEach(xf => prisma([[z0 + t, yt], [z1 - t, yt], [0, harja - .05]], xf - .12, xf + .12, { vari: '#DCD7CE', kansi: BETK }));
      if (hormi) { ltk(hx - .35, hx + .35, yt - (d.kerr === '15' ? 0 : .3), yr + .8, -.55, .15, { vari: '#CDB9A4', yla: TUMMA, kansi: '#B08F75' }); savuhormi = [hx, yr + .8, -.2]; }
    }

    // ---------- Ilmanvaihto ----------
    let ivP, ivNimi, ivTeksti;
    if (d.K === 'yhtio') {
      ivP = [-2, yt + 2.6, z0 + 2.5]; ivNimi = 'Ilmanvaihto ja konehuone';
      ivTeksti = 'Konehuoneen laitteet, huippuimurit ja kanavien läpiviennit. Arvioimme ilmanvaihdon toimivuutta asunnoissa aistinvaraisesti ja kirjaamme puhdistus- ja säätötarpeet.';
    } else if (d.vuosi === 'v00') {
      if (d.kerr === '15') { const yb = tasot[N - 1].yb; ltk(x1 - t - 1.4, x1 - t - .2, yb, yb + .8, -.7, .3, { vari: '#ECEAE5', yla: '#F5F3EF', kansi: '#DAD5CC', kerros: KATTOK }); ivP = [x1 - t - .8, yb + .8, -.2]; }
      else {
        ltk(.9, 2.2, yt + .3, yt + 1.0, -1.5, -.5, { vari: '#ECEAE5', yla: '#F5F3EF', kansi: '#DAD5CC' });
        ltk(1.45, 1.65, yt + 1.0, yr + .3, -1.1, -.9, { vari: '#B9BDC4', kansi: '#9DA2AA' });
        ivP = [1.5, yt + 1.0, -1.0];
      }
      ivNimi = 'Ilmanvaihtokone';
      ivTeksti = 'Lämmöntalteenottokoneen kunto, suodattimet ja huoltohistoria sekä kanavien eristys kylmässä ullakkotilassa. Kondenssi eristämättömissä kanavissa on yleinen kosteuslähde.';
    } else if (d.vuosi === 'v99') {
      ltk(1.4, 1.9, yr - .2, yr + .5, -.25, .25, { vari: TUMMA, kansi: TUMMA });
      ivP = [1.65, yr + .5, 0]; ivNimi = 'Koneellinen poisto';
      ivTeksti = 'Huippuimuri, poistoventtiilit ja korvausilman reitit. Puutteellinen korvausilma näkyy alipaineena: ovet vetävät ja kosteus tiivistyy ikkunoihin.';
    } else {
      ivP = savuhormi || [hx, yr, 0]; ivNimi = 'Painovoimainen ilmanvaihto';
      ivTeksti = 'Hormit, hormien pellit ja tulisijojen liitokset. Painovoimainen ilmanvaihto heikkenee kesällä ja tiiviiksi remontoidussa talossa – tarkastamme myös nuohouksen ja hormien kunnon.';
    }

    // ============================================================
    //  TARKASTUSKOHDAT (järjestys = numerointi)
    // ============================================================
    if (d.K === 'yhtio') {
      kohta('katto', 'Tasakatto', [3, yt + .5, z0 + 2], 'Kattokaivot, vedenpoisto, kattohuovan saumat ja läpiviennit. Tasakatto on taloyhtiön tavallisimpia vuotokohtia, joten se tarkastetaan aina huolellisesti.', ['kunto', 'vaur'], true);
      kohta('iv', ivNimi, ivP, ivTeksti, ['kunto', 'ener']);
      kohta('julkisivu', 'Julkisivu ja parvekkeet', [x1 + .75, tasot[2].yb, -.3], 'Betonin rapautuminen, raudoitteiden suojabetoni, parvekelaattojen vedenpoisto ja kaiteiden kiinnitykset. Tarvittaessa suosittelemme julkisivun kuntotutkimusta.', ['kunto', 'vaur']);
      kohta('markatila', 'Märkätilat ja putkistot', markaP, 'Märkätilojen pintakosteus, vedeneristykset ja putkistojen ikä. Havainnot ovat pohja linjasaneerauksen ajoitukselle ja suunnittelulle.', ['kunto', 'kost', 'vaur']);
    } else {
      // Loiva katto vain, kun piirretty katto on oikeasti loiva (1½-kerroksisessa katto on aina jyrkkä)
      const loiva = n.kalt < 20;
      const lisa = loiva ? ' Loivalla katolla vesi poistuu hitaasti, joten läpiviennit ja aluskate tarkastetaan erityisen huolellisesti.' : '';
      // Täppä katon takalappeelle (etupuoli leikataan pois), puoliväliin räystään ja harjan väliin
      kohta('katto', loiva ? 'Loiva vesikatto' : 'Vesikatto', [W * .22, yt + (D / 4) * tn + .35, -D / 4], 'Katteen kunto, läpiviennit, kattoturvatuotteet sekä räystäät ja sadevesijärjestelmä. Katolle noustaan, kun se on turvallista.' + lisa, ['kunto'], loiva);
      kohta('ylapohja', 'Yläpohja', d.kerr === '15' ? [-W * .2, yt + 1.2, -D / 4] : [-1.6, yt + .35, -1.2],
        'Ullakolla tarkastetaan lämmöneristeet, tuuletus, aluskate ja mahdolliset vuoto- ja kosteusjäljet.' + (d.vuosi === 'v59' ? ' Vanhoissa taloissa eristeenä on usein sahanpuru, joka painuu ja voi kerätä kosteutta.' : ''), ['kunto', 'kost']);
      kohta('iv', ivNimi, ivP, ivTeksti, ['kunto', 'ener']);
      kohta('markatila', d.K === 'rivi' ? 'Märkätilat' : 'Märkätilat ja sauna', markaP, 'Vedeneristys, lattiakaadot, kaivot ja läpiviennit. Pintakosteusmittarilla käydään läpi seinät ja lattia – kosteus näkyy usein vasta mittarilla.', ['kunto', 'kost', 'vaur']);
      kohta('ulkoseina', 'Ulkoseinät ja ikkunat', [d.K === 'rivi' ? -W / 3 - 1 : -1.4, n.fH + 1.5, z0 + .1], 'Julkisivu, ikkunoiden ja ovien liittymät, räystäät ja sokkelin korkeus maanpinnasta. Kuntotarkastus on rakenteita rikkomaton; epäselvät kohdat ohjataan rakennetutkimukseen.', ['kunto', 'vaur']);
      if (d.K === 'rivi') kohta('palomuuri', 'Huoneistojen väliseinät', [W / 6, yt + 1, 0], 'Palomuurin jatkuminen vesikattoon asti ja liittymien tiiviys. Puutteet vaikuttavat sekä paloturvallisuuteen että ääneneristykseen.', ['kunto']);
    }
    // Alapohja perustustavan mukaan
    if (d.perustus === 'kellari') kohta('alapohja', 'Kellarin seinät ja lattia', [d.K === 'yhtio' ? 1 : 1.2, -n.bD * .5, z0 + .5],
      'Maanvastaiset seinät ja lattia ovat alttiita kapillaari- ja valumavedelle. Mittaamme pintakosteudet ja arvioimme vedeneristyksen ja salaojituksen toimivuutta.' + (vanha ? ' Vanhoissa kellareissa vedeneristys puuttuu usein kokonaan.' : ''), ['kunto', 'kost', 'vaur'], vanha);
    else if (d.perustus === 'rossi') kohta('alapohja', 'Rossipohja', [1.6, n.fH * .4, z0 * .5],
      'Ryömintätilan tuuletus, maapohjan kosteus ja puurakenteiden kunto. Tarkastamme tilan luukusta ja mittaamme ilman suhteellisen kosteuden; mikrobivauriot ovat rossipohjissa yleisiä.', ['kunto', 'kost', 'vaur'], vanha);
    else kohta('alapohja', 'Maanvarainen laatta', [1.6, n.fH, z0 * .5],
      'Lattiapinnoitteiden alta mitataan kosteutta erityisesti märkätilojen vierestä ja ulkoseinien läheltä. Kapillaarikatko ja eristys laatan alla ratkaisevat, nouseeko maaperän kosteus rakenteisiin.', ['kunto', 'kost']);
    if (d.perustus === 'laatta' && (d.vuosi === 'v79' || d.vuosi === 'v99')) kohta('vale', 'Valesokkeli', [x1 - t / 2, .14, -D / 4],
      'Valesokkelissa puurungon alajuoksu on lattiapinnan alapuolella, maanpinnan tuntumassa ohuen betonilevyn takana. Rakenne on 1960–80-lukujen tunnetuin kosteusvaurioiden paikka – suosittelemme rakennetutkimusta.', ['kunto', 'vaur'], true);
    kohta('salaoja', 'Salaojat ja sadevedet', [x1 + .7, 0, z0 - .7], 'Maanpinnan kallistukset, syöksytorvet ja sadevesikaivot. Salaojien kuntoa arvioidaan iän ja tarkastuskaivojen perusteella.' + (vanha ? ' Yli 40 vuotta vanhat salaojat ovat usein käyttöikänsä lopussa.' : ''), ['kunto'], vanha);
    if (ennen94) kohta('asbesti', 'Asbesti ja haitta-aineet', keittioP || markaP, 'Ennen vuotta 1994 rakennettujen tai remontoitujen tilojen laattojen liimoissa, tasoitteissa, kiteissä ja eristeissä voi olla asbestia. Kartoitus tehdään ennen remonttia – otamme näytteet tarvittaessa.', ['vaur'], true);
    kohta('energia', 'Lämmitys ja energia', d.perustus === 'kellari' ? (d.K === 'yhtio' ? [x1 - t - .9, -n.bD + 1.0, z0 + t + .5] : [x0 + t + .7, -n.bD + 1.0, z0 + t + .55]) : (tekP || markaP),
      'Lämmitysjärjestelmä, käyttövesi, eristystaso ja ikkunat. Energiatodistus tarvitaan myynti- ja vuokrailmoituksiin, ja se on voimassa 10 vuotta.', ['ener', 'kunto']);

    const ylin = Math.max(yr + (hormi ? .8 : .5), yt + 1);
    return { K, kohdat, mitat: { R: Math.hypot(W / 2 + mR, D / 2 + mR), ylin, alin: eB } };
  }

  // Normaalit, tahkojen värit ja varjostus lasketaan kerran mallia kohden (valo on kiinteä)
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function valmistele(malli, n) {
    const { W, D } = n;
    for (const k of malli.K) {
      const c = [0, 1, 2].map(a => k.v.reduce((s, p) => s + p[a], 0) / k.v.length);
      k.n = []; k.vari = [];
      k.f.forEach(f => {
        let nx = 0, ny = 0, nz = 0, fc = [0, 0, 0];
        f.forEach((j, i) => {
          const a = k.v[j], b = k.v[f[(i + 1) % f.length]];
          nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
          fc[0] += a[0] / f.length; fc[1] += a[1] / f.length; fc[2] += a[2] / f.length;
        });
        let p = Math.hypot(nx, ny, nz) || 1; nx /= p; ny /= p; nz /= p;
        if (nx * (fc[0] - c[0]) + ny * (fc[1] - c[1]) + nz * (fc[2] - c[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const o = k.o;
        let v = o.vari || '#DDDDDD';
        if (ny > .3 && o.yla) v = o.yla;
        else if (ny < -.3 && o.ala) v = o.ala;
        else if (o.ulko && Math.abs(ny) <= .3 && nx * fc[0] + nz * fc[2] > 0 && (Math.abs(fc[0]) > W / 2 - .02 || Math.abs(fc[2]) > D / 2 - .02)) v = o.ulko;
        if (v[0] === '#') {
          v = paperi(v);
          const s = .86 + .16 * Math.max(0, nx * VALO[0] + ny * VALO[1] + nz * VALO[2]);
          v = `rgb(${rgb(v).map(x => Math.min(255, Math.round(x * s))).join(',')})`;
        }
        // kellari: vain sisäpinnat ja yläpinnat
        k.n.push([nx, ny, nz]);
        k.vari.push(v);
        if (o.sisa) (k.sisaOk = k.sisaOk || []).push(ny > .5 || nx * (o.sisa[0] - fc[0]) + ny * (o.sisa[1] - fc[1]) + nz * (o.sisa[2] - fc[2]) > 0);
      });
    }
    return malli;
  }

  // ============================================================
  //  KÄYTTÖLIITTYMÄ
  // ============================================================
  const ryhma = (id, otsikko, vaihtoehdot) => `
      <div class="lk-ryhma" data-ryhma="${id}"><span class="lk-ryhma-nimi">${otsikko}</span>
        <div class="lk-pillerit">${vaihtoehdot.map(o => `<button type="button" class="lk-pilleri" data-arvo="${o.id}" aria-pressed="false">${o.nimi}</button>`).join('')}</div>
      </div>`;
  const nuoli = suunta => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${suunta < 0
    ? '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4.5h4.5"/>' : '<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v4.5h-4.5"/>'}</svg>`;
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
        <svg class="lk-svg" role="img" aria-label="Talon leikkauskuva, jossa numeroidut tarkastuskohdat">
          <defs>
            <pattern id="lk-maa" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#F1ECE3"/><line x1="0" y1="0" x2="0" y2="7" stroke="#D6CEBF" stroke-width="1"/></pattern>
            <pattern id="lk-sora" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#EEE9E0"/><circle cx="1.8" cy="1.8" r=".9" fill="#C9C0B1"/><circle cx="4.6" cy="4.4" r=".7" fill="#C9C0B1"/></pattern>
            <pattern id="lk-eriste" width="8" height="5" patternUnits="userSpaceOnUse"><rect width="8" height="5" fill="#FBF5E8"/><path d="M0 2.5Q2 0 4 2.5T8 2.5" fill="none" stroke="#DCCDB0" stroke-width=".7"/></pattern>
          </defs>
          <g class="lk-malli"></g>
        </svg>
        <div class="lk-pisteet"></div>
        <div class="lk-ohjaimet">
          <button type="button" class="lk-kierto" data-kierto="-1" aria-label="Käännä vasemmalle">${nuoli(-1)}</button>
          <span class="lk-vihje">Pyöritä vetämällä</span>
          <button type="button" class="lk-kierto" data-kierto="1" aria-label="Käännä oikealle">${nuoli(1)}</button>
        </div>
      </div>
      <div class="lk-tiedot">
        <div class="lk-kortti" aria-live="polite"></div>
        <ol class="lk-lista"></ol>
      </div>
    </div>`;
  const $ = s => juuri.querySelector(s);
  const svg = $('.lk-svg'), ryhmaMalli = $('.lk-malli'), pisteet = $('.lk-pisteet'), nayttamo = $('.lk-nayttamo');
  const lista = $('.lk-lista'), kortti = $('.lk-kortti');

  // ---------- Näkymän tila ----------
  let d = diskreetti(tila), nT = tavoite(tila), n = Object.assign({}, nT);
  let malli = valmistele(rakenna(d, n), n), muuttui = false;
  let th = .55, ph = .27, thT = null, vel = 0, veto = null, kosketty = vahenna, nakyvissa = true, kay = false;
  let heilunta = 0, heiluntaKeski = th, edAika = 0;
  let koko = { w: 1, h: 1 };
  const nakyy = p => -Math.sin(th) * p[0] + Math.cos(th) * p[2] <= LEIK - .05;

  // ---------- Piirto ----------
  function piirra() {
    const s = Math.sin(th), c = Math.cos(th), sf = Math.sin(ph), cf = Math.cos(ph);
    const V = [-s * cf, sf, c * cf];
    const X = p => (p[0] * c + p[2] * s) * S;
    const Y = p => -(p[1] * cf - (-p[0] * s + p[2] * c) * sf) * S;
    const et = p => -s * p[0] + c * p[2] - LEIK;          // > 0 = poistettavalla puolella
    const syv = p => p[0] * V[0] + p[1] * V[1] + p[2] * V[2];
    const pt = pts => pts.map(p => X(p).toFixed(1) + ',' + Y(p).toFixed(1)).join(' ');
    const leikkaa = (pts, merkki) => {
      const ulos = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], da = merkki * et(a), db = merkki * et(b);
        if (da <= 0) ulos.push(a);
        if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const u = da / (da - db); ulos.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]); }
      }
      return ulos;
    };
    const osat = [], haamut = [];
    for (const k of malli.K) {
      const o = k.o, e = k.v.map(et);
      const mn = Math.min(...e), mx = Math.max(...e);
      k.avain = null;
      if (mn >= 0) {
        if (o.kuori) k.f.forEach((f, i) => { const nn = k.n[i]; if (nn[0] * V[0] + nn[1] * V[1] + nn[2] * V[2] > .05) haamut.push(pt(f.map(j => k.v[j]))); });
        continue;
      }
      const leikattu = mx > 0;
      let summa = 0, lkm = 0, html = '';
      if (!o.haudattu) k.f.forEach((f, i) => {
        const nn = k.n[i];
        if (nn[0] * V[0] + nn[1] * V[1] + nn[2] * V[2] <= 1e-4) return;
        if (k.sisaOk && !k.sisaOk[i]) return;
        let pts = f.map(j => k.v[j]);
        if (leikattu) pts = leikkaa(pts, 1);
        if (pts.length < 3) return;
        html += `<polygon points="${pt(pts)}" fill="${k.vari[i]}"/>`;
        pts.forEach(p => { summa += syv(p); lkm++; });
        if (leikattu && o.kuori) { const h = leikkaa(f.map(j => k.v[j]), -1); if (h.length > 2) haamut.push(pt(h)); }
      });
      if (leikattu) {
        // Leikkauspinta: särmien ja tason leikkauspisteet kulman mukaan järjestettynä
        const q = [], nahty = new Set();
        k.f.forEach(f => f.forEach((j, i) => {
          const jj = f[(i + 1) % f.length], a = k.v[j], b = k.v[jj], da = e[j], db = e[jj];
          if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
            const u = da / (da - db), p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
            const av = p.map(x => x.toFixed(3)).join();
            if (!nahty.has(av)) { nahty.add(av); q.push(p); }
          }
        }));
        if (q.length > 2) {
          const u = p => p[0] * c + p[2] * s;
          const cu = q.reduce((a, p) => a + u(p), 0) / q.length, cy = q.reduce((a, p) => a + p[1], 0) / q.length;
          q.sort((a, b) => Math.atan2(a[1] - cy, u(a) - cu) - Math.atan2(b[1] - cy, u(b) - cu));
          const kansi = o.kansi && o.kansi[0] === '#' ? paperi(o.kansi) : (o.kansi || k.vari[0]);
          html += `<polygon class="k" points="${pt(q)}" fill="${kansi}"/>`;
          q.forEach(p => { summa += syv(p); lkm++; });
        }
      }
      if (!html) continue;
      k.avain = summa / lkm + (o.bias || 0);
      let kerros = o.kerros, avain = k.avain;
      if (o.isa && o.isa.avain != null) { kerros = o.isa.o.kerros; avain = o.isa.avain + .001; }
      osat.push({ kerros, avain, html });
    }
    osat.sort((a, b) => a.kerros - b.kerros || a.avain - b.avain);
    ryhmaMalli.innerHTML = osat.map(o => o.html).join('') + `<g class="lk-haamu">${haamut.map(p => `<polygon points="${p}"/>`).join('')}</g>`;

    // Rajaus: koko mallin ympyrä ja korkeus (ei hypi pyöritettäessä)
    const { R, ylin, alin } = malli.mitat, pad = 14;
    const ylos = ylin * cf + R * sf, alas = alin * cf - R * sf;
    const vb = [-R * S - pad, -ylos * S - pad, 2 * R * S + 2 * pad, (ylos - alas) * S + 2 * pad];
    svg.setAttribute('viewBox', vb.map(v => v.toFixed(1)).join(' '));
    const m = Math.min(koko.w / vb[2], koko.h / vb[3]), ox = (koko.w - vb[2] * m) / 2, oy = (koko.h - vb[3] * m) / 2;
    pisteet.querySelectorAll('[data-kohta]').forEach(b => {
      const kk = malli.kohdat.find(x => x.id === b.dataset.kohta);
      if (!kk || !kk.p) return;
      const px = ox + (X(kk.p) - vb[0]) * m, py = oy + (Y(kk.p) - vb[1]) * m;
      b.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      b.classList.toggle('piilossa', !nakyy(kk.p));
      b.classList.toggle('vasen', px > koko.w * .62);
    });
  }

  // ---------- Kohdat: numerot kuvassa, lista ja kortti ----------
  const palveluNimi = id => (L.palvelut.find(p => p.id === id) || {}).nimi || id;
  function paivitaKohdat() {
    const kohdat = malli.kohdat.filter(k => k.p);
    if (!kohdat.find(k => k.id === valittu)) valittu = (kohdat.find(k => k.varoitus) || kohdat[0]).id;
    const tunniste = kohdat.map(k => k.id + k.nimi + k.varoitus).join('|');
    if (tunniste !== pisteet.dataset.tunniste) {
      pisteet.dataset.tunniste = tunniste;
      pisteet.innerHTML = kohdat.map((k, i) => `<button type="button" class="lk-piste${k.varoitus ? ' varoitus' : ''}" data-kohta="${k.id}" aria-label="${i + 1}. ${k.nimi}"><span class="lk-piste-nro">${i + 1}</span><span class="lk-piste-nimi">${k.nimi}</span></button>`).join('');
      lista.innerHTML = kohdat.map((k, i) => `<li><button type="button" class="lk-rivi${k.varoitus ? ' varoitus' : ''}" data-kohta="${k.id}"><span class="lk-rivi-nro">${i + 1}</span><span>${k.nimi}</span></button></li>`).join('');
    }
    const kk = kohdat.find(k => k.id === valittu), nro = kohdat.indexOf(kk) + 1;
    juuri.querySelectorAll('[data-kohta]').forEach(b => {
      const on = b.dataset.kohta === valittu, kohde = kohdat.find(k => k.id === b.dataset.kohta);
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
    const d0 = diskreetti(tila);
    juuri.querySelectorAll('[data-ryhma]').forEach(r => {
      const id = r.dataset.ryhma, v = lisavalinta(id);
      r.hidden = !!(v && v.kohteet && !v.kohteet.includes(tila.kohde));
      r.querySelectorAll('[data-arvo]').forEach(b => b.setAttribute('aria-pressed', b.dataset.arvo === (id === 'perustus' ? d0.perustus : tila[id])));
    });
  }

  // ---------- Animaatiosilmukka ----------
  function silmukka(aika) {
    const dt = edAika ? Math.min(50, aika - edAika) : 16; edAika = aika;
    let liikkuu = false;
    for (const a in nT) {
      if (Math.abs(nT[a] - n[a]) > .002) { n[a] += (nT[a] - n[a]) * Math.min(1, dt / 90); liikkuu = muuttui = true; }
      else if (n[a] !== nT[a]) { n[a] = nT[a]; muuttui = true; }
    }
    if (muuttui) { malli = valmistele(rakenna(d, n), n); muuttui = false; }
    if (!veto) {
      if (Math.abs(vel) > 2e-4) { th += vel; vel *= Math.pow(.93, dt / 16); liikkuu = true; }
      else if (thT !== null) {
        if (Math.abs(thT - th) > .002) { th += (thT - th) * Math.min(1, dt / 110); liikkuu = true; } else { th = thT; thT = null; }
      } else if (!kosketty) { heilunta += dt / 2600; th = heiluntaKeski + .3 * Math.sin(heilunta); liikkuu = true; }
    }
    piirra();
    if ((liikkuu || veto) && nakyvissa) requestAnimationFrame(silmukka); else { kay = false; edAika = 0; }
  }
  const kaynnista = () => { if (!kay) { kay = true; requestAnimationFrame(silmukka); } };

  // ---------- Tila muuttuu (omat napit tai laskuri) ----------
  function paivita() {
    const uusi = diskreetti(tila), rakenne = uusi.K !== d.K || uusi.kerr !== d.kerr;
    d = uusi; nT = tavoite(tila);
    if (rakenne || vahenna) {
      n = Object.assign({}, nT);
      if (rakenne && !vahenna) { ryhmaMalli.classList.remove('lk-vaihto'); void ryhmaMalli.getBBox; requestAnimationFrame(() => ryhmaMalli.classList.add('lk-vaihto')); }
    }
    malli = valmistele(rakenna(d, n), n);
    paivitaNapit();
    paivitaKohdat();
    piirra();
    kaynnista();
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

  // Kohdan valinta: jos kohta on leikattu pois, malli kääntyy niin, että kohta tulee näkyviin
  juuri.addEventListener('click', e => {
    const b = e.target.closest('[data-kohta]'); if (!b) return;
    valittu = b.dataset.kohta;
    const kk = malli.kohdat.find(k => k.id === valittu);
    if (kk && kk.p && !nakyy(kk.p)) {
      const ok = a => -Math.sin(a) * kk.p[0] + Math.cos(a) * kk.p[2] < -.6;
      for (let dd = .05; dd < Math.PI; dd += .05) {
        if (ok(th + dd)) { thT = th + dd; break; }
        if (ok(th - dd)) { thT = th - dd; break; }
      }
      kosketty = true; vel = 0;
      if (vahenna && thT !== null) { th = thT; thT = null; }
    }
    paivitaKohdat();
    piirra();
    kaynnista();
  });
  juuri.querySelectorAll('[data-kierto]').forEach(b => b.addEventListener('click', () => {
    kosketty = true; vel = 0; thT = (thT ?? th) + (+b.dataset.kierto) * Math.PI / 4;
    if (vahenna) { th = thT; thT = null; piirra(); } else kaynnista();
  }));

  // Pyöritys vetämällä (vaakasuunta; hiirellä myös katselukulma pystysuunnassa)
  nayttamo.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    veto = { x: e.clientX, y: e.clientY, hiiri: e.pointerType === 'mouse' };
    kosketty = true; vel = 0; thT = null;
    nayttamo.setPointerCapture(e.pointerId);
    nayttamo.classList.add('vetaa');
    kaynnista();
  });
  nayttamo.addEventListener('pointermove', e => {
    if (!veto) return;
    const dx = e.clientX - veto.x, dy = e.clientY - veto.y;
    veto.x = e.clientX; veto.y = e.clientY;
    th -= dx * .009; vel = -dx * .009;
    if (veto.hiiri) ph = Math.max(.1, Math.min(.62, ph + dy * .004));
  });
  const lopeta = () => { if (!veto) return; veto = null; nayttamo.classList.remove('vetaa'); kaynnista(); };
  nayttamo.addEventListener('pointerup', lopeta);
  nayttamo.addEventListener('pointercancel', () => { vel = 0; lopeta(); });

  // Koko ja näkyvyys
  const mittaa = () => { const r = nayttamo.getBoundingClientRect(); koko = { w: r.width || 1, h: r.height || 1 }; piirra(); };
  if ('ResizeObserver' in window) new ResizeObserver(mittaa).observe(nayttamo); else addEventListener('resize', mittaa);
  if ('IntersectionObserver' in window) new IntersectionObserver(m => { nakyvissa = m[0].isIntersecting; if (nakyvissa) kaynnista(); }).observe(nayttamo);

  // Aloitus: laskurin valinnat samoiksi kuin kuvassa
  paivitaNapit();
  paivitaKohdat();
  mittaa();
  if (laskuri && laskuri.laskuriTila) tila.palvelut = laskuri.laskuriTila.palvelut.slice();
  kerroLaskurille();
  kaynnista();
};
window.alustaLeikkaus();
