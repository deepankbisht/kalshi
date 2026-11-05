import { prisma } from "../client.ts";

export const UserRepo = {
    getUser: async (username: string) => {
        return await prisma.user.findFirst({
            where: {
                username,
            },
        });
    },
    userCreate: async (username:string,password:string) => {
        return await prisma.user.create({
            data: {
                username: username,
                password: password,
            },
        });
    },
};

export const tx_log = async(userId:bigint,amount:bigint,type:string)=>{
    return await prisma.txLog.create({
        data:{
            userId:userId,
            amount: amount,
            type:type
        }
    })
}
