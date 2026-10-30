import { Router } from "express";
import { signin, signup } from "../controller/auth.controller";

const authRouter = Router();

authRouter.use("/signup",signup);
authRouter.use("signin",signin);

export default authRouter;