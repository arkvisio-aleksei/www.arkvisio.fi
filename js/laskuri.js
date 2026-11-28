// ============================================================
//  HINTALASKURI – palvelusivuilla. Käyttäjä valitsee kuvakkeista
//  kohteen ja palvelut, hinta muodostuu hinnaston tuntihinnoista.
//  Tarvitsee: data/hinnasto.js, js/ikonit.js
//  Sivulla: <div data-laskuri="suunnittelu"></div>
//           <div data-tuntihinnat="skol2,skol3"></div>, <ul data-lisakulut></ul>
// ============================================================

(function () {
  const H = window.HINNASTO, ikoni = window.IKONIT;
  const ALV = 1 + H.alv / 100;
  const muotoile = (n, des = 0) => n.toLocaleString('fi-FI', { minimumFractionDigits: des, maximumFractionDigits: des }).replace(/\s/g, ' ');
  const pyorista = (n, tarkkuus) => Math.round(n / tarkkuus) * tarkkuus;
  // Hintaväli; jos ala- ja yläraja ovat samat, näytetään yksi luku.
  const vali = (a, b, t) => { const x = muotoile(pyorista(a, t)), y = muotoile(pyorista(b, t)); return x === y ? x : `${x} – ${y}`; };
  const tunnit = n => muotoile(Math.round(n * 2) / 2, n % 1 && n < 10 ? 1 : 0);

  document.querySelectorAll('[data-laskuri]').forEach(juuri => {
    const L = H.laskurit[juuri.dataset.laskuri];
    if (!L) return;
    const tila = {
      kohde: L.kohteet[0],
      m2: L.kohteet[0].m2,
      palvelut: new Set(L.palvelut.filter(p => p.oletus).map(p => p.id)),
      km: 15,
      alv: true,
      valinnat: {},     // lisävalinnat, esim. { tontti: 'tasa', kerrokset: '1', rakennukset: 1 }
    };
    const lisavalinnat = L.lisavalinnat || [];
    // Määrävalinnan oletus voi riippua kohdetyypistä (esim. kerrostalossa 5 kerrosta).
    const oletusMaara = v => (v.oletus && v.oletus[tila.kohde.id]) || v.min;
    const alkuarvo = v => v.tyyppi === 'maara' ? oletusMaara(v) : v.tyyppi === 'monivalinta' ? [] : v.vaihtoehdot[0].id;
    lisavalinnat.forEach(v => { tila.valinnat[v.id] = alkuarvo(v); });
    const nakyy = v => !v.kohteet || v.kohteet.includes(tila.kohde.id);
    const vaihtoehtoNakyy = o => !o.kohteet || o.kohteet.includes(tila.kohde.id);
    const MAARA_YLA = 999;
    // Vaiheiden numerot lasketaan piirrettäessä, koska osa vaiheista näkyy vain tietyille kohteille.
    const otsikko = teksti => `<legend class="vaihe-otsikko"><span class="vaihe-nro"></span>${teksti}</legend>`;
    const lisavalintaHtml = v => v.tyyppi === 'maara' ? `
        <fieldset class="vaihe" data-lisavalinta="${v.id}">${otsikko(v.otsikko)}
          <div class="maaravalitsin">
            <button class="mv-miinus" type="button" data-maara="-1" aria-label="Vähemmän"></button>
            <input type="number" inputmode="numeric" min="${v.min}" ${v.max ? `max="${v.max}"` : ''} data-maara-arvo aria-label="${v.otsikko}">
            <button class="mv-plus" type="button" data-maara="1" aria-label="Enemmän"></button>
          </div>
          ${v.ohje ? `<p class="vaihe-ohje">${v.ohje}</p>` : ''}
        </fieldset>` : `
        <fieldset class="vaihe" data-lisavalinta="${v.id}">${otsikko(v.otsikko)}
          <div class="ruudut ruudut-pienet">${v.vaihtoehdot.map(o => `
            <button class="ruutu" type="button" ${v.tyyppi === 'monivalinta' ? 'data-moni' : 'data-valinta'}="${v.id}" data-arvo="${o.id}" aria-pressed="false">${o.ikoni ? ikoni(o.ikoni) : `<span class="ruutu-vuosi">${o.lyhyt}</span>`}<span class="ruutu-nimi">${o.nimi}</span></button>`).join('')}
          </div>
        </fieldset>`;
    const ennenKokoa = lisavalinnat.filter(v => !v.kokoJalkeen), kokoJalkeen = lisavalinnat.filter(v => v.kokoJalkeen);

    juuri.classList.add('laskuri-runko');
    juuri.innerHTML = `
      <div class="laskuri-valinnat">
        <fieldset class="vaihe">${otsikko(L.kohdeOtsikko)}
          <div class="ruudut" data-kohteet>${L.kohteet.map(k => `
            <button class="ruutu" type="button" data-kohde="${k.id}" aria-pressed="false">${ikoni(k.ikoni)}<span class="ruutu-nimi">${k.nimi}</span></button>`).join('')}
          </div>
        </fieldset>
        ${ennenKokoa.map(lisavalintaHtml).join('')}
        <fieldset class="vaihe">${otsikko('Kuinka iso?')}
          <div class="liuku">
            <input type="range" data-m2 aria-label="Pinta-ala neliömetreinä">
            <output data-m2-arvo></output>
          </div>
        </fieldset>
        ${kokoJalkeen.map(lisavalintaHtml).join('')}
        <fieldset class="vaihe">${otsikko(L.palveluOtsikko)}
          <div class="ruudut ruudut-palvelut" data-palvelut>${L.palvelut.map(p => `
            <button class="ruutu ruutu-palvelu" type="button" data-palvelu="${p.id}" aria-pressed="false">
              ${ikoni(p.ikoni)}
              <span class="ruutu-nimi">${p.nimi}</span>
              <span class="ruutu-kuvaus">${p.kuvaus}</span>
              <span class="ruutu-hinta">${muotoile(H.tuntihinnat[p.hinta].hinta, 2)} €/h</span>
              <span class="ruutu-valinta" aria-hidden="true"></span>
            </button>`).join('')}
          </div>
        </fieldset>
        ${L.matka ? `
        <fieldset class="vaihe">${otsikko('Matka toimistolta')}
          <div class="liuku">
            <input type="range" min="0" max="200" step="5" data-km aria-label="Etäisyys toimistolta kilometreinä">
            <output data-km-arvo></output>
          </div>
          <p class="vaihe-ohje">Toimisto: Puustellinpolku 12, Helsinki. Käynteihin lisätään matka-aika, yksi tunti ja ${muotoile(H.kmHinta, 2)} €/km.</p>
        </fieldset>` : ''}
      </div>
      <aside class="laskuri-tulos" aria-live="polite">
        ${L.akso && window.piirraAkso ? '<figure class="akso-kehys"><div class="akso" data-akso></div><figcaption data-akso-teksti></figcaption></figure>' : ''}
        <div class="alv-vaihto" role="group" aria-label="Hinnan esitystapa">
          <button type="button" data-alv="1" aria-pressed="true">Kuluttaja</button>
          <button type="button" data-alv="0" aria-pressed="false">Yritys</button>
        </div>
        <p class="tulos-otsikko">Arvioitu hinta <span data-alv-teksti></span></p>
        <p class="tulos-luku" data-tulos></p>
        <ul class="erittely" data-erittely></ul>
        <a class="nappi nappi-oranssi tulos-nappi" data-tarjous href="#">Pyydä tarjous näillä tiedoilla</a>
        <p class="tulos-huom">Suuntaa-antava arvio hinnaston ${H.voimassa} (${H.alue}) tuntihinnoilla. Lopullinen hinta sovitaan tarjouksessa.</p>
      </aside>`;

    const $ = s => juuri.querySelector(s);
    const m2 = $('[data-m2]'), km = $('[data-km]');

    function asetaKohde(k) {
      tila.kohde = k;
      tila.m2 = k.m2;
      // Kohdetyypin vaihtuessa määrät palaavat sen oletuksiin ja epäsopivat monivalinnat poistuvat.
      lisavalinnat.forEach(v => {
        if (v.tyyppi === 'maara' && v.oletus) tila.valinnat[v.id] = oletusMaara(v);
        if (v.tyyppi === 'monivalinta') tila.valinnat[v.id] = tila.valinnat[v.id].filter(id => vaihtoehtoNakyy(v.vaihtoehdot.find(o => o.id === id)));
      });
      m2.min = k.min; m2.max = k.max; m2.step = k.max > 1000 ? 50 : 5; m2.value = k.m2;
    }

    function laske() {
      const kerroin = Math.min(3, Math.max(.5, Math.pow(tila.m2 / tila.kohde.m2, L.skaalaus)));
      // Lisävalintojen kertoimet ja lisärakennusten tunnit palveluittain
      const valintaKerroin = id => lisavalinnat.filter(nakyy).reduce((x, v) => {
        if (v.tyyppi === 'maara') return v.potenssi && v.potenssi[id] ? x * Math.pow(tila.valinnat[v.id] / oletusMaara(v), v.potenssi[id]) : x;
        const valitut = v.tyyppi === 'monivalinta' ? tila.valinnat[v.id] : [tila.valinnat[v.id]];
        return valitut.reduce((y, oid) => y * ((v.vaihtoehdot.find(o => o.id === oid) || {}).kerroin?.[id] || 1), x);
      }, 1);
      const lisaTunnit = id => lisavalinnat.filter(v => nakyy(v) && v.lisaTunnit && v.lisaTunnit[id])
        .reduce((x, v) => { const n = Math.max(0, tila.valinnat[v.id] - oletusMaara(v)); return [x[0] + n * v.lisaTunnit[id][0], x[1] + n * v.lisaTunnit[id][1]]; }, [0, 0]);
      const rivit = [];
      let ala = 0, yla = 0, kaynnit = [0, 0], matkaHinta = 0;
      for (const p of L.palvelut) {
        if (!tila.palvelut.has(p.id)) continue;
        const t = p.tunnit[tila.kohde.id]; if (!t) continue;
        const hinta = H.tuntihinnat[p.hinta].hinta;
        const vk = valintaKerroin(p.id), lt = lisaTunnit(p.id);
        const h0 = t[0] * kerroin * vk + lt[0], h1 = t[1] * kerroin * vk + lt[1];
        rivit.push({ nimi: p.nimi, teksti: `${tunnit(h0)}–${tunnit(h1)} h`, ala: h0 * hinta, yla: h1 * hinta });
        ala += h0 * hinta; yla += h1 * hinta;
        const kv = p.kaynnit && p.kaynnit[tila.kohde.id];
        if (kv) { kaynnit = [Math.max(kaynnit[0], kv[0]), Math.max(kaynnit[1], kv[1])]; matkaHinta = Math.max(matkaHinta, hinta); }
      }
      // Saman kohteen palvelut hoidetaan samoilla käynneillä.
      if (L.matka && kaynnit[1]) {
        const kaynti = (2 * tila.km / H.matkaNopeus + 1) * matkaHinta + 2 * tila.km * H.kmHinta;
        const k0 = Math.round(kaynnit[0]), k1 = Math.round(kaynnit[1]);
        rivit.push({ nimi: 'Käynnit ja matkat', teksti: k0 === k1 ? `${k0} × ${muotoile(tila.km)} km` : `${k0}–${k1} × ${muotoile(tila.km)} km`, ala: k0 * kaynti, yla: k1 * kaynti });
        ala += k0 * kaynti; yla += k1 * kaynti;
      }
      return { rivit, ala, yla };
    }

    // Valinnat lyhyinä teksteinä (kuvateksti ja tarjouspyyntö)
    function valintaTekstit() {
      const tekstit = [tila.kohde.nimi, `${muotoile(tila.m2)} m²`];
      lisavalinnat.filter(nakyy).forEach(v => {
        if (v.tyyppi === 'maara') {
          const n = tila.valinnat[v.id], y = v.yksikko || ['', ''];
          if (v.naytaAina || n > v.min) tekstit.push(`${n} ${n === 1 ? y[0] : y[1]}`);
        } else if (v.tyyppi === 'monivalinta') {
          v.vaihtoehdot.filter(o => tila.valinnat[v.id].includes(o.id) && vaihtoehtoNakyy(o)).forEach(o => tekstit.push(o.nimi.toLowerCase()));
        } else { const o = v.vaihtoehdot.find(o => o.id === tila.valinnat[v.id]); tekstit.push(o.kuvateksti || o.nimi.toLowerCase()); }
      });
      return tekstit;
    }

    function piirra() {
      juuri.querySelectorAll('[data-kohde]').forEach(b => b.setAttribute('aria-pressed', b.dataset.kohde === tila.kohde.id));
      juuri.querySelectorAll('[data-palvelu]').forEach(b => b.setAttribute('aria-pressed', tila.palvelut.has(b.dataset.palvelu)));
      juuri.querySelectorAll('[data-alv]').forEach(b => b.setAttribute('aria-pressed', (b.dataset.alv === '1') === tila.alv));
      $('[data-m2-arvo]').textContent = `${muotoile(tila.m2)} m²`;
      if (km) { km.value = tila.km; $('[data-km-arvo]').textContent = `${muotoile(tila.km)} km`; }

      // Lisävalinnat: näkyvyys kohdetyypin mukaan, valitut ja määrät
      lisavalinnat.forEach(v => {
        const kentta = $(`[data-lisavalinta="${v.id}"]`);
        kentta.hidden = !nakyy(v);
        if (v.tyyppi === 'maara') {
          const syote = kentta.querySelector('[data-maara-arvo]');
          if (document.activeElement !== syote) syote.value = tila.valinnat[v.id];
          kentta.querySelector('[data-maara="-1"]').disabled = tila.valinnat[v.id] <= v.min;
          kentta.querySelector('[data-maara="1"]').disabled = tila.valinnat[v.id] >= (v.max || MAARA_YLA);
        } else if (v.tyyppi === 'monivalinta') {
          kentta.querySelectorAll('[data-moni]').forEach(b => {
            const o = v.vaihtoehdot.find(x => x.id === b.dataset.arvo);
            b.hidden = !vaihtoehtoNakyy(o);
            b.setAttribute('aria-pressed', tila.valinnat[v.id].includes(o.id));
          });
        } else kentta.querySelectorAll('[data-valinta]').forEach(b => b.setAttribute('aria-pressed', b.dataset.arvo === tila.valinnat[v.id]));
      });
      let nro = 0;
      juuri.querySelectorAll('.vaihe').forEach(f => { if (!f.hidden) f.querySelector('.vaihe-nro').textContent = ++nro; });

      // Aksonometria (js/akso.js): rakennus vaihtuu animoiden, koko ja kerrokset liukuvat.
      const kuva = $('[data-akso]');
      if (kuva) {
        const h = { laji: juuri.dataset.laskuri, kohde: tila.kohde.id, m2: tila.m2, vertailu: tila.kohde.m2, palvelut: [...tila.palvelut] };
        lisavalinnat.forEach(v => { h[v.id] = nakyy(v) ? tila.valinnat[v.id] : undefined; });
        window.piirraAkso(kuva, h);
        $('[data-akso-teksti]').textContent = valintaTekstit().join(' · ');
      }

      const { rivit, ala, yla } = laske();
      const jako = tila.alv ? 1 : ALV;
      $('[data-alv-teksti]').textContent = tila.alv ? `(sis. alv ${muotoile(H.alv, 1)} %)` : '(alv 0 %)';
      $('[data-tulos]').innerHTML = rivit.length
        ? `${vali(ala / jako, yla / jako, 50)} <span>€</span>`
        : '<span class="tulos-tyhja">Valitse vähintään yksi palvelu</span>';
      $('[data-erittely]').innerHTML = rivit.map(r =>
        `<li><span>${r.nimi}<small>${r.teksti}</small></span><span>${vali(r.ala / jako, r.yla / jako, 10)} €</span></li>`).join('');

      // Tarjouspyyntö sähköpostilla, laskurin valinnat valmiina viestissä.
      const viesti = [
        'Hei,', '', 'haluaisin tarjouksen seuraavasta:', '',
        `Kohde: ${valintaTekstit().join(', ')}`,
        `Palvelut: ${L.palvelut.filter(p => tila.palvelut.has(p.id)).map(p => p.nimi).join(', ') || '–'}`,
        L.matka ? `Etäisyys toimistolta: noin ${muotoile(tila.km)} km` : null,
        rivit.length ? `Laskurin arvio: ${vali(ala / jako, yla / jako, 50)} € ${tila.alv ? 'sis. alv' : 'alv 0 %'}` : null,
        '', 'Kohteen osoite:', 'Aikataulu:', 'Puhelinnumero:', '',
      ].filter(r => r !== null).join('\n');
      // Tutkimussivun leikkauskuva (js/leikkaus.js) seuraa samoja valintoja
      juuri.laskuriTila = { kohde: tila.kohde.id, valinnat: Object.assign({}, tila.valinnat), palvelut: [...tila.palvelut] };
      juuri.dispatchEvent(new CustomEvent('laskuri:muutos', { detail: juuri.laskuriTila }));
      $('[data-tarjous]').href = `mailto:myynti@arkvisio.fi?subject=${encodeURIComponent('Tarjouspyyntö: ' + tila.kohde.nimi)}&body=${encodeURIComponent(viesti)}`;
    }

    juuri.addEventListener('click', e => {
      const kohde = e.target.closest('[data-kohde]');
      if (kohde) { asetaKohde(L.kohteet.find(k => k.id === kohde.dataset.kohde)); return piirra(); }
      const palvelu = e.target.closest('[data-palvelu]');
      if (palvelu) { const id = palvelu.dataset.palvelu; tila.palvelut.has(id) ? tila.palvelut.delete(id) : tila.palvelut.add(id); return piirra(); }
      const moni = e.target.closest('[data-moni]');
      if (moni) {
        const lista = tila.valinnat[moni.dataset.moni], id = moni.dataset.arvo;
        tila.valinnat[moni.dataset.moni] = lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id];
        return piirra();
      }
      const valinta = e.target.closest('[data-valinta]');
      if (valinta) { tila.valinnat[valinta.dataset.valinta] = valinta.dataset.arvo; return piirra(); }
      const maara = e.target.closest('[data-maara]');
      if (maara) {
        const v = lisavalinnat.find(x => x.id === maara.closest('[data-lisavalinta]').dataset.lisavalinta);
        tila.valinnat[v.id] = Math.max(v.min, Math.min(v.max || MAARA_YLA, tila.valinnat[v.id] + +maara.dataset.maara));
        return piirra();
      }
      const alv = e.target.closest('[data-alv]');
      if (alv) { tila.alv = alv.dataset.alv === '1'; return piirra(); }
    });
    juuri.addEventListener('laskuri:aseta', e => {
      const x = e.detail || {};
      if (x.kohde && x.kohde !== tila.kohde.id) { const k = L.kohteet.find(k => k.id === x.kohde); if (k) asetaKohde(k); }
      Object.keys(x.valinnat || {}).forEach(id => { if (lisavalinnat.some(v => v.id === id)) tila.valinnat[id] = x.valinnat[id]; });
      piirra();
    });
    m2.addEventListener('input', () => { tila.m2 = +m2.value; piirra(); });
    // Määrän voi myös kirjoittaa (esim. 24 kerrosta).
    juuri.addEventListener('input', e => {
      const syote = e.target.closest('[data-maara-arvo]'); if (!syote) return;
      const v = lisavalinnat.find(x => x.id === syote.closest('[data-lisavalinta]').dataset.lisavalinta);
      const n = Math.round(+syote.value);
      if (syote.value !== '' && n >= v.min) { tila.valinnat[v.id] = Math.min(v.max || MAARA_YLA, n); piirra(); }
    });
    juuri.addEventListener('focusout', e => { if (e.target.closest('[data-maara-arvo]')) setTimeout(piirra); });
    if (km) km.addEventListener('input', () => { tila.km = +km.value; piirra(); });

    asetaKohde(tila.kohde);
    piirra();
  });

  // Tuntihintakortit
  document.querySelectorAll('[data-tuntihinnat]').forEach(el => {
    el.innerHTML = el.dataset.tuntihinnat.split(',').map(id => {
      const t = H.tuntihinnat[id.trim()]; if (!t) return '';
      return `<article class="tuntihinta">
        <p class="tuntihinta-taso">${t.nimi}</p>
        <p class="tuntihinta-luku">${muotoile(t.hinta, 2)} <span>€/h</span></p>
        <p class="tuntihinta-alv">${muotoile(t.hinta / ALV, 2)} €/h alv 0 %</p>
        <ul>${t.tehtavat.map(x => `<li>${x}</li>`).join('')}</ul>
      </article>`;
    }).join('');
  });
  document.querySelectorAll('[data-lisakulut]').forEach(el => { el.innerHTML = H.lisakulut.map(x => `<li>${x}</li>`).join(''); });
})();
