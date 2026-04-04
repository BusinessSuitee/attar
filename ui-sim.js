(() => {
  "use strict";

  const MAP_URL = "https://maps.google.com/?q=%D8%A7%D9%84%D9%86%D9%88%D8%A8%D8%A7%D8%B1%D9%8A%D8%A9%20%D8%A7%D9%84%D8%A8%D8%AD%D9%8A%D8%B1%D8%A9%20%D9%85%D8%B5%D8%B1";
  const YOUTUBE_URL = "https://www.youtube.com/@AwladElAttar";
  const INSTAGRAM_URL = "https://www.instagram.com/";
  const FACEBOOK_URL = "https://www.facebook.com/";
  const LINKEDIN_URL = "https://www.linkedin.com/";

  let toastTimer = null;

  function normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function lowerText(value) {
    return normalizeText(value).toLowerCase();
  }

  function getCurrentPageName() {
    const fileName = window.location.pathname.split("/").pop();
    return fileName || "index.html";
  }

  function getToastElement() {
    const existingToast = document.getElementById("previewToast") || document.getElementById("uiSimToast");
    if (existingToast) {
      return existingToast;
    }

    const toast = document.createElement("div");
    toast.id = "uiSimToast";
    toast.className =
      "pointer-events-none fixed bottom-6 left-6 z-[80] max-w-xs rounded-lg bg-slate-900 px-4 py-3 text-sm text-white opacity-0 translate-y-2 shadow-xl transition-all duration-300";
    document.body.appendChild(toast);
    return toast;
  }

  function showToast(message, type = "info") {
    const toast = getToastElement();
    if (!toast) return;

    const translatedMessage =
      window.awladI18n && typeof window.awladI18n.translateText === "function"
        ? window.awladI18n.translateText(message)
        : message;
    toast.textContent = translatedMessage;
    toast.classList.remove("opacity-0", "translate-y-2", "bg-slate-900", "bg-emerald-600", "bg-rose-600");

    if (type === "success") {
      toast.classList.add("bg-emerald-600");
    } else if (type === "error") {
      toast.classList.add("bg-rose-600");
    } else {
      toast.classList.add("bg-slate-900");
    }

    toast.classList.add("opacity-100", "translate-y-0");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("opacity-100", "translate-y-0");
      toast.classList.add("opacity-0", "translate-y-2");
    }, 2400);
  }

  function navigateTo(url, message) {
    if (message) {
      showToast(message);
    }
    window.setTimeout(() => {
      window.location.href = url;
    }, 260);
  }

  function openExternal(url, message) {
    showToast(message || "جاري فتح الرابط...");
    window.setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    }, 220);
  }

  function startLoading(button) {
    if (!button || button.dataset.loading === "true") return;
    button.dataset.loading = "true";
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.classList.add("opacity-80", "cursor-not-allowed");
    button.innerHTML = '<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent"></span><span>جاري التنفيذ...</span>';
  }

  function stopLoading(button) {
    if (!button || button.dataset.loading !== "true") return;
    button.disabled = false;
    button.classList.remove("opacity-80", "cursor-not-allowed");
    button.innerHTML = button.dataset.originalHtml || button.innerHTML;
    delete button.dataset.loading;
    delete button.dataset.originalHtml;
  }

  function buildContactUrl(productName) {
    const params = new URLSearchParams();
    params.set("intent", "quote");
    params.set("source", getCurrentPageName());
    if (productName) {
      params.set("product", productName);
    }
    return `contact.html?${params.toString()}`;
  }

  function downloadPlaceholder(fileName, title) {
    const date = new Date();
    const content = [
      "Awlad El Attar - Preview Document",
      `Title: ${title}`,
      `Date: ${date.toISOString()}`,
      "",
      "This is a simulated download file for preview mode.",
      "Final branded PDF will replace this placeholder.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    showToast("تم تنزيل ملف تجريبي بنجاح.", "success");
  }

  function findProductName(control) {
    const label = normalizeText(control.textContent);
    const directMatch = label.match(/(?:لل|لـ)(.+)$/);
    if (directMatch) {
      return normalizeText(directMatch[1]);
    }

    const container = control.closest("article, .group, .relative, section");
    if (!container) return "";

    const title = container.querySelector("h1, h2, h3, h4");
    return title ? normalizeText(title.textContent) : "";
  }

  function scrollToHeading(partialTitle) {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
    const target = headings.find((heading) => normalizeText(heading.textContent).includes(partialTitle));
    if (!target) return false;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function resolveRouteByLabel(label) {
    const lowered = lowerText(label);

    if (/الرئيسية/.test(lowered)) return "index.html";
    if (/شركاؤنا|شركاء/.test(lowered)) return "partners.html";
    if (/المعرض|الصور|الفيديوهات/.test(lowered)) return "gallery.html";
    if (/المحطات|الأراضي|مزارع/.test(lowered)) return "stations.html";
    if (/المحاصيل|المنتجات|الموالح|العنب|البطاطس|البصل|الثوم|المانجو/.test(lowered)) return "products.html";
    if (/من نحن|عن الشركة|عن المجموعة|قصت|الاستدامة|الشهادات|الجودة/.test(lowered)) return "about.html";
    if (/اتصل|تواصل|خدمة العملاء|المبيعات|احجز|طلب/.test(lowered)) return "contact.html";

    return "";
  }

  function shouldIgnoreButton(button) {
    return (
      button.id === "mobileMenuBtn" ||
      button.id === "scrollToAbout" ||
      button.classList.contains("lang-btn") ||
      button.classList.contains("product-filter-btn") ||
      button.classList.contains("gallery-filter-btn")
    );
  }

  function submitBookingRequest(button) {
    const form = document.querySelector("#booking-form form");
    if (!form) return false;

    const fullNameInput = form.querySelector("#fullName");
    const countryInput = form.querySelector("#country");
    const productInput = form.querySelector("#productType");

    const fullName = fullNameInput ? normalizeText(fullNameInput.value) : "";
    const country = countryInput ? normalizeText(countryInput.value) : "";
    const product = productInput ? normalizeText(productInput.value) : "";

    if (!fullName) {
      showToast("من فضلك اكتب اسم العميل.", "error");
      fullNameInput && fullNameInput.focus();
      return true;
    }

    if (!country) {
      showToast("من فضلك اختر الدولة.", "error");
      countryInput && countryInput.focus();
      return true;
    }

    if (!product) {
      showToast("من فضلك اختر نوع المحصول.", "error");
      productInput && productInput.focus();
      return true;
    }

    startLoading(button);

    window.setTimeout(() => {
      stopLoading(button);
      const requestId = `AE-${String(Date.now()).slice(-6)}`;
      showToast(`تم إرسال الطلب بنجاح. رقم المتابعة: ${requestId}`, "success");
    }, 950);

    return true;
  }

  function handleNewsletterAction(button) {
    const section = button.closest("form, footer, section, div");
    const emailInput = section ? section.querySelector('input[type="email"]') : null;
    if (!emailInput) return false;

    const email = normalizeText(emailInput.value);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      showToast("من فضلك أدخل بريد إلكتروني صحيح.", "error");
      emailInput.focus();
      return true;
    }

    startLoading(button);

    window.setTimeout(() => {
      stopLoading(button);
      emailInput.value = "";
      showToast("تم الاشتراك في النشرة البريدية بنجاح.", "success");
    }, 700);

    return true;
  }

  function applyContactPrefillFromQuery() {
    if (!/contact\.html$/i.test(getCurrentPageName())) return;

    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    const product = normalizeText(params.get("product"));
    const intent = normalizeText(params.get("intent"));
    const source = normalizeText(params.get("source"));

    const productSelect = document.getElementById("productType");
    const messageField = document.getElementById("message");

    if (product && productSelect) {
      const options = Array.from(productSelect.options);
      const matched = options.find((option) => {
        const valueText = normalizeText(`${option.value} ${option.textContent}`).toLowerCase();
        return valueText.includes(product.toLowerCase());
      });

      if (matched) {
        productSelect.value = matched.value;
      }
    }

    if (messageField && !normalizeText(messageField.value)) {
      const messageParts = [];
      if (intent === "quote") {
        messageParts.push("طلب عرض سعر");
      }
      if (product) {
        messageParts.push(`للمنتج: ${product}`);
      }
      if (source) {
        messageParts.push(`(مصدر الطلب: ${source})`);
      }

      if (messageParts.length > 0) {
        messageField.value = `${messageParts.join(" ")}.`;
      }
    }

    showToast("تم تجهيز النموذج تلقائياً بناءً على اختيارك.", "success");
  }

  function handlePlaceholderAnchor(anchor) {
    const href = normalizeText(anchor.getAttribute("href"));
    const label = normalizeText(anchor.textContent);
    const lowered = lowerText(label);
    const className = String(anchor.className || "");

    if (href.startsWith("#") && href.length > 1) {
      const target = document.querySelector(href);
      if (target) {
        return false;
      }

      showToast("هذا القسم غير متاح حالياً في النسخة التجريبية.", "error");
      return true;
    }

    if (href && href !== "#" && !href.toLowerCase().startsWith("javascript:")) {
      if (/contact\.html/i.test(href) && /(طلب|احجز|عرض سعر|المبيعات)/.test(lowered)) {
        const productName = findProductName(anchor);
        navigateTo(buildContactUrl(productName), "جاري فتح نموذج الطلب...");
        return true;
      }

      return false;
    }

    if (/google maps|الخريطة|زيارة محطاتنا|موقع mha/.test(lowered)) {
      openExternal(MAP_URL, "جاري فتح الموقع على الخريطة...");
      return true;
    }

    if (/يوتيوب|قناتنا|كل الفيديوهات/.test(lowered)) {
      openExternal(YOUTUBE_URL, "جاري فتح الفيديو...");
      return true;
    }

    if (/انستجرام|instagram/.test(lowered) || className.includes("E1306C") || className.includes("E4405F")) {
      openExternal(INSTAGRAM_URL, "جاري فتح إنستجرام...");
      return true;
    }

    if (/facebook/.test(lowered) || className.includes("1877F2")) {
      openExternal(FACEBOOK_URL, "جاري فتح فيسبوك...");
      return true;
    }

    if (/linkedin/.test(lowered) || className.includes("0A66C2")) {
      openExternal(LINKEDIN_URL, "جاري فتح لينكدإن...");
      return true;
    }

    if (/سياسة الخصوصية/.test(lowered)) {
      showToast("سياسة الخصوصية قيد الإعداد حالياً.");
      return true;
    }

    if (/الشروط|الأحكام/.test(lowered)) {
      showToast("صفحة الشروط والأحكام قيد الإعداد حالياً.");
      return true;
    }

    if (/الوظائف|المدونة|الأسئلة الشائعة|أخبارنا|الأخبار/.test(lowered)) {
      showToast("هذا القسم قيد التطوير حالياً.");
      return true;
    }

    const extractedDigits = label.replace(/[^\d+]/g, "");
    if ((/\+\d/.test(label) || /^\d/.test(label)) && extractedDigits.replace(/\D/g, "").length >= 8) {
      window.location.href = `tel:${extractedDigits}`;
      return true;
    }

    if (lowered === "public") {
      openExternal(FACEBOOK_URL, "جاري فتح الصفحة الاجتماعية...");
      return true;
    }

    if (lowered === "share") {
      openExternal(LINKEDIN_URL, "جاري فتح الصفحة الاجتماعية...");
      return true;
    }

    const route = resolveRouteByLabel(label);
    if (route) {
      navigateTo(route, `جاري فتح ${label}...`);
      return true;
    }

    showToast("العنصر قيد التفعيل في النسخة الحالية.");
    return true;
  }

  function handleButtonAction(button) {
    if (shouldIgnoreButton(button)) {
      return false;
    }

    if (button.closest("#booking-form form")) {
      return false;
    }

    const label = normalizeText(button.textContent);
    const lowered = lowerText(label);

    if (!label) {
      return false;
    }

    if (/اشترك|اشتراك/.test(lowered)) {
      return handleNewsletterAction(button);
    }

    const action = (button.dataset.action || "").toLowerCase();
    if (action === "products") {
      navigateTo("products.html", "جاري فتح صفحة المحاصيل...");
      return true;
    }
    if (action === "contact" || action === "sales") {
      navigateTo(buildContactUrl(""), "جاري فتح نموذج التواصل...");
      return true;
    }
    if (action === "catalog") {
      downloadPlaceholder("awlad-elattar-catalog-preview", "Company Catalog Preview");
      return true;
    }

    if (/اكتشف شبكة صادراتنا/.test(lowered)) {
      if (!scrollToHeading("خريطة الصادرات")) {
        navigateTo("partners.html", "جاري فتح شبكة الصادرات...");
      }
      return true;
    }

    if (/اكتشف المزيد/.test(lowered)) {
      if (!scrollToHeading("مسيرة النجاح") && !scrollToHeading("قصة المؤسس")) {
        navigateTo("about.html", "جاري فتح صفحة من نحن...");
      }
      return true;
    }

    if (/عرض المزيد من الصور/.test(lowered)) {
      button.disabled = true;
      button.classList.add("opacity-70", "cursor-not-allowed");
      showToast("تم عرض كل الصور المتاحة حالياً.", "success");
      return true;
    }

    if (/تحميل/.test(lowered)) {
      downloadPlaceholder("awlad-elattar-company-profile", "Company Profile Preview");
      return true;
    }

    if (/فيديو|شاهد/.test(lowered)) {
      openExternal(YOUTUBE_URL, "جاري تشغيل فيديو تجريبي...");
      return true;
    }

    if (/طلب تسعير|طلب عرض|اطلب عرض|احجز|ابدأ الطلب|تواصل مع المبيعات|تواصل معنا/.test(lowered)) {
      const productName = findProductName(button);
      navigateTo(buildContactUrl(productName), "جاري فتح نموذج الطلب...");
      return true;
    }

    if (/تصفح منتجاتنا|عرض كل المنتجات|منتجاتنا/.test(lowered)) {
      navigateTo("products.html", "جاري فتح صفحة المنتجات...");
      return true;
    }

    if (/زيارة محطاتنا/.test(lowered)) {
      openExternal(MAP_URL, "جاري فتح موقع المحطات على الخريطة...");
      return true;
    }

    const route = resolveRouteByLabel(label);
    if (route) {
      navigateTo(route, `جاري فتح ${label}...`);
      return true;
    }

    showToast("هذا الزر في وضع تجريبي حالياً.");
    return true;
  }

  function bindBookingForm() {
    const form = document.querySelector("#booking-form form");
    if (!form) return;

    const submitButton = form.querySelector('button[type="button"], button[type="submit"]');
    if (!submitButton) return;

    const submitHandler = (event) => {
      event.preventDefault();
      submitBookingRequest(submitButton);
    };

    submitButton.addEventListener("click", submitHandler);
    form.addEventListener("submit", submitHandler);
  }

  function bindVideoCards() {
    const videoCards = Array.from(document.querySelectorAll(".cursor-pointer")).filter((card) => {
      const icons = card.querySelectorAll(".material-symbols-outlined");
      return Array.from(icons).some((icon) => normalizeText(icon.textContent) === "play_arrow");
    });

    videoCards.forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest("a, button")) {
          return;
        }
        openExternal(YOUTUBE_URL, "جاري تشغيل فيديو تجريبي...");
      });
    });
  }

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a");
    if (anchor) {
      if (handlePlaceholderAnchor(anchor)) {
        event.preventDefault();
      }
      return;
    }

    const button = event.target.closest("button");
    if (button && handleButtonAction(button)) {
      event.preventDefault();
    }
  });

  bindBookingForm();
  bindVideoCards();
  applyContactPrefillFromQuery();
})();
