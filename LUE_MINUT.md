# ArkVisio – verkkosivusto

Tavallinen HTML-sivusto. Ei asennuksia eikä työkaluja: avaa `index.html` selaimessa, tai siirrä koko kansio palvelimelle sellaisenaan.

## Kansiot

| Polku | Sisältö |
|---|---|
| `index.html` | Etusivu (rakennetaan uudelleen: nyt yläpalkki, iskulause ja alatunniste) |
| `suunnittelu.html`, `tyomaa.html`, `tutkimus.html` | Palvelusivut hintalaskureineen |
| `kohteet.html` | Kohteemme: nostokohde, suodatettava kohderuudukko ja kohdeikkuna (`js/kohteet.js`). **Kohteet ja kuvat: `data/referenssit.js`** (nyt esimerkkejä) |
| `toimisto.html` | Toimisto: yhteystiedot ja henkilöt (henkilöt nyt esimerkkejä – nimet, kuvat ja numerot vaihdetaan suoraan tiedostoon) |
| `css/tyylit.css` | Kaikki tyylit. **Brändin värit, fontit ja mitat ovat tiedoston alussa muuttujina.** |
| `js/kartta.js` | Maapallo, kohteiden ryhmittely ja zoomaus |
| `js/sivu.js` | Etusivun suodattimet ja hankelaskuri |
| `js/valikko.js` | Mobiilivalikko (kaikilla sivuilla) |
| `js/laskuri.js`, `js/ikonit.js`, `js/akso.js` | Palvelusivujen hintalaskuri, kuvakkeet ja aksonometriapiirros, joka muuttuu valintojen mukaan |
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
- **Lisävalinnat** (`lisavalinnat`, suunnittelussa): tontti, kerrokset ja rakennusten määrä. `kerroin` kasvattaa tunteja palveluittain (esim. rinnetontti rakennesuunnittelu 1,25 = +25 %), `lisaTunnit` lisää tunnit jokaista lisärakennusta kohden. Aksonometriapiirros (`js/akso.js`) muuttuu valintojen mukaan. Kerroksia voi valita rajattomasti, ja kellari ja asuinullakko ovat omia valintojaan.
- **Tutkimuslaskurin lisävalinnat**: rakennusvuosi, alapohja (laatta / rossipohja / kellari) ja kerrokset. Vanhemmat rakennukset ja rossipohja/kellari lisäävät tarkastustunteja (riskirakenteet). Piirros näyttää perustustavan ja merkit kohtiin, joihin valitut tutkimukset kohdistuvat.
- Suunnittelu- ja työmaalaskurissa on myös kerrostalo, liike- tai toimitila ja halli. **Niiden tuntiarviot ovat alustavia – tarkistakaa ne.**
- Uuden palvelun tai kohdetyypin voi lisätä samalla mallilla. Kuvakkeet ovat tiedostossa `js/ikonit.js`.

"Pyydä tarjous" avaa sähköpostin osoitteeseen myynti@arkvisio.fi, ja laskurin valinnat ovat viestissä valmiina.

## Uuden kohteen lisääminen

Avaa `data/kohteet.js` ja lisää uusi rivi `window.KOHTEET = [` -rivin alle:

```js
{ paikka: "Kavaljeerintie 4C, Vantaa", tyyppi: "vantaa", lat: 60.29511, lon: 24.94431 },
```

Tallenna. Kohde näkyy kartalla.

**Sijainti:** Google Mapsissa oikea klikkaus kohtaan → ylimmäisenä näkyvät luvut, esim. `60.185, 25.010`. Ensimmäinen on `lat`, toinen `lon`.

**Alueet (`tyyppi`):** `helsinki`, `espoo`, `vantaa`, `uusimaa` (muu Uusimaa) ja `muu` (muu Suomi). Nimet ja täppien värit ovat saman tiedoston alussa (`KOHDETYYPIT`), ja suodattimet muodostuvat niistä.

**Yksityisyys:** kartalla näytetään vain katu ja talon numero, ei rappua eikä asunnon numeroa. Kuntotutkimuksia ei lisätä kartalle.

Valinnaisia kenttiä: `nimi` (esim. "Huvila"), `vuosi` ja `kuvaus`.

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
