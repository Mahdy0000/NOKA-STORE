import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, insertCategorySchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable);
    res.json(categories);
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

router.post("/categories", async (req, res) => {
  try {
    const data = insertCategorySchema.parse({
      name: req.body.name,
      slug: req.body.slug || slugify(req.body.name || ""),
      imageUrl: req.body.imageUrl || null,
    });
    const [category] = await db.insert(categoriesTable).values(data).returning();
    res.status(201).json(category);
  } catch (err) {
    req.log.error({ err }, "Failed to create category");
    res.status(400).json({ error: "Invalid category data" });
  }
});

router.put("/categories/:id", async (req, res) => {
  try {
    const id = z.coerce.number().parse(req.params.id);
    const data = insertCategorySchema.partial().parse({
      name: req.body.name,
      slug: req.body.slug,
      imageUrl: req.body.imageUrl,
    });
    const [category] = await db.update(categoriesTable).set(data).where(eq(categoriesTable.id, id)).returning();
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (err) {
    req.log.error({ err }, "Failed to update category");
    res.status(400).json({ error: "Invalid category data" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const id = z.coerce.number().parse(req.params.id);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete category");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
