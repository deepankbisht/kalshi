import user from "../../routes/user.route"
import { prisma } from "../client"

export const checkUserStockBalance = async (userId:bigint,marketId:bigint,type:"YES"|"NO")=>{
    return await prisma.stockBalance.findUnique({
        where:{
            userId_marketId_type:{
                userId,
                marketId,
                type : type
            }
        }
    })
}

export const createUserStockBalance = async (userId:bigint,marketId:bigint,type:"YES"|"NO",qty:bigint)=>{
    return await prisma.stockBalance.create({
        data:{
            userId:userId,
            marketId:marketId,
            qty:qty,
            type:type
        }
    })
}

export const splitUserStockBalance = async (id:bigint,amount:bigint)=>{
    return await prisma.stockBalance.update({
        where:{
            id:id
        },
        data:{
            qty:{
                increment:amount
            }
        },
    })
}

export const mergeUserStockBalance = async (id:bigint,amount:bigint)=>{
    return await prisma.stockBalance.update({
        where:{
            id:id
        },
        data:{
            qty:{
                decrement:amount
            }
        },
    })
}

export const askUserStockBalance = async (userId:bigint,marketId:bigint,type:"YES"|"NO",amount:bigint)=>{
    return await prisma.stockBalance.update({
        where:{
            userId_marketId_type:{
                userId: userId,
                marketId : marketId,
                type : type
            }
        },
        data:{
            locked:{
                decrement:amount
            }
        },
    })
}

export const sellUserStockBalance = async (userId:bigint,marketId:bigint,type:"YES"|"NO",amount:bigint)=>{
    return await prisma.stockBalance.update({
        where:{
            userId_marketId_type:{
                userId: userId,
                marketId : marketId,
                type : type
            }
        },
        data:{
            qty:{
                decrement:amount
            }
        },
    })
}

export const bidUserStockBalance = async (userId:bigint,marketId:bigint,type:"YES"|"NO",amount:bigint)=>{
    return await prisma.stockBalance.upsert({
        where:{
            userId_marketId_type:{
                userId: userId,
                marketId : marketId,
                type : type
            }
        },
        update:{
            qty:{
                increment:amount
            }
        },
        create:{
            userId,
            marketId,
            type,
            qty:amount
        }
    })
}

export const lockStockBalance = async (userId:bigint,marketId:bigint,type:"YES"|"NO",amount:bigint)=>{
    return await prisma.stockBalance.update({
        where:{
            userId_marketId_type:{
                userId: userId,
                marketId : marketId,
                type : type
            }
        },
        data:{
            qty:{
                decrement:amount
            },
            locked:{
                increment:amount
            } 
        },
    })
}

export const unlockStockBalance = async (userId:bigint,marketId:bigint,type:"YES"|"NO",amount:bigint)=>{
    return await prisma.stockBalance.update({
        where:{
            userId_marketId_type:{
                userId: userId,
                marketId : marketId,
                type : type
            }
        },
        data:{
            qty:{
                increment:amount
            },
            locked:{
                decrement:amount
            } 
        },
    })
}

export const resolveStockBalance = async (marketId:bigint,type:"YES"|"NO")=>{
    return await prisma.stockBalance.findMany({
        where:{
            marketId:marketId,
            type:type
        },
    })
}

export const deleteStockBalance = async (marketId :bigint)=>{
    return await prisma.stockBalance.deleteMany({
        where :{
            marketId:marketId
        }
    })
}

export const userPortfolio = async (userId:bigint)=>{
    return await prisma.stockBalance.findMany({
        where:{
            userId
        },
        select:{
            userId:true,
            marketId: true,
            type : true,
            qty : true,
            locked: true
        }
    })
}