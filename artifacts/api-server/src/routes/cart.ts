import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetCartQueryParams,
  AddToCartBody,
  UpdateCartItemParams,
  UpdateCartItemBody,
  RemoveCartItemParams,
} from "@workspace/api-zod";

const router = Router();

async function buildCart(sessionId: string) {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

  const enriched = await Promise.all(
    items.map(async (item) => {
      const product = await db.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
      const p = product[0];
      return {
        id: item.id,
        productId: item.productId,
        productName: p?.name ?? "Unknown",
        productImage: p?.imageUrl ?? null,
        price: Number(p?.price ?? 0),
        quantity: item.quantity,
        size: item.size ?? null,
        color: item.color ?? null,
        sessionId: item.sessionId,
      };
    })
  );

  const total = enriched.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = enriched.reduce((sum, i) => sum + i.quantity, 0);

  return { items: enriched, total, itemCount };
}

router.get("/cart", async (req, res) => {
  try {
    const query = GetCartQueryParams.parse(req.query);
    const cart = await buildCart(query.session_id);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Failed to get cart");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.post("/cart/items", async (req, res) => {
  try {
    const data = AddToCartBody.parse(req.body);

    // Check if same product+size+color already in cart
    const existing = await db
      .select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.sessionId, data.sessionId),
          eq(cartItemsTable.productId, data.productId),
          eq(cartItemsTable.size, data.size ?? ""),
          eq(cartItemsTable.color, data.color ?? "")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(cartItemsTable)
        .set({ quantity: existing[0].quantity + data.quantity })
        .where(eq(cartItemsTable.id, existing[0].id));
    } else {
      await db.insert(cartItemsTable).values({
        sessionId: data.sessionId,
        productId: data.productId,
        quantity: data.quantity,
        size: data.size,
        color: data.color,
      });
    }

    const cart = await buildCart(data.sessionId);
    res.status(201).json(cart);
  } catch (err) {
    req.log.error({ err }, "Failed to add to cart");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.patch("/cart/items/:itemId", async (req, res) => {
  try {
    const { itemId } = UpdateCartItemParams.parse({ itemId: Number(req.params.itemId) });
    const data = UpdateCartItemBody.parse(req.body);

    await db.update(cartItemsTable).set({ quantity: data.quantity }).where(eq(cartItemsTable.id, itemId));

    const cart = await buildCart(data.sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Failed to update cart item");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/cart/items/:itemId", async (req, res) => {
  try {
    const { itemId } = RemoveCartItemParams.parse({ itemId: Number(req.params.itemId) });
    const sessionId = req.query.session_id as string;

    if (!sessionId) return res.status(400).json({ error: "session_id required" });

    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));

    const cart = await buildCart(sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Failed to remove cart item");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
