(() => {
  const config = window.SITE_CONFIG || {};
  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("js");

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value) element.textContent = value;
  };

  setText("[data-price-label]", config.priceLabel || "Cena do uzupełnienia");
  setText("[data-seller-name]", config.sellerName || "Dane sprzedawcy do uzupełnienia");
  setText("[data-current-year]", String(new Date().getFullYear()));

  const safeHttpsUrl = (value) => {
    if (!value || typeof value !== "string") return "";
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  };

  const checkoutUrl = safeHttpsUrl(config.checkoutUrl);
  const purchaseStatus = document.querySelector("[data-purchase-status]");
  document.querySelectorAll("[data-buy-link]").forEach((link) => {
    if (checkoutUrl) {
      link.href = checkoutUrl;
      link.removeAttribute("aria-disabled");
      link.dataset.ready = "true";
    } else {
      link.href = "#purchase-info";
      link.setAttribute("aria-describedby", "purchase-info");
      link.dataset.ready = "false";
    }
  });

  if (purchaseStatus) {
    if (checkoutUrl) {
      purchaseStatus.textContent = "Płatność i dostarczenie pliku obsługuje podłączona platforma sprzedażowa.";
      purchaseStatus.dataset.live = "true";
    } else {
      purchaseStatus.textContent = "Wersja demonstracyjna — płatność i dostarczenie PDF nie są jeszcze podłączone.";
    }
  }

  const contactLink = document.querySelector("[data-contact-link]");
  const email = typeof config.contactEmail === "string" ? config.contactEmail.trim() : "";
  if (contactLink && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    contactLink.href = `mailto:${email}`;
    contactLink.textContent = email;
  }

  const legalKeys = {
    terms: "termsUrl",
    privacy: "privacyUrl",
    consumer: "consumerRightsUrl"
  };
  Object.entries(legalKeys).forEach(([key, configKey]) => {
    const link = document.querySelector(`[data-legal-link="${key}"]`);
    const url = safeHttpsUrl(config[configKey]);
    if (link && url) {
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const note = link.querySelector("span");
      if (note) note.remove();
    }
  });

  const menuButton = document.querySelector(".nav-toggle");
  const menu = document.querySelector("#site-nav");
  if (menuButton && menu) {
    const closeMenu = () => {
      menu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Otwórz menu");
    };
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Otwórz menu" : "Zamknij menu");
      menu.classList.toggle("is-open", !isOpen);
    });
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -28px 0px" });
    revealItems.forEach((item) => observer.observe(item));
  }
})();
