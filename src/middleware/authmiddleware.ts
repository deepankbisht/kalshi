import { type NextFunction, type Request, type Response } from "express";
import { env } from "bun";
import jwt from "jsonwebtoken";
import { handleError } from "../utils";

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.token as string;
        if (typeof authHeader !== "string") {
            throw new Error("header is not string");
        }

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new Error("Error with token middleware");
        }

        const token = authHeader.split(" ")[1] as string;

        const response = jwt.verify(token, env.JWT_URL as string);
        if (
            typeof response === "string" ||
            typeof response.userId !== "string"
        ) {
            throw new Error("error with jwt");
        }
        req.userId = response.userId;
        next();
    } catch (error) {
        if (error instanceof Error) {
            return res.status(401).send(handleError(error.message, 0));
        } else {
            return res
                .status(500)
                .send(handleError("Server error in middleware", 0));
        }
    }
};
