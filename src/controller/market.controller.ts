import type { Request, Response } from "express";
import { prisma } from "../db/client";
import { handleError } from "../utils";
import { success } from "zod";

export const increaseBalance = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json(handleError("Invalid userId",0))
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
            return res.status(500).json(handleError("Server error",0));
        } else {
            return res
                .status(500)
                .json(handleError("internal server error", 0));
        }
    }
};
