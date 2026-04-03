export interface OptimizationResult {
    safetyStock: number;
    reorderPoint: number;
    recommendedOrder: number;
  }
  
  export function optimizeInventory(
    forecast: number,
    leadTime: number
  ): OptimizationResult {
    // 🔹 Safety stock (buffer for uncertainty)
    const safetyStock = forecast * 0.2;
  
    // 🔹 Reorder point
    const reorderPoint = forecast * leadTime + safetyStock;
  
    // 🔹 Recommended order quantity
    const recommendedOrder = Math.max(reorderPoint - forecast, 0);
  
    return {
      safetyStock: Math.round(safetyStock),
      reorderPoint: Math.round(reorderPoint),
      recommendedOrder: Math.round(recommendedOrder),
    };
  }