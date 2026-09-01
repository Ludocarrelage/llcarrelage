const assert = require("assert");

const {
  calculateEstimate,
  calculateProfitability,
  projectRates,
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

console.log("simulateur tests OK");
