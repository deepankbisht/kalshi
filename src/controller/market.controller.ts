import type { Request, Response } from "express";
import { prisma } from "../db/client";
import { handleError } from "../utils";

export const increaseBalance = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new Error("userId is not defined properly");
        }
        const user = await prisma.user.update({
            where: {
                id: BigInt(userId),
            },
            data: {
                available_balance: {
                    increment: 50,
                },
            },
            select: {
                username: true,
                available_balance: true,
            },
        });
        res.status(200).json({
            success: true,
            message: "balance updated",
            user: {
                ...user,
                available_balance: user.available_balance.toString(),
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(401).send(handleError(error.message, 0));
        } else {
            return res
                .status(500)
                .send(handleError("internal server error", 0));
        }
    }
};
