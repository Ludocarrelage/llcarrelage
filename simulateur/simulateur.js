(function () {
  "use strict";

  const MINIMUM_INTERVENTION = 80;

  // TARIFS CARRELAGE
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

  // ÉTAT CARRELAGE
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

  // CALCUL CARRELAGE
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



  // TARIFS PEINTURE
  const peintureTarifs = {
    protection: { label: "Protection du chantier", prix: 50, unite: "forfait" },
    lessivage: { label: "Lessivage / nettoyage", prix: 2.5, unite: "m²" },
    poncageLeger: { label: "Ponçage léger", prix: 3, unite: "m²" },
    rebouchageLocal: { label: "Rebouchage local", prix: 5, unite: "m²" },
    ratissageComplet: { label: "Ratissage complet", prix: 12, unite: "m²" },
    primaire: { label: "Primaire d'impression", prix: 4, unite: "m²" },
    peintureMurs2Couches: { label: "Peinture murs 2 couches", prix: 15, unite: "m²" },
    peinturePlafond2Couches: { label: "Peinture plafond 2 couches", prix: 18, unite: "m²" },
    packRatissagePrimairePeinture: { label: "Pack ratissage + primaire + peinture", prix: 30, unite: "m²" },
    porte: { label: "Porte intérieure", prix: 60, unite: "porte" },
    radiateur: { label: "Radiateur", prix: 50, unite: "unité" },
    plinthes: { label: "Plinthes", prix: 5, unite: "ml" }
  };

  // ÉTAT PEINTURE
  const peintureDefaultState = {
    surfaceType: "walls",
    wallsSurface: 0,
    ceilingSurface: 0,
    supportCondition: "good",
    protection: false,
    lessivage: false,
    lessivageSurface: 0,
    poncageLeger: false,
    poncageSurface: 0,
    rebouchageLocal: false,
    rebouchageSurface: 0,
    primaire: false,
    primaireSurface: 0,
    skimMode: "none",
    skimSurface: 0,
    packSurface: 0,
    paintWalls: true,
    paintCeiling: false,
    doors: false,
    doorCount: 0,
    radiators: false,
    radiatorCount: 0,
    plinthes: false,
    plinthesLength: 0,
    suppliesMode: "client",
    suppliesEstimate: 0,
    travelCost: 0,
    otherCost: 0,
    marginRate: 0.05
  };

  function formatRate(value) {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatTarif(tarif) {
    if (tarif.unite === "forfait") {
      return `${formatCurrency(tarif.prix)} forfait`;
    }
    return `${formatRate(tarif.prix)} €/${tarif.unite}`;
  }

  function normalizePeintureState(inputState) {
    const merged = { ...peintureDefaultState, ...(inputState || {}) };
    merged.wallsSurface = numberValue(merged.surfaceType === "ceiling" ? 0 : merged.wallsSurface);
    merged.ceilingSurface = numberValue(merged.surfaceType === "walls" ? 0 : merged.ceilingSurface);
    merged.lessivageSurface = numberValue(merged.lessivageSurface);
    merged.poncageSurface = numberValue(merged.poncageSurface);
    merged.rebouchageSurface = numberValue(merged.rebouchageSurface);
    merged.primaireSurface = numberValue(merged.primaireSurface);
    merged.skimSurface = numberValue(merged.skimSurface);
    merged.packSurface = numberValue(merged.packSurface);
    merged.doorCount = Math.floor(numberValue(merged.doorCount));
    merged.radiatorCount = Math.floor(numberValue(merged.radiatorCount));
    merged.plinthesLength = numberValue(merged.plinthesLength);
    merged.suppliesEstimate = numberValue(merged.suppliesEstimate);
    merged.travelCost = numberValue(merged.travelCost);
    merged.otherCost = numberValue(merged.otherCost);
    merged.marginRate = numberValue(merged.marginRate);
    merged.paintWalls = merged.surfaceType !== "ceiling" && Boolean(merged.paintWalls);
    merged.paintCeiling = merged.surfaceType !== "walls" && Boolean(merged.paintCeiling);
    return merged;
  }

  function getPeintureTotalSurface(state) {
    return numberValue(state.wallsSurface) + numberValue(state.ceilingSurface);
  }

  function addPeintureLine(lines, categoryTotals, category, label, calculation, amount, includeZero) {
    const safeAmount = roundEuro(amount);
    if (category && categoryTotals[category] !== undefined) {
      categoryTotals[category] += amount;
    }
    if (safeAmount > 0 || includeZero) {
      lines.push({ category, label, calculation, amount: safeAmount });
    }
  }

  // CALCUL PEINTURE
  function calculateEstimatePeinture(inputState) {
    const state = normalizePeintureState(inputState);
    const isPack = state.skimMode === "pack";
    const lines = [];
    const categoryTotals = {
      preparation: 0,
      skim: 0,
      painting: 0,
      extras: 0
    };

    if (state.protection) {
      addPeintureLine(lines, categoryTotals, "preparation", peintureTarifs.protection.label, "forfait", peintureTarifs.protection.prix, false);
    }

    if (state.lessivage) {
      addPeintureLine(
        lines,
        categoryTotals,
        "preparation",
        peintureTarifs.lessivage.label,
        `${formatQuantity(state.lessivageSurface)} m² x ${formatRate(peintureTarifs.lessivage.prix)} €/m²`,
        lineAmount(state.lessivageSurface, peintureTarifs.lessivage.prix),
        false
      );
    }

    if (state.poncageLeger) {
      addPeintureLine(
        lines,
        categoryTotals,
        "preparation",
        peintureTarifs.poncageLeger.label,
        `${formatQuantity(state.poncageSurface)} m² x ${formatRate(peintureTarifs.poncageLeger.prix)} €/m²`,
        lineAmount(state.poncageSurface, peintureTarifs.poncageLeger.prix),
        false
      );
    }

    if (state.rebouchageLocal) {
      addPeintureLine(
        lines,
        categoryTotals,
        "preparation",
        peintureTarifs.rebouchageLocal.label,
        `${formatQuantity(state.rebouchageSurface)} m² x ${formatRate(peintureTarifs.rebouchageLocal.prix)} €/m²`,
        lineAmount(state.rebouchageSurface, peintureTarifs.rebouchageLocal.prix),
        false
      );
    }

    if (state.primaire && !isPack) {
      addPeintureLine(
        lines,
        categoryTotals,
        "preparation",
        peintureTarifs.primaire.label,
        `${formatQuantity(state.primaireSurface)} m² x ${formatRate(peintureTarifs.primaire.prix)} €/m²`,
        lineAmount(state.primaireSurface, peintureTarifs.primaire.prix),
        false
      );
    }

    if (state.skimMode === "skim") {
      addPeintureLine(
        lines,
        categoryTotals,
        "skim",
        peintureTarifs.ratissageComplet.label,
        `${formatQuantity(state.skimSurface)} m² x ${formatRate(peintureTarifs.ratissageComplet.prix)} €/m²`,
        lineAmount(state.skimSurface, peintureTarifs.ratissageComplet.prix),
        false
      );
    }

    if (isPack) {
      addPeintureLine(
        lines,
        categoryTotals,
        "skim",
        peintureTarifs.packRatissagePrimairePeinture.label,
        `${formatQuantity(state.packSurface)} m² x ${formatRate(peintureTarifs.packRatissagePrimairePeinture.prix)} €/m²`,
        lineAmount(state.packSurface, peintureTarifs.packRatissagePrimairePeinture.prix),
        false
      );
    }

    if (!isPack && state.paintWalls) {
      addPeintureLine(
        lines,
        categoryTotals,
        "painting",
        peintureTarifs.peintureMurs2Couches.label,
        `${formatQuantity(state.wallsSurface)} m² x ${formatRate(peintureTarifs.peintureMurs2Couches.prix)} €/m²`,
        lineAmount(state.wallsSurface, peintureTarifs.peintureMurs2Couches.prix),
        false
      );
    }

    if (!isPack && state.paintCeiling) {
      addPeintureLine(
        lines,
        categoryTotals,
        "painting",
        peintureTarifs.peinturePlafond2Couches.label,
        `${formatQuantity(state.ceilingSurface)} m² x ${formatRate(peintureTarifs.peinturePlafond2Couches.prix)} €/m²`,
        lineAmount(state.ceilingSurface, peintureTarifs.peinturePlafond2Couches.prix),
        false
      );
    }

    if (state.doors) {
      addPeintureLine(
        lines,
        categoryTotals,
        "extras",
        "Portes intérieures",
        `${state.doorCount} x ${formatRate(peintureTarifs.porte.prix)} €/porte`,
        lineAmount(state.doorCount, peintureTarifs.porte.prix),
        false
      );
    }

    if (state.radiators) {
      addPeintureLine(
        lines,
        categoryTotals,
        "extras",
        "Radiateurs",
        `${state.radiatorCount} x ${formatRate(peintureTarifs.radiateur.prix)} €/unité`,
        lineAmount(state.radiatorCount, peintureTarifs.radiateur.prix),
        false
      );
    }

    if (state.plinthes) {
      addPeintureLine(
        lines,
        categoryTotals,
        "extras",
        peintureTarifs.plinthes.label,
        `${formatQuantity(state.plinthesLength)} ml x ${formatRate(peintureTarifs.plinthes.prix)} €/ml`,
        lineAmount(state.plinthesLength, peintureTarifs.plinthes.prix),
        false
      );
    }

    let laborSubtotal = categoryTotals.preparation + categoryTotals.skim + categoryTotals.painting + categoryTotals.extras;
    let minimumAddition = 0;

    if (laborSubtotal > 0 && laborSubtotal < MINIMUM_INTERVENTION) {
      minimumAddition = MINIMUM_INTERVENTION - laborSubtotal;
      laborSubtotal += minimumAddition;
      categoryTotals.preparation += minimumAddition;
      addPeintureLine(lines, categoryTotals, "", "Minimum d'intervention", "main-d'œuvre minimum", minimumAddition, false);
    }

    const marginAmount = laborSubtotal > 0 ? laborSubtotal * state.marginRate : 0;
    const suppliesAmount = state.suppliesEstimate;
    const feesAmount = state.travelCost + state.otherCost;
    const total = laborSubtotal + marginAmount + suppliesAmount + feesAmount;
    const roundedTotal = roundEuro(total);

    if (suppliesAmount > 0) {
      addPeintureLine(lines, categoryTotals, "", "Fournitures", "montant manuel", suppliesAmount, true);
    }

    if (state.travelCost > 0) {
      addPeintureLine(lines, categoryTotals, "", "Déplacement", "montant manuel", state.travelCost, true);
    }

    if (state.otherCost > 0) {
      addPeintureLine(lines, categoryTotals, "", "Autres frais", "montant manuel", state.otherCost, true);
    }

    if (marginAmount > 0) {
      addPeintureLine(lines, categoryTotals, "", `Marge imprévu ${Math.round(state.marginRate * 100)} %`, "sur main-d'œuvre", marginAmount, true);
    }

    return {
      state,
      preparationAmount: roundEuro(categoryTotals.preparation),
      skimAmount: roundEuro(categoryTotals.skim),
      paintingAmount: roundEuro(categoryTotals.painting),
      extrasAmount: roundEuro(categoryTotals.extras),
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
      calculateEstimateCarrelage: calculateEstimate,
      calculateEstimatePeinture,
      projectRates,
      peintureTarifs
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
    document.querySelectorAll("#jobEstimator .expandable-field[data-target]").forEach((field) => {
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

  async function copyText(text, successMessage, statusElement = copyStatus) {
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
      if (statusElement) {
        statusElement.textContent = successMessage;
      }
    } catch (error) {
      if (statusElement) {
        statusElement.textContent = "Copie impossible sur ce navigateur.";
      }
    }
  }



  const modeChooserElement = document.getElementById("modeChooser");
  const paintingForm = document.getElementById("paintingEstimatorForm");
  const paintDetailList = document.getElementById("paintDetailList");
  const paintCopyStatus = document.getElementById("paintCopyStatus");
  let lastPaintingCalculation = calculateEstimatePeinture(peintureDefaultState);

  function getActiveEstimatorMode() {
    const activeButton = document.querySelector("[data-mode-button].is-active");
    return activeButton ? activeButton.dataset.modeButton : "carrelage";
  }

  function setEstimatorMode(mode) {
    document.querySelectorAll("[data-mode-button]").forEach((button) => {
      const isActive = button.dataset.modeButton === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    document.querySelectorAll("[data-mode-panel]").forEach((panel) => {
      const isActive = panel.dataset.modePanel === mode;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", String(!isActive));
    });

    if (mode === "peinture") {
      updatePaintingEstimate();
    } else {
      updateEstimate();
    }
  }

  function initModeSwitcher() {
    document.querySelectorAll("[data-mode-button]").forEach((button) => {
      button.addEventListener("click", () => {
        setEstimatorMode(button.dataset.modeButton);
      });
    });

    document.querySelectorAll("[data-mode-change]").forEach((button) => {
      button.addEventListener("click", () => {
        modeChooserElement?.scrollIntoView({ behavior: "smooth", block: "start" });
        document.querySelector("[data-mode-button].is-active")?.focus({ preventScroll: true });
      });
    });
  }

  function getPaintingRadio(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  }

  function readPaintingState() {
    return {
      surfaceType: getPaintingRadio("paintSurfaceType") || "walls",
      wallsSurface: getInputNumber("paintWallsSurface"),
      ceilingSurface: getInputNumber("paintCeilingSurface"),
      supportCondition: getPaintingRadio("paintSupportCondition") || "good",
      protection: isChecked("paintProtectionToggle"),
      lessivage: isChecked("paintLessivageToggle"),
      lessivageSurface: getInputNumber("paintLessivageSurface"),
      poncageLeger: isChecked("paintPoncageToggle"),
      poncageSurface: getInputNumber("paintPoncageSurface"),
      rebouchageLocal: isChecked("paintRebouchageToggle"),
      rebouchageSurface: getInputNumber("paintRebouchageSurface"),
      primaire: isChecked("paintPrimaireToggle"),
      primaireSurface: getInputNumber("paintPrimaireSurface"),
      skimMode: getPaintingRadio("paintSkimMode") || "none",
      skimSurface: getInputNumber("paintSkimSurface"),
      packSurface: getInputNumber("paintPackSurface"),
      paintWalls: isChecked("paintWallPaintToggle"),
      paintCeiling: isChecked("paintCeilingPaintToggle"),
      doors: isChecked("paintDoorsToggle"),
      doorCount: getInputNumber("paintDoorCount"),
      radiators: isChecked("paintRadiatorsToggle"),
      radiatorCount: getInputNumber("paintRadiatorCount"),
      plinthes: isChecked("paintBaseboardsToggle"),
      plinthesLength: getInputNumber("paintBaseboardsLength"),
      suppliesMode: getPaintingRadio("paintSuppliesMode") || "client",
      suppliesEstimate: getInputNumber("paintSuppliesEstimate"),
      travelCost: getInputNumber("paintTravelCost"),
      otherCost: getInputNumber("paintOtherCost"),
      marginRate: numberValue(getPaintingRadio("paintMarginRate") || 0)
    };
  }

  function setPaintingPriceLabels() {
    setText("paintProtectionPrice", formatTarif(peintureTarifs.protection));
    setText("paintLessivagePrice", formatTarif(peintureTarifs.lessivage));
    setText("paintPoncagePrice", formatTarif(peintureTarifs.poncageLeger));
    setText("paintRebouchagePrice", formatTarif(peintureTarifs.rebouchageLocal));
    setText("paintPrimairePrice", formatTarif(peintureTarifs.primaire));
    setText("paintSkimPrice", formatTarif(peintureTarifs.ratissageComplet));
    setText("paintPackPrice", formatTarif(peintureTarifs.packRatissagePrimairePeinture));
    setText("paintWallPaintPrice", formatTarif(peintureTarifs.peintureMurs2Couches));
    setText("paintCeilingPaintPrice", formatTarif(peintureTarifs.peinturePlafond2Couches));
    setText("paintDoorPrice", formatTarif(peintureTarifs.porte));
    setText("paintRadiatorPrice", formatTarif(peintureTarifs.radiateur));
    setText("paintBaseboardsPrice", formatTarif(peintureTarifs.plinthes));
  }

  function getVisiblePaintingSurface() {
    const state = readPaintingState();
    return getPeintureTotalSurface(state);
  }

  function fillPaintingSurfaceIfEmpty(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (numberValue(input.value) === 0) {
      input.value = String(getVisiblePaintingSurface());
    }
  }

  function updatePaintingSupportSuggestions() {
    const condition = getPaintingRadio("paintSupportCondition") || "good";
    document.querySelectorAll("[data-suggestion]").forEach((element) => {
      const suggestions = String(element.dataset.suggestion || "").split(" ");
      element.classList.toggle("is-suggested", suggestions.includes(condition));
    });
  }

  function updatePaintingSurfaceMode(syncDefaults) {
    const surfaceType = getPaintingRadio("paintSurfaceType") || "walls";
    const wallsField = document.getElementById("paintWallsSurfaceField");
    const ceilingField = document.getElementById("paintCeilingSurfaceField");
    const wallPaintCard = document.getElementById("paintWallPaintCard");
    const ceilingPaintCard = document.getElementById("paintCeilingPaintCard");
    const wallPaintToggle = document.getElementById("paintWallPaintToggle");
    const ceilingPaintToggle = document.getElementById("paintCeilingPaintToggle");

    wallsField?.classList.toggle("is-hidden", surfaceType === "ceiling");
    ceilingField?.classList.toggle("is-hidden", surfaceType === "walls");
    wallPaintCard?.classList.toggle("is-hidden", surfaceType === "ceiling");
    ceilingPaintCard?.classList.toggle("is-hidden", surfaceType === "walls");

    if (syncDefaults) {
      if (wallPaintToggle) wallPaintToggle.checked = surfaceType !== "ceiling";
      if (ceilingPaintToggle) ceilingPaintToggle.checked = surfaceType !== "walls";
    }
  }

  function updatePaintingExpandableFields() {
    document.querySelectorAll("#paintingEstimatorForm .expandable-field[data-target]").forEach((field) => {
      const toggle = document.getElementById(field.dataset.target);
      field.classList.toggle("is-visible", Boolean(toggle && toggle.checked && !toggle.disabled));
    });

    const skimMode = getPaintingRadio("paintSkimMode") || "none";
    document.getElementById("paintSkimSurfaceField")?.classList.toggle("is-visible", skimMode === "skim");
    document.getElementById("paintPackSurfaceField")?.classList.toggle("is-visible", skimMode === "pack");
  }

  function updatePaintingPackState() {
    const isPack = getPaintingRadio("paintSkimMode") === "pack";
    const primaryToggle = document.getElementById("paintPrimaireToggle");
    const wallPaintToggle = document.getElementById("paintWallPaintToggle");
    const ceilingPaintToggle = document.getElementById("paintCeilingPaintToggle");
    const surfaceType = getPaintingRadio("paintSurfaceType") || "walls";

    if (primaryToggle) {
      primaryToggle.disabled = isPack;
      if (isPack) primaryToggle.checked = true;
      document.getElementById("paintPrepPrimaireCard")?.classList.toggle("is-pack-included", isPack);
      setText("paintPrimairePrice", isPack ? "Compris dans le pack" : formatTarif(peintureTarifs.primaire));
    }

    if (wallPaintToggle) {
      wallPaintToggle.disabled = isPack;
      if (isPack && surfaceType !== "ceiling") wallPaintToggle.checked = true;
      document.getElementById("paintWallPaintCard")?.classList.toggle("is-pack-included", isPack);
      setText("paintWallPaintPrice", isPack ? "Compris dans le pack" : formatTarif(peintureTarifs.peintureMurs2Couches));
    }

    if (ceilingPaintToggle) {
      ceilingPaintToggle.disabled = isPack;
      if (isPack && surfaceType !== "walls") ceilingPaintToggle.checked = true;
      document.getElementById("paintCeilingPaintCard")?.classList.toggle("is-pack-included", isPack);
      setText("paintCeilingPaintPrice", isPack ? "Compris dans le pack" : formatTarif(peintureTarifs.peinturePlafond2Couches));
    }

    document.getElementById("paintPackIncludedMessage")?.classList.toggle("is-hidden", !isPack);
    document.querySelector('.prep-surface-field[data-target="paintPrimaireToggle"]')?.classList.toggle("is-visible", Boolean(primaryToggle && primaryToggle.checked && !isPack));
  }

  function renderPeintureDetails(lines) {
    paintDetailList.innerHTML = "";
    const visibleLines = lines.length ? lines : [{ label: "Aucune ligne pour le moment", calculation: "", amount: 0 }];

    visibleLines.forEach((line) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      const amount = document.createElement("strong");
      label.textContent = line.calculation ? `${line.label} - ${line.calculation}` : line.label;
      amount.textContent = formatCurrency(line.amount);
      item.append(label, amount);
      paintDetailList.appendChild(item);
    });
  }

  function updatePaintingEstimate() {
    if (!paintingForm) return;
    lastPaintingCalculation = calculateEstimatePeinture(readPaintingState());
    setText("paintTotalAmount", formatCurrency(lastPaintingCalculation.total));
    setText("paintClientRange", `Fourchette client : ${formatCurrency(lastPaintingCalculation.low)} - ${formatCurrency(lastPaintingCalculation.high)}`);
    setText("paintPreparationAmount", formatCurrency(lastPaintingCalculation.preparationAmount));
    setText("paintSkimAmount", formatCurrency(lastPaintingCalculation.skimAmount));
    setText("paintPaintingAmount", formatCurrency(lastPaintingCalculation.paintingAmount));
    setText("paintExtrasAmount", formatCurrency(lastPaintingCalculation.extrasAmount));
    setText("paintSuppliesAmount", formatCurrency(lastPaintingCalculation.suppliesAmount));
    setText("paintFeesAmount", formatCurrency(lastPaintingCalculation.feesAmount));
    setText("paintMarginAmount", formatCurrency(lastPaintingCalculation.marginAmount));
    renderPeintureDetails(lastPaintingCalculation.detailLines);
  }

  function updatePaintingInterface(syncSurfaceDefaults) {
    setPaintingPriceLabels();
    updatePaintingSurfaceMode(syncSurfaceDefaults);
    updatePaintingSupportSuggestions();
    updatePaintingPackState();
    updatePaintingExpandableFields();
    updatePaintingEstimate();
  }

  function resetPaintingEstimator() {
    paintingForm.reset();
    updatePaintingInterface(true);
    paintCopyStatus.textContent = "";
  }

  function getPaintingSummaryText() {
    const state = lastPaintingCalculation.state;
    const surfaces = [];
    if (state.surfaceType !== "ceiling") surfaces.push(`Murs : ${formatQuantity(state.wallsSurface)} m²`);
    if (state.surfaceType !== "walls") surfaces.push(`Plafond : ${formatQuantity(state.ceilingSurface)} m²`);

    return [
      "LL Carrelage - estimation peinture",
      "",
      ...surfaces,
      `Préparation : ${formatCurrency(lastPaintingCalculation.preparationAmount)}`,
      `Ratissage / pack : ${formatCurrency(lastPaintingCalculation.skimAmount)}`,
      `Peinture : ${formatCurrency(lastPaintingCalculation.paintingAmount)}`,
      `Éléments supplémentaires : ${formatCurrency(lastPaintingCalculation.extrasAmount)}`,
      `Fournitures : ${formatCurrency(lastPaintingCalculation.suppliesAmount)}`,
      `Déplacement + frais : ${formatCurrency(lastPaintingCalculation.feesAmount)}`,
      "",
      `Total estimé : ${formatCurrency(lastPaintingCalculation.total)}`,
      "",
      "Estimation indicative à confirmer après visite et établissement du devis définitif."
    ].join("\n");
  }

  function getPaintingDetailText() {
    const state = lastPaintingCalculation.state;
    const surfaces = [];
    if (state.surfaceType !== "ceiling") surfaces.push(`Murs : ${formatQuantity(state.wallsSurface)} m²`);
    if (state.surfaceType !== "walls") surfaces.push(`Plafond : ${formatQuantity(state.ceilingSurface)} m²`);
    const detailLines = lastPaintingCalculation.detailLines
      .map((line) => `${line.label}${line.calculation ? " : " + line.calculation : ""} = ${formatCurrency(line.amount)}`)
      .join("\n");

    return [
      "LL Carrelage - estimation peinture",
      "",
      ...surfaces,
      "",
      detailLines,
      "",
      `Préparation : ${formatCurrency(lastPaintingCalculation.preparationAmount)}`,
      `Ratissage / pack : ${formatCurrency(lastPaintingCalculation.skimAmount)}`,
      `Peinture : ${formatCurrency(lastPaintingCalculation.paintingAmount)}`,
      `Éléments supplémentaires : ${formatCurrency(lastPaintingCalculation.extrasAmount)}`,
      `Fournitures : ${formatCurrency(lastPaintingCalculation.suppliesAmount)}`,
      `Déplacement + frais : ${formatCurrency(lastPaintingCalculation.feesAmount)}`,
      `Marge imprévu : ${formatCurrency(lastPaintingCalculation.marginAmount)}`,
      `Total : ${formatCurrency(lastPaintingCalculation.total)}`,
      `Fourchette client : ${formatCurrency(lastPaintingCalculation.low)} - ${formatCurrency(lastPaintingCalculation.high)}`
    ].join("\n");
  }

  function handlePaintingChange(event) {
    const target = event.target;

    if (!target) return;

    if (target.name === "paintSurfaceType") {
      updatePaintingSurfaceMode(true);
    }

    const autofillMap = {
      paintLessivageToggle: "paintLessivageSurface",
      paintPoncageToggle: "paintPoncageSurface",
      paintRebouchageToggle: "paintRebouchageSurface",
      paintPrimaireToggle: "paintPrimaireSurface",
      paintDoorsToggle: "paintDoorCount",
      paintRadiatorsToggle: "paintRadiatorCount",
      paintBaseboardsToggle: "paintBaseboardsLength"
    };

    if (autofillMap[target.id] && target.checked) {
      if (target.id === "paintDoorsToggle" || target.id === "paintRadiatorsToggle") {
        const input = document.getElementById(autofillMap[target.id]);
        if (input && numberValue(input.value) === 0) input.value = "1";
      } else if (target.id === "paintBaseboardsToggle") {
        const input = document.getElementById(autofillMap[target.id]);
        if (input && numberValue(input.value) === 0) input.value = "1";
      } else {
        fillPaintingSurfaceIfEmpty(autofillMap[target.id]);
      }
    }

    if (target.name === "paintSkimMode" && target.value === "skim") {
      fillPaintingSurfaceIfEmpty("paintSkimSurface");
    }

    if (target.name === "paintSkimMode" && target.value === "pack") {
      fillPaintingSurfaceIfEmpty("paintPackSurface");
    }

    updatePaintingInterface(false);
  }

  function initPaintingEstimator() {
    if (!paintingForm) return;

    updatePaintingInterface(true);

    paintingForm.addEventListener("input", (event) => {
      if (event.target && event.target.matches('input[type="number"]')) {
        updatePaintingEstimate();
      }
    });

    paintingForm.addEventListener("change", handlePaintingChange);

    document.getElementById("paintResetButton").addEventListener("click", resetPaintingEstimator);
    document.getElementById("paintCopyEstimateButton").addEventListener("click", () => {
      copyText(getPaintingSummaryText(), "Estimation peinture copiée.", paintCopyStatus);
    });
    document.getElementById("paintCopyDetailButton").addEventListener("click", () => {
      copyText(getPaintingDetailText(), "Détail peinture copié.", paintCopyStatus);
    });
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
    calculateEstimateCarrelage: calculateEstimate,
    calculateEstimatePeinture,
    readState,
    readPaintingState,
    updateEstimate,
    updatePaintingEstimate,
    projectRates,
    peintureTarifs
  };

  initModeSwitcher();
  initEstimator();
  initPaintingEstimator();
})();
