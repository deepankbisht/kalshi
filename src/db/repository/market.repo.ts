import { prisma } from "../client";

export const MarketRepo = {
    createMarket: async (userId:bigint,title:string) => {
        return await prisma.market.create({
            data:{
                creatorId: userId,
                title : title
            }
        })
    },
};

export const getMarket = async(marketId:bigint)=>{
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