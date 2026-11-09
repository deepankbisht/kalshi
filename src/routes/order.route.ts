import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";
import { createAsk, createBid } from "../controller/market.order.controller";

const marketOrder = Router();

marketOrder.post("/create/bid/:id",authMiddleware,createBid)
marketOrder.post("/create/ask/:id",authMiddleware,createAsk)

export default marketOrder