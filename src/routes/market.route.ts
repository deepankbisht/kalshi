import { Router } from "express";
import {
    increaseBalance,
    market,
    splitBid,
} from "../controller/market.controller";
import { authMiddleware } from "../middleware/authmiddleware";

const marketRouter = Router();

marketRouter.post("/onramp", authMiddleware, increaseBalance);
marketRouter.post("/market", authMiddleware, market);
marketRouter.post("/split/:marketId", authMiddleware, splitBid);

export default marketRouter;
