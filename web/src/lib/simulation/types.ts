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
  }