// Runs synchronously in <head> to apply saved preferences before first paint (no theme flash).
(function () {
  try {
    var theme = localStorage.getItem('100top_theme');
    if (theme === 'emerald' || theme === 'midnight' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    var scale = localStorage.getItem('100top_arabic_scale');
    if (scale === 'sm' || scale === 'md' || scale === 'lg' || scale === 'xl') {
      document.documentElement.setAttribute('data-arabic-scale', scale);
    }
  } catch (e) {
    /* storage unavailable */
  }
  document.documentElement.classList.add('js');
})();
