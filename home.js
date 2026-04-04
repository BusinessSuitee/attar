(() => {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const scrollToAboutBtn = document.getElementById("scrollToAbout");
  const aboutSection = document.getElementById("about-founder");
  const langButtons = document.querySelectorAll(".lang-btn");
  const supportedLanguages = ["AR", "EN", "RU"];
  const preferredLanguage = (window.localStorage.getItem("awlad_elattar_lang") || "AR").toUpperCase();

  function getCurrentLanguage() {
    const saved = (window.localStorage.getItem("awlad_elattar_lang") || "AR").toUpperCase();
    return supportedLanguages.includes(saved) ? saved : "AR";
  }

  function setActiveLanguage(langCode, shouldPersist = true) {
    const normalizedLanguage = (langCode || "AR").toUpperCase();
    const safeLanguage = supportedLanguages.includes(normalizedLanguage) ? normalizedLanguage : "AR";

    langButtons.forEach((button) => {
      const isActive = (button.dataset.lang || "").toUpperCase() === safeLanguage;

      button.classList.toggle("active", isActive);
      button.classList.toggle("font-bold", isActive);
      button.classList.toggle("text-slate-900", isActive);
      button.classList.toggle("bg-white", isActive);
      button.classList.toggle("shadow-sm", isActive);
      button.classList.toggle("rounded", isActive);

      button.classList.toggle("font-medium", !isActive);
      button.classList.toggle("text-slate-500", !isActive);
    });

    if (shouldPersist) {
      window.localStorage.setItem("awlad_elattar_lang", safeLanguage);
    }

    window.dispatchEvent(
      new CustomEvent("awlad:lang-change", {
        detail: { language: safeLanguage },
      })
    );
  }

  window.awladLanguage = {
    get: getCurrentLanguage,
    set: (langCode) => setActiveLanguage(langCode, true),
    supported: supportedLanguages.slice(),
  };

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (event) => {
      const clickedInsideMenu = mobileMenu.contains(event.target);
      const clickedMenuButton = mobileMenuBtn.contains(event.target);
      if (!clickedInsideMenu && !clickedMenuButton) {
        mobileMenu.classList.add("hidden");
      }
    });
  }

  if (scrollToAboutBtn && aboutSection) {
    scrollToAboutBtn.addEventListener("click", () => {
      aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (langButtons.length > 0) {
    setActiveLanguage(preferredLanguage, false);

    langButtons.forEach((button) => {
      button.addEventListener("click", () => {
        window.awladLanguage.set(button.dataset.lang || "AR");
      });
    });
  } else {
    setActiveLanguage(preferredLanguage, false);
  }
})();
