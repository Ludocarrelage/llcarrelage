const assert = require("assert");

const {
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
} = require("./simulateur.js");

function estimate(overrides) {
  return calculateEstimate({
    projectType: "interior",
    quantity: 40,
    tileFormat: "none",
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
  none: 0,
  small: 5,
  large80: 10,
  large120: 15
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
    tileFormat: "none",
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
