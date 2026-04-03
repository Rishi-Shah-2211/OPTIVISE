export function forecastDemand(history: number[]): number {
    // Safety check
    if (!history || history.length === 0) {
      return 0;
    }
  
    // 🔹 Moving average
    const sum = history.reduce((acc, val) => acc + val, 0);
    const avg = sum / history.length;
  
    // 🔹 Trend (last - first)
    const trend = history[history.length - 1] - history[0];
  
    // 🔹 Final forecast (weighted)
    const forecast = avg + trend * 0.2;
  
    return Math.max(Math.round(forecast), 0);
  }