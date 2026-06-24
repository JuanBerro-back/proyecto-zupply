import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, inventoryTable } from "@workspace/db";
import {
  CreateInventoryItemBody,
  UpdateInventoryItemParams,
  UpdateInventoryItemBody,
  DeleteInventoryItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeStockStatus(current: number, min: number): "ok" | "low" | "critical" {
  if (current <= min * 0.5) return "critical";
  if (current <= min) return "low";
  return "ok";
}

function formatInventoryItem(item: typeof inventoryTable.$inferSelect) {
  const current = parseFloat(item.currentStock ?? "0");
  const min = parseFloat(item.minStock ?? "0");
  const max = parseFloat(item.maxStock ?? "0");
  const avgDaily = parseFloat(item.avgDailyUsage ?? "0");
  const costPerUnit = parseFloat(item.costPerUnit ?? "0");
  return {
    id: item.id,
    productId: item.productId,
    name: item.name,
    category: item.category,
    unit: item.unit,
    currentStock: current,
    minStock: min,
    maxStock: max,
    costPerUnit,
    stockStatus: computeStockStatus(current, min),
    lastUpdated: item.lastUpdated.toISOString(),
    avgDailyUsage: avgDaily,
  };
}

router.get("/inventory", async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryTable).orderBy(inventoryTable.name);
  res.json(items.map(formatInventoryItem));
});

router.post("/inventory", async (req, res): Promise<void> => {
  const parsed = CreateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const [created] = await db
    .insert(inventoryTable)
    .values({
      name: d.name,
      category: d.category,
      unit: d.unit,
      currentStock: d.currentStock.toFixed(2),
      minStock: d.minStock.toFixed(2),
      maxStock: d.maxStock.toFixed(2),
      avgDailyUsage: d.avgDailyUsage.toFixed(2),
      costPerUnit: d.costPerUnit.toFixed(2),
    })
    .returning();
  res.status(201).json(formatInventoryItem(created));
});

router.patch("/inventory/:id", async (req, res): Promise<void> => {
  const params = UpdateInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { lastUpdated: new Date() };
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.category != null) updateData.category = parsed.data.category;
  if (parsed.data.unit != null) updateData.unit = parsed.data.unit;
  if (parsed.data.currentStock != null) updateData.currentStock = parsed.data.currentStock.toFixed(2);
  if (parsed.data.minStock != null) updateData.minStock = parsed.data.minStock.toFixed(2);
  if (parsed.data.maxStock != null) updateData.maxStock = parsed.data.maxStock.toFixed(2);
  if (parsed.data.avgDailyUsage != null) updateData.avgDailyUsage = parsed.data.avgDailyUsage.toFixed(2);
  if (parsed.data.costPerUnit != null) updateData.costPerUnit = parsed.data.costPerUnit.toFixed(2);

  const [updated] = await db
    .update(inventoryTable)
    .set(updateData)
    .where(eq(inventoryTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }

  res.json(formatInventoryItem(updated));
});

router.delete("/inventory/:id", async (req, res): Promise<void> => {
  const params = DeleteInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(inventoryTable)
    .where(eq(inventoryTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  res.status(204).send();
});

router.get("/inventory/predictions", async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryTable).orderBy(inventoryTable.name);

  const predictions = items.map((item) => {
    const current = parseFloat(item.currentStock ?? "0");
    const min = parseFloat(item.minStock ?? "0");
    const max = parseFloat(item.maxStock ?? "0");
    const avgDaily = parseFloat(item.avgDailyUsage ?? "0");

    const daysUntilStockout = avgDaily > 0 ? Math.floor(current / avgDaily) : null;
    const predictedDemand = Math.round(avgDaily * 7 * (1 + (Math.random() * 0.3 - 0.1)));
    const recommendedOrderQty = Math.max(0, max - current);

    let urgency: "high" | "medium" | "low";
    let recommendation: string;
    let trend: "increasing" | "stable" | "decreasing";

    if (current <= min * 0.5) {
      urgency = "high";
      recommendation = `Stock crítico de ${item.name}. Se recomienda pedir ${recommendedOrderQty.toFixed(1)} ${item.unit} inmediatamente según la tendencia de consumo.`;
      trend = "increasing";
    } else if (current <= min) {
      urgency = "medium";
      const dayLabel = daysUntilStockout === 1 ? "1 día" : `${daysUntilStockout ?? "pocos"} días`;
      recommendation = `${item.name} alcanzará nivel mínimo en ${dayLabel}. Se recomienda pedir ${recommendedOrderQty.toFixed(1)} ${item.unit} esta semana.`;
      trend = "stable";
    } else {
      urgency = "low";
      recommendation = `${item.name} en niveles adecuados. Próximo reabastecimiento recomendado en ${daysUntilStockout ?? 14} días.`;
      trend = "decreasing";
    }

    return {
      inventoryItemId: item.id,
      itemName: item.name,
      currentStock: current,
      unit: item.unit,
      predictedDemand,
      recommendedOrderQty,
      daysUntilStockout,
      urgency,
      recommendation,
      trend,
    };
  });

  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  predictions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  res.json(predictions);
});

export default router;
