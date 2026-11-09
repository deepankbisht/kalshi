import type { Request, Response } from "express";
import { handleError } from "../utils";
import {
    createBidOrderBook,
    getOrderBook,
} from "../db/repository/orderBook.repo";
import {
    askUserStockBalance,
    bidUserStockBalance,
    checkUserStockBalance,
    createUserStockBalance,
    lockStockBalance,
    sellUserStockBalance,
} from "../db/repository/stockBalance.repo";
import {
    deleteAsk,
    getAsk,
    updateAsk,
    createASK,
} from "../db/repository/ask.repo";
import UserRepo from "../db/repository/user.repo";
import MarketRepo from "../db/repository/market.repo";
import {
    createUserBid,
    deleteBid,
    getBid,
    updateBid,
} from "../db/repository/bid.repo";
import tx_log from "../db/repository/tx_repo";
import { createFill } from "../db/repository/fill.repo";

export const createBid = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(400).json(handleError("userId not define", 0));
        }
        const userId = BigInt(req.userId);
        const temp = req.params.id;
        if (!req.params || typeof temp !== "string") {
            return res.status(400).json(handleError("body is not define", 0));
        }
        const id = temp;
        const marketId = BigInt(id);

        const checkMarketId = await MarketRepo.getMarket(marketId);
        if (!checkMarketId) {
            return res
                .status(400)
                .json(handleError("market is not created", 0));
        }

        if (checkMarketId.resolution !== null) {
            return res
                .status(400)
                .json(handleError("resolution is already executed", 0));
        }

        const { side } = req.body;
        const oppSide = side === "YES" ? "NO" : "YES";
        const resp = req.body;
        const price = BigInt(resp.price);
        const oppPrice = 100n - price;
        let qty = BigInt(resp.qty);
        const orgQty = qty;

        if (price <= 0 || price >= 100) {
            return res
                .status(400)
                .json(
                    handleError(
                        "you can't fix price more than 100 or less than 0",
                        0
                    )
                );
        }

        const user = await UserRepo.getUserViaUserId(userId);
        if (!user) {
            return res.status(400).json(handleError("invalid user", 0));
        }

        //check balance
        if (user.available_balance < price * qty) {
            return res.status(400).json(handleError("low balance", 0));
        }

        const checkOrderBook = await getOrderBook(marketId, side);

        //order matching
        if (checkOrderBook) {
            const askOrder = await getAsk(checkOrderBook.id, side, price);
            if (askOrder && askOrder.length > 0) {
                for (const order of askOrder) {
                    if (qty <= 0n) break;

                    const fillQty = qty < order.qty ? qty : order.qty;

                    if (fillQty === order.qty) {
                        await deleteAsk(order.id);
                    } else {
                        await updateAsk(order.id, order.qty - fillQty);
                    }
                    qty -= fillQty;

                    //taker
                    await UserRepo.decreaseBalance(
                        userId,
                        order.price * fillQty
                    );
                    await bidUserStockBalance(userId, marketId, side, fillQty);
                    await tx_log.tx_history(
                        userId,
                        order.price * fillQty,
                        "buying"
                    );

                    //maker
                    await UserRepo.increaseBalance(
                        order.userId,
                        order.price * fillQty
                    );
                    await askUserStockBalance(
                        order.userId,
                        marketId,
                        side,
                        fillQty
                    );
                    await tx_log.tx_history(
                        order.userId,
                        order.price * fillQty,
                        "selling"
                    );

                    //fill
                    await createFill(
                        order.orderbookId,
                        order.price,
                        fillQty,
                        "BUY",
                        order.userId,
                        userId
                    );
                }
            }
        }

        const oppOrderBook = await getOrderBook(marketId, oppSide);
        if (oppOrderBook) {
            const bidOrder = await getBid(oppOrderBook.id, oppSide, oppPrice);
            if (bidOrder && bidOrder.length > 0) {
                for (const order of bidOrder) {
                    if (qty <= 0n) break;

                    const fillQty = qty < order.qty ? qty : order.qty;

                    if (fillQty === order.qty) {
                        await deleteBid(order.id);
                    } else {
                        await updateBid(order.id, order.qty - fillQty);
                    }
                    qty -= fillQty;

                    //taker
                    await UserRepo.decreaseBalance(
                        userId,
                        (100n - order.price) * fillQty
                    );
                    await bidUserStockBalance(userId, marketId, side, fillQty);
                    await tx_log.tx_history(
                        userId,
                        (100n - order.price) * fillQty,
                        "buying"
                    );

                    //maker
                    await UserRepo.decreaseReservedBalance(
                        order.userId,
                        order.price * fillQty
                    );
                    await bidUserStockBalance(
                        order.userId,
                        marketId,
                        oppSide,
                        fillQty
                    );
                    await tx_log.tx_history(
                        order.userId,
                        order.price * fillQty,
                        "buying"
                    );

                    //split market
                    await MarketRepo.splitMarket(marketId, fillQty);

                    //fill
                    await createFill(
                        order.orderbookId,
                        order.price,
                        fillQty,
                        "BUY",
                        order.userId,
                        userId
                    );
                }
            }
        }

        let order = null;
        let orderBook;
        if (!checkOrderBook) {
            orderBook = await createBidOrderBook(marketId, side);
        } else {
            orderBook = checkOrderBook;
        }

        if (qty > 0) {
            await createUserBid(orderBook.id, price, qty, userId, side);
            order = await UserRepo.lockBalance(userId, price * qty);
        }

        const stockBalance = await checkUserStockBalance(
            userId,
            marketId,
            side
        );
        const userFinalBalance = await UserRepo.getUserViaUserId(userId);

        if (order && qty > 0) {
            return res.status(200).json({
                success: true,
                message: "bid order is placed",
                username: user.username,
                available_balance: String(order.available_balance),
                reserved_balance: String(order.reserved_balance),
                stockBalance: String(stockBalance?.qty),
            });
        } else {
            return res.status(200).json({
                success: true,
                message: "order executed",
                username: user.username,
                available_balance: String(userFinalBalance!.available_balance),
                reserved_balance: String(userFinalBalance!.reserved_balance),
                stockBalance: String(stockBalance?.qty),
            });
        }
    } catch (error) {
        console.log("create bid :  ", error);
        return res.status(400).json(handleError("SERVER ERROR", 0));
    }
};

export const createAsk = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(400).json(handleError("userId not define", 0));
        }
        const userId = BigInt(req.userId);

        const temp = req.params.id;
        if (!req.params || typeof temp !== "string") {
            return res.status(400).json(handleError("body is not define", 0));
        }
        const id = temp;
        const marketId = BigInt(id);

        const checkMarketId = await MarketRepo.getMarket(marketId);
        if(!checkMarketId){
            return res.status(400).json(handleError("market is not created",0))
        }

        if (checkMarketId.resolution !== null) {
            return res
                .status(400)
                .json(handleError("resolution is already executed", 0));
        }

        const { side } = req.body;
        const oppSide = side === "YES" ? "NO" : "YES";
        const resp = req.body;
        const price = BigInt(resp.price);
        const oppPrice = 100n - price;
        let qty = BigInt(resp.qty);
        const orgQty = qty;

        if (price <= 0 || price >= 100) {
            return res
                .status(400)
                .json(
                    handleError(
                        "you can't fix price more than 100 or less than 0",
                        0
                    )
                );
        }

        const userStockBalance = await checkUserStockBalance(
            userId,
            marketId,
            side
        );
        if (!userStockBalance) {
            return res
                .status(400)
                .json(handleError("invalid stock balance", 0));
        }

        //check balance
        if (userStockBalance.qty < qty) {
            return res.status(400).json(handleError("low balance stock", 0));
        }

        const checkOrderBook = await getOrderBook(marketId, side);

        //order matching
        if (checkOrderBook) {
            const bidOrder = await getBid(checkOrderBook.id, side, price);
            if (bidOrder && bidOrder.length > 0) {
                for (const order of bidOrder) {
                    if (qty <= 0n) break;

                    const fillQty = qty < order.qty ? qty : order.qty;

                    if (fillQty === order.qty) {
                        await deleteBid(order.id);
                    } else {
                        await updateBid(order.id, order.qty - fillQty);
                    }
                    qty -= fillQty;

                    //taker
                    await UserRepo.increaseBalance(
                        userId,
                        order.price * fillQty
                    );
                    await sellUserStockBalance(userId, marketId, side, fillQty);
                    await tx_log.tx_history(
                        userId,
                        order.price * fillQty,
                        "selling"
                    );

                    //maker
                    await UserRepo.decreaseReservedBalance(
                        order.userId,
                        order.price * fillQty
                    );
                    await bidUserStockBalance(
                        order.userId,
                        marketId,
                        side,
                        fillQty
                    );
                    await tx_log.tx_history(
                        order.userId,
                        order.price * fillQty,
                        "buying"
                    );

                    //fill
                    await createFill(
                        order.orderbookId,
                        order.price,
                        fillQty,
                        "SELL",
                        order.userId,
                        userId,
                    );
                }
            }
        }

        const oppOrderBook = await getOrderBook(marketId, oppSide);
        if (oppOrderBook) {
            const askOrder = await getAsk(oppOrderBook.id, oppSide, oppPrice);
            if (askOrder && askOrder.length > 0) {
                for (const order of askOrder) {
                    if (qty <= 0n) break;

                    const fillQty = qty < order.qty ? qty : order.qty;

                    if (fillQty === order.qty) {
                        await deleteAsk(order.id);
                    } else {
                        await updateAsk(order.id, order.qty - fillQty);
                    }
                    qty -= fillQty;

                    //taker
                    await UserRepo.increaseBalance(
                        userId,
                        (100n - order.price) * fillQty
                    );
                    await sellUserStockBalance(userId, marketId, side, fillQty);
                    await tx_log.tx_history(
                        userId,
                        (100n - order.price) * fillQty,
                        "selling"
                    );

                    //maker
                    await UserRepo.increaseBalance(
                        order.userId,
                        order.price * fillQty
                    );
                    await askUserStockBalance(
                        order.userId,
                        marketId,
                        oppSide,
                        fillQty
                    );
                    await tx_log.tx_history(
                        order.userId,
                        order.price * fillQty,
                        "selling"
                    );

                    //merge market
                    await MarketRepo.mergeMarket(marketId, fillQty);

                    //fill
                    await createFill(
                        order.orderbookId,
                        100n - order.price,
                        fillQty,
                        "SELL",
                        order.userId,
                        userId
                    );
                }
            }
        }

        let order = null;
        let orderBook;
        if (!checkOrderBook) {
            orderBook = await createBidOrderBook(marketId, side);
        } else {
            orderBook = checkOrderBook;
        }

        if (qty > 0) {
            await createASK(orderBook.id, price, qty, userId, side);
            order = await lockStockBalance(userId, marketId, side, qty);
        }

        const stockBalance = await checkUserStockBalance(
            userId,
            marketId,
            side
        );

        const user = await UserRepo.getUserViaUserId(userId);
        if (!user || !stockBalance) {
            return res.status(400).json(handleError("user invalid", 0));
        }

        if (order && qty > 0) {
            return res.status(200).json({
                success: true,
                message: "Ask order is placed",
                username: user.username,
                available_balance: String(user.available_balance),
                reserved_balance: String(user.reserved_balance),
                stockBalance: String(stockBalance.qty),
                lockStockBalance: String(stockBalance.locked),
            });
        } else {
            return res.status(200).json({
                success: true,
                message: "order executed",
                username: user.username,
                available_balance: String(user.available_balance),
                reserved_balance: String(user.reserved_balance),
                stockBalance: String(stockBalance.qty),
                lockStockBalance: String(stockBalance.locked),
            });
        }
    } catch (error) {
        console.log("create Ask :  ", error);
        return res.status(400).json(handleError("SERVER ERROR", 0));
    }
};
