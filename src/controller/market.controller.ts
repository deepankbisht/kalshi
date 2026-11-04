import type { Request, Response } from "express";
import { prisma } from "../db/client";
import { handleError, handleReponse } from "../utils";
import { bigint, success } from "zod";
import MarketRepo from "../db/repository/market.repo";

export const increaseBalance = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json(handleError("Invalid userId",0))
        }
        const user = await prisma.user.update({
            where: {
                id: BigInt(userId),
            },
            data: {
                available_balance: {
                    increment: 50,
                },
            },
            select: {
                username: true,
                available_balance: true,
            },
        });

        res.status(200).json({
            success: true,
            message: "balance updated",
            user: {
                ...user,
                available_balance: user.available_balance.toString(), 
            },
        });

    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json(handleError("Server error",0));
        } else {
            return res
                .status(500)
                .json(handleError("internal server error", 0));
        }
    }
};

export const market = async (req:Request,res:Response)=>{
    try {
        if(!req.userId){
            return res.status(400).json(handleError("userId invalid",0));
        }
        const userId = BigInt(req.userId);
        const {title} = req.body;
        const marketCreate = await MarketRepo.createMarket(userId,title);
        if(!marketCreate){
            return res.status(400).json(handleError("market not created",0))
        }

        return res.status(200).json(handleReponse("market created",1,marketCreate));
        
    } catch (error) {
        return res.status(500).json(handleError("server error",0))
    }
}
