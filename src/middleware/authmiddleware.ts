import { type NextFunction, type Request, type Response } from "express";
import { env } from "bun";
import jwt from "jsonwebtoken"
import { string } from "zod";

export const authMiddleware = async (req:Request,res:Response,next:NextFunction) => {
    try {
        const authHeader = req.headers.token;
        if(typeof authHeader !== "string"){
            throw new Error("header is not string");
        }

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            throw new Error("Error with token middleware");
        }

        const token = authHeader.split(" ")[1];
        const response = jwt.verify(token!,env.JWT_URL!);
        if(typeof response === "string" || typeof response.userId !== "string"){
            throw new Error("error with jwt")
        }

        req.userId = response.userId  ;
        
        next();
    } catch (error) {
        
    }
}
