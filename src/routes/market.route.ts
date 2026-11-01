import { Router } from "express";
import { increaseBalance } from "../controller/market.controller";

const marketRouter = Router();

marketRouter.post("/onramp", increaseBalance);

export default marketRouter;
