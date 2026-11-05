import type { Request, Response } from "express";
import { prisma } from "../db/client";
import { handleError } from "../utils";
import MarketRepo from "../db/repository/market.repo";
import { getUser } from "../db/repository/user.getRepo";
import { bigint, int, number, string, success } from "zod";
import { tx_log } from "../db/repository/user.repo";
import { checkUserStockBalance, createUserStockBalance, splitUserStockBalance } from "../db/repository/stockBalance.repo";
import { userIdSchema } from "../zod/req";

export const increaseBalance = async (req: Request, res: Response) => {
    try {
        if(!req.userId){
            return res.status(400).json(handleError("invalid request userId",0))
        }

        const userId = BigInt(req.userId);

        if (!userId) {
            return res.status(400).json(handleError("Invalid userId", 0));
        }
        const user = await prisma.user.update({
            where: {
                id: userId,
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

        await tx_log(userId,BigInt(50),"increase balance",);

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
            return res.status(500).json(handleError("Server error", 0));
        } else {
            return res
                .status(500)
                .json(handleError("internal server error", 0));
        }
    }
};

export const market = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(400).json(handleError("userId invalid", 0));
        }
        const userId = BigInt(req.userId);
        const { title } = req.body;
        const marketCreate = await MarketRepo.createMarket(userId, title);

        if (!marketCreate) {
            return res.status(400).json(handleError("market not created", 0));
        }

        return res.status(200).json({
            success: true,
            marketId: String(marketCreate.id),
            title: marketCreate.title,
        });
    } catch (error) {
        return res.status(500).json(handleError("server error", 0));
    }
};



export const splitBid = async (req: Request, res: Response) => {
    try {
        const {marketId} = req.params ;
        if (!marketId || typeof marketId !== "string") {
            return res.status(400).json(handleError("marketId invalid", 0));
        }
        if (!req.userId) {
            return res.status(400).json(handleError("userId invalid", 0));
        }
        const userId = BigInt(req.userId);
        if (!userId) {
            return res.status(400).json(handleError("userId invalid", 0));
        }

        const existUser = await getUser(userId);
        const existMarket = await MarketRepo.getMarket(BigInt(marketId));

        if (!existUser) {
            return res.status(400).json(handleError("invalid user", 0));
        }

        const bet = BigInt(req.body.bet);

        if (!bet) {
            return res.status(400).json(handleError("bet invalid", 0));
        }

        if(bet%100n !== 0n){
            return res.status(400).json(handleError("bet should be in multiple of 100",0))
        }

        const stock = bet/100n;

        if (existUser?.available_balance < (bet)) {
            return res.status(400).json({
                success:"low balance",
                username:existUser.username,
                balance: String(existUser.available_balance),
                title: existMarket?.title
            });
        }

        const updatedMarket = await prisma.user.update({
            where: {
                id: (userId),
            },
            data: {
                available_balance: {
                    decrement: (bet),
                },
            },
            select: {
                username: true,
                available_balance: true,
            },
        });

        const userExistYES = await checkUserStockBalance(userId,BigInt(marketId),"YES");
        const userExistNO  = await checkUserStockBalance(userId,BigInt(marketId),"NO");

        if(!userExistYES){
            await createUserStockBalance(userId,BigInt(marketId),"YES",stock);
        }else{
            await splitUserStockBalance(userExistYES.id,stock);
        }

        if(!userExistNO){
            await createUserStockBalance(userId,BigInt(marketId),"NO",stock);
        }else{
            await splitUserStockBalance(userExistNO.id,stock);
        }

        await tx_log(userId,bet,"split");


        const checkYES = await checkUserStockBalance(userId,BigInt(marketId),"YES");
        const checkNO = await checkUserStockBalance(userId,BigInt(marketId),"NO");
        return res.status(200).json({
            username: updatedMarket.username,
            balance: String(updatedMarket.available_balance),
            title: existMarket?.title,
            total_YES : String(checkYES?.qty),
            total_NO : String(checkNO?.qty)
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json(handleError("server error", 0));
    }
};

export const mergeBid = async (req:Request,res:Response)=>{
    try {
        const {marketId} = req.params ;
        if (!marketId || typeof marketId !== "string") {
            return res.status(400).json(handleError("marketId invalid", 0));
        }
        if (!req.userId) {
            return res.status(400).json(handleError("userId invalid", 0));
        }
        const userId = BigInt(req.userId);
        if (!userId) {
            return res.status(400).json(handleError("userId invalid", 0));
        }

        const existUser = await getUser(userId);
        const existMarket = await MarketRepo.getMarket(BigInt(marketId));

        if (!existUser) {
            return res.status(400).json(handleError("invalid user", 0));
        }

        const bet = BigInt(req.body.bet);

        if (!bet) {
            return res.status(400).json(handleError("bet invalid", 0));
        }

        const userExistYES = await checkUserStockBalance(userId,BigInt(marketId),"YES");
        const userExistNO  = await checkUserStockBalance(userId,BigInt(marketId),"NO");

        if(!userExistYES){
            return res.status(400).json(handleError("user don't exist of type YES",0))
        }

        if(!userExistNO){
            return res.status(400).json(handleError("user don't exist of type NO",0))
        }

        if(userExistYES.qty<bet && userExistNO.qty < bet){
            return res.status(400).json(handleError("insufficient qty of stock",0))
        }



        const updatedMarket = await prisma.user.update({
            where: {
                id: (userId),
            },
            data: {
                available_balance: {
                    increment: (bet),
                },
            },
            select: {
                username: true,
                available_balance: true,
            },
        });

    } catch (error) {
        
    }
}
