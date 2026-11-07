import { prisma } from "../client";

export const getOrderBook = async(marketId:bigint,type:"YES"|"NO")=>{
    return await prisma.orderbook.findUnique({
        where:{
            marketId_type:{
                marketId:marketId,
                type:type
            }
        }
    })
}

export const createBidOrder = async(marketId:bigint,type:"YES"|"NO")=>{
    return await prisma.orderbook.create({
        data:{
            marketId:marketId,
            type:type
        }
    })
}