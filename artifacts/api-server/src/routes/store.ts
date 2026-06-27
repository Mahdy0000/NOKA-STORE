import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable, ordersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.get("/store/summary", async (req, res) => {
  try {
    const [totalProducts] = await db.select({ count: count() }).from(productsTable);
    const [totalOrders] = await db.select({ count: count() }).from(ordersTable);
    const [totalCategories] = await db.select({ count: count() }).from(categoriesTable);
    const [featuredCount] = await db.select({ count: count() }).from(productsTable).where(eq(productsTable.isFeatured, true));
    const [newArrivalsCount] = await db.select({ count: count() }).from(productsTable).where(eq(productsTable.isNew, true));

    res.json({
      totalProducts: Number(totalProducts.count),
      totalOrders: Number(totalOrders.count),
      totalCategories: Number(totalCategories.count),
      featuredCount: Number(featuredCount.count),
      newArrivalsCount: Number(newArrivalsCount.count),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get store summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
