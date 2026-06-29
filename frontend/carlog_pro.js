// Scroll reveal : animation d'apparition des éléments quand on scrolle
// L'API IntersectionObserver est plus performante que d'écouter l'événement scroll en continu
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      // Petit délai en cascade (i * 80ms) pour créer un effet d'animation fluide
      // J'ai hésité à utiliser une librairie comme AOS mais ça marche bien comme ça
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      observer.unobserve(e.target); // On arrête d'observer une fois visible pour économiser des ressources
    }
  });
}, { threshold: 0.1 }); // 0.1 = déclenche quand 10% de l'élément est visible
reveals.forEach(el => observer.observe(el));

// Effet visuel sur la navbar quand on scrolle : la bordure devient plus visible
// C'est un petit détail UX qui donne un effet de profondeur
// J'aurais pu utiliser CSS avec position: sticky mais ça marche bien en JS
window.addEventListener('scroll', () => {
  document.querySelector('nav').style.borderBottomColor =
    window.scrollY > 10 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)';
});

// Animation des barres du graphique au chargement de la page
// L'idée : on met la hauteur à 0, puis on la restaure avec un délai pour créer un effet de croissance
// C'est purement cosmétique pour le mockup du dashboard
window.addEventListener('load', () => {
  const bars = document.querySelectorAll('.mock-bar');
  bars.forEach((b, i) => {
    const h = b.style.height; // On sauvegarde la hauteur finale définie en CSS
    b.style.height = '0'; // On commence à 0 pour l'animation
    setTimeout(() => { b.style.height = h; }, 800 + i * 80); // Délai progressif pour l'effet cascade
  });
});
