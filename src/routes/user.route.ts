import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";
import { getUserBalance, getUserFills, getUserPortfolio, getUserTransaction } from "../controller/user.controller";

const user = Router();

user.get("/portfolio/",authMiddleware,getUserPortfolio)
user.get("/balance/",authMiddleware,getUserBalance)
user.get("/fills/",authMiddleware,getUserFills)
user.get("/transaction/",authMiddleware,getUserTransaction)

export default user;