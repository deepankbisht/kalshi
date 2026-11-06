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
    }
}


export default tx_log