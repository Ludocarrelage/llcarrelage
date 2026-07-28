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
  terrace: 35,
  bathroom: 45,
  shower: 50,
  "kitchen-wall": 25,
  "bathroom-wall": 25,
  stairs: 50,
  baseboards: 15,
});

const calculatorAdjustments = Object.freeze({
  format: { small: 0, 30: 0, 45: 0, 60: 0, 80: 10, 120: 15, other: 0 },
  support: { slab: 0, screed: 0, "old-tiles": 6, wood: 15, unknown: 5 },
  removal: { none: 0, tiles: 15, parquet: 10, pvc: 7, carpet: 7, unknown: 0 },
  flat: { Oui: 0, Non: 12, "Je ne sais pas": 0 },
});

const calculatorWorkshop = Object.freeze({
  label: "Pont-Évêque",
  postalCode: "38780",
  lat: 45.5326,
  lon: 4.9097,
});

const calculatorTravelSettings = Object.freeze({
  includedKm: 20,
  pricePerExtraKm: 0.8,
  cachePrefix: "llcarrelage_travel_distance_",
  timeoutMs: 6500,
});

const calculatorTravelCache = new Map();
const calculatorTravelRequests = new Map();

const calculatorSteps = Array.from(document.querySelectorAll("[data-calc-step]"));
const calculatorPrevious = document.getElementById("calcPrev");
const calculatorNext = document.getElementById("calcNext");
const calculatorSubmit = document.getElementById("calcSubmit");
const calculatorRestart = document.getElementById("calcRestart");
const calculatorError = document.getElementById("calcFormError");
let calculatorStepIndex = 0;
let calculatorHasEstimate = false;
let calculatorRecalculationTimer = null;
let calculatorQuoteRequestId = 0;
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

function scrollToEstimatedBudget() {
  window.setTimeout(() => {
    const quoteContent = document.getElementById("quoteContent");

    if (!quoteContent || quoteContent.hidden) {
      return;
    }

    const budgetHeading = quoteContent.querySelector(".quote-kicker") || quoteContent.querySelector("h3") || quoteContent;
    const headerHeight = navbar?.getBoundingClientRect().height || 0;
    const safeOffset = 18;
    const targetPosition = budgetHeading.getBoundingClientRect().top + window.scrollY - headerHeight - safeOffset;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, 150);
}

function animateEstimatedBudget() {
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

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const euroCentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatEuros(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0 €";
  }

  return Number.isInteger(amount) ? euroFormatter.format(amount) : euroCentFormatter.format(amount);
}

function getCalculatorProjectUnit(projectKey) {
  return projectKey === "baseboards" ? "ml" : "m²";
}

function normalizeCalculatorCity(value) {
  return limitText(value, 80)
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getUnavailableTravelResult() {
  return {
    status: "unavailable",
    distanceKm: null,
    fee: 0,
  };
}

function getTravelDistanceText(travelResult) {
  if (travelResult?.status === "ok") {
    return `${travelResult.distanceKm} km depuis ${calculatorWorkshop.label}`;
  }

  return "Les frais de déplacement seront calculés lors du devis définitif.";
}

function getTravelFeeText(travelResult) {
  if (travelResult?.status !== "ok") {
    return "À confirmer";
  }

  return travelResult.fee > 0 ? formatEuros(travelResult.fee) : "Offerts";
}

function readCalculatorTravelCache(cityKey) {
  if (!cityKey) return null;
  const memoryValue = calculatorTravelCache.get(cityKey);
  if (memoryValue) return memoryValue;

  try {
    const storedValue = sessionStorage.getItem(`${calculatorTravelSettings.cachePrefix}${cityKey}`);
    if (!storedValue) return null;
    const parsedValue = JSON.parse(storedValue);
    calculatorTravelCache.set(cityKey, parsedValue);
    return parsedValue;
  } catch (error) {
    return null;
  }
}

function writeCalculatorTravelCache(cityKey, value) {
  if (!cityKey || !value) return;
  calculatorTravelCache.set(cityKey, value);

  try {
    sessionStorage.setItem(`${calculatorTravelSettings.cachePrefix}${cityKey}`, JSON.stringify(value));
  } catch (error) {
    // Le cache en mémoire suffit si sessionStorage n'est pas disponible.
  }
}

async function fetchCalculatorJson(url) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), calculatorTravelSettings.timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Réponse API invalide : ${response.status}`);
    }

    return await response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function geocodeCalculatorCity(city) {
  const cityLabel = limitText(city, 80);
  const queries = [
    `${cityLabel}, Auvergne-Rhône-Alpes, France`,
    `${cityLabel}, France`,
  ];

  for (const query of queries) {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      limit: "1",
      countrycodes: "fr",
      email: "llcarrelage@outlook.fr",
    });
    params.set("accept-language", "fr");

    const results = await fetchCalculatorJson(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    const place = Array.isArray(results) ? results.find((item) => item?.lat && item?.lon) : null;

    if (place) {
      return {
        lat: Number(place.lat),
        lon: Number(place.lon),
      };
    }
  }

  return null;
}

async function fetchCalculatorRouteDistanceKm(destination) {
  if (!Number.isFinite(destination?.lat) || !Number.isFinite(destination?.lon)) {
    throw new Error("Ville introuvable");
  }

  const routeCoordinates = [
    `${calculatorWorkshop.lon},${calculatorWorkshop.lat}`,
    `${destination.lon},${destination.lat}`,
  ].join(";");
  const params = new URLSearchParams({
    overview: "false",
    steps: "false",
    alternatives: "false",
  });
  const routeData = await fetchCalculatorJson(
    `https://router.project-osrm.org/route/v1/driving/${routeCoordinates}?${params.toString()}`
  );
  const distanceMeters = routeData?.routes?.[0]?.distance;

  if (!Number.isFinite(distanceMeters)) {
    throw new Error("Itinéraire introuvable");
  }

  return Math.max(0, Math.round(distanceMeters / 1000));
}

async function calculateTravelFees(city) {
  const cityKey = normalizeCalculatorCity(city);
  if (cityKey.length < 2) return getUnavailableTravelResult();

  const cachedValue = readCalculatorTravelCache(cityKey);
  if (cachedValue) return cachedValue;

  const pendingRequest = calculatorTravelRequests.get(cityKey);
  if (pendingRequest) return pendingRequest;

  const request = (async () => {
    try {
      const destination = await geocodeCalculatorCity(city);
      const distanceKm = await fetchCalculatorRouteDistanceKm(destination);
      const extraKm = Math.max(0, distanceKm - calculatorTravelSettings.includedKm);
      const fee = Math.round(extraKm * calculatorTravelSettings.pricePerExtraKm * 100) / 100;
      const result = { status: "ok", distanceKm, fee };
      writeCalculatorTravelCache(cityKey, result);
      return result;
    } catch (error) {
      console.warn("Les frais de déplacement seront calculés lors du devis définitif.", error);
      const fallbackResult = getUnavailableTravelResult();
      writeCalculatorTravelCache(cityKey, fallbackResult);
      return fallbackResult;
    } finally {
      calculatorTravelRequests.delete(cityKey);
    }
  })();

  calculatorTravelRequests.set(cityKey, request);
  return request;
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

async function calculateQuote(requestId = calculatorQuoteRequestId) {
  const data = getCalculatorData();
  const quoteLink = document.getElementById("quoteWhatsapp");
  const quoteEmpty = document.getElementById("quoteEmpty");
  const quoteContent = document.getElementById("quoteContent");

  if (!quoteLink || !quoteEmpty || !quoteContent || !data.surface || !data.projectKey) return false;

  const baseRate = calculatorBaseRates[data.projectKey] || 0;
  const projectUnit = getCalculatorProjectUnit(data.projectKey);
  const formatAdjustment = calculatorAdjustments.format[data.formatKey] || 0;
  const supportAdjustment = calculatorAdjustments.support[data.supportKey] || 0;
  const removalAdjustment = calculatorAdjustments.removal[data.removalKey] || 0;
  const flatAdjustment = calculatorAdjustments.flat[data.flat] || 0;
  const baseboardsAdjustment = data.baseboards === "Oui" && data.projectKey !== "baseboards" ? 10 : 0;
  const estimatedRate = baseRate + formatAdjustment + supportAdjustment + removalAdjustment + flatAdjustment + baseboardsAdjustment;
  const workPrice = estimatedRate * data.surface;
  const travelResult = await calculateTravelFees(data.city);

  if (requestId !== calculatorQuoteRequestId) {
    return false;
  }

  const travelFee = travelResult.status === "ok" ? travelResult.fee : 0;
  const averagePrice = workPrice + travelFee;
  const lowPrice = Math.round(workPrice * 0.85 + travelFee);
  const highPrice = Math.round(workPrice * 1.15 + travelFee);
  const travelDistanceText = getTravelDistanceText(travelResult);
  const travelFeeText = getTravelFeeText(travelResult);

  setCalculatorText("quoteLow", formatEuros(lowPrice));
  setCalculatorText("quoteHigh", formatEuros(highPrice));
  setCalculatorText("quoteAverage", formatEuros(averagePrice));
  setCalculatorText("quotePerM2", `${Math.round(estimatedRate)} €/${projectUnit}`);
  setCalculatorText("quoteSupplyNote", data.tilesBought === "Oui"
    ? "Le carrelage est déjà acheté."
    : "Le choix du carrelage pourra être accompagné par LL Carrelage.");

  setCalculatorText("summaryProject", data.project);
  setCalculatorText("summarySurface", `${data.surface.toLocaleString("fr-FR")} ${projectUnit}`);
  setCalculatorText("summaryCity", data.city);
  setCalculatorText("summaryDistance", travelDistanceText);
  setCalculatorText("summaryTravelFee", travelFeeText);
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
    `Surface : ${data.surface} ${projectUnit}`,
    `Ville : ${data.city}`,
    `Distance : ${travelDistanceText}`,
    `Frais de déplacement : ${travelFeeText}`,
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

function isTextLikeCalculatorControl(control) {
  if (!control?.matches) return false;
  return control.matches("textarea, input:not([type='radio']):not([type='checkbox'])");
}

async function refreshCalculatorQuote(requestId = ++calculatorQuoteRequestId) {
  const result = await calculateQuote(requestId);

  if (requestId !== calculatorQuoteRequestId) {
    return false;
  }

  return result;
}

function scheduleCalculatorRecalculation(event) {
  const requestId = ++calculatorQuoteRequestId;
  window.clearTimeout(calculatorRecalculationTimer);

  if (!calculatorHasEstimate || !calculatorForm || !calculatorForm.checkValidity()) {
    return;
  }

  if (normalizeCalculatorCity(getCalculatorData().city).length < 2) {
    return;
  }

  const delay = isTextLikeCalculatorControl(event?.target) ? 600 : 0;

  if (delay > 0) {
    calculatorRecalculationTimer = window.setTimeout(() => {
      void refreshCalculatorQuote(requestId);
    }, delay);
    return;
  }

  void refreshCalculatorQuote(requestId);
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

  calculatorForm.addEventListener("submit", async (event) => {
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

    calculatorHasEstimate = await refreshCalculatorQuote();
    if (calculatorHasEstimate) {
      animateEstimatedBudget();
      scrollToEstimatedBudget();
    }
  });

  calculatorForm.addEventListener("input", (event) => {
    if (event.target?.checkValidity?.()) {
      clearCalculatorInvalidState(event.target);
    }

    if (isTextLikeCalculatorControl(event.target)) {
      scheduleCalculatorRecalculation(event);
    }
  });

  calculatorForm.addEventListener("change", (event) => {
    if (event.target?.checkValidity?.()) {
      clearCalculatorInvalidState(event.target);
    }

    if (!isTextLikeCalculatorControl(event.target)) {
      scheduleCalculatorRecalculation(event);
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
