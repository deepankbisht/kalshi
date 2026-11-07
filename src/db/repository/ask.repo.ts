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
        }
    })
}

export const createAsk = async(orderbookId:bigint,price:bigint,qty:bigint,userId:bigint ,type:"YES"|"NO")=>{
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

export const updateAsk = async(id:bigint,qty:bigint)=>{
    return await prisma.ask.update({
        where:{
            id:id
        },
        data:{
            qty:{
                decrement:qty
            }
        }
    })
}