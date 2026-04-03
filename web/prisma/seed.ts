import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🔹 realistic random helpers
function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDemandProfile(index: number) {
  // 🔥 create different product categories
  if (index < 30) return randomBetween(20, 80);     // low demand
  if (index < 70) return randomBetween(80, 200);    // medium demand
  return randomBetween(200, 400);                   // high demand
}

async function main() {
  console.log("🌱 Seeding realistic product data...");

  // clear old data
  await prisma.product.deleteMany();

  const products = [];

  for (let i = 1; i <= 100; i++) {
    const demand = getDemandProfile(i);

    // inventory depends on demand (realistic)
    const inventory =
      demand + randomBetween(-50, 150); // can be understock or overstock

    const leadTime = randomBetween(2, 20); // supplier variability

    products.push({
      name: `Product ${i}`,
      demand,
      inventory: Math.max(0, inventory), // no negative inventory
      leadTime,
    });
  }

  await prisma.product.createMany({
    data: products,
  });

  console.log("✅ 100 realistic products created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });