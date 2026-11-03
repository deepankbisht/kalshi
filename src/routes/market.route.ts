import { Router } from "express";
import { increaseBalance } from "../controller/market.controller";
import { authMiddleware } from "../middleware/authmiddleware";

const marketRouter = Router();

marketRouter.post("/onramp",authMiddleware ,increaseBalance);

export default marketRouter;
