import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 🏪 Local kirana suppliers (simple, real-life names)
const SUPPLIERS = [
  { name: "Sharma Wholesale", region: "Local Mandi", reliability: 0.95 },
  { name: "Gupta Distributors", region: "City Market", reliability: 0.9 },
  { name: "Annapurna Traders", region: "Local Mandi", reliability: 0.88 },
  { name: "Patel Agencies", region: "Highway Depot", reliability: 0.92 },
  { name: "Verma Suppliers", region: "City Market", reliability: 0.85 },
];

// 🛒 50 everyday kirana items: [name, category, price (₹/unit), monthly demand]
// Fast movers (atta, rice, milk, sugar...) get high demand; spices/extras lower.
const ITEMS: [string, string, number, number][] = [
  // Grains & Flour
  ["Rice", "Grains & Flour", 60, 320],
  ["Wheat Flour", "Grains & Flour", 45, 380],
  ["Poha", "Grains & Flour", 50, 90],
  ["Semolina (Suji)", "Grains & Flour", 48, 80],
  ["Gram Flour (Besan)", "Grains & Flour", 90, 110],
  ["Maida", "Grains & Flour", 42, 100],
  // Daal & Pulses
  ["Toor Dal", "Daal & Pulses", 130, 160],
  ["Moong Dal", "Daal & Pulses", 120, 130],
  ["Chana Dal", "Daal & Pulses", 95, 120],
  ["Masoor Dal", "Daal & Pulses", 100, 110],
  ["Rajma", "Daal & Pulses", 140, 70],
  ["White Chickpeas (Chole)", "Daal & Pulses", 110, 90],
  // Cooking Oil & Ghee
  ["Mustard Oil", "Oil & Ghee", 150, 220],
  ["Sunflower Oil", "Oil & Ghee", 140, 200],
  ["Refined Oil", "Oil & Ghee", 135, 240],
  ["Desi Ghee", "Oil & Ghee", 550, 95],
  ["Vanaspati", "Oil & Ghee", 120, 80],
  // Sugar & Salt
  ["Sugar", "Sugar & Salt", 45, 300],
  ["Jaggery (Gud)", "Sugar & Salt", 55, 90],
  ["Salt", "Sugar & Salt", 22, 280],
  // Spices
  ["Turmeric Powder", "Spices", 220, 120],
  ["Red Chilli Powder", "Spices", 260, 110],
  ["Coriander Powder", "Spices", 180, 100],
  ["Garam Masala", "Spices", 320, 70],
  ["Cumin Seeds (Jeera)", "Spices", 380, 85],
  ["Mustard Seeds (Sarso)", "Spices", 140, 75],
  ["Black Pepper", "Spices", 600, 50],
  // Tea & Coffee
  ["Tea Leaves", "Tea & Coffee", 260, 230],
  ["Coffee Powder", "Tea & Coffee", 300, 90],
  // Biscuits & Snacks
  ["Glucose Biscuits", "Biscuits & Snacks", 10, 360],
  ["Marie Biscuits", "Biscuits & Snacks", 30, 180],
  ["Salted Namkeen", "Biscuits & Snacks", 40, 200],
  ["Potato Chips", "Biscuits & Snacks", 20, 240],
  ["Rusk Toast", "Biscuits & Snacks", 50, 110],
  // Cleaning
  ["Detergent Powder", "Cleaning", 110, 210],
  ["Dishwash Bar", "Cleaning", 15, 230],
  ["Toilet Cleaner", "Cleaning", 85, 120],
  ["Floor Cleaner (Phenyl)", "Cleaning", 75, 100],
  ["Bathing Soap", "Cleaning", 35, 260],
  // Personal Care
  ["Toothpaste", "Personal Care", 55, 190],
  ["Shampoo Sachet", "Personal Care", 3, 320],
  ["Hair Oil", "Personal Care", 90, 140],
  ["Face Cream", "Personal Care", 65, 100],
  // Beverages
  ["Soft Drink", "Beverages", 40, 250],
  ["Fruit Juice", "Beverages", 35, 150],
  // Dairy & Bakery
  ["Milk Packet", "Dairy & Bakery", 28, 400],
  ["Bread", "Dairy & Bakery", 40, 300],
  ["Butter", "Dairy & Bakery", 55, 130],
  ["Paneer", "Dairy & Bakery", 80, 110],
  ["Curd", "Dairy & Bakery", 30, 220],
];

async function main() {
  console.log("🌱 Seeding kirana store data...");

  // Clear old data (children first to respect relations)
  await prisma.demand.deleteMany();
  await prisma.inventoryRecord.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();

  // Suppliers
  const suppliers = [];
  for (const s of SUPPLIERS) {
    suppliers.push(await prisma.supplier.create({ data: s }));
  }

  // Products — create a realistic mix of healthy / low-stock / overstocked
  for (let i = 0; i < ITEMS.length; i++) {
    const [name, category, price, baseDemand] = ITEMS[i];
    const demand = baseDemand + rand(-15, 15);

    // Stock health variety so analytics look real:
    // every 6th item is understocked, every 5th is overstocked, rest healthy.
    let factor = rand(12, 20) / 10; // 1.2x – 2.0x (healthy)
    if (i % 6 === 0) factor = rand(3, 7) / 10; // 0.3x – 0.7x (low stock → stockout risk)
    else if (i % 5 === 0) factor = rand(35, 50) / 10; // 3.5x – 5.0x (overstock)

    const inventory = Math.max(0, Math.round(demand * factor));
    const leadTime = category === "Dairy & Bakery" ? rand(1, 3) : rand(2, 12);
    const reorderPoint = Math.round((demand / 30) * leadTime * 1.5);
    const supplier = suppliers[i % suppliers.length];

    const product = await prisma.product.create({
      data: {
        name,
        category,
        price,
        demand,
        inventory,
        leadTime,
        reorderPoint,
        supplierId: supplier.id,
      },
    });

    // 🗓️ 21 days of demand history (for week-over-week trends)
    const dailyAvg = Math.max(1, Math.round(demand / 30));
    const trend = rand(-1, 1); // some items rising, some falling, some flat
    const history = [];
    for (let d = 20; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const drift = Math.round(trend * (20 - d) * dailyAvg * 0.04);
      const qty = Math.max(0, dailyAvg + drift + rand(-Math.ceil(dailyAvg * 0.3), Math.ceil(dailyAvg * 0.3)));
      history.push({ productId: product.id, date, demandQty: qty });
    }
    await prisma.demand.createMany({ data: history });

    // Current inventory snapshot
    await prisma.inventoryRecord.create({
      data: { productId: product.id, stockLevel: inventory },
    });
  }

  // 💡 Generate plain-language tips from the seeded data (powers the dashboard)
  const allProducts = await prisma.product.findMany();
  const insightData: { type: string; message: string; impact: number; confidence: number }[] = [];
  for (const p of allProducts) {
    if (p.inventory < p.demand) {
      insightData.push({
        type: "stockout",
        message: `${p.name} is running low — only ${p.inventory} left but about ${p.demand} sell each month.`,
        impact: Math.min(((p.demand - p.inventory) / p.demand) * 100, 100),
        confidence: 0.9,
      });
    }
    if (p.inventory > p.demand * 3) {
      const excess = p.inventory - p.demand * 3;
      insightData.push({
        type: "overstock",
        message: `${p.name} has too much stock — ${excess} extra units. Your money is stuck here.`,
        impact: Math.min((excess / p.inventory) * 80, 90),
        confidence: 0.78,
      });
    }
    if (p.inventory > 0 && p.inventory < p.reorderPoint) {
      insightData.push({
        type: "reorder",
        message: `${p.name} is below its safe level (${p.reorderPoint}). Order more soon so it does not finish.`,
        impact: 72,
        confidence: 0.92,
      });
    }
  }
  if (insightData.length > 0) {
    await prisma.insight.createMany({ data: insightData });
  }

  console.log(`✅ ${ITEMS.length} kirana products + ${SUPPLIERS.length} suppliers + ${insightData.length} tips seeded with demand history`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
