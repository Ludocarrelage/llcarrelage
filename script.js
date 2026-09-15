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
let galleryTouchStartX = 0;
let galleryTouchStartY = 0;

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

function clearLeadDraft() {
  const draftLink = document.getElementById("leadWhatsapp");
  const status = document.getElementById("formStatus");
  if (draftLink) {
    draftLink.hidden = true;
    draftLink.removeAttribute("href");
  }
  if (status) status.textContent = "";
}

function sendLead(event) {
  event.preventDefault();
  clearLeadDraft();

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
  const draftLink = document.getElementById("leadWhatsapp");

  // Leave a usable link even when the browser blocks the new window.
  if (draftLink) {
    draftLink.href = url;
    draftLink.hidden = false;
  }

  if (status) {
    status.textContent = "Votre message est prêt. Envoyez-le dans WhatsApp pour que je reçoive votre demande.";
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

function isValidFrenchPostalCode(value) {
  return /^[0-9]{5}$/.test(String(value || "").trim());
}

function showGalleryImage(index) {
  if (!galleryItems.length || !galleryLightboxImage) return;
  galleryCurrentIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[galleryCurrentIndex];
  const image = item.querySelector("img");

  galleryLightboxImage.src = item.dataset.gallerySrc || image?.currentSrc || image?.getAttribute("src") || "";
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
  galleryLightbox.classList.add("is-open");
}

function closeGallery() {
  if (!galleryLightbox) return;
  if (typeof galleryLightbox.close === "function") {
    galleryLightbox.close();
  } else {
    galleryLightbox.removeAttribute("open");
  }
  galleryLightbox.classList.remove("is-open");
}

const calculatorSteps = Array.from(document.querySelectorAll("[data-calc-step]"));
const calculatorPrevious = document.getElementById("calcPrev");
const calculatorNext = document.getElementById("calcNext");
const calculatorSubmit = document.getElementById("calcSubmit");
const calculatorRestart = document.getElementById("calcRestart");
const calculatorError = document.getElementById("calcFormError");
let calculatorStepIndex = 0;
let calculatorHasSummary = false;
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

function updateCalculatorPostalCodeValidity() {
  const postalCodeField = document.getElementById("calcPostalCode");
  if (!postalCodeField) return;

  const value = String(postalCodeField.value || "").trim();
  postalCodeField.setCustomValidity(value && !isValidFrenchPostalCode(value)
    ? "Indiquez un code postal valide à 5 chiffres."
    : "");
}

function getCalculatorValidationMessage(control) {
  if (control?.id === "calcPostalCode") {
    return "Indiquez un code postal valide à 5 chiffres.";
  }

  return "Merci de répondre aux questions de cette étape.";
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

function scrollToCalculatorControl(control) {
  const target = getCalculatorField(control);
  if (!target) return;

  window.setTimeout(() => {
    const targetPosition = target.getBoundingClientRect().top + window.scrollY - getCalculatorHeaderOffset();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, 50);
}

function scrollToActiveStepHeading() {
  window.setTimeout(() => {
    const activeStep = calculatorSteps[calculatorStepIndex];

    if (!activeStep || activeStep.hidden) {
      return;
    }

    const stepHeading = activeStep.querySelector(".calculator-step-heading");
    const firstQuestion = activeStep.querySelector(".calculator-field");
    const target = stepHeading || firstQuestion || activeStep;
    const headerHeight = navbar?.getBoundingClientRect().height || 0;
    const safeOffset = 18;
    const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - safeOffset;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, 150);
}

function animateActiveCalculatorStep() {
  const activeStep = calculatorSteps[calculatorStepIndex];

  if (!activeStep) return;

  activeStep.classList.remove("calculator-step-enter");
  void activeStep.offsetWidth;
  activeStep.classList.add("calculator-step-enter");

  window.setTimeout(() => {
    activeStep.classList.remove("calculator-step-enter");
  }, 450);
}

function scrollToProjectSummary() {
  window.setTimeout(() => {
    const quoteContent = document.getElementById("quoteContent");

    if (!quoteContent || quoteContent.hidden) {
      return;
    }

    const summaryHeading = quoteContent.querySelector(".quote-kicker") || quoteContent.querySelector("h3") || quoteContent;
    const headerHeight = navbar?.getBoundingClientRect().height || 0;
    const safeOffset = 18;
    const targetPosition = summaryHeading.getBoundingClientRect().top + window.scrollY - headerHeight - safeOffset;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, 150);
}

function animateProjectSummary() {
  const quoteContent = document.getElementById("quoteContent");

  if (!quoteContent || quoteContent.hidden) {
    return;
  }

  quoteContent.classList.remove("quote-content-enter");
  void quoteContent.offsetWidth;
  quoteContent.classList.add("quote-content-enter");

  window.setTimeout(() => {
    quoteContent.classList.remove("quote-content-enter");
  }, 500);
}

function getCalculatorProjectUnit(projectKey) {
  return projectKey === "baseboards" ? "ml" : "m²";
}

function updateCalculatorMeasure() {
  const isLength = document.getElementById("calcProject")?.value === "baseboards";
  setCalculatorText("calcMeasureLabel", isLength ? "Longueur approximative" : "Surface approximative");
  setCalculatorText("calcMeasureUnit", isLength ? "ml" : "m²");
  setCalculatorText("calcMeasureHelp", isLength
    ? "Indiquez la longueur totale de plinthes souhaitée en mètres linéaires."
    : "Pour une pièce rectangulaire : longueur × largeur. Exemple : 4 m × 5 m = 20 m².");
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
    postalCode: limitText(document.getElementById("calcPostalCode")?.value, 5),
    name: limitText(document.getElementById("calcName")?.value, 80),
    phone: limitText(document.getElementById("calcPhone")?.value, 25),
    email: limitText(document.getElementById("calcEmail")?.value, 120),
    message: limitText(document.getElementById("calcMessage")?.value, 700),
  };
}

function renderProjectSummary() {
  const data = getCalculatorData();
  const quoteLink = document.getElementById("quoteWhatsapp");
  const quoteEmpty = document.getElementById("quoteEmpty");
  const quoteContent = document.getElementById("quoteContent");

  if (!quoteLink || !quoteEmpty || !quoteContent || !data.surface || !data.projectKey) return false;

  const projectUnit = getCalculatorProjectUnit(data.projectKey);
  const measureLabel = data.projectKey === "baseboards" ? "Longueur" : "Surface";
  const format = data.format.replace(/(\d+)x(\d+)/g, "$1 × $2 cm");
  setCalculatorText("summaryProject", data.project);
  setCalculatorText("summaryMeasureLabel", measureLabel);
  setCalculatorText("summarySurface", `${data.surface.toLocaleString("fr-FR")} ${projectUnit}`);
  setCalculatorText("summaryCity", data.city);
  setCalculatorText("summaryPostalCode", data.postalCode);
  setCalculatorText("summaryTiles", data.tilesBought);
  setCalculatorText("summaryFormat", format);
  setCalculatorText("summarySupport", data.support);
  setCalculatorText("summaryRemoval", data.removal);
  setCalculatorText("summaryFlat", data.flat);
  setCalculatorText("summaryBaseboards", data.baseboards);
  setCalculatorText("summaryTimeline", data.timeline);
  setCalculatorText("summaryContact", `${data.name} · ${data.phone}${data.email ? ` · ${data.email}` : ""}`);
  setCalculatorText("summaryMessage", data.message || "Aucun");

  const whatsappMessage = [
    "Bonjour,",
    "",
    "Je souhaite obtenir un devis pour mon projet de carrelage.",
    "",
    `Type de travaux : ${data.project}`,
    `${measureLabel} : ${data.surface.toLocaleString("fr-FR")} ${projectUnit}`,
    `Format du carrelage : ${format}`,
    `Support actuel : ${data.support}`,
    `Ancien revêtement à retirer : ${data.removal}`,
    `Sol ou mur plat : ${data.flat}`,
    `Pose des plinthes : ${data.baseboards}`,
    `Carrelage déjà acheté : ${data.tilesBought}`,
    `Ville du chantier : ${data.city}`,
    `Code postal : ${data.postalCode}`,
    `Délai souhaité : ${data.timeline}`,
    `Nom : ${data.name}`,
    `Téléphone : ${data.phone}`,
    `E-mail : ${data.email || "Non renseigné"}`,
    `Message complémentaire : ${data.message || "Aucun"}`,
    "",
    "Pouvez-vous me faire une estimation personnalisée après étude de ce projet ?",
    "Merci.",
  ].join("\n");

  quoteLink.href = `https://wa.me/33618855886?text=${encodeURIComponent(whatsappMessage)}`;
  quoteLink.classList.remove("disabled");
  quoteLink.setAttribute("aria-disabled", "false");
  quoteLink.removeAttribute("tabindex");
  quoteEmpty.hidden = true;
  quoteContent.hidden = false;
  return true;
}

function clearProjectSummary() {
  const quoteEmpty = document.getElementById("quoteEmpty");
  const quoteContent = document.getElementById("quoteContent");
  const quoteLink = document.getElementById("quoteWhatsapp");
  if (quoteEmpty) quoteEmpty.hidden = false;
  if (quoteContent) quoteContent.hidden = true;
  if (quoteLink) {
    quoteLink.removeAttribute("href");
    quoteLink.classList.add("disabled");
    quoteLink.setAttribute("aria-disabled", "true");
    quoteLink.setAttribute("tabindex", "-1");
  }
}

function refreshProjectSummary() {
  if (!calculatorHasSummary || !calculatorForm) return;
  if (!calculatorForm.checkValidity() || !isValidPhone(getCalculatorData().phone)) {
    clearProjectSummary();
    return;
  }
  renderProjectSummary();
}

function updateCalculatorStep(nextIndex) {
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
}

function validateCalculatorStep() {
  const currentStep = calculatorSteps[calculatorStepIndex];
  if (!currentStep) return false;
  updateCalculatorPostalCodeValidity();
  const controls = Array.from(currentStep.querySelectorAll("input, select, textarea"));
  const invalidControl = controls.find((control) => !control.checkValidity());

  if (invalidControl) {
    if (calculatorError) calculatorError.textContent = getCalculatorValidationMessage(invalidControl);
    markCalculatorInvalidControl(invalidControl);
    scrollToCalculatorControl(invalidControl);
    return false;
  }

  return true;
}

function restartCalculator() {
  if (!calculatorForm) return;
  calculatorForm.reset();
  calculatorHasSummary = false;
  updateCalculatorMeasure();
  updateCalculatorPostalCodeValidity();
  clearAllCalculatorInvalidStates();
  updateCalculatorStep(0);

  clearProjectSummary();

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
updateCalculatorMeasure();

if (leadForm) {
  leadForm.addEventListener("submit", sendLead);
  leadForm.addEventListener("input", clearLeadDraft);
  leadForm.addEventListener("change", clearLeadDraft);
}

if (calculatorForm) {
  calculatorForm.noValidate = true;

  calculatorNext?.addEventListener("click", () => {
    const isValid = validateCalculatorStep();

    if (!isValid) {
      return;
    }

    updateCalculatorStep(calculatorStepIndex + 1);
    animateActiveCalculatorStep();
    scrollToActiveStepHeading();
  });

  calculatorPrevious?.addEventListener("click", () => {
    updateCalculatorStep(calculatorStepIndex - 1);
    animateActiveCalculatorStep();
    scrollToActiveStepHeading();
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
      const phoneField = document.getElementById("calcPhone");
      if (phoneField) {
        markCalculatorInvalidControl(phoneField);
        scrollToCalculatorControl(phoneField);
      }
      return;
    }

    calculatorHasSummary = renderProjectSummary();
    if (calculatorHasSummary) {
      animateProjectSummary();
      scrollToProjectSummary();
    }
  });

  calculatorForm.addEventListener("input", (event) => {
    if (event.target?.id === "calcPostalCode") {
      updateCalculatorPostalCodeValidity();
    }

    if (event.target?.checkValidity?.()) {
      clearCalculatorInvalidState(event.target);
    }

    refreshProjectSummary();
  });

  calculatorForm.addEventListener("change", (event) => {
    if (event.target?.id === "calcProject") {
      updateCalculatorMeasure();
    }

    if (event.target?.id === "calcPostalCode") {
      updateCalculatorPostalCodeValidity();
    }

    if (event.target?.checkValidity?.()) {
      clearCalculatorInvalidState(event.target);
    }

    refreshProjectSummary();
  });
}

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => openGallery(index));
  item.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openGallery(index);
  });
});

galleryClose?.addEventListener("click", closeGallery);
document.getElementById("galleryBrowse")?.addEventListener("click", () => openGallery(0));
galleryPrevious?.addEventListener("click", () => showGalleryImage(galleryCurrentIndex - 1));
galleryNext?.addEventListener("click", () => showGalleryImage(galleryCurrentIndex + 1));

galleryLightbox?.addEventListener("click", (event) => {
  if (event.target === galleryLightbox) closeGallery();
});

galleryLightbox?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") showGalleryImage(galleryCurrentIndex - 1);
  if (event.key === "ArrowRight") showGalleryImage(galleryCurrentIndex + 1);
  if (event.key === "Escape") closeGallery();
});

galleryLightbox?.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  galleryTouchStartX = touch.clientX;
  galleryTouchStartY = touch.clientY;
}, { passive: true });

galleryLightbox?.addEventListener("touchend", (event) => {
  const touch = event.changedTouches?.[0];
  if (!touch) return;

  const deltaX = touch.clientX - galleryTouchStartX;
  const deltaY = touch.clientY - galleryTouchStartY;
  const isHorizontalSwipe = Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4;

  if (!isHorizontalSwipe) return;
  showGalleryImage(galleryCurrentIndex + (deltaX < 0 ? 1 : -1));
});
