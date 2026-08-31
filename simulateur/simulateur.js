(function () {
  "use strict";

  const MINIMUM_INTERVENTION = 80;

  const projectRates = {
    interior: {
      label: "Sol intérieur",
      rate: 30,
      unitLabel: "m²",
      quantityLabel: "Surface en m²",
      quantityUnit: "m²",
      kind: "classic"
    },
    terrace: {
      label: "Terrasse extérieure",
      rate: 35,
      unitLabel: "m²",
      quantityLabel: "Surface en m²",
      quantityUnit: "m²",
      kind: "classic"
    },
    bathroom: {
      label: "Salle de bain",
      rate: 45,
      unitLabel: "m²",
      quantityLabel: "Surface en m²",
      quantityUnit: "m²",
      kind: "classic"
    },
    walkInShower: {
      label: "Douche italienne",
      rate: 50,
      unitLabel: "m²",
      quantityLabel: "Surface en m²",
      quantityUnit: "m²",
      kind: "classic"
    },
    kitchenWall: {
      label: "Faïence cuisine",
      rate: 25,
      unitLabel: "m²",
      quantityLabel: "Surface en m²",
      quantityUnit: "m²",
      kind: "classic"
    },
    bathroomWall: {
      label: "Faïence salle de bain",
      rate: 25,
      unitLabel: "m²",
      quantityLabel: "Surface en m²",
      quantityUnit: "m²",
      kind: "classic"
    },
    stairs: {
      label: "Escalier",
      rate: 50,
      unitLabel: "m²",
      quantityLabel: "Surface en m²",
      quantityUnit: "m²",
      kind: "classic"
    },
    baseboardsOnly: {
      label: "Plinthes uniquement",
      rate: 15,
      unitLabel: "ml",
      quantityLabel: "Longueur en ml",
      quantityUnit: "ml",
      kind: "baseboards"
    },
    brokenTiles: {
      label: "Remplacement de carreaux cassés",
      rate: 40,
      unitLabel: "carreau",
      quantityLabel: "Nombre de carreaux",
      quantityUnit: "carreau(x)",
      kind: "brokenTiles"
    },
    groutOnly: {
      label: "Réfection des joints uniquement",
      rate: 15,
      unitLabel: "m²",
      quantityLabel: "Surface en m²",
      quantityUnit: "m²",
      kind: "grout"
    }
  };

  const formatRates = {
    none: { label: "Aucun supplément format", rate: 0 },
    small: { label: "Petit format", rate: 5 },
    large80: { label: "80 x 80", rate: 10 },
    large120: { label: "120 x 120", rate: 15 }
  };

  const supportRates = {
    standard: { label: "Support standard", rate: 0 },
    oldTiles: { label: "Ancien carrelage", rate: 6 },
    wood: { label: "Support bois", rate: 15 },
    unknown: { label: "Support inconnu", rate: 5 },
    notFlat: { label: "Sol ou mur pas plat", rate: 12 }
  };

  const removalRates = {
    none: { label: "Aucune dépose", rate: 0 },
    tiles: { label: "Dépose carrelage", rate: 15 },
    parquet: { label: "Dépose parquet", rate: 10 },
    softFloor: { label: "Dépose PVC / moquette", rate: 7 }
  };

  const prepRates = {
    none: { label: "Aucune préparation", rate: 0 },
    lightLeveling: { label: "Ragréage léger", rate: 8 },
    heavyLeveling: { label: "Ragréage important", rate: 15 },
    sanding: { label: "Ponçage / nettoyage", rate: 5 },
    primer: { label: "Primaire d'accrochage", rate: 3 }
  };

  const waterproofRates = {
    none: { label: "Aucune étanchéité", rate: 0 },
    spec: { label: "SPEC sous carrelage", rate: 12 },
    mat: { label: "Natte d'étanchéité / désolidarisation", rate: 18 }
  };

  const suppliesLabels = {
    clientAll: "Client fournit tout",
    glueAndGrout: "Je fournis colle + joints",
    allSupplies: "Je fournis tout"
  };

  const defaultState = {
    projectType: "interior",
    quantity: 0,
    tileFormat: "none",
    supports: ["standard"],
    removal: "none",
    prep: ["none"],
    waterproof: "none",
    extraBaseboardsEnabled: false,
    extraBaseboardsLength: 0,
    siliconeEnabled: false,
    siliconeLength: 0,
    profileEnabled: false,
    profileLength: 0,
    thresholdCount: 0,
    suppliesType: "clientAll",
    suppliesEstimate: 0,
    travelCost: 0,
    otherCost: 0,
    marginRate: 0.05
  };

  function numberValue(value) {
    const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  }

  function roundEuro(value) {
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }
    return Math.round(value);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(roundEuro(value));
  }

  function formatQuantity(value) {
    const rounded = Math.round(numberValue(value) * 10) / 10;
    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 1
    }).format(rounded);
  }

  function normalizeState(state) {
    const merged = { ...defaultState, ...(state || {}) };
    merged.quantity = numberValue(merged.quantity);
    merged.supports = Array.isArray(merged.supports) ? merged.supports : ["standard"];
    merged.prep = Array.isArray(merged.prep) ? merged.prep : ["none"];
    merged.extraBaseboardsLength = numberValue(merged.extraBaseboardsLength);
    merged.siliconeLength = numberValue(merged.siliconeLength);
    merged.profileLength = numberValue(merged.profileLength);
    merged.thresholdCount = numberValue(merged.thresholdCount);
    merged.suppliesEstimate = numberValue(merged.suppliesEstimate);
    merged.travelCost = numberValue(merged.travelCost);
    merged.otherCost = numberValue(merged.otherCost);
    merged.marginRate = numberValue(merged.marginRate);
    return merged;
  }

  function lineAmount(quantity, rate) {
    return numberValue(quantity) * numberValue(rate);
  }

  function addLine(lines, label, amount, includeZero) {
    const safeAmount = roundEuro(amount);
    if (safeAmount > 0 || includeZero) {
      lines.push({ label, amount: safeAmount });
    }
  }

  function calculateEstimate(inputState) {
    const state = normalizeState(inputState);
    const project = projectRates[state.projectType] || projectRates.interior;
    const isClassic = project.kind === "classic";
    const isBrokenTiles = project.kind === "brokenTiles";
    const unit = project.unitLabel;
    const quantity = isBrokenTiles ? Math.floor(state.quantity) : state.quantity;
    const lines = [];

    let laborSubtotal = 0;
    let baseAmount = 0;

    if (quantity > 0) {
      baseAmount = lineAmount(quantity, project.rate);
      laborSubtotal += baseAmount;
      addLine(lines, `${project.label} - ${formatQuantity(quantity)} ${unit} x ${project.rate} €/${unit}`, baseAmount, true);
    } else {
      addLine(lines, `${project.label} - quantité à renseigner`, 0, true);
    }

    if (isBrokenTiles) {
      if (quantity > 0 && baseAmount < MINIMUM_INTERVENTION) {
        const minimumForRepair = MINIMUM_INTERVENTION - baseAmount;
        laborSubtotal += minimumForRepair;
        addLine(lines, "Minimum remplacement de carreaux", minimumForRepair, false);
      }
    } else if (isClassic) {
      const format = formatRates[state.tileFormat] || formatRates.none;
      addLine(lines, `${format.label} - ${format.rate} €/${unit}`, lineAmount(quantity, format.rate), false);
      laborSubtotal += lineAmount(quantity, format.rate);

      state.supports.forEach((supportKey) => {
        if (supportKey === "standard") return;
        const support = supportRates[supportKey];
        if (!support) return;
        const amount = lineAmount(quantity, support.rate);
        laborSubtotal += amount;
        addLine(lines, `${support.label} - ${support.rate} €/${unit}`, amount, false);
      });

      const removal = removalRates[state.removal] || removalRates.none;
      const removalAmount = lineAmount(quantity, removal.rate);
      laborSubtotal += removalAmount;
      addLine(lines, `${removal.label} - ${removal.rate} €/${unit}`, removalAmount, false);

      state.prep.forEach((prepKey) => {
        if (prepKey === "none") return;
        const prep = prepRates[prepKey];
        if (!prep) return;
        const amount = lineAmount(quantity, prep.rate);
        laborSubtotal += amount;
        addLine(lines, `${prep.label} - ${prep.rate} €/${unit}`, amount, false);
      });

      const waterproof = waterproofRates[state.waterproof] || waterproofRates.none;
      const waterproofAmount = lineAmount(quantity, waterproof.rate);
      laborSubtotal += waterproofAmount;
      addLine(lines, `${waterproof.label} - ${waterproof.rate} €/${unit}`, waterproofAmount, false);
    }

    if (project.kind !== "baseboards" && project.kind !== "brokenTiles" && project.kind !== "grout") {
      if (state.extraBaseboardsEnabled) {
        const baseboardsAmount = lineAmount(state.extraBaseboardsLength, 10);
        laborSubtotal += baseboardsAmount;
        addLine(lines, `Plinthes en plus - ${formatQuantity(state.extraBaseboardsLength)} ml x 10 €/ml`, baseboardsAmount, false);
      }
    }

    if (state.siliconeEnabled) {
      const siliconeAmount = lineAmount(state.siliconeLength, 8);
      laborSubtotal += siliconeAmount;
      addLine(lines, `Joint silicone - ${formatQuantity(state.siliconeLength)} ml x 8 €/ml`, siliconeAmount, false);
    }

    if (state.profileEnabled) {
      const profileAmount = lineAmount(state.profileLength, 10);
      laborSubtotal += profileAmount;
      addLine(lines, `Profilés de finition - ${formatQuantity(state.profileLength)} ml x 10 €/ml`, profileAmount, false);
    }

    const thresholdAmount = lineAmount(Math.floor(state.thresholdCount), 25);
    laborSubtotal += thresholdAmount;
    addLine(lines, `Seuils / petites finitions - ${Math.floor(state.thresholdCount)} x 25 €`, thresholdAmount, false);

    let minimumAddition = 0;

    if (laborSubtotal > 0 && laborSubtotal < MINIMUM_INTERVENTION) {
      minimumAddition = MINIMUM_INTERVENTION - laborSubtotal;
      laborSubtotal += minimumAddition;
      addLine(lines, "Minimum général d'intervention", minimumAddition, false);
    }

    const marginRate = isBrokenTiles ? 0 : state.marginRate;
    const marginAmount = laborSubtotal > 0 ? laborSubtotal * marginRate : 0;

    const suppliesAmount = state.suppliesEstimate;
    const feesAmount = state.travelCost + state.otherCost;
    const total = laborSubtotal + marginAmount + suppliesAmount + feesAmount;
    const roundedTotal = roundEuro(total);

    addLine(lines, suppliesLabels[state.suppliesType] || suppliesLabels.clientAll, suppliesAmount, suppliesAmount > 0);
    addLine(lines, "Déplacement", state.travelCost, state.travelCost > 0);
    addLine(lines, "Autres frais", state.otherCost, state.otherCost > 0);
    addLine(lines, `Marge imprévu ${Math.round(marginRate * 100)} %`, marginAmount, marginAmount > 0);

    return {
      project,
      state: { ...state, quantity },
      baseAmount: roundEuro(baseAmount),
      laborAmount: roundEuro(laborSubtotal),
      suppliesAmount: roundEuro(suppliesAmount),
      feesAmount: roundEuro(feesAmount),
      marginAmount: roundEuro(marginAmount),
      total: roundedTotal,
      low: roundEuro(roundedTotal * 0.95),
      high: roundEuro(roundedTotal * 1.1),
      detailLines: lines
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      calculateEstimate,
      projectRates
    };
  }

  if (typeof document === "undefined") {
    return;
  }

  const form = document.getElementById("jobEstimator");
  const projectSelect = document.getElementById("projectType");
  const quantityLabel = document.getElementById("quantityLabel");
  const quantityInput = document.getElementById("quantityInput");
  const quantityUnit = document.getElementById("quantityUnit");
  const detailList = document.getElementById("detailList");
  const copyStatus = document.getElementById("copyStatus");
  let lastCalculation = calculateEstimate(defaultState);

  function getCheckedRadio(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  }

  function getCheckedValues(ids) {
    return ids
      .map((id) => document.getElementById(id))
      .filter((item) => item && item.checked)
      .map((item) => item.value);
  }

  function getInputNumber(id) {
    const input = document.getElementById(id);
    return input ? numberValue(input.value) : 0;
  }

  function isChecked(id) {
    const input = document.getElementById(id);
    return Boolean(input && input.checked);
  }

  function readState() {
    return {
      projectType: projectSelect.value,
      quantity: getInputNumber("quantityInput"),
      tileFormat: getCheckedRadio("tileFormat") || "none",
      supports: getCheckedValues(["supportStandard", "supportOldTiles", "supportWood", "supportUnknown", "supportNotFlat"]),
      removal: getCheckedRadio("removal") || "none",
      prep: getCheckedValues(["prepNone", "prepLight", "prepHeavy", "prepSanding", "prepPrimer"]),
      waterproof: getCheckedRadio("waterproof") || "none",
      extraBaseboardsEnabled: isChecked("extraBaseboardsToggle"),
      extraBaseboardsLength: getInputNumber("extraBaseboardsLength"),
      siliconeEnabled: isChecked("siliconeToggle"),
      siliconeLength: getInputNumber("siliconeLength"),
      profileEnabled: isChecked("profileToggle"),
      profileLength: getInputNumber("profileLength"),
      thresholdCount: getInputNumber("thresholdCount"),
      suppliesType: document.getElementById("suppliesType").value,
      suppliesEstimate: getInputNumber("suppliesEstimate"),
      travelCost: getInputNumber("travelCost"),
      otherCost: getInputNumber("otherCost"),
      marginRate: numberValue(getCheckedRadio("marginRate") || 0)
    };
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function renderDetails(lines) {
    detailList.innerHTML = "";
    const visibleLines = lines.length ? lines : [{ label: "Aucune ligne pour le moment", amount: 0 }];

    visibleLines.forEach((line) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      const amount = document.createElement("strong");
      label.textContent = line.label;
      amount.textContent = formatCurrency(line.amount);
      item.append(label, amount);
      detailList.appendChild(item);
    });
  }

  function updateEstimate() {
    lastCalculation = calculateEstimate(readState());
    setText("totalAmount", formatCurrency(lastCalculation.total));
    setText("clientRange", `Fourchette client : ${formatCurrency(lastCalculation.low)} - ${formatCurrency(lastCalculation.high)}`);
    setText("laborAmount", formatCurrency(lastCalculation.laborAmount));
    setText("suppliesAmount", formatCurrency(lastCalculation.suppliesAmount));
    setText("feesAmount", formatCurrency(lastCalculation.feesAmount));
    setText("marginAmount", formatCurrency(lastCalculation.marginAmount));
    renderDetails(lastCalculation.detailLines);
  }

  function updateQuantityLabels() {
    const project = projectRates[projectSelect.value] || projectRates.interior;
    quantityLabel.textContent = project.quantityLabel;
    quantityUnit.textContent = project.quantityUnit;
    quantityInput.step = project.kind === "brokenTiles" ? "1" : "0.1";
    quantityInput.inputMode = project.kind === "brokenTiles" ? "numeric" : "decimal";
  }

  function toggleSections() {
    const project = projectRates[projectSelect.value] || projectRates.interior;
    const isClassic = project.kind === "classic";
    const showExtraBaseboards = isClassic;

    document.querySelectorAll("[data-section='format'], [data-section='support'], [data-section='removal'], [data-section='prep'], [data-section='waterproof']").forEach((section) => {
      section.classList.toggle("is-hidden", !isClassic);
    });

    const extraBaseboardsSection = document.querySelector("[data-section='extraBaseboards']");
    if (extraBaseboardsSection) {
      extraBaseboardsSection.classList.toggle("is-hidden", !showExtraBaseboards);
    }
  }

  function syncExpandableFields() {
    document.querySelectorAll(".expandable-field[data-target]").forEach((field) => {
      const toggle = document.getElementById(field.dataset.target);
      field.classList.toggle("is-visible", Boolean(toggle && toggle.checked));
    });
  }

  function normalizeSupportSelection(changedInput) {
    const standard = document.getElementById("supportStandard");
    const baseSupports = ["supportOldTiles", "supportWood", "supportUnknown"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const notFlat = document.getElementById("supportNotFlat");

    if (!standard || !notFlat) return;

    if (changedInput === standard && standard.checked) {
      baseSupports.forEach((input) => {
        input.checked = false;
      });
      notFlat.checked = false;
    }

    if (baseSupports.includes(changedInput) && changedInput.checked) {
      standard.checked = false;
      baseSupports.forEach((input) => {
        if (input !== changedInput) {
          input.checked = false;
        }
      });
    }

    if (changedInput === notFlat && notFlat.checked) {
      standard.checked = false;
    }

    const anySupport = [standard, ...baseSupports, notFlat].some((input) => input.checked);
    if (!anySupport) {
      standard.checked = true;
    }
  }

  function normalizePrepSelection(changedInput) {
    const none = document.getElementById("prepNone");
    const light = document.getElementById("prepLight");
    const heavy = document.getElementById("prepHeavy");
    const optional = ["prepLight", "prepHeavy", "prepSanding", "prepPrimer"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!none || !light || !heavy) return;

    if (changedInput === none && none.checked) {
      optional.forEach((input) => {
        input.checked = false;
      });
    } else if (changedInput && changedInput !== none && changedInput.checked) {
      none.checked = false;
    }

    if (changedInput === light && light.checked) {
      heavy.checked = false;
    }

    if (changedInput === heavy && heavy.checked) {
      light.checked = false;
    }

    const hasPrep = optional.some((input) => input.checked);
    if (!hasPrep) {
      none.checked = true;
    }
  }

  function resetEstimator() {
    form.reset();
    updateQuantityLabels();
    toggleSections();
    syncExpandableFields();
    updateEstimate();
    copyStatus.textContent = "";
  }

  function getClientText() {
    return `Estimation indicative : environ ${formatCurrency(lastCalculation.total)}, à confirmer après visite et établissement du devis définitif.`;
  }

  function getDetailText() {
    const project = lastCalculation.project;
    const state = lastCalculation.state;
    const detailLines = lastCalculation.detailLines
      .map((line) => `${line.label} : ${formatCurrency(line.amount)}`)
      .join("\n");

    return [
      "LL Carrelage - estimation chantier",
      `${project.label} : ${formatQuantity(state.quantity)} ${project.unitLabel}`,
      "",
      detailLines,
      "",
      `Main-d'œuvre : ${formatCurrency(lastCalculation.laborAmount)}`,
      `Fournitures : ${formatCurrency(lastCalculation.suppliesAmount)}`,
      `Déplacement + frais : ${formatCurrency(lastCalculation.feesAmount)}`,
      `Marge imprévu : ${formatCurrency(lastCalculation.marginAmount)}`,
      `Total estimé : ${formatCurrency(lastCalculation.total)}`,
      `Fourchette client : ${formatCurrency(lastCalculation.low)} - ${formatCurrency(lastCalculation.high)}`
    ].join("\n");
  }

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      copyStatus.textContent = successMessage;
    } catch (error) {
      copyStatus.textContent = "Copie impossible sur ce navigateur.";
    }
  }

  function initEstimator() {
    updateQuantityLabels();
    toggleSections();
    syncExpandableFields();
    updateEstimate();

    form.addEventListener("input", updateEstimate);
    form.addEventListener("change", (event) => {
      const target = event.target;

      if (target === projectSelect) {
        updateQuantityLabels();
        toggleSections();
      }

      if (target && target.id && target.id.startsWith("support")) {
        normalizeSupportSelection(target);
      }

      if (target && target.id && target.id.startsWith("prep")) {
        normalizePrepSelection(target);
      }

      syncExpandableFields();
      updateEstimate();
    });

    document.getElementById("resetButton").addEventListener("click", resetEstimator);
    document.getElementById("copyEstimateButton").addEventListener("click", () => {
      copyText(getClientText(), "Estimation client copiée.");
    });
    document.getElementById("copyDetailButton").addEventListener("click", () => {
      copyText(getDetailText(), "Détail chantier copié.");
    });
  }

  window.LLJobEstimator = {
    calculateEstimate,
    readState,
    updateEstimate
  };

  initEstimator();
})();
