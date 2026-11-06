import { id } from "zod/locales";
import { prisma } from "../client";

const MarketRepo = {
    createMarket: async (userId:bigint,title:string) => {
        return await prisma.market.create({
            data:{
                creatorId: userId,
                title : title
            }
        })
    },
    splitMarket: async (marketId:bigint,stock:bigint) => {
        return await prisma.market.update({
            where: {
                id:marketId
            },
            data:{
                totalIssued:{
                    increment:stock
                }
            }
        })
    },
    getMarket : async(marketId:bigint)=>{
        return await prisma.market.findUnique({
            where:{
                id: marketId
            },
        })
    },
    mergeMarket: async (marketId:bigint,stock:bigint) => {
        return await prisma.market.update({
            where: {
                id:marketId
            },
            data:{
                totalIssued:{
                    decrement:stock
                }
            }
        })
    },
    updateMarket : async (userId:bigint,bet:bigint)=>{
        return await prisma.user.update({
            where: {
                id: (userId),
            },
            data: {
                available_balance: {
                    decrement: (bet),
                },
            },
            select: {
                username: true,
                available_balance: true,
            },
        })
    }

};

export default MarketRepo;