import type { Request, Response } from "express";
import { handleError } from "../utils";
import UserRepo from "../db/repository/user.repo";
import { success } from "zod";
import { userPortfolio } from "../db/repository/stockBalance.repo";
import { getFills } from "../db/repository/fill.repo";
import tx_log from "../db/repository/tx_repo";

export const getUserBalance = async(req:Request,res:Response)=>{
    try {
        if(!req.userId){
            return res.status(400).json(handleError("invalid userId",0))
        }
        const userId = BigInt(req.userId);
        const user = await UserRepo.getUserViaUserId(userId);
        if(!user){
            return res.status(400).json(handleError("invalid user",0))
        }
        return res.status(200).json({
            success:true,
            username : user.username,
            role : user.role ,
            balance : user.available_balance,
            locked_balance : user.reserved_balance,
        })
    } catch (error) {
        return res.status(500).json(handleError("Server Error",0))
    }
}


export const getUserPortfolio = async(req:Request,res:Response)=>{
    try {
        if(!req.userId){
            return res.status(400).json(handleError("invalid userId",0))
        }
        const userId = BigInt(req.userId);
        const user = await UserRepo.getUserViaUserId(userId);
        const userProfile = await userPortfolio(userId);
        if(!user){
            return res.status(400).json(handleError("invalid user",0))
        }
        return res.status(200).json({
            success:true,
            username : user.username,
            portfolio : userProfile
        })
    } catch (error) {
        return res.status(500).json(handleError("Server Error",0))
    }
}



export const getUserFills = async(req:Request,res:Response)=>{
    try {
        if(!req.userId){
            return res.status(400).json(handleError("invalid userId",0))
        }
        const userId = BigInt(req.userId);
        const user = await UserRepo.getUserViaUserId(userId);
        const userFills = await getFills(userId);
        if(!user){
            return res.status(400).json(handleError("invalid user",0))
        }
        return res.status(200).json({
            success:true,
            username : user.username,
            Fills : userFills
        })
    } catch (error) {
        return res.status(500).json(handleError("Server Error",0))
    }
}


export const getUserTransaction = async(req:Request,res:Response)=>{
    try {
        if(!req.userId){
            return res.status(400).json(handleError("invalid userId",0))
        }
        const userId = BigInt(req.userId);
        const user = await UserRepo.getUserViaUserId(userId);
        const userFills = await tx_log.get_tx(userId);
        if(!user){
            return res.status(400).json(handleError("invalid user",0))
        }
        return res.status(200).json({
            success:true,
            username : user.username,
            transaction_History : userFills
        })
    } catch (error) {
        return res.status(500).json(handleError("Server Error",0))
    }
}