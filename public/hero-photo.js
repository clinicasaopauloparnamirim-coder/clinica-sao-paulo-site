/* Hero photo loader - limpo. Foto sera restaurada via arquivo estatico. */
(function () {
  var i = document.getElementById("hero-photo");
  if (!i) return;
  // Sem data URI corrompido. Area usa background CSS do index.html.
  i.removeAttribute("src");
  i.alt = "Sorriso confiante — Clínica São Paulo Odontologia em Parnamirim";
})();
