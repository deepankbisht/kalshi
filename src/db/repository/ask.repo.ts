import { id } from "zod/locales";
import { prisma } from "../client";
import { bigint } from "zod";

export const getAsk = async(orderbookId:bigint,type:"YES"|"NO",price:bigint)=>{
    return await prisma.ask.findMany({
        where:{
            orderbookId:orderbookId,
            stockType:type,
            price:{
                lte:price
            }
        },
        orderBy:{
            price: "asc"
        }
    })
}

export const createASK = async(orderbookId:bigint,price:bigint,qty:bigint,userId:bigint ,type:"YES"|"NO")=>{
    return await prisma.ask.create({
        data:{
            orderbookId:orderbookId,
            price:price,
            qty:qty,
            userId:userId,
            stockType:type
        }
    })
}

export const deleteAsk = async(id:bigint)=>{
    return await prisma.ask.delete({
        where:{
            id:id
        },
    })
}

export const deleteAskMany = async(id:bigint[])=>{
    return await prisma.ask.deleteMany({
        where:{
            orderbookId:{
                in:id
            }
        },
    })
}

export const updateAsk = async(id:bigint,qty:bigint)=>{
    return await prisma.ask.update({
        where:{
            id:id
        },
        data:{
            qty:qty
        }
    })
}

export const getAskMany = async(orderbookId:bigint[])=>{
    return await prisma.ask.findMany({
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