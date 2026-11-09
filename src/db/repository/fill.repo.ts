import { prisma } from "../client";

export const createFill = async (orderbookId:bigint,price:bigint,qty:bigint,type:string,makerId:bigint,takerId:bigint)=>{
    return await prisma.fill.create({
        data:{
            orderbookId,
            price,
            qty,
            type, 
            makerId,
            takerId
        }
    })
}

export const getFills = async (takerId:bigint)=>{
    return await prisma.fill.findMany({
        where:{
            takerId
        },
        select:{
            qty:true,
            price:true,
            type:true,

        }
    })
}