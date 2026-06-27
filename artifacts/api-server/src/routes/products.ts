import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, and, desc, asc } from "drizzle-orm";
import {
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
  GetProductParams,
} from "@workspace/api-zod";

const router = Router();

function formatProduct(p: typeof productsTable.$inferSelect, categoryName?: string | null) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    imageUrl: p.imageUrl ?? null,
    images: p.images ?? [],
    categoryId: p.categoryId ?? null,
    categoryName: categoryName ?? null,
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    inStock: p.inStock,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res) => {
  try {
    const query = ListProductsQueryParams.parse(req.query);
    let conditions = [];

    if (query.category) {
      const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, query.category)).limit(1);
      if (cat.length > 0) {
        conditions.push(eq(productsTable.categoryId, cat[0].id));
      }
    }

    if (query.search) {
      conditions.push(ilike(productsTable.name, `%${query.search}%`));
    }

    let orderBy;
    if (query.sort === "price_asc") orderBy = asc(productsTable.price);
    else if (query.sort === "price_desc") orderBy = desc(productsTable.price);
    else orderBy = desc(productsTable.createdAt);

    const products = await db
      .select()
      .from(productsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy);

    const categories = await db.select().from(categoriesTable);
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    res.json(products.map((p) => formatProduct(p, p.categoryId ? catMap.get(p.categoryId) : null)));
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/featured", async (req, res) => {
  try {
    const products = await db.select().from(productsTable).where(eq(productsTable.isFeatured, true)).orderBy(desc(productsTable.createdAt));
    const categories = await db.select().from(categoriesTable);
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    res.json(products.map((p) => formatProduct(p, p.categoryId ? catMap.get(p.categoryId) : null)));
  } catch (err) {
    req.log.error({ err }, "Failed to get featured products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/new-arrivals", async (req, res) => {
  try {
    const products = await db.select().from(productsTable).where(eq(productsTable.isNew, true)).orderBy(desc(productsTable.createdAt));
    const categories = await db.select().from(categoriesTable);
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    res.json(products.map((p) => formatProduct(p, p.categoryId ? catMap.get(p.categoryId) : null)));
  } catch (err) {
    req.log.error({ err }, "Failed to get new arrivals");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const { id } = GetProductParams.parse({ id: Number(req.params.id) });
    const product = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!product.length) return res.status(404).json({ error: "Product not found" });

    let categoryName = null;
    if (product[0].categoryId) {
      const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product[0].categoryId)).limit(1);
      categoryName = cat[0]?.name ?? null;
    }

    res.json(formatProduct(product[0], categoryName));
  } catch (err) {
    req.log.error({ err }, "Failed to get product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const data = CreateProductBody.parse(req.body);
    const [product] = await db.insert(productsTable).values({
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      images: data.images,
      categoryId: data.categoryId,
      sizes: data.sizes ?? [],
      colors: data.colors ?? [],
      inStock: data.inStock ?? true,
      isFeatured: data.isFeatured ?? false,
      isNew: data.isNew ?? false,
    }).returning();
    res.status(201).json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.patch("/products/:id", async (req, res) => {
  try {
    const { id } = UpdateProductParams.parse({ id: Number(req.params.id) });
    const data = UpdateProductBody.parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.sizes !== undefined) updateData.sizes = data.sizes;
    if (data.colors !== undefined) updateData.colors = data.colors;
    if (data.inStock !== undefined) updateData.inStock = data.inStock;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isNew !== undefined) updateData.isNew = data.isNew;

    const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to update product");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = DeleteProductParams.parse({ id: Number(req.params.id) });
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete product");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
