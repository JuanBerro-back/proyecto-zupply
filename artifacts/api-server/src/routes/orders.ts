import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, suppliersTable, transactionsTable, inventoryTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  const items = await db
    .select({
      id: orderItemsTable.id,
      orderId: orderItemsTable.orderId,
      productId: orderItemsTable.productId,
      productName: productsTable.name,
      supplierName: suppliersTable.name,
      quantity: orderItemsTable.quantity,
      unit: productsTable.unit,
      unitPrice: orderItemsTable.unitPrice,
      subtotal: orderItemsTable.subtotal,
    })
    .from(orderItemsTable)
    .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .innerJoin(suppliersTable, eq(productsTable.supplierId, suppliersTable.id))
    .where(eq(orderItemsTable.orderId, orderId));

  return {
    ...order,
    totalAmount: parseFloat(order.totalAmount ?? "0"),
    createdAt: order.createdAt.toISOString(),
    items: items.map((i) => ({
      ...i,
      unitPrice: parseFloat(i.unitPrice),
      subtotal: parseFloat(i.subtotal),
    })),
  };
}

router.get("/orders", async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);

  const result = await Promise.all(
    orders.map(async (o) => {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
      return {
        ...o,
        totalAmount: parseFloat(o.totalAmount ?? "0"),
        createdAt: o.createdAt.toISOString(),
        items: items.map((i) => ({
          ...i,
          unitPrice: parseFloat(i.unitPrice),
          subtotal: parseFloat(i.subtotal),
        })),
      };
    })
  );

  res.json(result);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.items || parsed.data.items.length === 0) {
    res.status(400).json({ error: "Order must have at least one item" });
    return;
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await db
    .select({ id: productsTable.id, pricePerUnit: productsTable.pricePerUnit, supplierId: productsTable.supplierId })
    .from(productsTable)
    .where(inArray(productsTable.id, productIds));

  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalAmount = 0;
  const itemsToInsert: { productId: number; quantity: number; unitPrice: number; subtotal: number }[] = [];

  for (const item of parsed.data.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    const unitPrice = parseFloat(product.pricePerUnit);
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;
    itemsToInsert.push({ productId: item.productId, quantity: item.quantity, unitPrice, subtotal });
  }

  const uniqueSupplierIds = new Set(products.map((p) => p.supplierId));

  const [order] = await db
    .insert(ordersTable)
    .values({
      status: "pending",
      totalAmount: totalAmount.toFixed(2),
      supplierCount: uniqueSupplierIds.size,
      deliveryDate: parsed.data.deliveryDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  await db.insert(orderItemsTable).values(
    itemsToInsert.map((i) => ({
      orderId: order.id,
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice.toFixed(2),
      subtotal: i.subtotal.toFixed(2),
    }))
  );

  // Auto-create accounting transaction
  const today = new Date().toISOString().split("T")[0];
  await db.insert(transactionsTable).values({
    orderId: order.id,
    type: "expense",
    amount: totalAmount.toFixed(2),
    description: `Pedido #${order.id} - ${uniqueSupplierIds.size} proveedor(es)`,
    category: "Compras de insumos",
    date: today,
  });

  const full = await getOrderWithItems(order.id);
  res.status(201).json(full);
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const order = await getOrderWithItems(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // When delivered, decrement inventory
  if (parsed.data.status === "delivered") {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, params.data.id));
    for (const item of items) {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      if (product) {
        const inv = await db.select().from(inventoryTable).where(eq(inventoryTable.name, product.name));
        if (inv.length > 0) {
          const newStock = Math.max(0, parseFloat(inv[0].currentStock ?? "0") + item.quantity);
          await db
            .update(inventoryTable)
            .set({ currentStock: newStock.toFixed(2), lastUpdated: new Date() })
            .where(eq(inventoryTable.id, inv[0].id));
        }
      }
    }
  }

  const full = await getOrderWithItems(params.data.id);
  res.json(full);
});

export default router;
