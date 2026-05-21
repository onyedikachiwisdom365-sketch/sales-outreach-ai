import { Router, type IRouter } from "express";
import healthRouter from "./health";
import prospectsRouter from "./prospects";
import campaignsRouter from "./campaigns";
import emailsRouter from "./emails";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(prospectsRouter);
router.use(campaignsRouter);
router.use(emailsRouter);
router.use(statsRouter);

export default router;
