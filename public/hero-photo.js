/* Hero photo loader - imagem restaurada */
(function () {
  var i = document.getElementById("hero-photo");
  if (!i) return;
  i.src = "/hero.jpg";
  i.alt = "Sorriso confiante - Clinica Sao Paulo Odontologia em Parnamirim";
  i.style.display = "block";
  i.onerror = function(){ this.style.display="none"; };
})();
