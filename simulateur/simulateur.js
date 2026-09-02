(function () {
  "use strict";

  const MINIMUM_INTERVENTION = 80;
  const DEFAULT_HOURLY_TARGET = 40;
  const HOURLY_TARGET_STORAGE_KEY = "llcarrelage_hourly_target";

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

  const paintingRates = {
    lessivageMurs: { label: "Lessivage murs", rate: 3, unit: "m²" },
    poncageLeger: { label: "Ponçage léger", rate: 4, unit: "m²" },
    rebouchageLocalise: { label: "Rebouchage localisé", rate: 6, unit: "m²" },
    ratissageMurs: { label: "Ratissage complet murs", rate: 15, unit: "m²" },
    ratissagePlafond: { label: "Ratissage complet plafond", rate: 20, unit: "m²" },
    primaire: { label: "Primaire / sous-couche", rate: 5, unit: "m²" },
    peintureMurs: { label: "Peinture murs - 2 couches", rate: 20, unit: "m²" },
    peinturePlafond: { label: "Peinture plafond - 2 couches", rate: 25, unit: "m²" },
    packMurs: { label: "Ratissage + primaire + peinture murs", rate: 38, unit: "m²" },
    packPlafond: { label: "Ratissage + primaire + peinture plafond", rate: 48, unit: "m²" }
  };

  const paintingSurfaceLabels = {
    walls: "Murs",
    ceiling: "Plafond",
    both: "Murs + plafond"
  };

  const paintingSuppliesLabels = {
    client: "Client fournit les produits",
    artisan: "Je fournis peinture / produits"
  };

  const paintingSupportHints = {
    good: "Peinture simple possible si le support est propre et sain.",
    medium: "Vérifier ponçage, rebouchage et primaire.",
    bad: "Ratissage complet probablement à prévoir."
  };

  const paintingDefaultTask = { enabled: false, surface: 0 };

  const paintingDefaultState = {
    surfaceType: "walls",
    wallsSurface: 0,
    ceilingSurface: 0,
    supportCondition: "good",
    lessivageMurs: { ...paintingDefaultTask },
    sanding: { ...paintingDefaultTask },
    patching: { ...paintingDefaultTask },
    wallSkim: { ...paintingDefaultTask },
    ceilingSkim: { ...paintingDefaultTask },
    wallPrimer: { ...paintingDefaultTask },
    ceilingPrimer: { ...paintingDefaultTask },
    wallPaint: { ...paintingDefaultTask },
    ceilingPaint: { ...paintingDefaultTask },
    wallPack: { ...paintingDefaultTask },
    ceilingPack: { ...paintingDefaultTask },
    suppliesType: "client",
    suppliesEstimate: 0,
    travelCost: 0,
    otherCost: 0,
    marginRate: 0.05
  };

  const defaultPrepSurfaces = {
    lightLeveling: 0,
    heavyLeveling: 0,
    sanding: 0,
    primer: 0
  };

  const defaultState = {
    projectType: "interior",
    quantity: 0,
    tileFormat: "none",
    supports: ["standard"],
    removal: "none",
    removalSurface: 0,
    prep: ["none"],
    prepSurfaces: { ...defaultPrepSurfaces },
    waterproof: "none",
    waterproofSurface: 0,
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
    marginRate: 0.05,
    realSuppliesCost: 0,
    realTravelCost: 0,
    wasteCost: 0,
    otherRealCost: 0,
    estimatedHours: 0,
    hourlyTarget: DEFAULT_HOURLY_TARGET
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

  function roundDisplayEuro(value) {
    if (!Number.isFinite(value)) {
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

  function formatInternalCurrency(value, showPlus) {
    const rounded = roundDisplayEuro(value);
    const formatted = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(rounded);

    if (showPlus && rounded > 0) {
      return `+${formatted}`;
    }

    return formatted;
  }

  function formatQuantity(value) {
    const rounded = Math.round(numberValue(value) * 10) / 10;
    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 1
    }).format(rounded);
  }

  function formatInputValue(value) {
    const safeValue = numberValue(value);
    if (Number.isInteger(safeValue)) {
      return String(safeValue);
    }
    return String(Math.round(safeValue * 10) / 10);
  }

  function normalizeList(values, allowedKeys, fallback) {
    const keys = Array.isArray(values) ? values : [fallback];
    const filtered = keys.filter((key) => allowedKeys.includes(key));
    return filtered.length ? filtered : [fallback];
  }

  function normalizeState(state) {
    const merged = { ...defaultState, ...(state || {}) };
    const prepSurfaces = {
      ...defaultPrepSurfaces,
      ...(state && typeof state.prepSurfaces === "object" ? state.prepSurfaces : {})
    };

    merged.quantity = numberValue(merged.quantity);
    merged.supports = normalizeList(merged.supports, Object.keys(supportRates), "standard");
    if (merged.supports.some((support) => support !== "standard")) {
      merged.supports = merged.supports.filter((support) => support !== "standard");
    }

    merged.prep = normalizeList(merged.prep, Object.keys(prepRates), "none");
    if (merged.prep.some((prepKey) => prepKey !== "none")) {
      merged.prep = merged.prep.filter((prepKey) => prepKey !== "none");
    }

    merged.removalSurface = numberValue(merged.removalSurface);
    merged.prepSurfaces = Object.fromEntries(
      Object.keys(defaultPrepSurfaces).map((key) => [key, numberValue(prepSurfaces[key])])
    );
    merged.waterproofSurface = numberValue(merged.waterproofSurface);
    merged.extraBaseboardsLength = numberValue(merged.extraBaseboardsLength);
    merged.siliconeLength = numberValue(merged.siliconeLength);
    merged.profileLength = numberValue(merged.profileLength);
    merged.thresholdCount = numberValue(merged.thresholdCount);
    merged.suppliesEstimate = numberValue(merged.suppliesEstimate);
    merged.travelCost = numberValue(merged.travelCost);
    merged.otherCost = numberValue(merged.otherCost);
    merged.marginRate = numberValue(merged.marginRate);
    merged.realSuppliesCost = numberValue(merged.realSuppliesCost);
    merged.realTravelCost = numberValue(merged.realTravelCost);
    merged.wasteCost = numberValue(merged.wasteCost);
    merged.otherRealCost = numberValue(merged.otherRealCost);
    merged.estimatedHours = numberValue(merged.estimatedHours);
    merged.hourlyTarget = numberValue(merged.hourlyTarget) || DEFAULT_HOURLY_TARGET;
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

  function addWarning(warnings, message) {
    if (!warnings.includes(message)) {
      warnings.push(message);
    }
  }

  function warnIfSurfaceAboveMain(warnings, label, surface, mainQuantity) {
    if (mainQuantity > 0 && surface > mainQuantity) {
      addWarning(warnings, `${label} : surface supérieure à la surface principale, vérifier la saisie.`);
    }
  }

  function buildSurfaceLine(label, surface, rate) {
    if (surface <= 0) {
      return `${label} - surface à renseigner`;
    }

    return `${label} - ${formatQuantity(surface)} m² x ${rate} €/m²`;
  }

  function calculateEstimate(inputState) {
    const state = normalizeState(inputState);
    const project = projectRates[state.projectType] || projectRates.interior;
    const isClassic = project.kind === "classic";
    const isBrokenTiles = project.kind === "brokenTiles";
    const unit = project.unitLabel;
    const quantity = isBrokenTiles ? Math.floor(state.quantity) : state.quantity;
    const lines = [];
    const warnings = [];

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
      const formatAmount = lineAmount(quantity, format.rate);
      addLine(lines, `${format.label} - ${formatQuantity(quantity)} ${unit} x ${format.rate} €/${unit}`, formatAmount, false);
      laborSubtotal += formatAmount;

      state.supports.forEach((supportKey) => {
        if (supportKey === "standard") return;
        const support = supportRates[supportKey];
        if (!support) return;
        const amount = lineAmount(quantity, support.rate);
        laborSubtotal += amount;
        addLine(lines, `${support.label} - ${formatQuantity(quantity)} ${unit} x ${support.rate} €/${unit}`, amount, false);
      });

      const removal = removalRates[state.removal] || removalRates.none;
      if (state.removal !== "none") {
        const removalAmount = lineAmount(state.removalSurface, removal.rate);
        laborSubtotal += removalAmount;
        addLine(lines, buildSurfaceLine(removal.label, state.removalSurface, removal.rate), removalAmount, true);
        warnIfSurfaceAboveMain(warnings, removal.label, state.removalSurface, quantity);

        if (state.removalSurface <= 0) {
          addWarning(warnings, "Dépose : renseigner la surface concernée.");
        }
      }

      state.prep.forEach((prepKey) => {
        if (prepKey === "none") return;
        const prep = prepRates[prepKey];
        if (!prep) return;
        const prepSurface = state.prepSurfaces[prepKey] || 0;
        const amount = lineAmount(prepSurface, prep.rate);
        laborSubtotal += amount;
        addLine(lines, buildSurfaceLine(prep.label, prepSurface, prep.rate), amount, true);
        warnIfSurfaceAboveMain(warnings, prep.label, prepSurface, quantity);

        if (prepSurface <= 0) {
          addWarning(warnings, `${prep.label} : renseigner la surface concernée.`);
        }
      });

      const waterproof = waterproofRates[state.waterproof] || waterproofRates.none;
      if (state.waterproof !== "none") {
        const waterproofAmount = lineAmount(state.waterproofSurface, waterproof.rate);
        laborSubtotal += waterproofAmount;
        addLine(lines, buildSurfaceLine(waterproof.label, state.waterproofSurface, waterproof.rate), waterproofAmount, true);
        warnIfSurfaceAboveMain(warnings, waterproof.label, state.waterproofSurface, quantity);

        if (state.waterproofSurface <= 0) {
          addWarning(warnings, "Étanchéité : renseigner la surface concernée.");
        }
      }

      if (state.supports.includes("oldTiles") && state.removal !== "none") {
        addWarning(warnings, "Ancien carrelage + dépose : vérifier que ces deux suppléments ne couvrent pas le même travail.");
      }

      if (state.supports.includes("oldTiles") && (state.prep.includes("sanding") || state.prep.includes("primer"))) {
        addWarning(warnings, "Ancien carrelage + préparation : vérifier que ces deux suppléments ne couvrent pas le même travail.");
      }

      if (state.supports.includes("notFlat") && (state.prep.includes("lightLeveling") || state.prep.includes("heavyLeveling"))) {
        addWarning(warnings, "Support pas plat + ragréage : vérifier que ces deux suppléments ne couvrent pas le même travail.");
      }

      if (state.supports.includes("wood") && state.waterproof === "mat") {
        addWarning(warnings, "Support bois + natte : vérifier que ces deux suppléments ne couvrent pas le même travail.");
      }
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
      detailLines: lines,
      warningLines: warnings
    };
  }

  function normalizePaintingTask(task) {
    return {
      enabled: Boolean(task && task.enabled),
      surface: numberValue(task && task.surface)
    };
  }

  function normalizePaintingState(inputState) {
    const source = inputState || {};
    const surfaceType = Object.keys(paintingSurfaceLabels).includes(source.surfaceType)
      ? source.surfaceType
      : paintingDefaultState.surfaceType;

    return {
      surfaceType,
      wallsSurface: surfaceType === "ceiling" ? 0 : numberValue(source.wallsSurface),
      ceilingSurface: surfaceType === "walls" ? 0 : numberValue(source.ceilingSurface),
      supportCondition: Object.keys(paintingSupportHints).includes(source.supportCondition) ? source.supportCondition : "good",
      lessivageMurs: normalizePaintingTask(source.lessivageMurs),
      sanding: normalizePaintingTask(source.sanding),
      patching: normalizePaintingTask(source.patching),
      wallSkim: normalizePaintingTask(source.wallSkim),
      ceilingSkim: normalizePaintingTask(source.ceilingSkim),
      wallPrimer: normalizePaintingTask(source.wallPrimer),
      ceilingPrimer: normalizePaintingTask(source.ceilingPrimer),
      wallPaint: normalizePaintingTask(source.wallPaint),
      ceilingPaint: normalizePaintingTask(source.ceilingPaint),
      wallPack: normalizePaintingTask(source.wallPack),
      ceilingPack: normalizePaintingTask(source.ceilingPack),
      suppliesType: Object.keys(paintingSuppliesLabels).includes(source.suppliesType) ? source.suppliesType : "client",
      suppliesEstimate: numberValue(source.suppliesEstimate),
      travelCost: numberValue(source.travelCost),
      otherCost: numberValue(source.otherCost),
      marginRate: numberValue(source.marginRate)
    };
  }

  function addPaintingSurfaceLine(lines, warnings, task, rate, mainSurface, isRelevant) {
    if (!isRelevant || !task.enabled) {
      return 0;
    }

    const amount = lineAmount(task.surface, rate.rate);
    addLine(lines, buildSurfaceLine(rate.label, task.surface, rate.rate), amount, true);
    warnIfSurfaceAboveMain(warnings, rate.label, task.surface, mainSurface);

    if (task.surface <= 0) {
      addWarning(warnings, `${rate.label} : renseigner la surface concernée.`);
    }

    return amount;
  }

  function addPaintingSurfaceLineOutsidePack(lines, warnings, task, rate, mainSurface, isRelevant, packTask) {
    if (!isRelevant || !task.enabled) {
      return 0;
    }

    warnIfSurfaceAboveMain(warnings, rate.label, task.surface, mainSurface);

    if (task.surface <= 0) {
      addLine(lines, buildSurfaceLine(rate.label, task.surface, rate.rate), 0, true);
      addWarning(warnings, `${rate.label} : renseigner la surface concernée.`);
      return 0;
    }

    const packSurface = packTask && packTask.enabled ? packTask.surface : 0;
    const billableSurface = Math.max(0, task.surface - packSurface);

    if (billableSurface <= 0) {
      return 0;
    }

    const label = billableSurface < task.surface ? `${rate.label} - hors surface du pack` : rate.label;
    const amount = lineAmount(billableSurface, rate.rate);
    addLine(lines, buildSurfaceLine(label, billableSurface, rate.rate), amount, true);

    return amount;
  }

  function warnIfPaintingPackAboveMain(warnings, packLabel, packTask, mainSurface) {
    if (packTask.enabled && mainSurface > 0 && packTask.surface > mainSurface) {
      addWarning(warnings, `Attention : la surface du pack ${packLabel} est supérieure à la surface totale.`);
    }
  }

  function calculatePaintingEstimate(inputState) {
    const state = normalizePaintingState(inputState);
    const lines = [];
    const warnings = [];
    const hasWalls = state.surfaceType === "walls" || state.surfaceType === "both";
    const hasCeiling = state.surfaceType === "ceiling" || state.surfaceType === "both";
    const totalSurface = state.wallsSurface + state.ceilingSurface;
    let laborSubtotal = 0;

    laborSubtotal += addPaintingSurfaceLine(lines, warnings, state.lessivageMurs, paintingRates.lessivageMurs, state.wallsSurface, hasWalls);
    laborSubtotal += addPaintingSurfaceLine(lines, warnings, state.sanding, paintingRates.poncageLeger, totalSurface, hasWalls || hasCeiling);
    laborSubtotal += addPaintingSurfaceLine(lines, warnings, state.patching, paintingRates.rebouchageLocalise, totalSurface, hasWalls || hasCeiling);
    laborSubtotal += addPaintingSurfaceLine(lines, warnings, state.wallPack, paintingRates.packMurs, state.wallsSurface, hasWalls);
    laborSubtotal += addPaintingSurfaceLine(lines, warnings, state.ceilingPack, paintingRates.packPlafond, state.ceilingSurface, hasCeiling);
    laborSubtotal += addPaintingSurfaceLineOutsidePack(lines, warnings, state.wallSkim, paintingRates.ratissageMurs, state.wallsSurface, hasWalls, state.wallPack);
    laborSubtotal += addPaintingSurfaceLineOutsidePack(lines, warnings, state.ceilingSkim, paintingRates.ratissagePlafond, state.ceilingSurface, hasCeiling, state.ceilingPack);
    laborSubtotal += addPaintingSurfaceLineOutsidePack(lines, warnings, state.wallPrimer, paintingRates.primaire, state.wallsSurface, hasWalls, state.wallPack);
    laborSubtotal += addPaintingSurfaceLineOutsidePack(lines, warnings, state.ceilingPrimer, paintingRates.primaire, state.ceilingSurface, hasCeiling, state.ceilingPack);
    laborSubtotal += addPaintingSurfaceLineOutsidePack(lines, warnings, state.wallPaint, paintingRates.peintureMurs, state.wallsSurface, hasWalls, state.wallPack);
    laborSubtotal += addPaintingSurfaceLineOutsidePack(lines, warnings, state.ceilingPaint, paintingRates.peinturePlafond, state.ceilingSurface, hasCeiling, state.ceilingPack);

    warnIfPaintingPackAboveMain(warnings, "murs", state.wallPack, state.wallsSurface);
    warnIfPaintingPackAboveMain(warnings, "plafond", state.ceilingPack, state.ceilingSurface);

    if (!lines.length) {
      addLine(lines, "Aucune prestation peinture sélectionnée", 0, true);
    }

    if (laborSubtotal > 0 && laborSubtotal < MINIMUM_INTERVENTION) {
      const minimumAddition = MINIMUM_INTERVENTION - laborSubtotal;
      laborSubtotal += minimumAddition;
      addLine(lines, "Minimum général d'intervention", minimumAddition, false);
    }

    const marginAmount = laborSubtotal > 0 ? laborSubtotal * state.marginRate : 0;
    const suppliesAmount = state.suppliesEstimate;
    const feesAmount = state.travelCost + state.otherCost;
    const total = laborSubtotal + marginAmount + suppliesAmount + feesAmount;
    const roundedTotal = roundEuro(total);

    addLine(lines, paintingSuppliesLabels[state.suppliesType] || paintingSuppliesLabels.client, suppliesAmount, suppliesAmount > 0);
    addLine(lines, "Déplacement", state.travelCost, state.travelCost > 0);
    addLine(lines, "Autres frais", state.otherCost, state.otherCost > 0);
    addLine(lines, `Marge imprévu ${Math.round(state.marginRate * 100)} %`, marginAmount, marginAmount > 0);

    return {
      state,
      surfaceLabel: paintingSurfaceLabels[state.surfaceType] || paintingSurfaceLabels.walls,
      laborAmount: roundEuro(laborSubtotal),
      suppliesAmount: roundEuro(suppliesAmount),
      feesAmount: roundEuro(feesAmount),
      marginAmount: roundEuro(marginAmount),
      total: roundedTotal,
      low: roundEuro(roundedTotal * 0.95),
      high: roundEuro(roundedTotal * 1.1),
      detailLines: lines,
      warningLines: warnings
    };
  }

  function calculateProfitability(input) {
    const data = {
      totalClient: numberValue(input && input.totalClient),
      realSuppliesCost: numberValue(input && input.realSuppliesCost),
      realTravelCost: numberValue(input && input.realTravelCost),
      wasteCost: numberValue(input && input.wasteCost),
      otherRealCost: numberValue(input && input.otherRealCost),
      estimatedHours: numberValue(input && input.estimatedHours),
      hourlyTarget: numberValue(input && input.hourlyTarget) || DEFAULT_HOURLY_TARGET
    };

    const directCosts = data.realSuppliesCost + data.realTravelCost + data.wasteCost + data.otherRealCost;
    const remainingAfterCosts = data.totalClient - directCosts;
    const hasHours = data.estimatedHours > 0;
    const hourlyYield = hasHours ? remainingAfterCosts / data.estimatedHours : null;
    const targetLabor = hasHours ? data.estimatedHours * data.hourlyTarget : null;
    const minimumObjectivePrice = hasHours ? targetLabor + directCosts : null;
    const objectiveGap = hasHours ? data.totalClient - minimumObjectivePrice : null;

    let status = "À compléter";
    let statusKey = "empty";
    let message = "Renseignez le temps estimé pour calculer la rentabilité.";

    if (hasHours) {
      if (hourlyYield < 30) {
        status = "Peu rentable";
        statusKey = "low";
      } else if (hourlyYield < 40) {
        status = "Correct";
        statusKey = "fair";
      } else if (hourlyYield < 50) {
        status = "Rentable";
        statusKey = "good";
      } else {
        status = "Très rentable";
        statusKey = "strong";
      }

      if (objectiveGap < 0) {
        message = `Il manque environ ${formatInternalCurrency(Math.abs(objectiveGap))} pour atteindre l'objectif.`;
      } else {
        message = `Prix supérieur d'environ ${formatInternalCurrency(objectiveGap)} à l'objectif.`;
      }
    }

    return {
      directCosts,
      remainingAfterCosts,
      hourlyYield,
      hourlyTarget: data.hourlyTarget,
      targetLabor,
      minimumObjectivePrice,
      objectiveGap,
      status,
      statusKey,
      message
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      calculateEstimate,
      calculatePaintingEstimate,
      calculateProfitability,
      projectRates,
      paintingRates,
      formatRates,
      supportRates,
      removalRates,
      prepRates,
      waterproofRates,
      MINIMUM_INTERVENTION
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
  const warningBox = document.getElementById("estimateWarnings");
  const warningList = document.getElementById("warningList");
  const copyStatus = document.getElementById("copyStatus");
  const paintingForm = document.getElementById("paintingEstimatorForm");
  const paintDetailList = document.getElementById("paintDetailList");
  const paintWarningBox = document.getElementById("paintEstimateWarnings");
  const paintWarningList = document.getElementById("paintWarningList");
  const paintCopyStatus = document.getElementById("paintCopyStatus");

  const surfaceInputs = {
    removalSurface: document.getElementById("removalSurface"),
    prepLightSurface: document.getElementById("prepLightSurface"),
    prepHeavySurface: document.getElementById("prepHeavySurface"),
    prepSandingSurface: document.getElementById("prepSandingSurface"),
    prepPrimerSurface: document.getElementById("prepPrimerSurface"),
    waterproofSurface: document.getElementById("waterproofSurface")
  };

  let lastCalculation = calculateEstimate(defaultState);
  let lastPaintingCalculation = calculatePaintingEstimate(paintingDefaultState);

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
      removalSurface: getInputNumber("removalSurface"),
      prep: getCheckedValues(["prepNone", "prepLight", "prepHeavy", "prepSanding", "prepPrimer"]),
      prepSurfaces: {
        lightLeveling: getInputNumber("prepLightSurface"),
        heavyLeveling: getInputNumber("prepHeavySurface"),
        sanding: getInputNumber("prepSandingSurface"),
        primer: getInputNumber("prepPrimerSurface")
      },
      waterproof: getCheckedRadio("waterproof") || "none",
      waterproofSurface: getInputNumber("waterproofSurface"),
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
      marginRate: numberValue(getCheckedRadio("marginRate") || 0),
      realSuppliesCost: getInputNumber("realSuppliesCost"),
      realTravelCost: getInputNumber("realTravelCost"),
      wasteCost: getInputNumber("wasteCost"),
      otherRealCost: getInputNumber("otherRealCost"),
      estimatedHours: getInputNumber("estimatedHours"),
      hourlyTarget: getInputNumber("hourlyTarget") || DEFAULT_HOURLY_TARGET
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

  function renderWarnings(warnings) {
    if (!warningBox || !warningList) return;

    warningList.innerHTML = "";
    warningBox.hidden = warnings.length === 0;

    warnings.forEach((warning) => {
      const item = document.createElement("li");
      item.textContent = warning;
      warningList.appendChild(item);
    });
  }

  function renderPaintingDetails(lines) {
    if (!paintDetailList) return;

    paintDetailList.innerHTML = "";
    const visibleLines = lines.length ? lines : [{ label: "Aucune ligne pour le moment", amount: 0 }];

    visibleLines.forEach((line) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      const amount = document.createElement("strong");
      label.textContent = line.label;
      amount.textContent = formatCurrency(line.amount);
      item.append(label, amount);
      paintDetailList.appendChild(item);
    });
  }

  function renderPaintingWarnings(warnings) {
    if (!paintWarningBox || !paintWarningList) return;

    paintWarningList.innerHTML = "";
    paintWarningBox.hidden = warnings.length === 0;

    warnings.forEach((warning) => {
      const item = document.createElement("li");
      item.textContent = warning;
      paintWarningList.appendChild(item);
    });
  }

  function readPaintingTask(toggleId, surfaceId) {
    return {
      enabled: isChecked(toggleId),
      surface: getInputNumber(surfaceId)
    };
  }

  function readPaintingState() {
    return {
      surfaceType: getCheckedRadio("paintSurfaceType") || "walls",
      wallsSurface: getInputNumber("paintWallsSurface"),
      ceilingSurface: getInputNumber("paintCeilingSurface"),
      supportCondition: getCheckedRadio("paintSupportCondition") || "good",
      lessivageMurs: readPaintingTask("paintLessivageToggle", "paintLessivageSurface"),
      sanding: readPaintingTask("paintSandingToggle", "paintSandingSurface"),
      patching: readPaintingTask("paintPatchingToggle", "paintPatchingSurface"),
      wallSkim: readPaintingTask("paintWallSkimToggle", "paintWallSkimSurface"),
      ceilingSkim: readPaintingTask("paintCeilingSkimToggle", "paintCeilingSkimSurface"),
      wallPrimer: readPaintingTask("paintWallPrimerToggle", "paintWallPrimerSurface"),
      ceilingPrimer: readPaintingTask("paintCeilingPrimerToggle", "paintCeilingPrimerSurface"),
      wallPaint: readPaintingTask("paintWallPaintToggle", "paintWallPaintSurface"),
      ceilingPaint: readPaintingTask("paintCeilingPaintToggle", "paintCeilingPaintSurface"),
      wallPack: readPaintingTask("paintWallPackToggle", "paintWallPackSurface"),
      ceilingPack: readPaintingTask("paintCeilingPackToggle", "paintCeilingPackSurface"),
      suppliesType: getCheckedRadio("paintSuppliesType") || "client",
      suppliesEstimate: getInputNumber("paintSuppliesEstimate"),
      travelCost: getInputNumber("paintTravelCost"),
      otherCost: getInputNumber("paintOtherCost"),
      marginRate: numberValue(getCheckedRadio("paintMarginRate") || 0)
    };
  }

  function setPaintingRelevance(selector, isRelevant) {
    document.querySelectorAll(selector).forEach((element) => {
      element.classList.toggle("paint-relevance-hidden", !isRelevant);
    });
  }

  function syncPaintingSurfaceVisibility() {
    const surfaceType = getCheckedRadio("paintSurfaceType") || "walls";
    const hasWalls = surfaceType === "walls" || surfaceType === "both";
    const hasCeiling = surfaceType === "ceiling" || surfaceType === "both";

    setPaintingRelevance("[data-paint-area='walls'], .paint-relevant-walls", hasWalls);
    setPaintingRelevance("[data-paint-area='ceiling'], .paint-relevant-ceiling", hasCeiling);
  }

  function syncPaintingSurfaceFields() {
    document.querySelectorAll(".paint-surface-field[data-target]").forEach((field) => {
      const toggle = document.getElementById(field.dataset.target);
      const isRelevant = !field.classList.contains("paint-relevance-hidden");
      field.classList.toggle("is-visible", Boolean(toggle && toggle.checked && isRelevant));
    });
  }

  function getPaintingMainSurface(kind) {
    if (kind === "walls") {
      return getInputNumber("paintWallsSurface");
    }

    if (kind === "ceiling") {
      return getInputNumber("paintCeilingSurface");
    }

    return getInputNumber("paintWallsSurface") + getInputNumber("paintCeilingSurface");
  }

  function prefillPaintingSurface(inputId, kind) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const currentValue = numberValue(input.value);
    const sourceSurface = getPaintingMainSurface(kind);

    if (currentValue <= 0 && sourceSurface > 0) {
      input.value = formatInputValue(sourceSurface);
    }
  }

  function updatePaintSupportHint() {
    const hint = document.getElementById("paintSupportHint");
    if (!hint) return;

    const supportCondition = getCheckedRadio("paintSupportCondition") || "good";
    hint.textContent = paintingSupportHints[supportCondition] || paintingSupportHints.good;
  }

  function updatePaintingQuickButtons() {
    const surfaceType = getCheckedRadio("paintSurfaceType") || "walls";
    const hasWalls = surfaceType === "walls" || surfaceType === "both";
    const hasCeiling = surfaceType === "ceiling" || surfaceType === "both";

    document.querySelectorAll("[data-paint-quick]").forEach((button) => {
      const quick = button.dataset.paintQuick;
      const needsWalls = quick === "wallsSimple" || quick === "wallPack";
      const needsCeiling = quick === "ceilingSimple" || quick === "ceilingPack";
      button.disabled = (needsWalls && !hasWalls) || (needsCeiling && !hasCeiling);
    });
  }

  function handlePaintingActivation(target) {
    if (!target || !target.checked) return;

    const activationMap = {
      paintLessivageToggle: ["paintLessivageSurface", "walls"],
      paintSandingToggle: ["paintSandingSurface", "total"],
      paintPatchingToggle: ["paintPatchingSurface", "total"],
      paintWallSkimToggle: ["paintWallSkimSurface", "walls"],
      paintCeilingSkimToggle: ["paintCeilingSkimSurface", "ceiling"],
      paintWallPrimerToggle: ["paintWallPrimerSurface", "walls"],
      paintCeilingPrimerToggle: ["paintCeilingPrimerSurface", "ceiling"],
      paintWallPaintToggle: ["paintWallPaintSurface", "walls"],
      paintCeilingPaintToggle: ["paintCeilingPaintSurface", "ceiling"],
      paintWallPackToggle: ["paintWallPackSurface", "walls"],
      paintCeilingPackToggle: ["paintCeilingPackSurface", "ceiling"]
    };
    const entry = activationMap[target.id];

    if (entry) {
      prefillPaintingSurface(entry[0], entry[1]);
    }
  }

  function applyPaintingQuickChoice(choice) {
    const quickMap = {
      wallsSimple: ["paintWallPaintToggle", "paintWallPaintSurface", "walls"],
      ceilingSimple: ["paintCeilingPaintToggle", "paintCeilingPaintSurface", "ceiling"],
      wallPack: ["paintWallPackToggle", "paintWallPackSurface", "walls"],
      ceilingPack: ["paintCeilingPackToggle", "paintCeilingPackSurface", "ceiling"]
    };
    const entry = quickMap[choice];

    if (!entry) return;

    const toggle = document.getElementById(entry[0]);
    if (!toggle || toggle.disabled) return;

    toggle.checked = true;
    prefillPaintingSurface(entry[1], entry[2]);
    syncPaintingSurfaceFields();
    updatePaintingEstimate();
  }

  function updatePaintingEstimate() {
    if (!paintingForm) return;

    lastPaintingCalculation = calculatePaintingEstimate(readPaintingState());
    setText("paintTotalAmount", formatCurrency(lastPaintingCalculation.total));
    setText("paintClientRange", `Fourchette client : ${formatCurrency(lastPaintingCalculation.low)} - ${formatCurrency(lastPaintingCalculation.high)}`);
    setText("paintLaborAmount", formatCurrency(lastPaintingCalculation.laborAmount));
    setText("paintSuppliesAmount", formatCurrency(lastPaintingCalculation.suppliesAmount));
    setText("paintFeesAmount", formatCurrency(lastPaintingCalculation.feesAmount));
    setText("paintMarginAmount", formatCurrency(lastPaintingCalculation.marginAmount));
    renderPaintingWarnings(lastPaintingCalculation.warningLines);
    renderPaintingDetails(lastPaintingCalculation.detailLines);
  }

  function resetPaintingEstimator() {
    if (!paintingForm) return;

    paintingForm.reset();
    syncPaintingSurfaceVisibility();
    syncPaintingSurfaceFields();
    updatePaintSupportHint();
    updatePaintingQuickButtons();
    updatePaintingEstimate();

    if (paintCopyStatus) {
      paintCopyStatus.textContent = "";
    }
  }

  function getPaintingDetailText() {
    const result = lastPaintingCalculation;
    const state = result.state;
    const detailLines = result.detailLines
      .map((line) => `${line.label} : ${formatCurrency(line.amount)}`)
      .join("\n");
    const surfaces = [
      state.wallsSurface > 0 ? `Murs : ${formatQuantity(state.wallsSurface)} m²` : "",
      state.ceilingSurface > 0 ? `Plafond : ${formatQuantity(state.ceilingSurface)} m²` : ""
    ].filter(Boolean).join("\n");

    return [
      "LL Carrelage - estimation peinture",
      `Type de surface : ${result.surfaceLabel}`,
      surfaces || "Surface : à renseigner",
      "",
      detailLines,
      "",
      `Prestations : ${formatCurrency(result.laborAmount)}`,
      `Fournitures : ${formatCurrency(result.suppliesAmount)}`,
      `Déplacement + frais : ${formatCurrency(result.feesAmount)}`,
      `Marge imprévu : ${formatCurrency(result.marginAmount)}`,
      `Total estimé : ${formatCurrency(result.total)}`,
      `Fourchette client : ${formatCurrency(result.low)} - ${formatCurrency(result.high)}`
    ].join("\n");
  }

  function setEstimatorMode(mode) {
    const activeMode = mode === "peinture" ? "peinture" : "carrelage";

    document.querySelectorAll("[data-mode-button]").forEach((button) => {
      const isActive = button.dataset.modeButton === activeMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    document.querySelectorAll("[data-mode-panel]").forEach((panel) => {
      const isActive = panel.dataset.modePanel === activeMode;
      panel.classList.toggle("is-active", isActive);

      if (isActive) {
        panel.hidden = false;
        panel.removeAttribute("hidden");
      } else {
        panel.hidden = true;
        panel.setAttribute("hidden", "");
      }

      panel.setAttribute("aria-hidden", String(!isActive));
    });
  }

  function initModeSwitcher() {
    document.querySelectorAll("[data-mode-button]").forEach((button) => {
      button.addEventListener("click", () => {
        setEstimatorMode(button.dataset.modeButton);
      });
    });

    setEstimatorMode("carrelage");
  }

  function initPaintingEstimator() {
    if (!paintingForm) return;

    syncPaintingSurfaceVisibility();
    syncPaintingSurfaceFields();
    updatePaintSupportHint();
    updatePaintingQuickButtons();
    updatePaintingEstimate();

    paintingForm.addEventListener("input", () => {
      updatePaintingEstimate();
    });

    paintingForm.addEventListener("change", (event) => {
      const target = event.target;

      if (target && target.name === "paintSurfaceType") {
        syncPaintingSurfaceVisibility();
        updatePaintingQuickButtons();
      }

      if (target && target.name === "paintSupportCondition") {
        updatePaintSupportHint();
      }

      handlePaintingActivation(target);
      syncPaintingSurfaceFields();
      updatePaintingEstimate();
    });

    document.querySelectorAll("[data-paint-quick]").forEach((button) => {
      button.addEventListener("click", () => {
        applyPaintingQuickChoice(button.dataset.paintQuick);
      });
    });

    document.getElementById("paintResetButton").addEventListener("click", resetPaintingEstimator);
    document.getElementById("paintCopyEstimateButton").addEventListener("click", () => {
      copyText(getPaintingDetailText(), "Estimation peinture copiée.", paintCopyStatus);
    });
  }

  function renderProfitability(profitability) {
    const status = document.getElementById("profitabilityStatus");

    if (status) {
      status.textContent = profitability.status;
      status.dataset.status = profitability.statusKey;
    }

    setText("directCostsAmount", formatCurrency(profitability.directCosts));
    setText("remainingAfterCosts", formatInternalCurrency(profitability.remainingAfterCosts));
    setText(
      "hourlyYield",
      profitability.hourlyYield === null ? "À renseigner" : `${formatInternalCurrency(profitability.hourlyYield)}/h`
    );
    setText("profitTarget", `${formatQuantity(profitability.hourlyTarget)} €/h`);
    setText(
      "minimumObjectivePrice",
      profitability.minimumObjectivePrice === null ? "À renseigner" : formatInternalCurrency(profitability.minimumObjectivePrice)
    );
    setText(
      "objectiveGap",
      profitability.objectiveGap === null ? "À renseigner" : formatInternalCurrency(profitability.objectiveGap, true)
    );
    setText("profitHint", profitability.message);
  }

  function updateEstimate() {
    const state = readState();
    lastCalculation = calculateEstimate(state);
    const profitability = calculateProfitability({
      totalClient: lastCalculation.total,
      realSuppliesCost: state.realSuppliesCost,
      realTravelCost: state.realTravelCost,
      wasteCost: state.wasteCost,
      otherRealCost: state.otherRealCost,
      estimatedHours: state.estimatedHours,
      hourlyTarget: state.hourlyTarget
    });

    setText("totalAmount", formatCurrency(lastCalculation.total));
    setText("clientRange", `Fourchette client : ${formatCurrency(lastCalculation.low)} - ${formatCurrency(lastCalculation.high)}`);
    setText("laborAmount", formatCurrency(lastCalculation.laborAmount));
    setText("suppliesAmount", formatCurrency(lastCalculation.suppliesAmount));
    setText("feesAmount", formatCurrency(lastCalculation.feesAmount));
    setText("marginAmount", formatCurrency(lastCalculation.marginAmount));
    renderWarnings(lastCalculation.warningLines);
    renderDetails(lastCalculation.detailLines);
    renderProfitability(profitability);
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

    syncSpecificSurfaceFields();
  }

  function syncExpandableFields() {
    document.querySelectorAll(".expandable-field[data-target]").forEach((field) => {
      const toggle = document.getElementById(field.dataset.target);
      field.classList.toggle("is-visible", Boolean(toggle && toggle.checked));
    });
  }

  function syncSpecificSurfaceFields() {
    const project = projectRates[projectSelect.value] || projectRates.interior;
    const isClassic = project.kind === "classic";
    const visibleState = {
      removal: isClassic && getCheckedRadio("removal") !== "none",
      prepLight: isClassic && isChecked("prepLight"),
      prepHeavy: isClassic && isChecked("prepHeavy"),
      prepSanding: isClassic && isChecked("prepSanding"),
      prepPrimer: isClassic && isChecked("prepPrimer"),
      waterproof: isClassic && getCheckedRadio("waterproof") !== "none"
    };

    document.querySelectorAll(".option-surface-field[data-surface-for]").forEach((field) => {
      field.classList.toggle("is-visible", Boolean(visibleState[field.dataset.surfaceFor]));
    });
  }

  function prefillSpecificSurface(inputId) {
    const input = surfaceInputs[inputId];
    if (!input) return;

    const currentValue = numberValue(input.value);
    const mainQuantity = numberValue(quantityInput.value);

    if (currentValue <= 0 && mainQuantity > 0) {
      input.value = formatInputValue(mainQuantity);
    }
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

  function handleSpecificSurfaceActivation(target) {
    if (!target) return;

    if (target.name === "removal" && target.value !== "none" && target.checked) {
      prefillSpecificSurface("removalSurface");
    }

    if (target.id === "prepLight" && target.checked) {
      prefillSpecificSurface("prepLightSurface");
    }

    if (target.id === "prepHeavy" && target.checked) {
      prefillSpecificSurface("prepHeavySurface");
    }

    if (target.id === "prepSanding" && target.checked) {
      prefillSpecificSurface("prepSandingSurface");
    }

    if (target.id === "prepPrimer" && target.checked) {
      prefillSpecificSurface("prepPrimerSurface");
    }

    if (target.name === "waterproof" && target.value !== "none" && target.checked) {
      prefillSpecificSurface("waterproofSurface");
    }
  }

  function saveHourlyTarget() {
    const target = document.getElementById("hourlyTarget");
    if (!target || !window.localStorage) return;

    try {
      const value = numberValue(target.value);
      if (value > 0) {
        window.localStorage.setItem(HOURLY_TARGET_STORAGE_KEY, String(value));
      }
    } catch (error) {
      // Le simulateur doit rester utilisable si le navigateur bloque le stockage local.
    }
  }

  function applyStoredHourlyTarget() {
    const target = document.getElementById("hourlyTarget");
    if (!target || !window.localStorage) return;

    try {
      const storedValue = numberValue(window.localStorage.getItem(HOURLY_TARGET_STORAGE_KEY));
      if (storedValue > 0) {
        target.value = formatInputValue(storedValue);
      }
    } catch (error) {
      target.value = String(DEFAULT_HOURLY_TARGET);
    }
  }

  function resetEstimator() {
    form.reset();
    applyStoredHourlyTarget();
    updateQuantityLabels();
    toggleSections();
    syncExpandableFields();
    syncSpecificSurfaceFields();
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

  function initEstimator() {
    applyStoredHourlyTarget();
    updateQuantityLabels();
    toggleSections();
    syncExpandableFields();
    syncSpecificSurfaceFields();
    updateEstimate();

    form.addEventListener("input", (event) => {
      if (event.target && event.target.id === "hourlyTarget") {
        saveHourlyTarget();
      }

      updateEstimate();
    });

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

      handleSpecificSurfaceActivation(target);
      syncExpandableFields();
      syncSpecificSurfaceFields();
      updateEstimate();
    });

    document.getElementById("resetButton").addEventListener("click", resetEstimator);
    document.getElementById("copyEstimateButton").addEventListener("click", () => {
      copyText(getClientText(), "Estimation client copiée.");
    });
    document.getElementById("copyDetailButton").addEventListener("click", () => {
      copyText(getDetailText(), "Détail chantier copié.");
    });

    initModeSwitcher();
    initPaintingEstimator();
  }

  window.LLJobEstimator = {
    calculateEstimate,
    calculatePaintingEstimate,
    calculateProfitability,
    readPaintingState,
    readState,
    setEstimatorMode,
    updatePaintingEstimate,
    updateEstimate
  };

  initEstimator();
})();
