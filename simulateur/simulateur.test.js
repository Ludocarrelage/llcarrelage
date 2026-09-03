const assert = require("assert");

const {
  calculateEstimate,
  calculatePaintingEstimate,
  getTileFormatInfo,
  buildClientCopyRows,
  buildClientCopyText,
  buildInternalMemoText,
  buildPaintingClientCopyText,
  buildPaintingInternalMemoText,
  calculateProfitability,
  projectRates,
  paintingRates,
  formatRates,
  supportRates,
  removalRates,
  prepRates,
  waterproofRates,
  MINIMUM_INTERVENTION
} = require("./simulateur.js");

function estimate(overrides) {
  return calculateEstimate({
    projectType: "interior",
    quantity: 40,
    tileLengthCm: 0,
    tileWidthCm: 0,
    supports: ["standard"],
    removal: "none",
    removalSurface: 0,
    prep: ["none"],
    prepSurfaces: {},
    waterproof: "none",
    waterproofSurface: 0,
    suppliesEstimate: 0,
    travelCost: 0,
    otherCost: 0,
    marginRate: 0,
    ...overrides
  });
}

function painting(overrides) {
  return calculatePaintingEstimate({
    surfaceType: "walls",
    wallsSurface: 0,
    ceilingSurface: 0,
    supportCondition: "good",
    lessivageMurs: { enabled: false, surface: 0 },
    sanding: { enabled: false, surface: 0 },
    patching: { enabled: false, surface: 0 },
    wallSkim: { enabled: false, surface: 0 },
    ceilingSkim: { enabled: false, surface: 0 },
    wallPrimer: { enabled: false, surface: 0 },
    ceilingPrimer: { enabled: false, surface: 0 },
    wallPaint: { enabled: false, surface: 0 },
    ceilingPaint: { enabled: false, surface: 0 },
    wallPack: { enabled: false, surface: 0 },
    ceilingPack: { enabled: false, surface: 0 },
    interiorDoors: { enabled: false, quantity: 0 },
    radiators: { enabled: false, quantity: 0 },
    baseboards: { enabled: false, length: 0 },
    suppliesType: "client",
    suppliesEstimate: 0,
    travelCost: 0,
    otherCost: 0,
    marginRate: 0,
    ...overrides
  });
}

assert.strictEqual(MINIMUM_INTERVENTION, 80);
assert.deepStrictEqual(
  Object.fromEntries(Object.entries(projectRates).map(([key, item]) => [key, item.rate])),
  {
    interior: 30,
    terrace: 35,
    bathroom: 45,
    walkInShower: 50,
    kitchenWall: 25,
    bathroomWall: 25,
    stairs: 50,
    baseboardsOnly: 15,
    brokenTiles: 40,
    groutOnly: 15
  }
);
assert.deepStrictEqual(Object.fromEntries(Object.entries(formatRates).map(([key, item]) => [key, item.rate])), {
  verySmall: 10,
  small: 5,
  intermediate: 3,
  standard: 0,
  largeStandard: 0,
  large: 10,
  veryLarge: 15,
  xxl: 20
});
assert.deepStrictEqual(Object.fromEntries(Object.entries(supportRates).map(([key, item]) => [key, item.rate])), {
  standard: 0,
  oldTiles: 6,
  wood: 15,
  unknown: 5,
  notFlat: 12
});
assert.deepStrictEqual(Object.fromEntries(Object.entries(removalRates).map(([key, item]) => [key, item.rate])), {
  none: 0,
  tiles: 15,
  parquet: 10,
  softFloor: 7
});
assert.deepStrictEqual(Object.fromEntries(Object.entries(prepRates).map(([key, item]) => [key, item.rate])), {
  none: 0,
  lightLeveling: 8,
  heavyLeveling: 15,
  sanding: 5,
  primer: 3
});
assert.deepStrictEqual(Object.fromEntries(Object.entries(waterproofRates).map(([key, item]) => [key, item.rate])), {
  none: 0,
  spec: 12,
  mat: 18
});
assert.deepStrictEqual(Object.fromEntries(Object.entries(paintingRates).map(([key, item]) => [key, item.rate])), {
  lessivageMurs: 3,
  poncageLeger: 4,
  rebouchageLocalise: 6,
  ratissageMurs: 15,
  ratissagePlafond: 20,
  primaire: 5,
  peintureMurs: 20,
  peinturePlafond: 25,
  packMurs: 38,
  packPlafond: 48,
  interiorDoors: 100,
  radiators: 60,
  baseboards: 8
});

let result = estimate();
assert.strictEqual(result.baseAmount, 1200);
assert.strictEqual(result.laborAmount, 1200);
assert.strictEqual(result.total, 1200);

[
  ["interior", 10, 300],
  ["terrace", 10, 350],
  ["bathroom", 10, 450],
  ["walkInShower", 10, 500],
  ["kitchenWall", 10, 250],
  ["bathroomWall", 10, 250],
  ["stairs", 10, 500],
  ["baseboardsOnly", 10, 150],
  ["brokenTiles", 2, 80],
  ["groutOnly", 10, 150]
].forEach(([projectType, quantity, expectedBase]) => {
  const projectResult = calculateEstimate({
    projectType,
    quantity,
    tileLengthCm: 0,
    tileWidthCm: 0,
    supports: ["standard"],
    removal: "none",
    prep: ["none"],
    waterproof: "none",
    marginRate: 0,
    suppliesEstimate: 0,
    travelCost: 0,
    otherCost: 0
  });
  assert.strictEqual(projectResult.baseAmount, expectedBase, projectType);
  assert(Number.isFinite(projectResult.total), projectType);
});

function assertTileFormat(lengthCm, widthCm, expected) {
  const info = getTileFormatInfo(lengthCm, widthCm);
  Object.entries(expected).forEach(([key, value]) => {
    assert.strictEqual(info[key], value, `${lengthCm} x ${widthCm} - ${key}`);
  });
  assert(Number.isFinite(info.areaCm2), `${lengthCm} x ${widthCm} - finite area`);
  return info;
}

assertTileFormat(5, 5, {
  areaCm2: 25,
  category: "Très petit format",
  notch: "3 mm",
  bonding: "Simple encollage",
  rate: 10
});
assertTileFormat(10, 10, {
  areaCm2: 100,
  category: "Petit format",
  notch: "4 mm",
  bonding: "Simple encollage",
  rate: 5
});
assertTileFormat(30, 30, {
  areaCm2: 900,
  category: "Format intermédiaire",
  notch: "6 mm",
  bonding: "Simple ou double encollage selon le chantier",
  rate: 3
});
assertTileFormat(30, 60, {
  areaCm2: 1800,
  category: "Format standard",
  notch: "8 mm",
  bonding: "Double encollage",
  rate: 0
});
assertTileFormat(60, 60, {
  areaCm2: 3600,
  category: "Grand format standard",
  notch: "10 mm",
  bonding: "Double encollage",
  rate: 0
});
assertTileFormat(80, 80, {
  areaCm2: 6400,
  category: "Grand format",
  notch: "12 mm",
  bonding: "Double encollage obligatoire",
  rate: 10
});
assertTileFormat(100, 100, {
  areaCm2: 10000,
  category: "Grand format",
  notch: "12 mm",
  bonding: "Double encollage obligatoire",
  rate: 10
});
assertTileFormat(120, 120, {
  areaCm2: 14400,
  category: "Très grand format",
  bonding: "Double encollage obligatoire",
  rate: 15
});
assertTileFormat(120, 240, {
  category: "Dalle XXL",
  bonding: "Double encollage obligatoire",
  rate: 20
});

[
  [7, 7, "verySmall"],
  [5, 10, "small"],
  [10, 30, "small"],
  [10, 30.1, "intermediate"],
  [30, 40, "intermediate"],
  [30, 40.1, "standard"],
  [44, 50, "standard"],
  [44.1, 50, "largeStandard"],
  [60, 60, "largeStandard"],
  [60.1, 60, "large"],
  [100, 100, "large"],
  [100.1, 100, "veryLarge"],
  [160, 70, "veryLarge"],
  [160.1, 10, "xxl"]
].forEach(([lengthCm, widthCm, expectedKey]) => {
  const info = getTileFormatInfo(lengthCm, widthCm);
  assert.strictEqual(info.key, expectedKey, `${lengthCm} x ${widthCm}`);
});

["", 0, -1, "abc"].forEach((badValue) => {
  const info = getTileFormatInfo(badValue, 60);
  assert.strictEqual(info.hasDimensions, false, `invalid length ${badValue}`);
  assert.strictEqual(info.rate, 0, `invalid length rate ${badValue}`);
  assert(Number.isFinite(info.areaCm2), `invalid length finite area ${badValue}`);
});

[
  [60, 60, 1200],
  [80, 80, 1600],
  [120, 120, 1800],
  [120, 240, 2000]
].forEach(([tileLengthCm, tileWidthCm, expectedLabor]) => {
  const formatResult = estimate({ tileLengthCm, tileWidthCm });
  assert.strictEqual(formatResult.laborAmount, expectedLabor, `${tileLengthCm} x ${tileWidthCm}`);
});

result = estimate({
  tileLengthCm: 80,
  tileWidthCm: 80,
  prep: ["primer"],
  prepSurfaces: { primer: 10 },
  siliconeEnabled: true,
  siliconeLength: 5,
  suppliesEstimate: 150,
  travelCost: 50,
  marginRate: 0.1,
  realSuppliesCost: 100,
  realTravelCost: 20,
  wasteCost: 10,
  otherRealCost: 30,
  estimatedHours: 20,
  hourlyTarget: 40
});
const clientRows = buildClientCopyRows(result);
const clientText = buildClientCopyText(result);
const internalMemo = buildInternalMemoText(result);
const forbiddenClientWords = [
  "Marge",
  "10 %",
  "Bénéfice",
  "Profit",
  "Rentabilité",
  "Rentable",
  "Pas rentable",
  "Coût réel",
  "Taux horaire",
  "Objectif horaire"
];

assert.strictEqual(clientRows.reduce((sum, line) => sum + line.amount, 0), result.total);
forbiddenClientWords.forEach((word) => {
  assert(!clientText.includes(word), `client text leaks ${word}`);
});
assert(clientText.includes("Carrelage : 80 × 80 cm"));
assert(clientText.includes(`TOTAL ESTIMÉ : ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(result.total)}`));
assert(!clientText.includes("€/m²"));
assert(internalMemo.includes("Marge :\n10 %"));
assert(internalMemo.includes("Montant marge :"));
assert(internalMemo.includes("Coût réel estimé :"));
assert(internalMemo.includes("Temps estimé :\n20 h"));
assert(internalMemo.includes("Taux horaire estimé :"));
assert(internalMemo.includes("Rentabilité :"));
assert(internalMemo.includes("Dimensions : 80 × 80 cm"));
assert(internalMemo.includes("Surface d'un carreau : 6 400 cm²"));
assert(internalMemo.includes("Peigne conseillé : 12 mm"));
assert(internalMemo.includes("Encollage : Double encollage obligatoire"));
assert(internalMemo.includes("Supplément format : +10 €/m²"));

result = calculateEstimate({
  projectType: "brokenTiles",
  quantity: 3,
  supports: ["standard"],
  removal: "none",
  prep: ["none"],
  waterproof: "none",
  marginRate: 0,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 120);

result = calculateEstimate({
  projectType: "brokenTiles",
  quantity: 3,
  supports: ["standard"],
  removal: "none",
  prep: ["sanding"],
  prepSurfaces: { sanding: 2 },
  waterproof: "none",
  marginRate: 0,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 130);
assert(result.detailLines.some((line) => line.label.includes("Ponçage / nettoyage - 2 m² x 5 €/m²")));

result = calculateEstimate({
  projectType: "brokenTiles",
  quantity: 2,
  supports: ["standard"],
  removal: "none",
  prep: ["primer"],
  prepSurfaces: { primer: 3 },
  waterproof: "none",
  marginRate: 0,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 89);
assert(result.detailLines.some((line) => line.label.includes("Primaire d'accrochage - 3 m² x 3 €/m²")));

result = calculateEstimate({
  projectType: "brokenTiles",
  quantity: 4,
  supports: ["standard"],
  removal: "none",
  prep: ["sanding", "primer"],
  prepSurfaces: { sanding: 3, primer: 3 },
  waterproof: "none",
  siliconeEnabled: true,
  siliconeLength: 2,
  marginRate: 0,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 200);

result = calculateEstimate({
  projectType: "brokenTiles",
  quantity: 2,
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
  marginRate: 0,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 80);

result = calculateEstimate({
  projectType: "brokenTiles",
  quantity: 3,
  tileLengthCm: 120,
  tileWidthCm: 240,
  supports: ["notFlat"],
  removal: "none",
  prep: ["none"],
  waterproof: "none",
  marginRate: 0,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 120);
assert(!result.detailLines.some((line) => line.label.includes("Dalle XXL")));
assert(!result.detailLines.some((line) => line.label.includes("3 carreau x 12")));
const brokenClientText = buildClientCopyText(result);
const brokenInternalMemo = buildInternalMemoText(result);
assert(brokenClientText.includes("Remplacement de carreaux cassés"));
assert(brokenClientText.includes("3 carreaux"));
assert(!brokenClientText.includes("Dalle XXL"));
assert(brokenInternalMemo.includes("Dimensions : 120 × 240 cm"));
assert(brokenInternalMemo.includes("Supplément format : +20 €/m²"));

result = calculateEstimate({
  projectType: "brokenTiles",
  quantity: 3,
  supports: ["notFlat"],
  supportSurface: 2,
  removal: "none",
  prep: ["none"],
  waterproof: "none",
  marginRate: 0,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 144);
assert(result.detailLines.some((line) => line.label.includes("Sol ou mur pas plat - 2 m² x 12 €/m²")));

result = calculateEstimate({
  projectType: "brokenTiles",
  quantity: 3,
  supports: ["standard"],
  removal: "tiles",
  removalSurface: 2,
  prep: ["none"],
  waterproof: "none",
  marginRate: 0,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 150);
assert(result.detailLines.some((line) => line.label.includes("Dépose carrelage - 2 m² x 15 €/m²")));

result = calculateEstimate({
  projectType: "brokenTiles",
  quantity: 2,
  supports: ["standard"],
  removal: "none",
  prep: ["none"],
  waterproof: "spec",
  waterproofSurface: 2,
  extraBaseboardsEnabled: true,
  extraBaseboardsLength: 1.5,
  marginRate: 0,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 119);
assert(result.detailLines.some((line) => line.label.includes("SPEC sous carrelage - 2 m² x 12 €/m²")));
assert(result.detailLines.some((line) => line.label.includes("Plinthes en plus - 1,5 ml x 10 €/ml")));

result = estimate({ removal: "tiles", removalSurface: 25 });
assert.strictEqual(result.laborAmount, 1575);
assert(result.detailLines.some((line) => line.label.includes("25 m² x 15 €/m²")));

result = estimate({ prep: ["lightLeveling"], prepSurfaces: { lightLeveling: 8 } });
assert.strictEqual(result.laborAmount, 1264);
assert(result.detailLines.some((line) => line.label.includes("8 m² x 8 €/m²")));

result = estimate({
  prep: ["lightLeveling", "sanding", "primer"],
  prepSurfaces: { lightLeveling: 8, sanding: 40, primer: 40 }
});
assert.strictEqual(result.laborAmount, 1584);

result = estimate({
  projectType: "bathroom",
  quantity: 25,
  waterproof: "spec",
  waterproofSurface: 6
});
assert.strictEqual(result.laborAmount, 1197);
assert(result.detailLines.some((line) => line.label.includes("6 m² x 12 €/m²")));

result = estimate({ prep: ["none"], prepSurfaces: { sanding: 40 } });
assert.strictEqual(result.laborAmount, 1200);

result = estimate({ removal: "tiles", removalSurface: 45 });
assert(result.warningLines.some((line) => line.includes("surface supérieure")));

result = calculateEstimate({
  projectType: "baseboardsOnly",
  quantity: 1,
  marginRate: 0,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 80);
assert.strictEqual(result.total, 80);

result = calculateEstimate({
  projectType: "baseboardsOnly",
  quantity: 1,
  marginRate: 0.05,
  suppliesEstimate: 0,
  travelCost: 0,
  otherCost: 0
});
assert.strictEqual(result.laborAmount, 80);
assert.strictEqual(result.marginAmount, 4);
assert.strictEqual(result.total, 84);

let profitability = calculateProfitability({
  totalClient: 900,
  realSuppliesCost: 180,
  realTravelCost: 20,
  otherRealCost: 20,
  estimatedHours: 20,
  hourlyTarget: 40
});
assert.strictEqual(profitability.directCosts, 220);
assert.strictEqual(profitability.remainingAfterCosts, 680);
assert.strictEqual(profitability.hourlyYield, 34);
assert.strictEqual(profitability.status, "Correct");
assert.strictEqual(profitability.minimumObjectivePrice, 1020);
assert.strictEqual(profitability.objectiveGap, -120);

profitability = calculateProfitability({
  totalClient: 300,
  realSuppliesCost: 400,
  estimatedHours: 10,
  hourlyTarget: 40
});
assert.strictEqual(profitability.remainingAfterCosts, -100);
assert.strictEqual(profitability.hourlyYield, -10);
assert.strictEqual(profitability.status, "Peu rentable");

profitability = calculateProfitability({ totalClient: 900, estimatedHours: 0, hourlyTarget: 40 });
assert.strictEqual(profitability.hourlyYield, null);
assert.strictEqual(profitability.minimumObjectivePrice, null);
assert.strictEqual(profitability.status, "À compléter");

profitability = calculateProfitability({ totalClient: 900, estimatedHours: "4,5", hourlyTarget: 40 });
assert.strictEqual(profitability.hourlyYield, 200);

result = painting({
  surfaceType: "walls",
  wallsSurface: 40,
  wallPaint: { enabled: true, surface: 40 }
});
assert.strictEqual(result.laborAmount, 800);
assert.strictEqual(result.total, 800);

result = painting({
  surfaceType: "ceiling",
  ceilingSurface: 20,
  ceilingPaint: { enabled: true, surface: 20 }
});
assert.strictEqual(result.laborAmount, 500);

result = painting({
  surfaceType: "walls",
  wallsSurface: 50,
  lessivageMurs: { enabled: true, surface: 50 },
  sanding: { enabled: true, surface: 20 },
  patching: { enabled: true, surface: 8 },
  wallPaint: { enabled: true, surface: 50 }
});
assert.strictEqual(result.laborAmount, 1278);

result = painting({
  surfaceType: "walls",
  wallsSurface: 40,
  wallPack: { enabled: true, surface: 40 }
});
assert.strictEqual(result.laborAmount, 1520);

result = painting({
  surfaceType: "ceiling",
  ceilingSurface: 20,
  ceilingPack: { enabled: true, surface: 20 }
});
assert.strictEqual(result.laborAmount, 960);

result = painting({
  surfaceType: "walls",
  wallsSurface: 40,
  wallPack: { enabled: true, surface: 40 },
  wallPaint: { enabled: true, surface: 40 }
});
assert.strictEqual(result.laborAmount, 1520);
assert(!result.detailLines.some((line) => line.label.includes("Peinture murs - 2 couches -")));

result = painting({
  surfaceType: "walls",
  wallsSurface: 40,
  wallPack: { enabled: true, surface: 20 },
  wallPaint: { enabled: true, surface: 40 }
});
assert.strictEqual(result.laborAmount, 1160);
assert(result.detailLines.some((line) => line.label.includes("Peinture murs - 2 couches - hors surface du pack - 20 m² x 20 €/m²")));

result = painting({
  surfaceType: "walls",
  wallsSurface: 40,
  wallPack: { enabled: true, surface: 20 },
  wallSkim: { enabled: true, surface: 40 }
});
assert.strictEqual(result.laborAmount, 1060);
assert(result.detailLines.some((line) => line.label.includes("Ratissage complet murs - hors surface du pack - 20 m² x 15 €/m²")));

result = painting({
  surfaceType: "ceiling",
  ceilingSurface: 20,
  ceilingPack: { enabled: true, surface: 12 },
  ceilingPaint: { enabled: true, surface: 20 }
});
assert.strictEqual(result.laborAmount, 776);
assert(result.detailLines.some((line) => line.label.includes("Peinture plafond - 2 couches - hors surface du pack - 8 m² x 25 €/m²")));

result = painting({
  surfaceType: "ceiling",
  ceilingSurface: 20,
  ceilingPack: { enabled: true, surface: 20 },
  ceilingSkim: { enabled: true, surface: 20 },
  ceilingPrimer: { enabled: true, surface: 20 },
  ceilingPaint: { enabled: true, surface: 20 }
});
assert.strictEqual(result.laborAmount, 960);
assert(!result.detailLines.some((line) => line.label.includes("Ratissage complet plafond -")));
assert(!result.detailLines.some((line) => line.label.includes("Primaire / sous-couche -")));
assert(!result.detailLines.some((line) => line.label.includes("Peinture plafond - 2 couches -")));

result = painting({
  surfaceType: "walls",
  wallsSurface: 40,
  wallPack: { enabled: true, surface: 40 },
  patching: { enabled: true, surface: 10 }
});
assert.strictEqual(result.laborAmount, 1580);
assert(result.detailLines.some((line) => line.label.includes("Rebouchage localisé - 10 m² x 6 €/m²")));

result = painting({
  interiorDoors: { enabled: true, quantity: 1 }
});
assert.strictEqual(result.laborAmount, 100);
assert(result.detailLines.some((line) => line.label.includes("Porte intérieure - 1 porte x 100 €/porte")));

result = painting({
  interiorDoors: { enabled: true, quantity: 3 }
});
assert.strictEqual(result.laborAmount, 300);
assert(result.detailLines.some((line) => line.label.includes("Porte intérieure - 3 portes x 100 €/porte")));

result = painting({
  radiators: { enabled: true, quantity: 2 }
});
assert.strictEqual(result.laborAmount, 120);
assert(result.detailLines.some((line) => line.label.includes("Radiateur - 2 unités x 60 €/unité")));

result = painting({
  baseboards: { enabled: true, length: 15 }
});
assert.strictEqual(result.laborAmount, 120);
assert(result.detailLines.some((line) => line.label.includes("Plinthes - 15 ml x 8 €/ml")));

result = painting({
  interiorDoors: { enabled: true, quantity: 2 },
  radiators: { enabled: true, quantity: 2 },
  baseboards: { enabled: true, length: 15 }
});
assert.strictEqual(result.laborAmount, 440);

result = painting({
  surfaceType: "walls",
  wallsSurface: 40,
  wallPack: { enabled: true, surface: 40 },
  interiorDoors: { enabled: true, quantity: 2 }
});
assert.strictEqual(result.laborAmount, 1720);

result = painting({
  interiorDoors: { enabled: false, quantity: 2 },
  radiators: { enabled: false, quantity: 2 },
  baseboards: { enabled: false, length: 15 }
});
assert.strictEqual(result.laborAmount, 0);

result = painting({
  surfaceType: "walls",
  wallsSurface: 60,
  patching: { enabled: true, surface: 8 }
});
assert.strictEqual(result.laborAmount, 80);
assert(result.detailLines.some((line) => line.label.includes("8 m² x 6 €/m²")));

result = painting({
  surfaceType: "walls",
  wallsSurface: 40,
  wallPaint: { enabled: true, surface: 40 },
  suppliesEstimate: 100,
  travelCost: 20,
  marginRate: 0.05
});
assert.strictEqual(result.laborAmount, 800);
assert.strictEqual(result.marginAmount, 40);
assert.strictEqual(result.suppliesAmount, 100);
assert.strictEqual(result.feesAmount, 20);
assert.strictEqual(result.total, 960);
const paintingClientText = buildPaintingClientCopyText(result);
const paintingInternalMemo = buildPaintingInternalMemoText(result);
assert(!paintingClientText.includes("Marge"));
assert(!paintingClientText.includes("Rentabilité"));
assert(paintingClientText.includes("TOTAL ESTIMÉ"));
assert(paintingInternalMemo.includes("Marge :\n5 %"));
assert(paintingInternalMemo.includes("TOTAL CLIENT"));

result = painting({
  surfaceType: "walls",
  wallsSurface: 15,
  sanding: { enabled: true, surface: 15 },
  marginRate: 0.05
});
assert.strictEqual(result.laborAmount, 80);
assert.strictEqual(result.marginAmount, 4);
assert.strictEqual(result.total, 84);

result = painting({
  surfaceType: "walls",
  wallsSurface: 30,
  wallPack: { enabled: true, surface: 40 }
});
assert(result.warningLines.some((line) => line.includes("pack murs")));
assert(Number.isFinite(result.total));

console.log("simulateur tests OK");
