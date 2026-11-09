import type { Request, Response } from "express";
import { handleError } from "../utils";
import UserRepo from "../db/repository/user.repo";
import MarketRepo from "../db/repository/market.repo";
import { getOrder } from "../db/repository/orderBook.repo";
import {  deleteBidMany, getBidMany } from "../db/repository/bid.repo";
import {  deleteAskMany, getAskMany } from "../db/repository/ask.repo";
import { deleteStockBalance, resolveStockBalance, unlockStockBalance } from "../db/repository/stockBalance.repo";
import tx_log from "../db/repository/tx_repo.ts";
import { resolveSchema } from "../zod/auth.type.ts";

export const resolveMarket = async(req:Request,res:Response)=>{
    try {
        if(!req.userId){
            return res.status(400).json(handleError("token invalid",0))
        }
        const userId = BigInt(req.userId);
        const user = await UserRepo.getUserViaUserId(userId);
        if(!user){
            return res.status(400).json(handleError("user invalid",0))
        }
        if(user.role!=="ADMIN"){
            return res.status(400).json(handleError("Access Denied, Only Admin",0))
        }

        const id = req.params.id;
        if(!id || typeof id !=="string"){
            return res.status(400).json(handleError("market id invalid",0))
        }

        const marketId = BigInt(id);
        const check = resolveSchema.safeParse(req.body)

        if (!check.success) {
            return res.status(400).json({
                success: false,
                message: check.error.message,
            });
        }
        const finalResolve = check.data.resolve;

        const checkMarketId = await MarketRepo.getMarket(marketId);
        if(!checkMarketId){
            return res.status(400).json(handleError("market is not created",0))
        }

        if(checkMarketId.resolution!== null){
            return res.status(400).json(handleError("resolution is already executed",0))
        }

        if(!finalResolve || typeof finalResolve !=="string"){
            return res.status(400).json(handleError("invalid resolve",0))
        }

        const orderbookId = await getOrder(marketId);
        if(orderbookId.length===0){
            return res.status(400).json(handleError("invalid orderBook",0))
        }
        const orderbookIds = orderbookId.map((obj)=> obj.id )

        if( !orderbookIds || orderbookIds.length===0){
            return res.status(400).json(handleError("no orderBook ID",0))
        }

        const pendingBids = await getBidMany(orderbookIds);
        for(const bid of pendingBids){
            const lockAmount = bid.price * bid.qty;
            await UserRepo.unlockBalance(bid.userId,lockAmount);
        }

        const pendingAsks = await getAskMany(orderbookIds)
        for(const ask of pendingAsks){
            await unlockStockBalance(ask.userId,marketId,ask.stockType,ask.qty);
        }

        const bid = await deleteBidMany(orderbookIds);

        const ask = await deleteAskMany(orderbookIds);

        const resolve = await MarketRepo.resolve(marketId,finalResolve);

        const winner = await resolveStockBalance(marketId,finalResolve);
        for(const winnerUser of winner){
            const winningAmount = winnerUser.qty * 100n;
            await UserRepo.increaseBalance(winnerUser.userId,winningAmount)
            await tx_log.tx_history(winnerUser.userId,winningAmount,"Win");
        }

        const cleared = await deleteStockBalance(marketId);

        return res.status(200).json({
            success:true,
            market_title: resolve.title ,
            resolve : finalResolve  ,
            winnerCount: winner.length,
            positionCleared: cleared.count
        })

    } catch (error) {
        console.log("error from resolve :  ",error);
        return res.status(500).json(handleError("SERVER ERROR",0))
    }
}