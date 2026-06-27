import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GROQ_BASE = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(dataContext: string): string {
  return `You are the Shop Helper — a friendly assistant for a small kirana / general store owner in India.

WHO YOU HELP:
The owner is a normal shopkeeper, not a business expert. They may not read English well. Help them decide what to buy, how much, and when, so they never run out of items and never block money in extra stock.

HOW TO UNDERSTAND QUESTIONS (very important):
- The user may type with bad spelling, no grammar, short words, or mix Hindi and English (Hinglish). ALWAYS try your best to understand the meaning. NEVER tell them to rewrite or rephrase.
- Examples you must understand: "rice khatam to nahi", "kitna oil order karu", "kaun sa maal jada pada hai", "konsa item fast bik raha", "paisa kaha phasa hai".

HOW TO ANSWER (very important):
- Reply in the SAME language/style the user used. If they wrote in Hindi or Hinglish, answer in simple Hinglish. If English, answer in simple English.
- Use words a 10-year-old understands. NO technical or business words. Do NOT use: SKU, inventory, stockout, lead time, demand, EOQ, holding cost, safety stock, reorder point, procurement. Instead say: item, stock, "will finish soon", "days to arrive", "sells fast", "extra stock", "money stuck", "order more".
- Use ₹ (rupees) for money, never $.
- Be short and practical. Give the answer first, then 2-4 simple steps if needed.
- Always use the real items and numbers from the data below. Never invent item names or numbers.

YOUR SHOP'S CURRENT DATA (read it, but explain it in simple words):
${dataContext}

Quick guide:
- "Will finish soon" = items where stock is less than what sells.
- "Too much stock / money stuck" = items where stock is much more than what sells.
- "Slow delivery" = items that take many days to arrive.
- For money lost or saved, give a rough ₹ figure when you can.`;
}

interface ChatMessage { role: "user" | "assistant"; content: string; }

async function getDataContext(): Promise<string> {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
      include: {
        supplier: { select: { name: true, region: true, reliability: true } },
      },
    });

    if (products.length === 0) return "No products in database yet.";

    const totalInventory = products.reduce((s, p) => s + p.inventory, 0);
    const totalDemand = products.reduce((s, p) => s + p.demand, 0);
    const avgLeadTime = (products.reduce((s, p) => s + p.leadTime, 0) / products.length).toFixed(1);

    const stockoutRisk = products.filter(p => p.inventory < p.demand);
    const overstocked = products.filter(p => p.inventory > p.demand * 3);
    const highPressure = products.filter(p => p.inventory > 0 && (p.demand / p.inventory) > 0.8);
    const belowReorder = products.filter(p => p.reorderPoint > 0 && p.inventory < p.reorderPoint);

    let context = `SUMMARY: ${products.length} SKUs | Total Inventory: ${totalInventory.toLocaleString()} units | Total Demand: ${totalDemand.toLocaleString()} units/mo | Avg Lead Time: ${avgLeadTime} days\n`;

    // Categories breakdown
    const categories: Record<string, number> = {};
    products.forEach(p => { categories[p.category] = (categories[p.category] || 0) + 1; });
    context += `CATEGORIES: ${Object.entries(categories).map(([k, v]) => `${k}(${v})`).join(", ")}\n\n`;

    if (stockoutRisk.length > 0) {
      context += `STOCKOUT RISK (${stockoutRisk.length} products where inventory < demand):\n`;
      stockoutRisk.slice(0, 10).forEach(p => {
        const daysOfStock = p.demand > 0 ? (p.inventory / (p.demand / 30)).toFixed(1) : "N/A";
        const supplierInfo = p.supplier ? ` | supplier: ${p.supplier.name} (${p.supplier.region})` : "";
        context += `- ${p.name} [${p.category}]: ${p.inventory} inv, ${p.demand} demand, LT ${p.leadTime}d, ~${daysOfStock} days of stock${supplierInfo}\n`;
      });
      context += "\n";
    }

    if (overstocked.length > 0) {
      context += `OVERSTOCKED (${overstocked.length} products where inventory > 3x demand):\n`;
      overstocked.slice(0, 8).forEach(p => {
        const excess = p.inventory - p.demand * 3;
        const holdingCost = p.price > 0 ? `$${(excess * p.price * 0.2 / 12).toFixed(0)}/mo holding cost` : "";
        context += `- ${p.name}: ${p.inventory} units (${excess} excess), demand ${p.demand}${holdingCost ? `, ${holdingCost}` : ""}\n`;
      });
      context += "\n";
    }

    if (belowReorder.length > 0) {
      context += `BELOW REORDER POINT (${belowReorder.length} products needing PO):\n`;
      belowReorder.slice(0, 8).forEach(p => {
        context += `- ${p.name}: stock ${p.inventory}, reorder point ${p.reorderPoint}, LT ${p.leadTime}d\n`;
      });
      context += "\n";
    }

    if (highPressure.length > 0) {
      context += `HIGH DEMAND PRESSURE (${highPressure.length} products >80%):\n`;
      highPressure.slice(0, 8).forEach(p => {
        const pressure = ((p.demand / p.inventory) * 100).toFixed(0);
        context += `- ${p.name}: ${pressure}% pressure (${p.demand} demand / ${p.inventory} stock)\n`;
      });
      context += "\n";
    }

    // Demand trends (from last 7d vs prev 7d)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentDemand = await prisma.demand.groupBy({
      by: ["productId"],
      _sum: { demandQty: true },
      where: { date: { gte: sevenDaysAgo } },
    });
    const prevDemand = await prisma.demand.groupBy({
      by: ["productId"],
      _sum: { demandQty: true },
      where: { date: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    });

    const recentMap = new Map(recentDemand.map(d => [d.productId, d._sum.demandQty ?? 0]));
    const prevMap = new Map(prevDemand.map(d => [d.productId, d._sum.demandQty ?? 0]));

    const trending: { name: string; pctChange: number }[] = [];
    products.forEach(p => {
      const recent = recentMap.get(p.id) ?? 0;
      const prev = prevMap.get(p.id) ?? 0;
      if (prev > 0) {
        const pct = ((recent - prev) / prev) * 100;
        if (Math.abs(pct) > 10) trending.push({ name: p.name, pctChange: pct });
      }
    });

    if (trending.length > 0) {
      trending.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
      context += `DEMAND TRENDS (week-over-week):\n`;
      trending.slice(0, 8).forEach(t => {
        const dir = t.pctChange > 0 ? "UP" : "DOWN";
        context += `- ${t.name}: ${dir} ${Math.abs(t.pctChange).toFixed(0)}%\n`;
      });
      context += "\n";
    }

    // Supplier summary
    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { products: true } } },
    });
    if (suppliers.length > 0) {
      context += `SUPPLIERS:\n`;
      suppliers.forEach(s => {
        context += `- ${s.name} (${s.region}): ${s._count.products} products, ${(s.reliability * 100).toFixed(0)}% reliability\n`;
      });
    }

    return context;
  } catch (error) {
    console.error("[Copilot] Failed to fetch data context:", error);
    return "Data temporarily unavailable. Provide general supply chain guidance.";
  }
}

async function callGroq(messages: ChatMessage[], apiKey: string, systemPrompt: string): Promise<string> {
  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.4,
      top_p: 0.85,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "Unknown error");
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content ?? "No response generated.";
}

function getIntelligentFallback(lastMessage: string): string {
  const q = lastMessage.toLowerCase();

  if (q.includes("finish") || q.includes("khatam") || q.includes("out of stock") || q.includes("run out") || q.includes("stockout") || q.includes("low")) {
    return "To see which items will finish soon: check how many you have versus how many sell. If an item sells faster than your stock lasts, order it now. Open the 'Smart Tips' page — the red 'Order now' items need attention first.";
  }
  if (q.includes("extra") || q.includes("zyada") || q.includes("overstock") || q.includes("too much") || q.includes("excess")) {
    return "Items where you have far more stock than you sell are blocking your money. Order less of these next time, or give a small discount to clear them. The 'Selling Fast' chart on My Shop shows which items move slowly.";
  }
  if (q.includes("delivery") || q.includes("deliver") || q.includes("supplier") || q.includes("der") || q.includes("late")) {
    return "For items that take many days to arrive, keep a little extra stock so you never run dry, and try a backup supplier. The 'Your Suppliers' chart on My Shop shows where each supplier is and how reliable they are.";
  }
  if (q.includes("order") || q.includes("kitna") || q.includes("how much") || q.includes("buy")) {
    return "Not sure how much to order? Open the 'What-If' tool, pick the item, and it tells you a safe amount to buy so the item never finishes and your money is not stuck.";
  }
  if (q.includes("money") || q.includes("paisa") || q.includes("save") || q.includes("cost") || q.includes("kharcha")) {
    return "To save money: 1) Clear items you have too much of, 2) Never let fast-selling items finish (you lose sales), 3) Order the right amount each time. The 'What-If' tool gives you a rough ₹ figure for each item.";
  }

  return "I can help you know which items will finish soon, which have too much stock, how much to order, and where your money is stuck. Try asking: 'Which items will finish this week?' or 'Kitna oil order karu?' — (Add your GROQ_API_KEY in .env for full smart answers.)";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { messages?: ChatMessage[] };
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: "Invalid request." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      const lastMsg = messages[messages.length - 1]?.content ?? "";
      const reply = getIntelligentFallback(lastMsg);
      return NextResponse.json({ reply });
    }

    const dataContext = await getDataContext();
    const systemPrompt = buildSystemPrompt(dataContext);

    const reply = await callGroq(messages, apiKey, systemPrompt);
    return NextResponse.json({ reply });

  } catch (error) {
    console.error("[Copilot API Error]", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    if (errorMsg.includes("Groq API error")) {
      return NextResponse.json({
        reply: "AI service temporarily unavailable. Check your GROQ_API_KEY configuration and ensure you have active credits at console.groq.com."
      });
    }

    return NextResponse.json({
      reply: "A server error occurred. Please try again in a moment."
    });
  }
}
