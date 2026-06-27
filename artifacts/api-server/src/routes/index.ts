import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import storeRouter from "./store";
import sizesRouter from "./sizes";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(storeRouter);
router.use(sizesRouter);
router.use("/upload", uploadRouter);

export default router;
