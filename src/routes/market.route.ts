import { Router } from "express";
import { increaseBalance, market } from "../controller/market.controller";
import { authMiddleware } from "../middleware/authmiddleware";

const marketRouter = Router();

marketRouter.post("/onramp",authMiddleware ,increaseBalance);
marketRouter.post("/market",authMiddleware,market)

export default marketRouter;
