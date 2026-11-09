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
    getMarketMany: async () => {
        return await prisma.market.findMany({
            where:{
                resolution:null
            },
            select:{
                id:true,
                title:true,
            },
            orderBy:{
                id:"desc"
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
    resolve:async(marketId:bigint,finalResolve:"YES"|"NO")=>{
        return await prisma.market.update({
            where:{
                id:marketId
            },
            data:{
                resolution:finalResolve
            }
        })
    }
};

export default MarketRepo;