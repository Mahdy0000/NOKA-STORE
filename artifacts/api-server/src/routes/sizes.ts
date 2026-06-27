import { Router } from "express";
import { db } from "@workspace/db";
import { sizesTable, insertSizeSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/sizes", async (req, res) => {
  try {
    const sizes = await db.select().from(sizesTable);
    res.json(sizes);
  } catch (err) {
    req.log.error({ err }, "Failed to list sizes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sizes", async (req, res) => {
  try {
    const data = insertSizeSchema.parse({ name: req.body.name });
    const [size] = await db.insert(sizesTable).values(data).returning();
    res.status(201).json(size);
  } catch (err) {
    req.log.error({ err }, "Failed to create size");
    res.status(400).json({ error: "Invalid size data" });
  }
});

router.put("/sizes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = insertSizeSchema.parse({ name: req.body.name });
    const [size] = await db.update(sizesTable).set(data).where(eq(sizesTable.id, id)).returning();
    if (!size) return res.status(404).json({ error: "Size not found" });
    res.json(size);
  } catch (err) {
    req.log.error({ err }, "Failed to update size");
    res.status(400).json({ error: "Invalid size data" });
  }
});

router.delete("/sizes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(sizesTable).where(eq(sizesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete size");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
