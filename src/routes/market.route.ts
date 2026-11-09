import { Router } from "express";
import {
    getMarket,
    increaseBalance,
    market,
    mergeBid,
    splitBid,
} from "../controller/market.controller";
import { authMiddleware } from "../middleware/authmiddleware";

const marketRouter = Router();

marketRouter.post("/onramp", authMiddleware, increaseBalance);
marketRouter.post("/market", authMiddleware, market);
marketRouter.post("/split/:marketId", authMiddleware, splitBid);
marketRouter.post("/merge/:marketId", authMiddleware, mergeBid);
marketRouter.get("/market", authMiddleware, getMarket);

export default marketRouter;
