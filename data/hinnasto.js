// ============================================================
//  ARKVISION HINNASTO JA LASKURIT
//  Tuntihinnat: Hinnasto 2026, Etelä-Suomi (alkaen 20.1.2026).
//  Tuntiarviot ovat suuntaa-antavia – TARKISTA JA KORJAA ne
//  omien kokemustenne mukaan. Ohjeet: LUE_MINUT.md
// ============================================================

window.HINNASTO = {
  alue: "Etelä-Suomi",
  voimassa: "20.1.2026",
  alv: 25.5,              // %
  kmHinta: 0.90,          // €/km sis. alv
  matkaNopeus: 60,        // km/h, matka-ajan arvioon

  // Tuntihinnat sis. alv 25,5 % (alv 0 % lasketaan tästä).
  tuntihinnat: {
    skol2:    { nimi: "SKOL 2", hinta: 138.05, tehtavat: ["Pääsuunnittelu", "Päärakennesuunnittelu", "Rakennuttaminen ja valvonta"] },
    skol3:    { nimi: "SKOL 3", hinta: 119.23, tehtavat: ["Arkkitehtisuunnittelu – arkkitehti / rakennusarkkitehti", "Rakennesuunnittelu – rakennusinsinööri", "Vastaava työnjohto"] },
    skol4:    { nimi: "SKOL 4", hinta: 106.68, tehtavat: ["Arkkitehtisuunnittelu – nuorempi rakennusarkkitehti"] },
    skol5:    { nimi: "SKOL 5", hinta: 94.13,  tehtavat: ["Arkkitehtisuunnittelu – nuorempi suunnittelija"] },
    skol6:    { nimi: "SKOL 6", hinta: 75.30,  tehtavat: ["Arkkitehti- ja rakennesuunnittelu – suunnitteluassistentti"] },
    skol7:    { nimi: "SKOL 7", hinta: 56.48,  tehtavat: ["Arkkitehtisuunnittelu – harjoittelija"] },
    erityis:  { nimi: "Asiantuntija", hinta: 150.00, tehtavat: ["Rakennustarkastukset", "Kosteus- ja pinta-alamittaukset", "Energiatodistukset"] },
  },

  lisakulut: [
    "Kopiokustannukset sekä asiapapereiden nouto ja hankinta tilaajan kustannuksella.",
    "ArkVisio Oy:n kautta kierrätettäviin laskuihin lisätään 10 %:n provisio.",
    "Toimiston ulkopuolisiin tehtäviin lisätään matka-ajan lisäksi yksi tunti.",
    "Matkakulut toimiston ulkopuolisiin käynteihin 0,90 €/km (sis. alv 25,5 %).",
    "LVI-suunnittelu yhteistyökumppanin kautta erillisen sopimuksen mukaan.",
  ],

  // ---------- Laskurit ----------
  // kohteet:  vaihtoehdot, joista käyttäjä valitsee. m2 = oletuskoko ja tuntiarvioiden vertailukoko.
  // palvelut: tunnit = [vähintään, enintään] kohdetyypeittäin vertailukoossa.
  //           Tunnit kasvavat koon mukaan loivasti (skaalaus 0,6: kaksinkertainen koko ≈ 1,5-kertaiset tunnit).
  //           kaynnit = käynnit kohteessa → matka-aika + 1 h + km-kulut. Saman kohteen palvelut tehdään samoilla käynneillä.
  laskurit: {
    suunnittelu: {
      kohdeOtsikko: "Mitä suunnitellaan?",
      palveluOtsikko: "Mitä suunnittelua tarvitset?",
      skaalaus: 0.6,
      havainne: true,   // julkisivupiirros, joka muuttuu valintojen mukaan
      // Lisävalinnat. kohteet = millä kohdetyypeillä valinta näytetään.
      //   kerroin = tuntien kerroin palveluittain (1,15 = +15 %).
      //   lisaTunnit = tunnit jokaista lisärakennusta kohden (päärakennuksen lisäksi).
      lisavalinnat: [
        { id: "tontti", otsikko: "Millainen tontti?", kohteet: ["okt", "pari", "mokki", "sauna", "laaj"],
          vaihtoehdot: [
            { id: "tasa",  nimi: "Tasamaa",     ikoni: "tasamaa", kerroin: {} },
            { id: "rinne", nimi: "Rinnetontti", ikoni: "rinne",   kerroin: { paa: 1.10, ark: 1.15, rak: 1.25 } },
          ] },
        { id: "kerrokset", otsikko: "Montako kerrosta?", kohteet: ["okt", "pari", "mokki"],
          vaihtoehdot: [
            { id: "1",  nimi: "1 kerros",    ikoni: "kerros1",  kerroin: {} },
            { id: "15", nimi: "1½ kerrosta", ikoni: "kerros15", kerroin: { ark: 1.08, rak: 1.08 } },
            { id: "2",  nimi: "2 kerrosta",  ikoni: "kerros2",  kerroin: { ark: 1.12, rak: 1.15 } },
          ] },
        { id: "rakennukset", otsikko: "Montako rakennusta?", tyyppi: "maara", kohteet: ["okt", "pari", "mokki", "sauna"],
          min: 1, max: 4, ohje: "Esimerkiksi päärakennuksen lisäksi autotalli, sauna tai vierasmaja.",
          lisaTunnit: { paa: [3, 5], ark: [6, 10], rak: [3, 6] } },
      ],
      kohteet: [
        { id: "okt",   nimi: "Omakotitalo",            ikoni: "talo",      m2: 150, min: 60,  max: 400 },
        { id: "pari",  nimi: "Pari- tai rivitalo",     ikoni: "paritalo",  m2: 250, min: 100, max: 900 },
        { id: "mokki", nimi: "Vapaa-ajan asunto",      ikoni: "mokki",     m2: 90,  min: 30,  max: 250 },
        { id: "sauna", nimi: "Sauna tai piharakennus", ikoni: "sauna",     m2: 25,  min: 8,   max: 80 },
        { id: "laaj",  nimi: "Laajennus",              ikoni: "laajennus", m2: 40,  min: 10,  max: 200 },
        { id: "korj",  nimi: "Muutos tai korjaus",     ikoni: "korjaus",   m2: 100, min: 20,  max: 400 },
      ],
      palvelut: [
        { id: "paa", nimi: "Pääsuunnittelu", kuvaus: "Hankkeen kokonaisuus ja rakennuslupa", ikoni: "paa", hinta: "skol2", oletus: true,
          tunnit: { okt: [30, 40], pari: [45, 65], mokki: [22, 32], sauna: [4, 6], laaj: [12, 18], korj: [10, 20] } },
        { id: "ark", nimi: "Arkkitehtisuunnittelu", kuvaus: "Pohjat, julkisivut ja lupakuvat", ikoni: "ark", hinta: "skol3", oletus: true,
          tunnit: { okt: [25, 45], pari: [45, 80], mokki: [18, 32], sauna: [8, 12], laaj: [15, 25], korj: [15, 30] } },
        { id: "rak", nimi: "Rakennesuunnittelu", kuvaus: "Rakenteet, mitoitus ja rakennekuvat", ikoni: "rak", hinta: "skol3", oletus: false,
          tunnit: { okt: [20, 35], pari: [35, 60], mokki: [15, 26], sauna: [4, 8], laaj: [10, 18], korj: [8, 20] } },
      ],
    },

    tyomaa: {
      kohdeOtsikko: "Mitä rakennetaan?",
      palveluOtsikko: "Mitä tarvitset työmaalle?",
      skaalaus: 0.6,
      matka: true,
      kohteet: [
        { id: "okt",   nimi: "Omakotitalo",            ikoni: "talo",      m2: 150, min: 60,  max: 400 },
        { id: "pari",  nimi: "Pari- tai rivitalo",     ikoni: "paritalo",  m2: 250, min: 100, max: 900 },
        { id: "mokki", nimi: "Vapaa-ajan asunto",      ikoni: "mokki",     m2: 90,  min: 30,  max: 250 },
        { id: "sauna", nimi: "Sauna tai piharakennus", ikoni: "sauna",     m2: 25,  min: 8,   max: 80 },
        { id: "laaj",  nimi: "Laajennus",              ikoni: "laajennus", m2: 40,  min: 10,  max: 200 },
        { id: "korj",  nimi: "Muutos tai korjaus",     ikoni: "korjaus",   m2: 100, min: 20,  max: 400 },
      ],
      palvelut: [
        { id: "vtj", nimi: "Vastaava työnjohto", kuvaus: "Lakisääteinen työnjohto ja tarkastukset", ikoni: "kypara", hinta: "skol3", oletus: true,
          tunnit:  { okt: [80, 150], pari: [120, 220], mokki: [50, 100], sauna: [10, 20], laaj: [30, 60], korj: [30, 80] },
          kaynnit: { okt: [12, 20],  pari: [16, 28],   mokki: [8, 14],   sauna: [2, 4],   laaj: [5, 10],  korj: [5, 12] } },
        { id: "val", nimi: "Rakennuttaminen ja valvonta", kuvaus: "Urakoiden kilpailutus ja laadun valvonta", ikoni: "valvonta", hinta: "skol2", oletus: false,
          tunnit:  { okt: [30, 60],  pari: [50, 90],    mokki: [20, 40],  sauna: [4, 8],   laaj: [12, 25], korj: [15, 35] },
          kaynnit: { okt: [6, 10],   pari: [8, 14],     mokki: [4, 8],    sauna: [1, 2],   laaj: [3, 6],   korj: [3, 8] } },
      ],
    },

    tutkimus: {
      kohdeOtsikko: "Mitä tutkitaan?",
      palveluOtsikko: "Mitä tutkimuksia tarvitset?",
      skaalaus: 0.6,
      matka: true,
      havainne: true,   // leikkauspiirros: perustustapa ja valittujen tutkimusten kohdat
      // Riskirakenteet riippuvat rakennusajasta ja perustustavasta → tarkastuksiin kuluu enemmän aikaa.
      lisavalinnat: [
        { id: "vuosi", otsikko: "Milloin rakennettu?",
          vaihtoehdot: [
            { id: "v59", nimi: "Ennen 1960", lyhyt: "–1959",   kuvateksti: "rak. ennen 1960", kerroin: { kunto: 1.15, vaur: 1.15 } },
            { id: "v79", nimi: "1960–1979",  lyhyt: "1960–", kuvateksti: "rak. 1960–1979", kerroin: { kunto: 1.20, kost: 1.10, vaur: 1.20 } },
            { id: "v99", nimi: "1980–1999",  lyhyt: "1980–", kuvateksti: "rak. 1980–1999", kerroin: { kunto: 1.05 } },
            { id: "v00", nimi: "2000 jälkeen", lyhyt: "2000–",  kuvateksti: "rak. 2000 jälkeen", kerroin: { kunto: 0.95 } },
          ] },
        { id: "perustus", otsikko: "Millainen alapohja?", kohteet: ["okt", "rivi", "mokki"],
          vaihtoehdot: [
            { id: "laatta",  nimi: "Maanvarainen laatta", ikoni: "laatta",  kerroin: {} },
            { id: "rossi",   nimi: "Rossipohja",          ikoni: "rossi",   kerroin: { kunto: 1.10, kost: 1.10, vaur: 1.15 } },
            { id: "kellari", nimi: "Kellari",             ikoni: "kellari", kerroin: { kunto: 1.15, kost: 1.20, vaur: 1.25 } },
          ] },
        { id: "kerrokset", otsikko: "Montako kerrosta?", kohteet: ["okt"],
          vaihtoehdot: [
            { id: "1",  nimi: "1 kerros",    ikoni: "kerros1",  kerroin: {} },
            { id: "15", nimi: "1½ kerrosta", ikoni: "kerros15", kerroin: { kunto: 1.05 } },
            { id: "2",  nimi: "2 kerrosta",  ikoni: "kerros2",  kerroin: { kunto: 1.10, kost: 1.10 } },
          ] },
      ],
      kohteet: [
        { id: "okt",   nimi: "Omakotitalo",            ikoni: "talo",       m2: 140,  min: 40,  max: 400 },
        { id: "rivi",  nimi: "Rivi- tai paritalo",     ikoni: "paritalo",   m2: 90,   min: 30,  max: 250 },
        { id: "mokki", nimi: "Vapaa-ajan asunto",      ikoni: "mokki",      m2: 70,   min: 20,  max: 250 },
        { id: "yhtio", nimi: "Taloyhtiö",              ikoni: "kerrostalo", m2: 1500, min: 300, max: 8000 },
      ],
      palvelut: [
        { id: "kunto", nimi: "Kuntotarkastus", kuvaus: "Asuntokaupan kuntotarkastus ja raportti", ikoni: "tarkastus", hinta: "erityis", oletus: true,
          tunnit:  { okt: [6, 9],   rivi: [4, 6],  mokki: [4, 7],  yhtio: [25, 45] },
          kaynnit: { okt: [1, 1],   rivi: [1, 1],  mokki: [1, 1],  yhtio: [1, 2] } },
        { id: "kost", nimi: "Kosteusmittaus", kuvaus: "Pintakosteuskartoitus märkätiloista ja riskirakenteista", ikoni: "pisara", hinta: "erityis", oletus: false,
          tunnit:  { okt: [3, 5],   rivi: [2, 4],  mokki: [2, 4],  yhtio: [8, 16] },
          kaynnit: { okt: [1, 1],   rivi: [1, 1],  mokki: [1, 1],  yhtio: [1, 2] } },
        { id: "vaur", nimi: "Kosteusvauriotutkimus", kuvaus: "Rakenneavaukset, näytteet ja korjausehdotus", ikoni: "suurennus", hinta: "erityis", oletus: false,
          tunnit:  { okt: [10, 20], rivi: [8, 14], mokki: [8, 16], yhtio: [30, 70] },
          kaynnit: { okt: [1, 2],   rivi: [1, 2],  mokki: [1, 2],  yhtio: [2, 3] } },
        { id: "ener", nimi: "Energiatodistus", kuvaus: "Lakisääteinen todistus myyntiin tai vuokraukseen", ikoni: "energia", hinta: "erityis", oletus: false,
          tunnit:  { okt: [3, 5],   rivi: [2, 3],  mokki: [2, 4],  yhtio: [8, 14] },
          kaynnit: { okt: [1, 1],   rivi: [1, 1],  mokki: [1, 1],  yhtio: [1, 1] } },
        { id: "pala", nimi: "Pinta-alamittaus", kuvaus: "Huoneisto- ja kerrosalan mittaus", ikoni: "mitta", hinta: "erityis", oletus: false,
          tunnit:  { okt: [2, 4],   rivi: [1.5, 3], mokki: [1.5, 3], yhtio: [6, 12] },
          kaynnit: { okt: [1, 1],   rivi: [1, 1],  mokki: [1, 1],  yhtio: [1, 1] } },
      ],
    },
  },
};
