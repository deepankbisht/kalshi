import { prisma } from "../client"

const tx_log = {
    tx_history: async(userId:bigint,amount:bigint,type:string)=>{
        return await prisma.txLog.create({
            data:{
                userId: userId,
                amount: amount,
                type  : type
            }
        })
    },
    get_tx:async (userId:bigint)=>{
        return await prisma.txLog.findMany({
            where:{
                userId
            },
            select:{
                amount:true,
                type: true,
            },
            orderBy:{
                createdAt:"desc"
            }
        })
    }
}


export default tx_log