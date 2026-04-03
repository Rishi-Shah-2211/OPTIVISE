import { forecastDemand } from "../ml/forecast";
import { optimizeInventory } from "../ml/optimize";

export interface SimulationInput {
  demand: number;
  inventory: number;
  leadTime: number;
}

export interface SimulationResult {
  stockoutRisk: number;
  overstockRisk: number;
  riskScore: number;
  estimatedCostImpact: number;
  insights: string[];
  forecast: number;
  optimization: {
    safetyStock: number;
    reorderPoint: number;
    recommendedOrder: number;
  };
}

export function runSimulation(input: SimulationInput): SimulationResult {
  const { demand, inventory, leadTime } = input;

  // 🔹 Fake historical data (for now)
  const history = [
    demand - 20,
    demand - 10,
    demand,
    demand + 5,
    demand + 10,
  ];

  // 🔹 Forecast demand
  const forecast = forecastDemand(history);

  // 🔹 Optimization
  const optimization = optimizeInventory(forecast, leadTime);

  // 🔹 Risk calculations
  const stockoutRisk = Math.min((forecast / Math.max(inventory, 1)) * 100, 100);
  const overstockRisk = Math.min((inventory / Math.max(forecast, 1)) * 100, 100);

  const riskScore = Math.round((stockoutRisk + overstockRisk) / 2);

  // 🔹 Cost impact (simple estimation)
  const estimatedCostImpact = Math.round(
    Math.abs(forecast - inventory) * 10
  );

  // 🔹 Insights
  const insights: string[] = [];

  if (stockoutRisk > 70) {
    insights.push("High risk of stockout — consider increasing inventory.");
  }

  if (overstockRisk > 70) {
    insights.push("Overstock risk — reduce inventory levels.");
  }

  if (optimization.recommendedOrder > 0) {
    insights.push(
      `Recommended order quantity: ${optimization.recommendedOrder}`
    );
  }

  return {
    stockoutRisk: Math.round(stockoutRisk),
    overstockRisk: Math.round(overstockRisk),
    riskScore,
    estimatedCostImpact,
    insights,
    forecast,
    optimization,
  };
}