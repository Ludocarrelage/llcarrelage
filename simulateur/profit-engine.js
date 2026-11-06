(function (root) {
  "use strict";
  const socialRate = 0.215;
  const cents = value => Math.round((value + Number.EPSILON * Math.max(1, Math.abs(value))) * 100) / 100;
  function calculate({price, direct, monthlyFixed, billableDays, jobDays, targetDaily, hours = 0, rate = socialRate, safetyRate = 0}) {
    const fixed = billableDays > 0 ? monthlyFixed / billableDays * jobDays : 0;
    const reserve = cents(direct * safetyRate);
    const social = cents(price * rate);
    const result = cents(price - direct - reserve - social - cents(fixed));
    const targetRaw = rate < 1 ? (direct + reserve + fixed + targetDaily * jobDays) / (1 - rate) : null;
    // Round upward so the suggested quote actually meets the target.
    let targetPrice = targetRaw === null ? null : Math.ceil(targetRaw * 100) / 100;
    if (targetPrice !== null && cents(targetPrice - cents(targetPrice * rate) - direct - reserve - cents(fixed)) < targetDaily * jobDays) targetPrice = cents(targetPrice + 0.01);
    return {price, direct, reserve, rate, social, fixed: cents(fixed), gross: price-direct, result,
      daily: jobDays > 0 ? result/jobDays : null, hourly: hours > 0 ? result/hours : null,
      targetDaily, targetPrice, netRate: price > 0 ? result/price*100 : 0, jobDays, billableDays};
  }
  const defaults = {monthlyFixed: 300, billableDays: 20, targetDaily: 150, hoursPerDay: 7, safetyPercent: 10};
  function settings(saved) {
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => {
      const value = saved && saved[key];
      return [key, typeof value === "number" && Number.isFinite(value) && value >= 0 && (!["billableDays", "hoursPerDay"].includes(key) || value > 0) ? value : fallback];
    }));
  }
  const api = {calculate, socialRate, defaults, settings};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LLProfitEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
