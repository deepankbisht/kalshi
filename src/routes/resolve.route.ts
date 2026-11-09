import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";
import { resolveMarket } from "../controller/market.resolve";

const marketResolve = Router();

marketResolve.post("/market/resolve/:id",authMiddleware,resolveMarket)

export default marketResolve