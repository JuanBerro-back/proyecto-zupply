import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable, suppliersTable } from "@workspace/db";
import { ListProductsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { supplierId, category } = parsed.data;

  const conditions = [];
  if (supplierId != null) conditions.push(eq(productsTable.supplierId, supplierId));
  if (category != null) conditions.push(eq(productsTable.category, category));

  const rows = await db
    .select({
      id: productsTable.id,
      supplierId: productsTable.supplierId,
      supplierName: suppliersTable.name,
      name: productsTable.name,
      category: productsTable.category,
      unit: productsTable.unit,
      pricePerUnit: productsTable.pricePerUnit,
      minOrderQty: productsTable.minOrderQty,
      isAvailable: productsTable.isAvailable,
    })
    .from(productsTable)
    .innerJoin(suppliersTable, eq(productsTable.supplierId, suppliersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(productsTable.name);

  res.json(rows.map((r) => ({ ...r, pricePerUnit: parseFloat(r.pricePerUnit) })));
});

export default router;
