// ============================================================
//  REFERENSSIT – Kohteemme-sivu (kohteet.html)
//  Tätä tiedostoa muokkaamalla sivun kohteet päivittyvät.
//
//  NYKYISET KOHTEET OVAT ESIMERKKEJÄ (esimerkki: true). Korvatkaa ne omilla.
//
//  nimi       – kohteen nimi
//  paikka     – kaupunki tai kaupunginosa (ei katuosoitetta)
//  vuosi      – valmistumisvuosi (valinnainen)
//  tyyppi     – näkyvä tyyppi, esim. "Uudisrakennus"
//  luokka     – suodatin: asuin, kerros, toimi tai korjaus (nimet alla)
//  palvelut   – mitä teimme (valinnainen)
//  kuvaus     – lyhyt kuvaus
//  kuva       – kuvan polku, esim. "assets/images/kohteet/pakila.jpg" (n. 2000 px leveä).
//               Jos kuvaa ei ole, näytetään piirros (akso = piirroksen valinnat).
//  nosto      – true = näytetään isona sivun alussa (yksi kohde)
// ============================================================

window.REFERENSSILUOKAT = {
  asuin:   "Asuinrakennukset",
  kerros:  "Kerrostalot",
  toimi:   "Liike- ja toimitilat",
  korjaus: "Korjaukset ja laajennukset",
};

window.REFERENSSIT = [
  { nimi: "Paritalo", paikka: "Vantaa", tyyppi: "Uudisrakennus", luokka: "asuin", nosto: true,
    kuvaus: "Rinnetontille porrastettu paritalo. Puuverhoiltu julkisivu, katettu sisäänkäyntiterassi ja autokatokset alarinteen puolella.",
    kuva: "assets/images/kohteet/vanha-porvoontie-paritalo-web.jpg" },
  { nimi: "Kalliotalo", paikka: "Espoo", vuosi: 2025, tyyppi: "Uudisrakennus", luokka: "asuin",
    palvelut: ["Pääsuunnittelu", "Arkkitehtisuunnittelu", "Rakennesuunnittelu"],
    kuvaus: "Kaksiosainen asuinrakennus kallioiselle metsätontille. Tummat massat, isot lasipinnat ja kivimuuri, joka sitoo talon maastoon.",
    kuva: "assets/images/kansikuva.jpg", esimerkki: true },
  { nimi: "Omakotitalo", paikka: "Pakila, Helsinki", vuosi: 2024, tyyppi: "Uudisrakennus", luokka: "asuin",
    palvelut: ["Pääsuunnittelu", "Arkkitehtisuunnittelu"], kuvaus: "Kaksikerroksinen puutalo vanhalle pientaloalueelle.",
    akso: { kohde: "okt", m2: 180, kerrokset: 2 }, esimerkki: true },
  { nimi: "Kerrostalo", paikka: "Leppävaara, Espoo", vuosi: 2023, tyyppi: "Uudisrakennus", luokka: "kerros",
    palvelut: ["Pääsuunnittelu", "Rakennesuunnittelu", "Vastaava työnjohto"], kuvaus: "Kuusikerroksinen asuinkerrostalo, 48 asuntoa.",
    akso: { kohde: "kerrostalo", m2: 2400, kerrokset: 6 }, esimerkki: true },
  { nimi: "Rantasauna", paikka: "Kirkkonummi", vuosi: 2024, tyyppi: "Uudisrakennus", luokka: "asuin",
    palvelut: ["Arkkitehtisuunnittelu", "Rakennesuunnittelu"], kuvaus: "Saunarakennus ja vierashuone rantaan.",
    akso: { kohde: "sauna", m2: 30 }, esimerkki: true },
  { nimi: "Rivitalo", paikka: "Tikkurila, Vantaa", vuosi: 2023, tyyppi: "Uudisrakennus", luokka: "asuin",
    palvelut: ["Pääsuunnittelu", "Arkkitehtisuunnittelu", "Rakennesuunnittelu"], kuvaus: "Kahden asunnon paritalo puolitoistakerroksisena.",
    akso: { kohde: "pari", m2: 260, kerrokset: 1, lisatilat: ["ullakko"] }, esimerkki: true },
  { nimi: "Huvilan laajennus", paikka: "Kauniainen", vuosi: 2023, tyyppi: "Laajennus", luokka: "korjaus",
    palvelut: ["Pääsuunnittelu", "Arkkitehtisuunnittelu"], kuvaus: "Makuuhuonesiipi ja katettu terassi 1950-luvun huvilaan.",
    akso: { kohde: "laaj", m2: 45 }, esimerkki: true },
  { nimi: "Liikerakennus", paikka: "Kerava", vuosi: 2021, tyyppi: "Uudisrakennus", luokka: "toimi",
    palvelut: ["Pääsuunnittelu", "Rakennesuunnittelu", "Rakennuttaminen ja valvonta"], kuvaus: "Kaksikerroksinen liike- ja toimistorakennus.",
    akso: { kohde: "liike", m2: 900, kerrokset: 2 }, esimerkki: true },
  { nimi: "Rintamamiestalon peruskorjaus", paikka: "Tapanila, Helsinki", vuosi: 2022, tyyppi: "Korjaus ja muutos", luokka: "korjaus",
    palvelut: ["Kuntotutkimus", "Korjaussuunnittelu", "Vastaava työnjohto"], kuvaus: "Peruskorjaus, ullakon käyttöönotto ja märkätilat.",
    akso: { kohde: "korj", m2: 120 }, esimerkki: true },
  { nimi: "Varastohalli", paikka: "Tuusula", vuosi: 2023, tyyppi: "Uudisrakennus", luokka: "toimi",
    palvelut: ["Rakennesuunnittelu", "Vastaava työnjohto"], kuvaus: "Teräsrunkoinen varasto- ja tuotantohalli.",
    akso: { kohde: "halli", m2: 1200, kerrokset: 1 }, esimerkki: true },
  { nimi: "Vapaa-ajan asunto", paikka: "Porvoo", vuosi: 2022, tyyppi: "Uudisrakennus", luokka: "asuin",
    palvelut: ["Pääsuunnittelu", "Arkkitehtisuunnittelu"], kuvaus: "Jyrkkäkattoinen loma-asunto merenrantaan.",
    akso: { kohde: "mokki", m2: 95, kerrokset: 1, rakennukset: 2 }, esimerkki: true },
  { nimi: "Omakotitalo rinteeseen", paikka: "Lohja", vuosi: 2025, tyyppi: "Uudisrakennus", luokka: "asuin",
    palvelut: ["Pääsuunnittelu", "Arkkitehtisuunnittelu", "Rakennesuunnittelu"], kuvaus: "Rinnetontin talo, jonka alakerta avautuu järvelle.",
    akso: { kohde: "okt", m2: 210, kerrokset: 2, tontti: "rinne", lisatilat: ["kellari"] }, esimerkki: true },
  { nimi: "Asuinkerrostalo", paikka: "Kalasatama, Helsinki", vuosi: 2024, tyyppi: "Uudisrakennus", luokka: "kerros",
    palvelut: ["Rakennesuunnittelu"], kuvaus: "Kahdeksankerroksinen asuinkerrostalo.",
    akso: { kohde: "kerrostalo", m2: 3600, kerrokset: 8 }, esimerkki: true },
];
