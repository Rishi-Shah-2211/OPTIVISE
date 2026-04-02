import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GROQ_BASE = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.1-8b-instant";

function buildSystemPrompt(dataContext: string): string {
  return `You are Optivise Copilot — a precision AI assistant for supply chain operations professionals.

Your role:
- Analyse supply chain data: inventory levels, demand trends, supplier lead times, stockout risk
- Give specific, actionable decisions — not generic advice
- Always quantify risk where possible (days until stockout, cost exposure, etc.)
- Reference specific product names and numbers from the data provided below
- Keep answers under 200 words unless deep analysis is explicitly requested
- When listing actions, use numbered steps
- Tone: confident, precise, like a senior supply chain strategist

CURRENT LIVE DATA:
${dataContext}

When the user asks about stockouts, reference products where inventory < demand.
When asked about overstocking, reference products where inventory > 3x demand.
When asked about lead times, reference specific products with their lead time values.
When asked about costs, estimate holding cost at ~20% of inventory value per year.
When asked about suppliers, reference supplier names, regions, and reliability scores.
When asked about demand trends, reference the demand trend direction for relevant products.

Always use the real data above. Never make up product names or numbers.`;
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

  if (q.includes("stockout") || q.includes("out of stock") || q.includes("run out")) {
    return "To assess stockout risk: divide current inventory by daily demand — if that number is less than your supplier lead time (in days), you're at risk. Check the Critical Alerts metric on your dashboard for immediate signals. Prioritize any product where stockout days < lead time x 1.5.";
  }
  if (q.includes("overstock") || q.includes("excess") || q.includes("too much")) {
    return "Overstock is flagged when inventory exceeds 3x monthly demand. This generates holding costs of ~18-25% of inventory value annually. Use the Simulator to model optimal order quantities and calculate the exact cost exposure. Products with demand pressure < 30% should be reviewed first.";
  }
  if (q.includes("lead time") || q.includes("supplier") || q.includes("delivery")) {
    return "Lead time optimization: 1) Identify SKUs where lead time > days of stock on hand, 2) Qualify backup suppliers for single-source items, 3) Pre-position stock for seasonal peaks. The Simulator lets you model how changing lead times impacts stockout exposure in real time.";
  }
  if (q.includes("demand") || q.includes("forecast") || q.includes("trend")) {
    return "Demand analysis starts by comparing current demand figures against your inventory coverage ratio. Products showing demand pressure > 80% are approaching supply constraints. Review the Demand Pressure metric for a full breakdown, and use the Simulator to stress-test your current stock against demand spikes.";
  }
  if (q.includes("cost") || q.includes("save") || q.includes("reduce")) {
    return "Supply chain cost reduction typically targets: 1) Holding cost reduction (reduce overstock), 2) Stockout prevention (avoid lost sales), 3) Lead time optimization (reduce buffer stock requirements). The Simulator calculates estimated cost exposure per scenario — run it for your highest-risk SKUs first.";
  }

  return "I can help with stockout risk analysis, demand forecasting, lead time optimization, and supplier evaluation. Try asking: 'Which products are at stockout risk?' or 'How can I reduce inventory holding costs?' — Add your GROQ_API_KEY to .env to unlock full AI analysis.";
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
