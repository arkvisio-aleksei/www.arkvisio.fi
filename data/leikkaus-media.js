// ============================================================
//  TALO LEIKKAUKSENA – kuvat ja videot tarkastuskohtiin (tutkimus.html)
//  Kun kohdalle lisätään kuva tai video, se näkyy kohdan kortissa.
//  Ilman kuvaa kortissa on varattu paikka ("Kuva tai video tulossa").
//
//  kuva   – esim. "assets/images/leikkaus/katto.jpg" (n. 1600 × 900, vaakakuva 16:9)
//  video  – esim. "assets/video/leikkaus/katto.mp4" (lyhyt, äänetön; kuva toimii esikatselukuvana)
//  teksti – valinnainen kuvateksti
//
//  Kohtien tunnukset:
//    katto, ylapohja, iv, markatila, ulkoseina, palomuuri (rivitalo), julkisivu (taloyhtiö),
//    alapohja, vale (valesokkeli), salaoja, asbesti, energia
// ============================================================

window.LEIKKAUS_MEDIA = {
  // katto: { kuva: "assets/images/leikkaus/katto.jpg", teksti: "Läpivientien tarkastus katolla" },
  // markatila: { video: "assets/video/leikkaus/markatila.mp4", kuva: "assets/images/leikkaus/markatila.jpg" },
};
