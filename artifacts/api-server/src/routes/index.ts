import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ideasRouter from "./ideas";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ideasRouter);

export default router;
