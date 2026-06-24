import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import suppliersRouter from "./suppliers";
import productsRouter from "./products";
import ordersRouter from "./orders";
import inventoryRouter from "./inventory";
import accountingRouter from "./accounting";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(suppliersRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(inventoryRouter);
router.use(accountingRouter);

export default router;
