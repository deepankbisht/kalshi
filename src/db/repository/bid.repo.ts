import { id } from "zod/locales";
import { prisma } from "../client";

export const getBid = async(orderbookId:bigint,type:"YES"|"NO",price:bigint)=>{
    return await prisma.bid.findMany({
        where:{
            orderbookId:orderbookId,
            stockType:type,
            price:price,
        }
    })
}

export const createBid = async(orderbookId:bigint,price:bigint,qty:bigint,userId:bigint ,type:"YES"|"NO")=>{
    return await prisma.bid.create({
        data:{
            orderbookId:orderbookId,
            price:price,
            qty:qty,
            userId:userId,
            stockType:type
        }
    })
}