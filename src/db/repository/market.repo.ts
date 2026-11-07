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
};

export default MarketRepo;