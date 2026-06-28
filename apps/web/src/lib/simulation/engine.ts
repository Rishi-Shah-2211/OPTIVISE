// ─── Scenario engine ─────────────────────────────────────────────────────────
// Single source of truth for the simulator. Used by BOTH the API route
// (/api/simulate) and the client page, so the result is identical no matter
// where it is computed. Pure logic only — no React, no icons.

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ScenarioInsight {
  type: "warn" | "ok" | "info";
  text: string;
}

export interface ScenarioInput {
  name: string;
  demand: number; // units sold per MONTH
  inventory: number; // units currently in stock
  leadTime: number; // days for a new order to arrive
}

export interface ScenarioResult {
  riskLevel: RiskLevel;
  stockoutDays: number;
  overstockScore: number;
  costImpact: number;
  costDirection: "save" | "loss";
  recommendation: string;
  optimization: string;
  insights: ScenarioInsight[];
}

const AVG_UNIT_COST = 24;
const AVG_HOLDING_RATE = 0.22;
const STOCKOUT_PENALTY = 48;

export function runScenario(input: ScenarioInput): ScenarioResult {
  const { name, demand, inventory, leadTime } = input;

  // demand is per MONTH; convert to per-day for "how long will stock last" maths
  const dailyDemand = demand > 0 ? demand / 30 : 0;

  const daysStock = dailyDemand > 0 ? Math.floor(inventory / dailyDemand) : 999;
  const stockoutRisk = daysStock < leadTime;
  const criticalRisk = daysStock < leadTime * 0.5;
  const overstockRatio = inventory / (demand || 1); // months of stock on hand
  const overstock = overstockRatio > 3;
  const pressure = Math.min((demand / (inventory || 1)) * 100, 100);

  let riskLevel: RiskLevel = "low";
  if (criticalRisk) riskLevel = "critical";
  else if (stockoutRisk) riskLevel = "high";
  else if (daysStock < leadTime * 1.5) riskLevel = "medium";

  // ── Cost impact ──
  let costImpact = 0;
  let costDirection: "save" | "loss" = "save";

  if (stockoutRisk) {
    const unmetUnits = Math.max(0, leadTime - daysStock) * dailyDemand;
    costImpact = unmetUnits * STOCKOUT_PENALTY;
    costDirection = "loss";
  } else if (overstock) {
    const excessUnits = inventory - demand * 2; // keep ~2 months as healthy
    const holdingCost = Math.max(0, excessUnits) * AVG_UNIT_COST * (AVG_HOLDING_RATE / 12);
    costImpact = holdingCost;
    costDirection = excessUnits > 0 ? "loss" : "save";
  } else {
    const safetyStock = dailyDemand * leadTime * 1.5;
    const savedUnits = Math.max(0, safetyStock - inventory);
    costImpact = savedUnits * AVG_UNIT_COST * (AVG_HOLDING_RATE / 12);
    costDirection = "save";
  }

  // ── Insights (plain language) ──
  const insights: ScenarioInsight[] = [];

  if (criticalRisk)
    insights.push({ type: "warn", text: `Very low! Stock will finish in about ${daysStock} day(s), but new stock takes ${leadTime} day(s) to arrive. Order today.` });
  else if (stockoutRisk)
    insights.push({ type: "warn", text: `Stock will finish about ${leadTime - daysStock} day(s) before your next delivery comes. Order now.` });
  else
    insights.push({ type: "ok", text: `Good — current stock lasts about ${daysStock} day(s), that's ${daysStock - leadTime} day(s) more than the delivery time.` });

  if (overstock)
    insights.push({ type: "warn", text: `Too much stock — you have about ${overstockRatio.toFixed(1)}× of a month's selling. Money is sitting idle here.` });
  else if (demand > 0)
    insights.push({ type: "ok", text: `Stock amount looks healthy — about ${overstockRatio.toFixed(1)}× of what sells. No money wasted.` });

  if (leadTime > 21)
    insights.push({ type: "warn", text: `Delivery takes ${leadTime} days — quite long. Try keeping a backup supplier so you never run dry.` });
  else if (leadTime > 14)
    insights.push({ type: "info", text: `Delivery takes ${leadTime} days. Keep a little extra before busy days.` });

  if (pressure > 85)
    insights.push({ type: "info", text: `This item sells very fast (${Math.round(pressure)}% of your stock each month). Keep extra so it never finishes.` });

  const recommendation =
    riskLevel === "critical" ? `${name} needs action today. Order at least ${Math.max(1, Math.round(dailyDemand * leadTime * 2))} units right away. If you don't, you could lose about ₹${Math.round(costImpact).toLocaleString()} in sales.`
    : riskLevel === "high"   ? `Order ${name} in the next 1–2 days. It will finish before the next delivery comes. Order at least ${Math.max(1, Math.round(dailyDemand * leadTime * 1.3))} units.`
    : riskLevel === "medium" ? `Keep an eye on ${name}. Stock is a bit thin — maybe order ${Math.max(1, Math.round(dailyDemand * 7))} units in the next 5 days.`
    : overstock              ? `Order less ${name} next time — about ${Math.max(1, Math.round(inventory - demand * 1.5))} units fewer. A small discount can help clear the extra stock.`
    : `${name} stock is just right. No need to do anything now. Check again in ${Math.max(7, Math.round(daysStock / 4))} days.`;

  const optimization =
    riskLevel === "critical" ? `Set a reminder to reorder when stock falls to ${Math.max(1, Math.round(dailyDemand * leadTime * 1.5))} units (about ${Math.round(leadTime * 1.5)} days of cover) so this doesn't happen again.`
    : riskLevel === "high"   ? `Keep a safe level of about ${Math.max(1, Math.round(dailyDemand * (leadTime + 7)))} units for this item, so it never runs out.`
    : overstock              ? `Best amount to order at this selling rate: about ${Math.max(1, Math.round(demand))} units a month (one month of stock). Saves around ${Math.round(AVG_HOLDING_RATE * 100 * 0.4)}% of idle-money cost.`
    : `A good order size for you is about ${Math.max(1, Math.round(dailyDemand * leadTime * 1.25))} units. Keep ordering like this to stay smooth.`;

  return {
    riskLevel,
    stockoutDays: Math.min(daysStock, 999),
    overstockScore: Math.min(Math.round((overstockRatio / 5) * 100), 100),
    costImpact: Math.round(costImpact),
    costDirection,
    recommendation,
    optimization,
    insights,
  };
}
