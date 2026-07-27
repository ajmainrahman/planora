import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ideasRouter from "./ideas";
import authRouter from "./auth";
import trackerRouter from "./tracker";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(ideasRouter);
router.use(trackerRouter);

export default router;
