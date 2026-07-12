import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storesRouter from "./stores";
import productsRouter from "./products";
import visitsRouter from "./visits";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/stores", storesRouter);
router.use("/products", productsRouter);
router.use("/visits", visitsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
