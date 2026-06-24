import { Router, type IRouter } from "express";
import { gte, sql } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/accounting/transactions", async (_req, res): Promise<void> => {
  const transactions = await db.select().from(transactionsTable).orderBy(transactionsTable.date);
  res.json(
    transactions.map((t) => ({
      ...t,
      amount: parseFloat(t.amount),
    }))
  );
});

router.get("/accounting/summary", async (_req, res): Promise<void> => {
  const allTx = await db.select().from(transactionsTable).orderBy(transactionsTable.date);

  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  let cashBalance = 0;
  let totalExpensesThisMonth = 0;
  let totalExpensesLastMonth = 0;
  const categoryMap = new Map<string, number>();
  const monthlyMap = new Map<string, number>();

  for (const t of allTx) {
    const amount = parseFloat(t.amount);
    const month = t.date.substring(0, 7);

    if (t.type === "expense") {
      cashBalance -= amount;
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + amount);
      categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + amount);
      if (month === thisMonthStr) totalExpensesThisMonth += amount;
      if (month === lastMonthStr) totalExpensesLastMonth += amount;
    } else if (t.type === "income") {
      cashBalance += amount;
    }
  }

  // Add a starting balance
  cashBalance += 5000000;

  const totalCategoryExpenses = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
  const expensesByCategory = Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalCategoryExpenses > 0 ? Math.round((amount / totalCategoryExpenses) * 100) : 0,
  }));

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));

  res.json({
    cashBalance,
    totalExpensesThisMonth,
    totalExpensesLastMonth,
    expensesByCategory,
    monthlyTrend,
  });
});

export default router;
