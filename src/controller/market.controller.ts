import type { Request, Response } from "express";
import { prisma } from "../db/client";
import { handleError } from "../utils";
import MarketRepo from "../db/repository/market.repo";
import {
    checkUserStockBalance,
    createUserStockBalance,
    mergeUserStockBalance,
    splitUserStockBalance,
} from "../db/repository/stockBalance.repo";
import tx_log from "../db/repository/tx_repo";
import UserRepo from "../db/repository/user.repo";
import { success } from "zod";

export const increaseBalance = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res
                .status(400)
                .json(handleError("invalid request userId", 0));
        }

        const userId = BigInt(req.userId);

        if (!userId) {
            return res.status(400).json(handleError("Invalid userId", 0));
        }

        const user = await UserRepo.increase(userId);

        await tx_log.tx_history(userId, BigInt(50), "increase balance");

        res.status(200).json({
            success: true,
            message: "balance updated",
            username: user.username,
            balance: String(user.available_balance),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json(handleError("internal server error", 0));
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
        const { marketId } = req.params;
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

        const existUser = await UserRepo.getUserViaUserId(userId);
        if (!existUser) {
            return res.status(400).json(handleError("invalid user", 0));
        }

        const existMarket = await MarketRepo.getMarket(BigInt(marketId));

        if(!existMarket){
            return res.status(400).json(handleError("market is not created",0))
        }

        if(existMarket.resolution!== null){
            return res.status(400).json(handleError("resolution is already executed",0))   
        }

        const bet = BigInt(req.body.bet);

        if (!bet) {
            return res.status(400).json(handleError("bet invalid", 0));
        }

        if (bet % 100n !== 0n) {
            return res
                .status(400)
                .json(handleError("bet should be in multiple of 100", 0));
        }

        const stock = bet / 100n;

        if (existUser?.available_balance < bet) {
            return res.status(400).json({
                success: "low balance",
                username: existUser.username,
                balance: String(existUser.available_balance),
                title: existMarket?.title,
            });
        }

        const updatedMarket = await UserRepo.updateMarket(userId, bet);

        const userExistYES = await checkUserStockBalance(
            userId,
            BigInt(marketId),
            "YES"
        );
        const userExistNO = await checkUserStockBalance(
            userId,
            BigInt(marketId),
            "NO"
        );

        if (!userExistYES) {
            await createUserStockBalance(
                userId,
                BigInt(marketId),
                "YES",
                stock
            );
        } else {
            await splitUserStockBalance(userExistYES.id, stock);
        }

        if (!userExistNO) {
            await createUserStockBalance(userId, BigInt(marketId), "NO", stock);
        } else {
            await splitUserStockBalance(userExistNO.id, stock);
        }

        await tx_log.tx_history(userId, bet, "split");
        await MarketRepo.splitMarket(BigInt(marketId), stock);

        const checkYES = await checkUserStockBalance(
            userId,
            BigInt(marketId),
            "YES"
        );
        const checkNO = await checkUserStockBalance(
            userId,
            BigInt(marketId),
            "NO"
        );
        return res.status(200).json({
            username: updatedMarket.username,
            balance: String(updatedMarket.available_balance),
            title: existMarket?.title,
            total_YES: String(checkYES?.qty),
            total_NO: String(checkNO?.qty),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json(handleError("server error", 0));
    }
};

export const mergeBid = async (req: Request, res: Response) => {
    try {
        const { marketId } = req.params;
        if (!marketId || typeof marketId !== "string") {
            return res.status(400).json(handleError("marketId invalid", 0));
        }
        if (!req.userId) {
            return res.status(400).json(handleError("userId invalid", 0));
        }

        const userId = BigInt(req.userId);
        const marketID = BigInt(marketId);

        if (!userId) {
            return res.status(400).json(handleError("userId invalid", 0));
        }

        const checkMarketId = await MarketRepo.getMarket(marketID);
        if(!checkMarketId){
            return res.status(400).json(handleError("market is not created",0))
        }

        if(checkMarketId.resolution!== null){
            return res.status(400).json(handleError("resolution is already executed",0))   
        }

        const existUser = await UserRepo.getUserViaUserId(userId);

        if (!existUser) {
            return res.status(400).json(handleError("invalid user", 0));
        }

        const bet = BigInt(req.body.bet);

        if (!bet) {
            return res.status(400).json(handleError("bet invalid", 0));
        }

        const userExistYES = await checkUserStockBalance(userId,marketID,"YES");
        const userExistNO = await checkUserStockBalance(userId, marketID, "NO");

        if (!userExistYES) {
            return res
                .status(400)
                .json(handleError("user don't exist of type YES", 0));
        }

        if (!userExistNO) {
            return res
                .status(400)
                .json(handleError("user don't exist of type NO", 0));
        }

        if (userExistYES.qty < bet || userExistNO.qty < bet) {
            return res.status(400).json({
                success: false,
                message: "not enough YES or NO",
                qty_YES: String(userExistYES.qty),
                qty_NO: String(userExistNO.qty),
            });
        }

        if(checkMarketId.totalIssued<=0 || checkMarketId.totalIssued < bet){
            return res.status(400).json(handleError("you can't merge more that market",0))
        }
        
        const user = await UserRepo.updatedBalance(userId, bet);
        const market = await MarketRepo.mergeMarket(marketID,bet);
        const stockYES = await mergeUserStockBalance(userExistYES.id,bet);
        const stockNO = await mergeUserStockBalance(userExistNO.id,bet);
        await tx_log.tx_history(userId, bet*100n, "merge");

        return res.status(200).json({
            success: true,
            username: user.username,
            balance: String(user.available_balance),
            YES_left: String(stockYES.qty),
            NO_left : String(stockNO.qty),
            total_Market_Stock: String(market.totalIssued)
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json(handleError("Server Error", 0));
    }
};


export const getMarket = async (req:Request,res:Response)=>{
    try {
        const market = await MarketRepo.getMarketMany();
        if(!market){
            return res.status(400).json(handleError("no market created",0))
        }

        return res.status(200).json({
            success: true,
            market : market
        })
    } catch (error) {
        console.log("get market error :   ",error);
        
        return res.status(500).json(handleError("Server Error",0))
    }
}