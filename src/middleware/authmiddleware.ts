import { type NextFunction, type Request, type Response } from "express";
import { env } from "bun";
import jwt from "jsonwebtoken";
import { handleError } from "../utils";
import { success } from "zod";

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.token as string;
        if (typeof authHeader !== "string") {
            return res.status(400).json(handleError("header is not string",0));
        }

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(400).json(handleError("Error with token middleware",0));
        }

        const token = authHeader.split(" ")[1] as string;

        const response = jwt.verify(token, env.JWT_URL as string);
        if (
            typeof response === "string" ||
            typeof response.userId !== "string"
        ) {
            return res
                .status(400)
                .json(handleError( "error with jwt", 0));
        }
        req.userId = response.userId;
        next();
    } catch (error) {
        if (error instanceof Error) {
            return res.status(401).json(handleError( error.message, 0));
        } else {
            return res
                .status(500)
                .send(handleError("Server error in middleware", 0));
        }
    }
};
