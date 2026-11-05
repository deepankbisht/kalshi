import type { Request, Response } from "express";
import { prisma } from "../db/client";
import { handleError } from "../utils";
import { MarketRepo, getMarket } from "../db/repository/market.repo";
import { getUser } from "../db/repository/user.getRepo";
import { bigint, int, number, string, success } from "zod";

export const increaseBalance = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json(handleError("Invalid userId", 0));
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
            return res.status(500).json(handleError("Server error", 0));
        } else {
            return res
                .status(500)
                .json(handleError("internal server error", 0));
        }
    }
};

export const market = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(400).json(handleError("userId invalid", 0));
        }
        const userId = BigInt(req.userId);
        const { title } = req.body;
        const marketCreate = await MarketRepo.createMarket(userId, title);

        if (!marketCreate) {
            return res.status(400).json(handleError("market not created", 0));
        }

        return res.status(200).json({
            success: true,
            marketId: String(marketCreate.id),
            title: marketCreate.title,
        });
    } catch (error) {
        return res.status(500).json(handleError("server error", 0));
    }
};

export const splitBid = async (req: Request, res: Response) => {
    try {
        const { marketId } = req.params;
        if (!marketId || typeof marketId !== "string") {
            return res.status(400).json(handleError("marketId invalid", 0));
        }
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json(handleError("userId invalid", 0));
        }

        const existUser = await getUser(BigInt(userId));
        const existMarket = await getMarket(BigInt(marketId));

        if (!existUser) {
            return res.status(400).json(handleError("invalid user", 0));
        }

        const bet = String(req.body.bet);

        if (!bet) {
            return res.status(400).json(handleError("bet invalid", 0));
        }

        if (existUser?.available_balance < BigInt(bet)) {
            return res.status(400).json({
                success:"low balance",
                username:existUser.username,
                balance: String(existUser.available_balance),
                title: existMarket?.title
            });
        }

        const updatedMarket = await prisma.user.update({
            where: {
                id: BigInt(userId),
            },
            data: {
                available_balance: {
                    decrement: BigInt(bet),
                },
            },
            select: {
                username: true,
                available_balance: true,
            },
        });

        return res.status(200).json({
            username: updatedMarket.username,
            balance: String(updatedMarket.available_balance),
            title: existMarket?.title,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json(handleError("server error", 0));
    }
};
