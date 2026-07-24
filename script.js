const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const navbar = document.querySelector(".navbar");
const leadForm = document.getElementById("leadForm");
const calculatorForm = document.getElementById("calculatorForm");
const galleryItems = Array.from(document.querySelectorAll("[data-gallery-index]"));
const galleryLightbox = document.getElementById("galleryLightbox");
const galleryLightboxImage = document.getElementById("galleryLightboxImage");
const galleryLightboxCaption = document.getElementById("galleryLightboxCaption");
const galleryLightboxCounter = document.getElementById("galleryLightboxCounter");
const galleryClose = document.getElementById("galleryClose");
const galleryPrevious = document.getElementById("galleryPrev");
const galleryNext = document.getElementById("galleryNext");
let galleryCurrentIndex = 0;

function closeMenu() {
  if (!menuBtn || !navLinks) return;
  menuBtn.classList.remove("active");
  navLinks.classList.remove("active");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-label", "Ouvrir le menu");
  document.body.classList.remove("menu-open");
}

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");
    menuBtn.classList.toggle("active", isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    menuBtn.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
    document.body.classList.toggle("menu-open", isOpen);
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

window.addEventListener("scroll", () => {
  if (!navbar) return;
  navbar.classList.toggle("scrolled", window.scrollY > 40);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    closeMenu();
  }
});

function sendLead(event) {
  event.preventDefault();

  const name = limitText(document.getElementById("name")?.value, 80);
  const phone = limitText(document.getElementById("phone")?.value, 25);
  const project = document.getElementById("project")?.value;
  const message = limitText(document.getElementById("message")?.value, 700);
  const status = document.getElementById("formStatus");

  if (!name || !phone || !project) {
    if (status) {
      status.textContent = "Merci de compléter les champs obligatoires.";
    }
    return;
  }

  if (!isValidPhone(phone)) {
    if (status) {
      status.textContent = "Vérifiez le numéro de téléphone indiqué.";
    }
    return;
  }

  const text = [
    `Bonjour LL Carrelage, je m'appelle ${name}.`,
    `Téléphone : ${phone}`,
    `Projet : ${project}`,
    message ? `Message : ${message}` : "Pouvez-vous me recontacter ?"
  ].join("\n");

  const url = `https://wa.me/33618855886?text=${encodeURIComponent(text)}`;

  if (status) {
    status.textContent = "Demande prête. Ouverture de WhatsApp...";
  }

  const whatsappWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (whatsappWindow) {
    whatsappWindow.opener = null;
  }
}

function limitText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function isValidPhone(value) {
  return /^[0-9+().\s-]{8,25}$/.test(String(value || "").trim());
}

function showGalleryImage(index) {
  if (!galleryItems.length || !galleryLightboxImage) return;
  galleryCurrentIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[galleryCurrentIndex];
  const image = item.querySelector("img");

  galleryLightboxImage.src = image?.getAttribute("src") || "";
  galleryLightboxImage.alt = image?.alt || "Réalisation LL Carrelage";
  if (galleryLightboxCaption) galleryLightboxCaption.textContent = item.dataset.galleryCaption || "Réalisation LL Carrelage";
  if (galleryLightboxCounter) galleryLightboxCounter.textContent = `${galleryCurrentIndex + 1} / ${galleryItems.length}`;
}

function openGallery(index) {
  if (!galleryLightbox) return;
  showGalleryImage(index);
  if (typeof galleryLightbox.showModal === "function") {
    galleryLightbox.showModal();
  } else {
    galleryLightbox.setAttribute("open", "");
  }
}

function closeGallery() {
  if (!galleryLightbox) return;
  if (typeof galleryLightbox.close === "function") {
    galleryLightbox.close();
  } else {
    galleryLightbox.removeAttribute("open");
  }
}

// Tarifs indicatifs faciles à ajuster au même endroit.
const calculatorBaseRates = Object.freeze({
  interior: 30,
  terrace: 30,
  bathroom: 45,
  shower: 50,
  "kitchen-wall": 25,
  "bathroom-wall": 25,
  stairs: 50,
  baseboards: 15,
});

const calculatorAdjustments = Object.freeze({
  format: { small: 5, 30: 0, 45: 0, 60: 0, 80: 10, 120: 15, other: 5 },
  support: { slab: 0, screed: 0, "old-tiles": 6, wood: 15, unknown: 5 },
  removal: { none: 0, tiles: 15, parquet: 10, pvc: 7, carpet: 7, unknown: 5 },
  flat: { Oui: 0, Non: 12, "Je ne sais pas": 5 },
});

const calculatorSteps = Array.from(document.querySelectorAll("[data-calc-step]"));
const calculatorPrevious = document.getElementById("calcPrev");
const calculatorNext = document.getElementById("calcNext");
const calculatorSubmit = document.getElementById("calcSubmit");
const calculatorRestart = document.getElementById("calcRestart");
const calculatorError = document.getElementById("calcFormError");
let calculatorStepIndex = 0;
let calculatorHasEstimate = false;
const calculatorInvalidClass = "is-invalid";

function getSelectLabel(id) {
  const select = document.getElementById(id);
  return limitText(select?.selectedOptions?.[0]?.textContent, 120);
}

function getRadioAnswer(name) {
  return limitText(document.querySelector(`input[name="${name}"]:checked`)?.value, 120);
}

function setCalculatorText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function getCalculatorField(control) {
  return control?.closest(".calculator-field") || control;
}

function getCalculatorHeaderOffset() {
  const headerHeight = navbar?.getBoundingClientRect().height || 0;
  return headerHeight + 22;
}

function clearCalculatorInvalidState(control) {
  if (!control) return;
  const field = getCalculatorField(control);
  field?.classList.remove(calculatorInvalidClass);

  if (control.name && (control.type === "radio" || control.type === "checkbox")) {
    document.querySelectorAll(`input[name="${control.name}"]`).forEach((input) => {
      input.removeAttribute("aria-invalid");
    });
    return;
  }

  control.removeAttribute("aria-invalid");
}

function clearAllCalculatorInvalidStates() {
  calculatorForm?.querySelectorAll(`.${calculatorInvalidClass}`).forEach((field) => {
    field.classList.remove(calculatorInvalidClass);
  });
  calculatorForm?.querySelectorAll("[aria-invalid]").forEach((control) => {
    control.removeAttribute("aria-invalid");
  });
}

function markCalculatorInvalidControl(control) {
  if (!control) return;
  const field = getCalculatorField(control);
  field?.classList.remove(calculatorInvalidClass);
  void field?.offsetWidth;
  field?.classList.add(calculatorInvalidClass);

  if (control.name && (control.type === "radio" || control.type === "checkbox")) {
    document.querySelectorAll(`input[name="${control.name}"]`).forEach((input) => {
      input.setAttribute("aria-invalid", "true");
    });
    return;
  }

  control.setAttribute("aria-invalid", "true");
}

function focusCalculatorControl(control) {
  if (!control) return;

  try {
    control.focus({ preventScroll: true });
  } catch (error) {
    control.focus();
  }
}

function scrollToCalculatorControl(control) {
  const target = getCalculatorField(control);
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

  window.setTimeout(() => {
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - getCalculatorHeaderOffset();
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
  }, 80);

  window.setTimeout(() => {
    focusCalculatorControl(control);
  }, 260);

  window.setTimeout(() => {
    const rect = target.getBoundingClientRect();
    const headerOffset = getCalculatorHeaderOffset();
    if (rect.top < headerOffset || rect.bottom > window.innerHeight - 24) {
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    }
  }, 620);
}

function scrollToCalculatorStep(stepElement) {
  if (!stepElement) return;

  window.setTimeout(() => {
    const firstField =
      stepElement.querySelector(".calculator-field") ||
      stepElement.querySelector("fieldset") ||
      stepElement.querySelector("select, input:not([type='hidden']), textarea, button") ||
      stepElement;

    const headerHeight = navbar?.getBoundingClientRect().height || 0;
    const extraOffset = 24;
    const top =
      firstField.getBoundingClientRect().top +
      window.scrollY -
      headerHeight -
      extraOffset;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  }, 100);
}

function formatEuros(value) {
  return `${Math.round(value).toLocaleString("fr-FR")} €`;
}

function getCalculatorData() {
  const projectSelect = document.getElementById("calcProject");
  const formatSelect = document.getElementById("calcTileFormat");
  const supportSelect = document.getElementById("calcSupport");
  const removalSelect = document.getElementById("calcRemoval");

  return {
    projectKey: projectSelect?.value || "",
    project: getSelectLabel("calcProject"),
    surface: Number(document.getElementById("calcSurface")?.value || 0),
    tilesBought: getRadioAnswer("calcTilesBought"),
    formatKey: formatSelect?.value || "",
    format: getSelectLabel("calcTileFormat"),
    supportKey: supportSelect?.value || "",
    support: getSelectLabel("calcSupport"),
    removalKey: removalSelect?.value || "",
    removal: getSelectLabel("calcRemoval"),
    flat: getRadioAnswer("calcFlat"),
    baseboards: getRadioAnswer("calcBaseboards"),
    timeline: getSelectLabel("calcTimeline"),
    city: limitText(document.getElementById("calcCity")?.value, 80),
    name: limitText(document.getElementById("calcName")?.value, 80),
    phone: limitText(document.getElementById("calcPhone")?.value, 25),
    email: limitText(document.getElementById("calcEmail")?.value, 120),
    message: limitText(document.getElementById("calcMessage")?.value, 700),
  };
}

function calculateQuote() {
  const data = getCalculatorData();
  const quoteLink = document.getElementById("quoteWhatsapp");
  const quoteEmpty = document.getElementById("quoteEmpty");
  const quoteContent = document.getElementById("quoteContent");

  if (!quoteLink || !quoteEmpty || !quoteContent || !data.surface || !data.projectKey) return false;

  const baseRate = calculatorBaseRates[data.projectKey] || 0;
  const formatAdjustment = calculatorAdjustments.format[data.formatKey] || 0;
  const supportAdjustment = calculatorAdjustments.support[data.supportKey] || 0;
  const removalAdjustment = calculatorAdjustments.removal[data.removalKey] || 0;
  const flatAdjustment = calculatorAdjustments.flat[data.flat] || 0;
  const baseboardsAdjustment = data.baseboards === "Oui" && data.projectKey !== "baseboards" ? 10 : 0;
  const estimatedRate = baseRate + formatAdjustment + supportAdjustment + removalAdjustment + flatAdjustment + baseboardsAdjustment;
  const averagePrice = estimatedRate * data.surface;
  const lowPrice = Math.round(averagePrice * 0.85);
  const highPrice = Math.round(averagePrice * 1.15);

  setCalculatorText("quoteLow", formatEuros(lowPrice));
  setCalculatorText("quoteHigh", formatEuros(highPrice));
  setCalculatorText("quoteAverage", formatEuros(averagePrice));
  setCalculatorText("quotePerM2", `${Math.round(estimatedRate)} €/m²`);
  setCalculatorText("quoteSupplyNote", data.tilesBought === "Oui"
    ? "Le carrelage est déjà acheté."
    : "Le choix du carrelage pourra être accompagné par LL Carrelage.");

  setCalculatorText("summaryProject", data.project);
  setCalculatorText("summarySurface", `${data.surface.toLocaleString("fr-FR")} m²`);
  setCalculatorText("summaryCity", data.city);
  setCalculatorText("summaryTiles", data.tilesBought);
  setCalculatorText("summaryFormat", data.format);
  setCalculatorText("summarySupport", data.support);
  setCalculatorText("summaryRemoval", data.removal);
  setCalculatorText("summaryFlat", data.flat);
  setCalculatorText("summaryBaseboards", data.baseboards);
  setCalculatorText("summaryTimeline", data.timeline);
  setCalculatorText("summaryContact", `${data.name} · ${data.phone}${data.email ? ` · ${data.email}` : ""}`);

  const whatsappMessage = [
    "Bonjour LL Carrelage, je souhaite vous envoyer ma demande de devis.",
    "",
    `Type de chantier : ${data.project}`,
    `Surface : ${data.surface} m²`,
    `Ville : ${data.city}`,
    `Carrelage déjà acheté : ${data.tilesBought}`,
    `Format du carrelage : ${data.format}`,
    `Support actuel : ${data.support}`,
    `Ancien revêtement : ${data.removal}`,
    `Sol ou mur plat : ${data.flat}`,
    `Pose des plinthes : ${data.baseboards}`,
    `Délai souhaité : ${data.timeline}`,
    `Nom : ${data.name}`,
    `Téléphone : ${data.phone}`,
    `Email : ${data.email || "Non renseigné"}`,
    `Message complémentaire : ${data.message || "Aucun"}`,
    `Estimation indicative : ${formatEuros(lowPrice)} - ${formatEuros(highPrice)}`,
    "Hors fourniture du carrelage sauf indication contraire.",
  ].join("\n");

  quoteLink.href = `https://wa.me/33618855886?text=${encodeURIComponent(whatsappMessage)}`;
  quoteLink.classList.remove("disabled");
  quoteLink.setAttribute("aria-disabled", "false");
  quoteEmpty.hidden = true;
  quoteContent.hidden = false;
  return true;
}

function updateCalculatorStep(nextIndex, shouldScroll = false) {
  if (!calculatorSteps.length) return;
  calculatorStepIndex = Math.max(0, Math.min(nextIndex, calculatorSteps.length - 1));

  calculatorSteps.forEach((step, index) => {
    const isActive = index === calculatorStepIndex;
    step.hidden = !isActive;
    step.classList.toggle("is-active", isActive);
  });

  const progress = Math.round(((calculatorStepIndex + 1) / calculatorSteps.length) * 100);
  setCalculatorText("calcStepLabel", `Étape ${calculatorStepIndex + 1} sur ${calculatorSteps.length}`);
  setCalculatorText("calcProgressPercent", `${progress} %`);
  const progressBar = document.getElementById("calcProgressBar");
  const progressTrack = document.getElementById("calcProgressTrack");
  if (progressBar) progressBar.dataset.progress = String(progress);
  if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(progress));

  if (calculatorPrevious) calculatorPrevious.hidden = calculatorStepIndex === 0;
  if (calculatorNext) calculatorNext.hidden = calculatorStepIndex === calculatorSteps.length - 1;
  if (calculatorSubmit) calculatorSubmit.hidden = calculatorStepIndex !== calculatorSteps.length - 1;
  if (calculatorError) calculatorError.textContent = "";

  if (shouldScroll) {
    scrollToCalculatorStep(calculatorSteps[calculatorStepIndex]);
  }
}

function validateCalculatorStep() {
  const currentStep = calculatorSteps[calculatorStepIndex];
  if (!currentStep) return false;
  const controls = Array.from(currentStep.querySelectorAll("input, select, textarea"));
  const invalidControl = controls.find((control) => !control.checkValidity());

  if (invalidControl) {
    if (calculatorError) calculatorError.textContent = "Merci de répondre aux questions de cette étape.";
    markCalculatorInvalidControl(invalidControl);
    scrollToCalculatorControl(invalidControl);
    return false;
  }

  return true;
}

function restartCalculator() {
  if (!calculatorForm) return;
  calculatorForm.reset();
  calculatorHasEstimate = false;
  clearAllCalculatorInvalidStates();
  updateCalculatorStep(0);

  const quoteEmpty = document.getElementById("quoteEmpty");
  const quoteContent = document.getElementById("quoteContent");
  const quoteLink = document.getElementById("quoteWhatsapp");
  if (quoteEmpty) quoteEmpty.hidden = false;
  if (quoteContent) quoteContent.hidden = true;
  if (quoteLink) {
    quoteLink.href = "https://wa.me/33618855886";
    quoteLink.classList.add("disabled");
    quoteLink.setAttribute("aria-disabled", "true");
  }

  document.getElementById("devis")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const animatedElements = document.querySelectorAll(
  ".section, .stats, .card, .gallery-item, .review-box, .calculator-box, .form"
);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  animatedElements.forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
} else {
  animatedElements.forEach((element) => element.classList.add("visible"));
}

updateCalculatorStep(0);

if (leadForm) {
  leadForm.addEventListener("submit", sendLead);
}

if (calculatorForm) {
  calculatorForm.noValidate = true;

  calculatorNext?.addEventListener("click", () => {
    const isValid = validateCalculatorStep();

    if (!isValid) {
      return;
    }

    updateCalculatorStep(calculatorStepIndex + 1, true);
  });

  calculatorPrevious?.addEventListener("click", () => {
    updateCalculatorStep(calculatorStepIndex - 1);
  });

  calculatorRestart?.addEventListener("click", restartCalculator);

  calculatorForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateCalculatorStep() || !calculatorForm.checkValidity()) {
      calculatorForm.reportValidity();
      return;
    }

    const data = getCalculatorData();
    if (!isValidPhone(data.phone)) {
      if (calculatorError) calculatorError.textContent = "Vérifiez le numéro de téléphone indiqué.";
      document.getElementById("calcPhone")?.focus();
      return;
    }

    calculatorHasEstimate = calculateQuote();
    document.getElementById("quoteContent")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  calculatorForm.addEventListener("input", () => {
    if (calculatorHasEstimate && calculatorForm.checkValidity()) {
      calculateQuote();
    }
  });

  calculatorForm.addEventListener("input", (event) => {
    if (event.target?.checkValidity?.()) {
      clearCalculatorInvalidState(event.target);
    }
  });

  calculatorForm.addEventListener("change", (event) => {
    if (event.target?.checkValidity?.()) {
      clearCalculatorInvalidState(event.target);
    }
  });
}

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => openGallery(index));
});

galleryClose?.addEventListener("click", closeGallery);
galleryPrevious?.addEventListener("click", () => showGalleryImage(galleryCurrentIndex - 1));
galleryNext?.addEventListener("click", () => showGalleryImage(galleryCurrentIndex + 1));

galleryLightbox?.addEventListener("click", (event) => {
  if (event.target === galleryLightbox) closeGallery();
});

galleryLightbox?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") showGalleryImage(galleryCurrentIndex - 1);
  if (event.key === "ArrowRight") showGalleryImage(galleryCurrentIndex + 1);
});
