import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import categoriesRouter from "./categories.js";
import productsRouter from "./products.js";
import cartRouter from "./cart.js";
import ordersRouter from "./orders.js";
import storeRouter from "./store.js";
import sizesRouter from "./sizes.js";
import uploadRouter from "./upload.js";
import deliveryRouter from "./delivery.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(storeRouter);
router.use(sizesRouter);
router.use(deliveryRouter);
router.use("/upload", uploadRouter);

export default router;
