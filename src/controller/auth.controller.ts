import type { Request,Response } from "express";
import { userSchema } from "../types/auth.type"
import { prisma } from "../db/client";


export const signup = async (req:Request ,res:Response) => {
    const response = userSchema.safeParse(req.body);
    const isUserExist = await prisma.user
}

export const signin = async () => {

}