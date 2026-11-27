// ============================================================
//  ARKVISION KOHTEET
//  Tätä tiedostoa muokkaamalla kohteet päivittyvät kartalle.
//  Ohjeet: LUE_MINUT.md
// ============================================================

// Kohdetyypit ja niiden värit kartalla.
// Uuden tyypin voi lisätä samalla mallilla.
// Kuntotutkimuksia ei näytetä kartalla: ne ovat asiakkaiden yksityisiä kohteita.
window.KOHDETYYPIT = {
  uudis:     { nimi: "Uudisrakennus",    vari: "#F79C09" },
  korjaus:   { nimi: "Korjaus & muutos", vari: "#6FA8DC" },
  laajennus: { nimi: "Laajennus",        vari: "#E8E2D6" },
};

// Kohteet. Uusin kannattaa lisätä listan alkuun.
//   nimi       – kohteen nimi kartalla
//   paikka     – paikkakunta tai kaupunginosa (näkyy kävijälle)
//   tyyppi     – jokin yllä olevista: uudis, korjaus, laajennus
//   lat, lon   – sijainti. Google Mapsista: oikea klikkaus kohteeseen → ensimmäinen luku on lat, toinen lon.
//                Tarkkaa osoitetta ei tarvitse käyttää, lähialue riittää.
//   vuosi      – valmistumisvuosi
//   kuvaus     – lyhyt kuvaus (valinnainen)
//   kuva       – kuvan polku, esim. "assets/images/kulosaari.jpg" (valinnainen)
//   esimerkki  – true = esimerkkikohde. Poista kun oikeat kohteet on lisätty.
window.KOHTEET = [
  { nimi: "Huvila", paikka: "Hopeasalmentie 10, Kulosaari, Helsinki", tyyppi: "uudis", lat: 60.18338, lon: 25.00362, vuosi: 2024, kuvaus: "Kaksikerroksinen huvila meren rannalle.", esimerkki: true },
  { nimi: "Huvila", paikka: "Kuusisaarentie 5, Munkkiniemi, Helsinki", tyyppi: "korjaus", lat: 60.18729, lon: 24.87025, vuosi: 2023, kuvaus: "Julkisivun ja vesikaton peruskorjaus.", esimerkki: true },
  { nimi: "Omakotitalo", paikka: "Pakilantie 60, Pakila, Helsinki", tyyppi: "laajennus", lat: 60.23929, lon: 24.92764, vuosi: 2022, kuvaus: "Makuuhuonesiipi ja katettu terassi.", esimerkki: true },
  { nimi: "Rintamamiestalo", paikka: "Tapaninkyläntie 20, Tapanila, Helsinki", tyyppi: "korjaus", lat: 60.26689, lon: 25.0081, vuosi: 2021, kuvaus: "Peruskorjaus ja märkätilojen uusiminen.", esimerkki: true },
  { nimi: "Paritalo", paikka: "Lauttasaarentie 30, Lauttasaari, Helsinki", tyyppi: "uudis", lat: 60.16047, lon: 24.87984, vuosi: 2023, esimerkki: true },
  { nimi: "Omakotitalo", paikka: "Kivikonkaari 3, Kivikko, Helsinki", tyyppi: "uudis", lat: 60.24038, lon: 25.0695, vuosi: 2020, esimerkki: true },
  { nimi: "Rivitalo", paikka: "Tapiolantie 30, Tapiola, Espoo", tyyppi: "korjaus", lat: 60.17072, lon: 24.8106, vuosi: 2022, kuvaus: "Rivitalon linjasaneeraus.", esimerkki: true },
  { nimi: "Omakotitalo", paikka: "Westendintie 50, Westend, Espoo", tyyppi: "uudis", lat: 60.15824, lon: 24.79189, vuosi: 2024, esimerkki: true },
  { nimi: "Saunarakennus", paikka: "Soukanniemi 5, Soukka, Espoo", tyyppi: "uudis", lat: 60.12093, lon: 24.67434, vuosi: 2021, kuvaus: "Rantasauna ja vierashuone.", esimerkki: true },
  { nimi: "Huvila", paikka: "Kasavuorentie 10, Kauniainen", tyyppi: "laajennus", lat: 60.21283, lon: 24.70527, vuosi: 2022, esimerkki: true },
  { nimi: "Omakotitalo", paikka: "Tikkurilantie 100, Tikkurila, Vantaa", tyyppi: "korjaus", lat: 60.29028, lon: 25.02462, vuosi: 2023, esimerkki: true },
  { nimi: "Paritalo", paikka: "Asolanväylä 30, Asola, Vantaa", tyyppi: "uudis", lat: 60.3262, lon: 25.05803, vuosi: 2021, esimerkki: true },
  { nimi: "Omakotitalo", paikka: "Kurkelankatu 10, Kerava", tyyppi: "laajennus", lat: 60.40949, lon: 25.1069, vuosi: 2024, esimerkki: true },
  { nimi: "Hirsitalo", paikka: "Sibeliuksenväylä 40, Järvenpää", tyyppi: "korjaus", lat: 60.45666, lon: 25.08381, vuosi: 2020, esimerkki: true },
  { nimi: "Huvila", paikka: "Rantatie 10, Tuusula", tyyppi: "uudis", lat: 60.42867, lon: 25.05247, vuosi: 2022, kuvaus: "Huvila Tuusulanjärven rannalle.", esimerkki: true },
  { nimi: "Omakotitalo", paikka: "Klaukkalantie 50, Klaukkala, Nurmijärvi", tyyppi: "uudis", lat: 60.37782, lon: 24.75657, vuosi: 2023, esimerkki: true },
  { nimi: "Puutalo", paikka: "Linnankoskenkatu 30, Porvoo", tyyppi: "korjaus", lat: 60.3952, lon: 25.66712, vuosi: 2021, kuvaus: "Vanhan puutalon korjaus.", esimerkki: true },
  { nimi: "Paritalo", paikka: "Jussaksentie 5, Nikkilä, Sipoo", tyyppi: "uudis", lat: 60.37957, lon: 25.26368, vuosi: 2024, esimerkki: true },
  { nimi: "Omakotitalo", paikka: "Masalantie 10, Masala, Kirkkonummi", tyyppi: "laajennus", lat: 60.13694, lon: 24.50743, vuosi: 2022, esimerkki: true },
  { nimi: "Kivitalo", paikka: "Laurinkatu 20, Lohja", tyyppi: "uudis", lat: 60.24659, lon: 24.0587, vuosi: 2023, esimerkki: true },
];
