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

export const createBidOrderBook = async(marketId:bigint,type:"YES"|"NO")=>{
    return await prisma.orderbook.upsert({
        where:{
            marketId_type:{
                marketId:marketId,
                type:type
            }
        },
        update:{},
        create:{
            marketId:marketId,
            type:type
        }
    })
}

export const getOrder = async(marketId:bigint,)=>{
    return await prisma.orderbook.findMany({
        where:{
            marketId
        },
        select:{
            id:true
        }
    })
}