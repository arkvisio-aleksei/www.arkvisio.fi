// ============================================================
//  KUVAKKEET – yksinkertaiset viivapiirrokset (24 × 24).
//  Väri tulee tekstin väristä (currentColor).
// ============================================================

window.IKONIT = (function () {
  const polut = {
    talo:       '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/>',
    paritalo:   '<path d="M1.5 12 7 7.5l5 4 5-4 5.5 4.5"/><path d="M3.5 10.5V20h17v-9.5"/><path d="M12 11.5V20"/><path d="M6 20v-4h2.5v4M15.5 20v-4H18v4"/>',
    mokki:      '<path d="M2.5 20h19"/><path d="M4.5 20 11 6l6.5 14"/><path d="M9.5 20v-4.5h3V20"/><path d="M19.5 20v-3"/><path d="m19.5 9-2 4h4z"/><path d="m19.5 12-2.5 5h5z"/>',
    sauna:      '<path d="M2.5 20h19"/><path d="M4.5 20v-8h11v8"/><path d="M3 12.5 10 8l7 4.5"/><path d="M8 20v-4h3v4"/><path d="M19 3.5c-1 1 1 2 0 3s1 2 0 3"/>',
    laajennus:  '<path d="M2.5 11.5 9.5 5.5l7 6"/><path d="M4.5 10v10h9"/><path d="M18.5 14v6M15.5 17h6"/>',
    korjaus:    '<path d="M14.5 5.5a4 4 0 0 0-5 5L3.5 16.5a1.4 1.4 0 0 0 0 2l2 2a1.4 1.4 0 0 0 2 0l6-6a4 4 0 0 0 5-5l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    kerrostalo: '<rect x="5" y="3" width="14" height="18" rx=".5"/><path d="M8.5 7h2M13.5 7h2M8.5 11h2M13.5 11h2M8.5 15h2M13.5 15h2"/><path d="M10.5 21v-2.5h3V21"/>',
    paa:        '<rect x="4.5" y="4" width="15" height="17" rx="1"/><path d="M9 4V2.5h6V4"/><path d="m8.5 13 2.5 2.5 4.5-5"/>',
    ark:        '<path d="M3.5 20.5V3.5l17 17z"/><path d="M7.5 16.5v-4.5l4.5 4.5z"/><path d="M3.5 8h2M3.5 12h2"/>',
    rak:        '<path d="M2.5 20.5h19"/><path d="M4 20.5V9h16v11.5"/><path d="M4 9l4 11.5L12 9l4 11.5L20 9"/>',
    kypara:     '<path d="M3 17.5h18"/><path d="M4.5 17.5a7.5 7.5 0 0 1 15 0"/><path d="M10 10.5V6.5h4v4"/><path d="M3 20.5h18"/>',
    valvonta:   '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    tarkastus:  '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="m9 15 2 2 4-4"/>',
    pisara:     '<path d="M12 3s6.5 7.2 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.2 12 3 12 3z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
    suurennus:  '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20.5 20.5-5.4-5.4"/><path d="M10.5 7.5v6M7.5 10.5h6"/>',
    energia:    '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>',
    mitta:      '<rect x="2.5" y="8" width="19" height="8" rx="1"/><path d="M6.5 8v3M10.5 8v4.5M14.5 8v3M18.5 8v4.5"/>',
    tasamaa:    '<path d="M2 19.5h20"/><path d="M6 19.5V12l6-5 6 5v7.5"/><path d="M4 22h2M9 22h2M14 22h2M19 22h1"/>',
    rinne:      '<path d="M2 14.5 22 21"/><path d="M6 15.8V10l5-4.5 5 4.5v7.4"/><path d="M6 15.8h10"/>',
    kerros1:    '<path d="M3 20.5h18"/><rect x="5" y="13" width="14" height="7.5"/><path d="M4 13l8-5 8 5"/>',
    kerros15:   '<path d="M3 20.5h18"/><rect x="5" y="11" width="14" height="9.5"/><path d="M4 11l8-7 8 7"/><path d="M11 9h2"/>',
    kerros2:    '<path d="M3 20.5h18"/><rect x="5" y="8" width="14" height="12.5"/><path d="M5 14h14"/><path d="M4 8l8-5 8 5"/>',
    laatta:     '<path d="M2 16.5h20"/><path d="M5 14V8l7-5 7 5v6"/><rect x="4" y="14" width="16" height="2.5"/><path d="M4 19.5l2-3M9 19.5l2-3M14 19.5l2-3M19 19.5l1.5-2"/>',
    rossi:      '<path d="M2 19.5h20"/><path d="M5 12V7l7-5 7 5v5"/><path d="M4 12h16"/><path d="M5 12v7.5M19 12v7.5M12 12v7.5"/><path d="M7.5 15.5h2M14.5 15.5h2"/>',
    kellari:    '<path d="M2 12.5h20"/><path d="M5 12.5V7l7-5 7 5v5.5"/><rect x="5" y="12.5" width="14" height="8.5" stroke-dasharray="2 1.6"/><path d="M8 17h3"/>',
    suunnittelu:'<path d="M3.5 20.5V3.5l17 17z"/><path d="M7.5 16.5v-4.5l4.5 4.5z"/><path d="M3.5 8h2M3.5 12h2"/>',
    tyomaa:     '<path d="M3 17.5h18"/><path d="M4.5 17.5a7.5 7.5 0 0 1 15 0"/><path d="M10 10.5V6.5h4v4"/><path d="M3 20.5h18"/>',
    tutkimus:   '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20.5 20.5-5.4-5.4"/><path d="M10.5 7.5v6M7.5 10.5h6"/>',
  };
  return nimi => `<svg class="ikoni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${polut[nimi] || ''}</svg>`;
})();
