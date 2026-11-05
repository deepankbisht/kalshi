import { prisma } from "../client"

export const getUser = async(userId:bigint)=>{
    return await prisma.user.findUnique({
        where:{
            id:(userId)
        },
        select:{
            username: true,
            available_balance:true,
            reserved_balance:true
        }
    })
}