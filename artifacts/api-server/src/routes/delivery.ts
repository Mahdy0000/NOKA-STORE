import { Router } from "express";
import { db } from "@workspace/db";
import { deliveryZonesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  CreateDeliveryZoneBody,
  UpdateDeliveryZoneBody,
  UpdateDeliveryZoneParams,
  DeleteDeliveryZoneParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/delivery-zones", async (req, res) => {
  try {
    const zones = await db.select().from(deliveryZonesTable).orderBy(deliveryZonesTable.name);
    res.json(zones.map((z) => ({ id: z.id, name: z.name, fee: Number(z.fee) })));
  } catch (err) {
    req.log.error({ err }, "Failed to list delivery zones");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/delivery-zones", async (req, res) => {
  try {
    const data = CreateDeliveryZoneBody.parse(req.body);
    const [zone] = await db.insert(deliveryZonesTable).values({ name: data.name, fee: data.fee }).returning();
    res.status(201).json({ id: zone.id, name: zone.name, fee: Number(zone.fee) });
  } catch (err) {
    req.log.error({ err }, "Failed to create delivery zone");
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: err.errors });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
});

router.put("/delivery-zones/:id", async (req, res) => {
  try {
    const { id } = UpdateDeliveryZoneParams.parse({ id: Number(req.params.id) });
    const data = UpdateDeliveryZoneBody.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.fee !== undefined) updateData.fee = data.fee;
    const [zone] = await db.update(deliveryZonesTable).set(updateData).where(eq(deliveryZonesTable.id, id)).returning();
    if (!zone) return res.status(404).json({ error: "Delivery zone not found" });
    res.json({ id: zone.id, name: zone.name, fee: Number(zone.fee) });
  } catch (err) {
    req.log.error({ err }, "Failed to update delivery zone");
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: err.errors });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
});

router.delete("/delivery-zones/:id", async (req, res) => {
  try {
    const { id } = DeleteDeliveryZoneParams.parse({ id: Number(req.params.id) });
    await db.delete(deliveryZonesTable).where(eq(deliveryZonesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete delivery zone");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
