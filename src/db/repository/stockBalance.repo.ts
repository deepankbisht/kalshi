import { prisma } from "../client"

export const checkUserStockBalance = async (userId:bigint,marketId:bigint,type:"YES"|"NO")=>{
    return await prisma.stockBalance.findUnique({
        where:{
            userId_marketId_type:{
                userId,
                marketId,
                type : type
            }
        }
    })
}

export const createUserStockBalance = async (userId:bigint,marketId:bigint,type:"YES"|"NO",qty:bigint)=>{
    return await prisma.stockBalance.create({
        data:{
            userId:userId,
            marketId:marketId,
            qty:qty,
            type:type
        }
    })
}

export const splitUserStockBalance = async (id:bigint,amount:bigint)=>{
    return await prisma.stockBalance.update({
        where:{
            id:id
        },
        data:{
            qty:{
                increment:amount
            }
        },
    })
}

export const mergeUserStockBalance = async (id:bigint,amount:bigint)=>{
    return await prisma.stockBalance.update({
        where:{
            id:id
        },
        data:{
            qty:{
                decrement:amount
            }
        },
    })
}

export const askUserStockBalance = async (userId:bigint,marketId:bigint,type:"YES"|"NO",amount:bigint)=>{
    return await prisma.stockBalance.update({
        where:{
            userId_marketId_type:{
                userId: userId,
                marketId : marketId,
                type : type
            }
        },
        data:{
            qty:{
                decrement:amount
            }
        },
    })
}