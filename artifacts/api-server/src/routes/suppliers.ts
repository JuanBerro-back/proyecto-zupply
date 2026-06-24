import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, suppliersTable, reviewsTable } from "@workspace/db";
import {
  CreateSupplierBody,
  GetSupplierParams,
  CreateSupplierReviewParams,
  CreateSupplierReviewBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/suppliers", async (_req, res): Promise<void> => {
  const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.name);
  res.json(suppliers.map((s) => ({ ...s, rating: parseFloat(s.rating ?? "0"), reviews: [] })));
});

router.post("/suppliers", async (req, res): Promise<void> => {
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [supplier] = await db.insert(suppliersTable).values(parsed.data).returning();
  res.status(201).json({ ...supplier, rating: parseFloat(supplier.rating ?? "0"), reviews: [] });
});

router.get("/suppliers/:id", async (req, res): Promise<void> => {
  const params = GetSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, params.data.id));
  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.supplierId, params.data.id));
  res.json({
    ...supplier,
    rating: parseFloat(supplier.rating ?? "0"),
    reviews: reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
});

router.post("/suppliers/:id/reviews", async (req, res): Promise<void> => {
  const params = CreateSupplierReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateSupplierReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, params.data.id));
  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({ supplierId: params.data.id, ...parsed.data })
    .returning();

  // Recalculate rating
  const [agg] = await db
    .select({ avg: sql<string>`avg(rating)`, count: sql<string>`count(*)` })
    .from(reviewsTable)
    .where(eq(reviewsTable.supplierId, params.data.id));

  await db
    .update(suppliersTable)
    .set({ rating: agg.avg ?? "0", reviewCount: parseInt(agg.count ?? "0", 10) })
    .where(eq(suppliersTable.id, params.data.id));

  res.status(201).json({ ...review, createdAt: review.createdAt.toISOString() });
});

export default router;
