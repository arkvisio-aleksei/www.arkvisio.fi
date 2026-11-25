// ============================================================
//  HAVAINNEKUVA – julkisivupiirros suunnittelulaskuriin.
//  Muuttuu valintojen mukaan: kohdetyyppi, tontti (tasamaa/rinne),
//  kerrokset, rakennusten määrä ja koko.
//  Oranssi = suunniteltava, harmaa = nykyinen / ympäristö.
//  Tutkimuslaskurissa (h.laji = 'tutkimus') piirretään lisäksi
//  perustustapa (laatta / rossipohja / kellari) ja merkit kohtiin,
//  joihin valitut tutkimukset kohdistuvat.
// ============================================================

window.piirraHavainne = function (h) {
  // h = { laji, kohde, m2, vertailu, palvelut, tontti, kerrokset, rakennukset, perustus, vuosi }
  const L = 360, K = 220;
  const rinne = h.tontti === 'rinne';
  const maa = x => rinne ? 118 + x * (64 / L) : 168;            // maanpinnan korkeus kohdassa x
  const koko = Math.max(.8, Math.min(1.3, Math.pow(h.m2 / h.vertailu, .35)));
  const kerroksia = { '1': 1, '15': 1.5, '2': 2 }[h.kerrokset] || 1;
  const KR = 27;                                                 // kerroksen korkeus
  const osat = [];
  let alue = null;                                               // viimeksi piirretyn rakennuksen mitat merkkejä varten
  const p = (pisteet, luokka) => `<polygon class="${luokka}" points="${pisteet.map(q => q.join(',')).join(' ')}"/>`;
  const r = (x, y, w, k, luokka) => `<rect class="${luokka}" x="${x}" y="${y}" width="${w}" height="${k}"/>`;

  // Perustus: rinteessä rakennus nojaa ylärinteeseen ja alarinteeseen jää näkyvä kellari / sokkeli.
  function perustus(x0, x1) {
    const w = x1 - x0, m = maa(x0);
    if (h.perustus === 'laatta') return { taso: m - 6, svg: r(x0 - 2, m - 6, w + 4, 6, 'hv-sokkeli') };
    if (h.perustus === 'rossi') {
      let svg = r(x0, m - 18, w, 18, 'hv-sokkeli');
      for (let x = x0 + 16; x < x1 - 12; x += 32) svg += r(x, m - 11, 9, 4, 'hv-tuuletus');
      return { taso: m - 18, svg };
    }
    if (h.perustus === 'kellari') return { taso: m - 10, svg: r(x0, m - 10, w, 10, 'hv-sokkeli') + r(x0, m, w, 36, 'hv-kellari') + r(x1 - 30, m - 7, 16, 9, 'hv-ikkuna') };
    const taso = m;
    if (!rinne) return { taso, svg: '' };
    let svg = p([[x0, taso], [x1, taso], [x1, maa(x1)], [x0, maa(x0)]], 'hv-sokkeli');
    if (maa(x1) - taso > 18) svg += r(x1 - 30, taso + 5, 16, Math.min(11, maa(x1) - taso - 9), 'hv-ikkuna');
    return { taso, svg };
  }

  function ikkunat(x0, x1, ala, kerrosmaara, luokka = 'hv-ikkuna') {
    let svg = '';
    const leveys = x1 - x0, lkm = Math.max(1, Math.round(leveys / 34));
    for (let k = 0; k < Math.floor(kerrosmaara); k++) {
      const y = ala - KR * (k + 1) + 8;
      for (let i = 0; i < lkm; i++) {
        const x = x0 + (leveys / lkm) * (i + .5) - 7;
        if (k === 0 && i === 0) continue;                       // ovi tulee tähän
        svg += r(x, y, 14, 11, luokka);
      }
    }
    return svg;
  }

  // Harjakattoinen talo (omakotitalo, paritalo)
  function talo(cx, w, kerrosmaara, luokka, kaksiOvea) {
    const x0 = cx - w / 2, x1 = cx + w / 2;
    const { taso, svg: pohja } = perustus(x0, x1);
    const runko = KR * (kerrosmaara === 1.5 ? 1.45 : kerrosmaara);
    const yla = taso - runko, harja = yla - (kerrosmaara === 1.5 ? 42 : 30);
    let svg = pohja;
    svg += r(x0, yla, w, runko, `hv-runko ${luokka}`);
    svg += p([[x0 - 7, yla], [cx, harja], [x1 + 7, yla]], `hv-katto ${luokka}`);
    svg += ikkunat(x0, x1, taso, kerrosmaara, `hv-ikkuna ${luokka}`);
    if (kerrosmaara === 1.5) svg += r(cx - 8, yla - 22, 16, 12, `hv-ikkuna ${luokka}`);
    svg += r(x0 + 12, taso - 22, 12, 22, `hv-ovi ${luokka}`);
    if (kaksiOvea) { svg += `<line class="hv-viiva ${luokka}" x1="${cx}" y1="${yla}" x2="${cx}" y2="${taso}"/>`; svg += r(x1 - 24, taso - 22, 12, 22, 'hv-ovi'); }
    alue = { cx, x0, x1, taso, harja, raysta: yla, puoli: w / 2 + 7 };
    return svg;
  }

  // A-mökki
  function mokki(cx, w, luokka) {
    const x0 = cx - w / 2, x1 = cx + w / 2;
    const { taso, svg: pohja } = perustus(x0 - 4, x1 + 4);
    const korkeus = 52 + w * .32;
    let svg = pohja;
    svg += p([[x0 - 4, taso], [cx, taso - korkeus], [x1 + 4, taso]], `hv-runko ${luokka}`);
    svg += p([[cx - w * .26, taso], [cx, taso - korkeus * .62], [cx + w * .26, taso]], 'hv-lasi');
    svg += `<line class="hv-viiva" x1="${cx}" y1="${taso - korkeus * .62}" x2="${cx}" y2="${taso}"/>`;
    alue = { cx, x0, x1, taso, harja: taso - korkeus, raysta: taso, puoli: w / 2 + 4 };
    return svg;
  }

  // Sauna / piharakennus: pulpettikatto ja savupiippu
  function sauna(cx, w, luokka, piippu = true) {
    const x0 = cx - w / 2, x1 = cx + w / 2;
    const { taso, svg: pohja } = perustus(x0, x1);
    const yla = taso - 30;
    let svg = pohja;
    svg += p([[x0, taso], [x0, yla - 10], [x1, yla], [x1, taso]], `hv-runko ${luokka}`);
    svg += p([[x0 - 5, yla - 11], [x1 + 5, yla - 1]], `hv-viiva ${luokka}`);
    svg += r(x0 + 8, taso - 20, 10, 20, 'hv-ovi');
    if (w > 46) svg += r(x1 - 20, yla + 8, 12, 9, 'hv-ikkuna');
    if (piippu) {
      const px = x0 + w * .62, py = yla - 10 + (10 * .62);
      svg += r(px, py - 14, 7, 14, `hv-runko ${luokka}`);
      svg += `<path class="hv-hoyry" d="M${px + 4} ${py - 18}c-4 -4 4 -6 0 -10s4 -6 0 -10"/>`;
    }
    return svg;
  }

  // Rivitalo: kolme asuntoa, tutkittava keskimmäinen
  function rivitalo(cx, uw) {
    const w = uw * 3, x0 = cx - w / 2, x1 = cx + w / 2;
    const { taso, svg: pohja } = perustus(x0, x1);
    const yla = taso - KR, harja = yla - 24;
    let svg = pohja + p([[x0 - 7, yla], [x0 + 16, harja], [x1 - 16, harja], [x1 + 7, yla]], 'hv-katto hv-vanha');
    for (let i = 0; i < 3; i++) {
      const ux = x0 + i * uw, l = i === 1 ? 'hv-tutkittava' : 'hv-vanha';
      svg += r(ux, yla, uw, KR, `hv-runko ${l}`) + r(ux + 10, taso - 22, 12, 22, `hv-ovi ${l}`) + r(ux + uw - 30, yla + 8, 18, 11, `hv-ikkuna ${l}`);
    }
    const kattoY = (harja + yla) / 2;
    alue = { cx, x0: x0 + uw, x1: x0 + 2 * uw, taso, harja: kattoY, raysta: kattoY, puoli: Infinity };
    return svg;
  }

  // Kerrostalo (taloyhtiö): tasakatto, kellari, kerrosmäärä koon mukaan
  function kerrostalo(cx, w, kerrosmaara) {
    const KK = 19, x0 = cx - w / 2, x1 = cx + w / 2, m = maa(x0), taso = m - 8;
    const yla = taso - KK * kerrosmaara;
    let svg = r(x0, m, w, 36, 'hv-kellari') + r(x0, taso, w, 8, 'hv-sokkeli');
    svg += r(x0, yla, w, KK * kerrosmaara, 'hv-runko hv-tutkittava') + r(x0 - 3, yla - 4, w + 6, 4, 'hv-runko hv-tutkittava');
    const lkm = Math.max(3, Math.round(w / 26));
    for (let k = 0; k < kerrosmaara; k++)
      for (let i = 0; i < lkm; i++) {
        if (k === 0 && i === Math.floor(lkm / 2)) continue;     // ovi
        svg += r(x0 + (w / lkm) * (i + .5) - 5.5, taso - KK * (k + 1) + 5, 11, 9, 'hv-ikkuna');
      }
    svg += r(cx - 7, taso - 16, 14, 16, 'hv-ovi');
    alue = { cx, x0, x1, taso, harja: yla - 4, raysta: yla - 4, puoli: Infinity };
    return svg;
  }

  // Merkki kohtaan, johon tutkimus kohdistuu (kuvake ympyrässä)
  function merkki(x, y, nimi) {
    const kuvake = window.IKONIT ? window.IKONIT(nimi).replace('<svg ', `<svg x="${x - 7}" y="${y - 7}" width="14" height="14" `) : '';
    return `<g class="hv-merkki"><circle cx="${x}" cy="${y}" r="11"/>${kuvake}</g>`;
  }

  function tutkimusMerkit(a, palvelut) {
    if (!a) return '';
    const on = id => palvelut.includes(id);
    const kattoY = x => a.puoli === Infinity ? a.harja : a.harja + Math.abs(x - a.cx) / a.puoli * (a.raysta - a.harja);
    const xo = a.cx + (a.x1 - a.cx) * .55, xv = a.cx - (a.cx - a.x0) * .55;
    let svg = '';
    if (on('pala')) {                                            // mittaviiva rakennuksen alle
      const y = 212, t = `${Math.round(h.m2).toLocaleString('fi-FI').replace(/\s/g, ' ')} m²`;
      svg += `<g class="hv-mitta"><path d="M${a.x0} ${y}H${a.x1}M${a.x0} ${y - 4}v8M${a.x1} ${y - 4}v8"/>`
        + `<rect x="${a.cx - 24}" y="${y - 7}" width="48" height="14"/><text x="${a.cx}" y="${y + 3.5}">${t}</text></g>`;
    }
    if (on('kunto')) svg += merkki(xo, kattoY(xo), 'valvonta') + merkki(a.x0 + 16, a.taso + 3, 'valvonta');
    if (on('ener'))  svg += merkki(xv, kattoY(xv), 'energia');
    if (on('kost'))  svg += merkki(a.x1 - 20, a.taso - 15, 'pisara');
    if (on('vaur'))  svg += merkki(a.cx, a.taso + 9, 'suurennus');
    return svg;
  }

  // Kuusi ympäristöksi
  function kuusi(x, k = 40) {
    const y = maa(x);
    return `<g class="hv-puu"><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 6}"/>${p([[x - k * .28, y - 6], [x, y - k], [x + k * .28, y - 6]], '')}</g>`;
  }

  // ---------- Kohde ----------
  const lisat = Math.max(0, (h.rakennukset || 1) - 1);
  const lisaPaikat = [72, 306, 28, 342].slice(0, lisat);
  let paa = '';
  if (h.laji === 'tutkimus') switch (h.kohde) {
    case 'rivi':  paa = rivitalo(180, 84 * koko); break;
    case 'mokki': paa = mokki(196, 88 * koko, 'hv-tutkittava'); break;
    case 'yhtio': paa = kerrostalo(196, 170 * koko, Math.max(2, Math.min(7, Math.round(h.m2 / 350)))); break;
    default:      paa = talo(196, 118 * koko, kerroksia, 'hv-tutkittava', false);
  }
  else switch (h.kohde) {
    case 'pari':  paa = talo(196, 156 * koko, kerroksia, 'hv-uusi', true); break;
    case 'mokki': paa = mokki(196, 88 * koko, 'hv-uusi'); break;
    case 'sauna': paa = sauna(196, 72 * koko, 'hv-uusi'); break;
    case 'laaj': {
      paa = talo(160, 112, 1, 'hv-vanha', false);
      const x0 = 160 + 56 + 7, w = 58 * koko;
      const { taso, svg } = perustus(x0, x0 + w);
      paa += svg + r(x0, taso - KR - 4, w, KR + 4, 'hv-runko hv-uusi') + r(x0 + w / 2 - 9, taso - KR + 6, 18, 12, 'hv-ikkuna')
        + `<line class="hv-viiva hv-uusi" x1="${x0 - 3}" y1="${taso - KR - 4}" x2="${x0 + w + 3}" y2="${taso - KR - 4}"/>`;
      break;
    }
    case 'korj':  paa = talo(196, 118 * koko, 1.5, 'hv-korjattava', false); break;
    default:      paa = talo(196, 118 * koko, kerroksia, 'hv-uusi', false);
  }
  const merkit = h.laji === 'tutkimus' ? tutkimusMerkit(alue, h.palvelut || []) : '';
  const sivut = lisaPaikat.map((x, i) => sauna(x, 40, 'hv-uusi hv-lisa', i === 0)).join('');
  const puut = [[18, 46], [350, 38], [334, 30]].filter(([x]) => !lisaPaikat.some(l => Math.abs(l - x) < 34)).map(([x, k]) => kuusi(x, k)).join('');

  // Maanpinta ja viivoitus
  const maaViiva = `M0 ${maa(0)} L${L} ${maa(L)}`;
  let viivoitus = '';
  for (let x = 6; x < L; x += 12) viivoitus += `M${x} ${maa(x) + 1} l-7 9 `;
  osat.push(`<path class="hv-maa-tausta" d="${maaViiva} L${L} ${K} L0 ${K}Z"/>`);
  osat.push(`<path class="hv-viivoitus" d="${viivoitus}"/>`);
  osat.push(puut);
  osat.push(`<g class="hv-rakennukset">${sivut}${paa}</g>`);
  osat.push(`<path class="hv-maa" d="${maaViiva}"/>`);
  osat.push(merkit);

  return `<svg class="havainne" viewBox="0 0 ${L} ${K}" role="img" aria-label="Havainnekuva valitusta kohteesta">${osat.join('')}</svg>`;
};
