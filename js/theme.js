
window.DKYTheme = (function() {
  "use strict";
  
  const THEME_KEY = "dky-theme";
  
  function applyTheme(mode) {
    document.documentElement.classList.toggle("light", mode === "light");
    document.documentElement.classList.toggle("dark", mode === "dark");
    
    const iconSun = document.getElementById("icon-sun");
    const iconMoon = document.getElementById("icon-moon");
    
    if (iconSun && iconMoon) {
      iconSun.style.display = mode === "dark" ? "" : "none";
      iconMoon.style.display = mode === "dark" ? "none" : "";
    }
  }
  
  function init() {
    const saved = localStorage.getItem(THEME_KEY) || "dark";
    applyTheme(saved);
    
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
    }
  }
  
  return { init };
})();