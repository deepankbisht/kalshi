import { id } from "zod/locales";
import { prisma } from "../client";

export const getBid = async(orderbookId:bigint,type:"YES"|"NO",price:bigint)=>{
    return await prisma.bid.findMany({
        where:{
            orderbookId:orderbookId,
            stockType:type,
            price:{
                gte:price
            }
        },
        orderBy:{
            price:"desc"
        }
    })
}

export const createUserBid = async(orderbookId:bigint,price:bigint,qty:bigint,userId:bigint ,type:"YES"|"NO")=>{
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

export const deleteBid = async(id:bigint)=>{
    return await prisma.bid.delete({
        where:{
            id:id
        }
    })
}

export const deleteBidMany = async(id:bigint[])=>{
    return await prisma.bid.deleteMany({
        where:{
            orderbookId:{
                in:id
            }
        }
    })
}


export const updateBid = async(id:bigint,qty:bigint)=>{
    return await prisma.bid.update({
        where:{
            id:id
        },
        data:{
            qty:qty
        }
    })
}

export const getBidMany = async(orderbookId:bigint[])=>{
    return await prisma.bid.findMany({
        where:{
            orderbookId:{
                in:orderbookId,
            },
            qty:{
                gt:0n
            }
        },
    })
}