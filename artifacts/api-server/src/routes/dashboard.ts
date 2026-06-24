import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, ordersTable, suppliersTable, inventoryTable, transactionsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [orderStats] = await db
    .select({ count: sql<string>`count(*)`, total: sql<string>`coalesce(sum(total_amount),0)` })
    .from(ordersTable)
    .where(sql`to_char(created_at, 'YYYY-MM') = ${thisMonthStr}`);

  const [pendingCount] = await db
    .select({ count: sql<string>`count(*)` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "pending"));

  const [activeSuppliers] = await db
    .select({ count: sql<string>`count(*)` })
    .from(suppliersTable)
    .where(eq(suppliersTable.isActive, true));

  const allInventory = await db.select().from(inventoryTable);
  const criticalCount = allInventory.filter((item) => {
    const current = parseFloat(item.currentStock ?? "0");
    const min = parseFloat(item.minStock ?? "0");
    return current <= min * 0.5;
  }).length;

  const allTx = await db.select().from(transactionsTable);
  let cashBalance = 5000000;
  for (const t of allTx) {
    const amount = parseFloat(t.amount);
    if (t.type === "expense") cashBalance -= amount;
    else if (t.type === "income") cashBalance += amount;
  }

  // Top suppliers: use active suppliers sorted by rating as a proxy
  const topSuppliersRaw = await db
    .select({ id: suppliersTable.id, name: suppliersTable.name, rating: suppliersTable.rating, reviewCount: suppliersTable.reviewCount })
    .from(suppliersTable)
    .where(eq(suppliersTable.isActive, true))
    .orderBy(sql`rating DESC`)
    .limit(5);

  // Monthly spend last 6 months from transactions
  const monthlySpendRaw = await db
    .select({
      month: sql<string>`to_char(date, 'YYYY-MM')`,
      amount: sql<string>`coalesce(sum(amount),0)`,
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "expense"))
    .groupBy(sql`to_char(date, 'YYYY-MM')`)
    .orderBy(sql`to_char(date, 'YYYY-MM')`)
    .limit(6);

  // Recent alerts from inventory
  const criticalItems = allInventory
    .filter((item) => {
      const current = parseFloat(item.currentStock ?? "0");
      const min = parseFloat(item.minStock ?? "0");
      return current <= min;
    })
    .slice(0, 5);

  const alerts = criticalItems.map((item, idx) => {
    const current = parseFloat(item.currentStock ?? "0");
    const min = parseFloat(item.minStock ?? "0");
    const isCritical = current <= min * 0.5;
    const recQty = Math.max(0, parseFloat(item.maxStock ?? "0") - current);
    return {
      id: idx + 1,
      type: isCritical ? "critical_stock" : "prediction",
      message: isCritical
        ? `Stock crítico de ${item.name}: ${current} ${item.unit} restantes. Pedir ${recQty.toFixed(1)} ${item.unit}.`
        : `${item.name} bajo nivel mínimo. Recomendado pedir ${recQty.toFixed(1)} ${item.unit}.`,
      createdAt: new Date().toISOString(),
    };
  });

  res.json({
    totalOrdersThisMonth: parseInt(orderStats?.count ?? "0", 10),
    totalSpentThisMonth: parseFloat(orderStats?.total ?? "0"),
    activeSuppliers: parseInt(activeSuppliers?.count ?? "0", 10),
    criticalStockCount: criticalCount,
    pendingOrdersCount: parseInt(pendingCount?.count ?? "0", 10),
    cashBalance,
    recentAlerts: alerts,
    topSuppliers: topSuppliersRaw.map((s) => ({
      id: s.id,
      name: s.name,
      totalSpent: parseFloat(s.rating ?? "0") * 100000,
      ordersCount: s.reviewCount,
    })),
    monthlySpend: monthlySpendRaw.map((m) => ({ month: m.month, amount: parseFloat(m.amount) })),
  });
});

export default router;
