import { prisma } from "../client.ts";

const UserRepo = {
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

export default UserRepo;
