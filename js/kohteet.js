// ============================================================
//  KOHTEEMME-SIVU: nostokohde, suodattimet, kohderuudukko ja kohdeikkuna.
//  Tarvitsee: data/referenssit.js, js/akso.js (piirros, jos kohteella ei ole kuvaa)
// ============================================================

(function () {
  const kohteet = window.REFERENSSIT || [], luokat = window.REFERENSSILUOKAT || {};
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kuvaHtml = (k, laiska) => k.kuva
    ? `<img src="${esc(k.kuva)}" alt="${esc(k.nimi)}, ${esc(k.paikka)}"${laiska ? ' loading="lazy"' : ''} decoding="async">`
    : `<div class="akso ref-piirros" data-piirros="${kohteet.indexOf(k)}" aria-hidden="true"></div>`;
  const piirraKuvat = juuri => {
    if (!window.piirraAkso) return;
    juuri.querySelectorAll('[data-piirros]').forEach(el => {
      const k = kohteet[+el.dataset.piirros], a = k.akso || {};
      window.piirraAkso(el, Object.assign({ laji: 'suunnittelu', vertailu: a.m2 || 150, m2: 150, kohde: 'okt' }, a));
    });
  };
  const merkki = k => k.esimerkki ? '<span class="ref-esimerkki">Esimerkki</span>' : '';
  const tyyppiVuosi = k => esc(k.tyyppi) + (k.vuosi ? ' · ' + k.vuosi : '');
  const palvelut = k => k.palvelut || [];

  // ---------- Nosto ----------
  const nosto = kohteet.find(k => k.nosto);
  const nostoEl = document.querySelector('[data-nosto]');
  if (nosto && nostoEl) {
    nostoEl.innerHTML = `
      <button class="nosto-kuva" type="button" data-avaa="${kohteet.indexOf(nosto)}" aria-label="Avaa kohde ${esc(nosto.nimi)}">${kuvaHtml(nosto)}${merkki(nosto)}</button>
      <div class="nosto-teksti">
        <p class="ref-tyyppi">${tyyppiVuosi(nosto)}</p>
        <h2>${esc(nosto.nimi)}</h2>
        <p class="ref-paikka">${esc(nosto.paikka)}</p>
        <p class="nosto-kuvaus">${esc(nosto.kuvaus)}</p>
        ${palvelut(nosto).length ? `<ul class="ref-palvelut">${palvelut(nosto).map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
        <button class="nappi nappi-oranssi" type="button" data-avaa="${kohteet.indexOf(nosto)}">Katso kohde</button>
      </div>`;
    piirraKuvat(nostoEl);
  }

  // ---------- Suodattimet ----------
  const muut = kohteet.filter(k => !k.nosto);
  const suodatinEl = document.querySelector('[data-ref-suodattimet]');
  let valittu = 'kaikki';
  if (suodatinEl) {
    const maara = id => id === 'kaikki' ? muut.length : muut.filter(k => k.luokka === id).length;
    suodatinEl.innerHTML = [['kaikki', 'Kaikki'], ...Object.entries(luokat)].filter(([id]) => maara(id))
      .map(([id, nimi]) => `<button type="button" class="ref-suodatin" data-luokka="${id}" aria-pressed="${id === valittu}">${esc(nimi)}<span>${maara(id)}</span></button>`).join('');
    suodatinEl.addEventListener('click', e => {
      const b = e.target.closest('[data-luokka]'); if (!b || b.dataset.luokka === valittu) return;
      valittu = b.dataset.luokka;
      suodatinEl.querySelectorAll('[data-luokka]').forEach(x => x.setAttribute('aria-pressed', x === b));
      piirraRuudukko(true);
    });
  }

  // ---------- Ruudukko: vuorottelevat rivit (iso + pieni, kolme samankokoista, pieni + iso) ----------
  const ruudukko = document.querySelector('[data-ref-ruudukko]');
  const RIVIT = [[7, 5], [4, 4, 4], [5, 7], [4, 4, 4]];
  function piirraRuudukko(vaihto) {
    if (!ruudukko) return;
    const lista = muut.filter(k => valittu === 'kaikki' || k.luokka === valittu);
    const sarakkeet = [];
    let i = 0, r = 0;
    while (i < lista.length) {
      let rivi = RIVIT[r++ % RIVIT.length];
      const jaljella = lista.length - i;
      if (jaljella < rivi.length) rivi = jaljella === 1 ? [8] : [6, 6];
      rivi.forEach(s => { if (i < lista.length) sarakkeet.push([lista[i++], s, rivi.length]); });
    }
    ruudukko.innerHTML = sarakkeet.map(([k, s, n], j) => `
      <button type="button" class="ref-kortti ${n >= 3 ? 'pieni' : 'iso'}" style="--sarake:${s};--j:${j % 3}" data-avaa="${kohteet.indexOf(k)}">
        <span class="ref-kuva">${kuvaHtml(k, true)}${merkki(k)}</span>
        <span class="ref-teksti">
          <span class="ref-tyyppi">${tyyppiVuosi(k)}</span>
          <span class="ref-nimi">${esc(k.nimi)}</span>
          <span class="ref-paikka">${esc(k.paikka)}</span>
        </span>
      </button>`).join('');
    piirraKuvat(ruudukko);
    esiin(ruudukko.querySelectorAll('.ref-kortti'), vaihto);
  }

  // Kortit nousevat esiin, kun ne tulevat näkyviin
  const havainnoija = 'IntersectionObserver' in window ? new IntersectionObserver(m => m.forEach(x => {
    if (x.isIntersecting) { x.target.classList.add('esilla'); havainnoija.unobserve(x.target); }
  }), { threshold: .12 }) : null;
  function esiin(kortit, heti) {
    kortit.forEach(k => {
      if (!havainnoija || heti) { requestAnimationFrame(() => k.classList.add('esilla')); return; }
      havainnoija.observe(k);
    });
  }
  piirraRuudukko(false);
  document.querySelectorAll('.nosto, .kartta-nosto').forEach(el => esiin([el]));

  // ---------- Kohdeikkuna ----------
  const ikkuna = document.querySelector('[data-ref-ikkuna]');
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-avaa]'); if (!b || !ikkuna) return;
    const k = kohteet[+b.dataset.avaa];
    const viesti = `Hei,\n\nolen kiinnostunut kohteen "${k.nimi}" (${k.paikka}) kaltaisesta hankkeesta.\n\nKohteen osoite:\nAikataulu:\nPuhelinnumero:\n`;
    ikkuna.querySelector('[data-ikkuna-sisalto]').innerHTML = `
      <div class="ref-ikkuna-kuva">${kuvaHtml(k)}${merkki(k)}</div>
      <div class="ref-ikkuna-teksti">
        <p class="ref-tyyppi">${esc(k.tyyppi)}</p>
        <h2>${esc(k.nimi)}</h2>
        <p class="nosto-kuvaus">${esc(k.kuvaus)}</p>
        <dl class="ref-tiedot">
          <div><dt>Paikka</dt><dd>${esc(k.paikka)}</dd></div>
          ${k.vuosi ? `<div><dt>Valmistunut</dt><dd>${k.vuosi}</dd></div>` : ''}
          ${palvelut(k).length ? `<div><dt>Palvelut</dt><dd>${palvelut(k).map(esc).join(', ')}</dd></div>` : ''}
        </dl>
        <a class="nappi nappi-oranssi" href="mailto:myynti@arkvisio.fi?subject=${encodeURIComponent('Kysely: ' + k.nimi)}&body=${encodeURIComponent(viesti)}">Kysy vastaavasta hankkeesta</a>
      </div>`;
    piirraKuvat(ikkuna);
    ikkuna.showModal();
    ikkuna.querySelector('[data-ikkuna-sisalto]').focus();
  });
  if (ikkuna) {
    ikkuna.addEventListener('click', e => { if (e.target === ikkuna || e.target.closest('[data-sulje]')) ikkuna.close(); });
  }
})();
