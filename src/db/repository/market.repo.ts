import { bigint } from "zod";
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
};


export default MarketRepo;