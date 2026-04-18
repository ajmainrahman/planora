import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ideasRouter from "./ideas";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(ideasRouter);

export default router;
