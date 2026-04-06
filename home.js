(() => {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const scrollToAboutBtn = document.getElementById("scrollToAbout");
  const aboutSection = document.getElementById("about-founder");
  const langButtons = document.querySelectorAll(".lang-btn");
  const supportedLanguages = ["AR", "EN", "RU"];
  const preferredLanguage = (
    window.localStorage.getItem("awlad_elattar_lang") || "AR"
  ).toUpperCase();

  function getCurrentLanguage() {
    const saved = (
      window.localStorage.getItem("awlad_elattar_lang") || "AR"
    ).toUpperCase();
    return supportedLanguages.includes(saved) ? saved : "AR";
  }

  function setActiveLanguage(langCode, shouldPersist = true) {
    const normalizedLanguage = (langCode || "AR").toUpperCase();
    const safeLanguage = supportedLanguages.includes(normalizedLanguage)
      ? normalizedLanguage
      : "AR";

    langButtons.forEach((button) => {
      const isActive =
        (button.dataset.lang || "").toUpperCase() === safeLanguage;

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
      }),
    );
  }

  window.awladLanguage = {
    get: getCurrentLanguage,
    set: (langCode) => setActiveLanguage(langCode, true),
    supported: supportedLanguages.slice(),
  };

  function parseAttributeNumber(value, fallback = NaN) {
    const parsed = Number.parseInt(String(value ?? "").trim(), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function initScrollReveal() {
    const revealNodes = Array.from(document.querySelectorAll("[data-reveal]"));
    if (revealNodes.length === 0) {
      return;
    }

    document.documentElement.classList.add("reveal-ready");

    const hasIntersectionObserver = "IntersectionObserver" in window;
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const staggerGroups = Array.from(
      document.querySelectorAll("[data-reveal-stagger]"),
    );
    staggerGroups.forEach((group) => {
      const staggerStep = parseAttributeNumber(group.dataset.revealStagger, 90);
      if (!Number.isFinite(staggerStep) || staggerStep < 0) {
        return;
      }

      const revealChildren = Array.from(group.children).filter(
        (child) =>
          child instanceof HTMLElement && child.hasAttribute("data-reveal"),
      );

      revealChildren.forEach((child, index) => {
        if (child.dataset.revealDelay) {
          return;
        }
        child.style.setProperty("--reveal-delay", `${index * staggerStep}ms`);
      });
    });

    revealNodes.forEach((node) => {
      const delay = parseAttributeNumber(node.dataset.revealDelay);
      if (Number.isFinite(delay) && delay >= 0) {
        node.style.setProperty("--reveal-delay", `${delay}ms`);
      }

      const duration = parseAttributeNumber(node.dataset.revealDuration);
      if (Number.isFinite(duration) && duration >= 150) {
        node.style.setProperty("--reveal-duration", `${duration}ms`);
      }

      const distance = parseAttributeNumber(node.dataset.revealDistance);
      if (Number.isFinite(distance) && distance > 0) {
        const revealType = (node.dataset.reveal || "up").toLowerCase();

        if (revealType === "left") {
          node.style.setProperty("--reveal-translate-x", `${distance}px`);
        } else if (revealType === "right") {
          node.style.setProperty("--reveal-translate-x", `-${distance}px`);
        } else if (revealType === "down") {
          node.style.setProperty("--reveal-translate-y", `-${distance}px`);
        } else {
          node.style.setProperty("--reveal-translate-y", `${distance}px`);
        }
      }
    });

    if (prefersReducedMotion || !hasIntersectionObserver) {
      revealNodes.forEach((node) => {
        node.classList.add("reveal-visible");
      });
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const node = entry.target;
          const once =
            (node.dataset.revealOnce || "true").toLowerCase() !== "false";

          if (entry.isIntersecting) {
            node.classList.add("reveal-visible");
            if (once) {
              revealObserver.unobserve(node);
            }
            return;
          }

          if (!once) {
            node.classList.remove("reveal-visible");
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -12% 0px",
      },
    );

    revealNodes.forEach((node) => {
      revealObserver.observe(node);
    });
  }

  initScrollReveal();

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
