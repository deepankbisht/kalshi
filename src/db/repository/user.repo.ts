import { prisma } from "../client.ts";

const UserRepo = {
    getUser: async (username: string) => {
        return await prisma.user.findUnique({
            where: {
                username,
            },
        });
    },
    getUserViaUserId: async (userId: bigint) => {
        return await prisma.user.findUnique({
            where: {
                id:userId,
            },
        });
    },
    increase: async (userId:bigint)=>{
        return await prisma.user.update({
            where: {
                id:userId
            },
            data:{
                available_balance:{
                    increment: 50
                }
            }
        })
    },
    userCreate: async (username:string,password:string) => {
        return await prisma.user.create({
            data: {
                username: username,
                password: password,
            },
        });
    },
    updatedBalance : async (userId:bigint,bet:bigint) => {
        return await prisma.user.update({
            where: {
                id: (userId),
            },
            data: {
                available_balance: {
                    increment: (bet*100n),
                },
            },
        })
    },
    updateMarket : async (userId:bigint,bet:bigint)=>{
        return await prisma.user.update({
            where: {
                id: (userId),
            },
            data: {
                available_balance: {
                    decrement: (bet),
                },
            },
        })
    },
    changeBalance: async(userId:bigint, amount:bigint)=>{

    },
}
export default UserRepo
