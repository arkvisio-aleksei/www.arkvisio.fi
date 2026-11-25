# ArkVisio – verkkosivusto

Tavallinen HTML-sivusto. Ei asennuksia eikä työkaluja: avaa `index.html` selaimessa, tai siirrä koko kansio palvelimelle sellaisenaan.

## Kansiot

| Polku | Sisältö |
|---|---|
| `index.html` | Etusivu (rakennetaan uudelleen: nyt yläpalkki, iskulause ja alatunniste) |
| `suunnittelu.html`, `tyomaa.html`, `tutkimus.html` | Palvelusivut hintalaskureineen |
| `css/tyylit.css` | Kaikki tyylit. **Brändin värit, fontit ja mitat ovat tiedoston alussa muuttujina.** |
| `js/kartta.js` | Maapallo, kohteiden ryhmittely ja zoomaus |
| `js/sivu.js` | Etusivun suodattimet ja hankelaskuri |
| `js/valikko.js` | Mobiilivalikko (kaikilla sivuilla) |
| `js/laskuri.js`, `js/ikonit.js`, `js/havainne.js` | Palvelusivujen hintalaskuri, kuvakkeet sekä suunnittelu- ja tutkimuslaskurin piirros |
| `js/vendor/` | Valmiit kirjastot (d3, topojson) – ei muokata |
| `data/kohteet.js` | **Kohteet – tätä muokataan, kun lisätään referenssi** |
| `data/hinnasto.js` | **Tuntihinnat ja laskureiden tuntiarviot – tätä muokataan, kun hinnasto muuttuu** |
| `data/kartta-data.js` | Maiden rajat (Natural Earth) – ei muokata |
| `assets/logo/` | Logot |
| `assets/images/` | Kuvat. `hero.jpg` = etusivun pääkuva (lisää sen jälkeen `index.html`:ssä `paakuva-kuva`-elementille luokka `kuvalla`) |
| `design/suunnat.html` | Vanha visuaalisten suuntien vertailu (ei osa sivustoa) |
| `design/kartta-osio.html` | **Kohdekartta talteen**: osion HTML ja tarvittavat skriptit. Kartan koodi (`js/kartta.js`, `js/sivu.js`, `data/`) on ennallaan. |
| `design/asemapiirros.svg` | Etusivulta poistettu asemapiirrosgrafiikka talteen |

## Hinnasto ja laskurit

Kaikki hinnat ovat tiedostossa `data/hinnasto.js`:

- **Tuntihinnat** (`tuntihinnat`) ovat hinnastosta 2026 (Etelä-Suomi), sis. alv 25,5 %. Alv 0 % -hinta lasketaan automaattisesti.
- **Tuntiarviot** (`tunnit: { okt: [30, 40], ... }`) ovat vähimmäis- ja enimmäistunnit kohdetyypeittäin oletuskoossa (`m2`). Suuremmassa kohteessa tunnit kasvavat loivasti. **Arviot ovat alustavia – tarkistakaa ne.**
- **Käynnit** (`kaynnit`) työmaa- ja tutkimuspalveluissa: jokaiseen käyntiin lisätään matka-aika, yksi tunti ja 0,90 €/km.
- **Lisävalinnat** (`lisavalinnat`, suunnittelussa): tontti, kerrokset ja rakennusten määrä. `kerroin` kasvattaa tunteja palveluittain (esim. rinnetontti rakennesuunnittelu 1,25 = +25 %), `lisaTunnit` lisää tunnit jokaista lisärakennusta kohden. Julkisivupiirros (`js/havainne.js`) muuttuu valintojen mukaan.
- **Tutkimuslaskurin lisävalinnat**: rakennusvuosi, alapohja (laatta / rossipohja / kellari) ja kerrokset. Vanhemmat rakennukset ja rossipohja/kellari lisäävät tarkastustunteja (riskirakenteet). Piirros näyttää perustustavan ja merkit kohtiin, joihin valitut tutkimukset kohdistuvat.
- Uuden palvelun tai kohdetyypin voi lisätä samalla mallilla. Kuvakkeet ovat tiedostossa `js/ikonit.js`.

"Pyydä tarjous" avaa sähköpostin osoitteeseen myynti@arkvisio.fi, ja laskurin valinnat ovat viestissä valmiina.

## Uuden kohteen lisääminen

1. Lisää kohteen kuva kansioon `assets/images/` (esim. `kulosaari-huvila.jpg`, n. 1600 px leveä).
2. Avaa `data/kohteet.js` ja lisää uusi rivi `window.KOHTEET = [` -rivin alle:

   ```js
   { nimi: "Huvila", paikka: "Kulosaari, Helsinki", tyyppi: "uudis", lat: 60.185, lon: 25.010, vuosi: 2025, kuvaus: "Lyhyt kuvaus.", kuva: "assets/images/kulosaari-huvila.jpg" },
   ```

3. Tallenna. Kohde näkyy kartalla.

**Sijainti:** Google Mapsissa oikea klikkaus kohtaan → ylimmäisenä näkyvät luvut, esim. `60.185, 25.010`. Ensimmäinen on `lat`, toinen `lon`. Tarkkaa osoitetta ei tarvitse käyttää, lähialue riittää.

**Tyypit:** `uudis`, `korjaus`, `laajennus`. Tyyppien nimet ja täppien värit ovat saman tiedoston alussa (`KOHDETYYPIT`). **Kuntotutkimuksia ei lisätä kartalle**: ne ovat asiakkaiden yksityisiä kohteita.

**Esimerkkikohteet:** nykyiset kohteet ovat esimerkkejä (`esimerkki: true`) ja näkyvät sivulla "Esimerkki"-merkinnällä. Poista ne, kun oikeat kohteet on lisätty.

Muista pilkku jokaisen rivin perään. Jos kartta tai lista katoaa tallennuksen jälkeen, tiedostossa on luultavasti puuttuva pilkku tai lainausmerkki.

## Kartta

- Lähekkäiset kohteet yhdistyvät ryhmäksi, jossa näkyy kohteiden määrä. Renkaan värit kertovat tyyppien osuudet.
- Ryhmää klikkaamalla kartta lähentää. Lähimmillään näkyy noin kaupunginosan kokoinen alue.
- Zoomaus: hiiren rulla tai kahden sormen nipistys puhelimella (kun karttaa on ensin napautettu). Avauslennon jälkeen Suomi-näkymä on kaukaisin näkymä; kun karttaa ei voi loitontaa enempää, rulla vierittää sivua.
- **Kuormitustesti:** `index.html?testi=1000` näyttää 1000 satunnaista testikohdetta Suomessa. Luvun voi vaihtaa. Ei vaikuta oikeisiin kohteisiin.

## Brändi

| Nimi | Väri | Käyttö |
|---|---|---|
| Grafiitti | #1F2229 | Pääkuva, kartta, tummat osiot |
| Kalkki | #EDEAE5 | Vaaleiden osioiden tausta |
| Pinta | #F7F5F1 | Kortit vaalealla |
| Vaalea | #F4F1EC | Teksti tummalla |
| **Vision Oranssi** | **#F79C09** | Toiminto- ja korostusväri (napin teksti aina tumma) |

Fontit: **Instrument Serif** (otsikot, kuten mainoksen "Suunniteltu arkeen ja juhlaan") ja **Jost** (teksti sekä harvennetut versaalit, esim. palvelurivi).
