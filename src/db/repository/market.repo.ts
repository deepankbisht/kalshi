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
    splitMarket: async (marketId:bigint) => {
        return await prisma.market.update({
            where: {
                id:marketId
            },
            data:{
                
            },
            select:{

            }
        })
    },
    getMarket : async(marketId:bigint)=>{
        return await prisma.market.findUnique({
            where:{
                id: marketId
            },
            select:{
                title: true,
                totalIssued: true
            }
        })
    }
};

export default MarketRepo;