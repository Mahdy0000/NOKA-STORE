import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, cartItemsTable, productsTable, deliveryZonesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";
import {
  CreateOrderBody,
  GetOrderParams,
} from "@workspace/api-zod";
import { appendOrderRow, readSheetRows, updateOrderStatus } from "../lib/sheets.js";

const router = Router();

async function getOrderWithItems(orderId: number) {
  const order = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order.length) return null;

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  return {
    id: order[0].id,
    customerName: order[0].customerName,
    customerEmail: order[0].customerEmail,
    customerPhone: order[0].customerPhone,
    address: order[0].address,
    city: order[0].city,
    governorate: order[0].governorate,
    total: Number(order[0].total),
    deliveryFee: Number(order[0].deliveryFee ?? 0),
    deliveryZone: order[0].deliveryZone ?? null,
    status: order[0].status,
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      price: Number(i.price),
      size: i.size ?? null,
      color: i.color ?? null,
    })),
    createdAt: order[0].createdAt.toISOString(),
  };
}

router.get("/orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const result = await Promise.all(orders.map((o) => getOrderWithItems(o.id)));
    res.json(result.filter(Boolean));
  } catch (err) {
    req.log.error({ err }, "Failed to list orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = GetOrderParams.parse({ id: Number(req.params.id) });
    const order = await getOrderWithItems(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to get order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const data = CreateOrderBody.parse(req.body);

    // Get cart items
    const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.sessionId, data.sessionId));
    if (!cartItems.length) return res.status(400).json({ error: "Cart is empty" });

    // Enrich with product info and compute total
    const enriched = await Promise.all(
      cartItems.map(async (item) => {
        const product = await db.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
        const p = product[0];
        return { item, product: p };
      })
    );

    const subtotal = enriched.reduce((sum, { item, product }) => sum + Number(product?.price ?? 0) * item.quantity, 0);

    // Look up delivery fee
    let deliveryFee = 0;
    let deliveryZoneName = null;
    if (data.deliveryZoneId) {
      const [zone] = await db.select().from(deliveryZonesTable).where(eq(deliveryZonesTable.id, data.deliveryZoneId)).limit(1);
      if (zone) {
        deliveryFee = Number(zone.fee);
        deliveryZoneName = zone.name;
      }
    }

    const total = subtotal + deliveryFee;

    const [order] = await db
      .insert(ordersTable)
      .values({
        customerName: data.customerName,
        customerEmail: data.customerEmail ?? null,
        customerPhone: data.customerPhone,
        address: data.address,
        city: data.city,
        governorate: data.governorate,
        total,
        deliveryFee,
        deliveryZone: deliveryZoneName,
        status: "pending",
        notes: data.notes,
      })
      .returning();

    // Insert order items
    await Promise.all(
      enriched.map(({ item, product }) =>
        db.insert(orderItemsTable).values({
          orderId: order.id,
          productId: item.productId,
          productName: product?.name ?? "Unknown",
          quantity: item.quantity,
          price: Number(product?.price ?? 0),
          size: item.size,
          color: item.color,
        })
      )
    );

    // Clear cart
    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, data.sessionId));

    const result = await getOrderWithItems(order.id);

    // Append order to Google Sheet (background, don't block response)
    if (result) {
      (async () => {
        try {
          const itemsStr = result.items
            .map((i) => `${i.productName}${i.size ? ` (${i.size})` : ""}${i.color ? ` - ${i.color}` : ""} x${i.quantity} @ ${(i.price * 50).toFixed(0)} EGP`)
            .join(" | ");
          await appendOrderRow({
            "Order ID": result.id,
            Date: new Date(result.createdAt).toLocaleString("en-EG"),
            Status: result.status,
            "Customer Name": result.customerName,
            Phone: result.customerPhone,
            Email: result.customerEmail ?? "",
            Address: result.address,
            City: result.city,
            Governorate: result.governorate,
            Items: itemsStr,
            "Delivery Fee": result.deliveryFee * 50,
            "Total (EGP)": result.total * 50,
          });
        } catch (e) {
          req.log.error({ err: e }, "Google Sheets append failed");
        }
      })();
    }

    res.status(201).json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const id = z.coerce.number().parse(req.params.id);
    const { status } = z.object({ status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]) }).parse(req.body);
    const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
    if (!order) return res.status(404).json({ error: "Order not found" });

    updateOrderStatus(id, status); // update sheet in background

    const result = await getOrderWithItems(order.id);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to update order status");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.post("/orders/sync-sheet", async (req, res) => {
  try {
    const rows = await readSheetRows();
    if (!rows.length) {
      res.json({ updated: 0 });
      return;
    }

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
    let updated = 0;

    for (const row of rows) {
      const sheetStatus = row.Status.toLowerCase().trim();
      if (!validStatuses.includes(sheetStatus as typeof validStatuses[number])) continue;

      const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, row["Order ID"])).limit(1);
      if (!existing || existing.status === sheetStatus) continue;

      await db.update(ordersTable).set({ status: sheetStatus }).where(eq(ordersTable.id, row["Order ID"]));
      updated++;
    }

    res.json({ updated, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Sheet sync failed");
    res.status(500).json({ error: "Sync failed" });
  }
});

export default router;
