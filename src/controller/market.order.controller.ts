import type { Request, Response } from "express";
import { handleError } from "../utils";
import { createBidOrder, getOrderBook } from "../db/repository/orderBook.repo";
import { askUserStockBalance, checkUserStockBalance } from "../db/repository/stockBalance.repo";
import { deleteAsk, getAsk, updateAsk } from "../db/repository/ask.repo";
import UserRepo from "../db/repository/user.repo";
import MarketRepo from "../db/repository/market.repo";

export const createBid = async(req:Request,res:Response)=>{
    try {
        if(!req.userId){
            return res.status(400).json(handleError("userId not define",0))
        }
        const userId = BigInt(req.userId);
        const temp = req.params.marketId;
        if(!req.params || typeof temp!=="string"){
            return res.status(400).json(handleError("body is not define",0))
        }
        const id = temp;
        const marketId = BigInt(id);
    
        const {side} = req.body;
        const oppSide = (side==="YES")? "NO":"YES";
        const resp = req.body;
        const price = BigInt(resp.price);
        const oppPrice = 100n - price;
        const qty = BigInt(resp.qty);
        const checkStockBalance = await checkUserStockBalance(userId,marketId,side);

        if(!checkStockBalance || checkStockBalance.qty < qty){
            return res.status(400).json(handleError("you don't have enough stock balance",0));
        }

        if(price<=0 || price>=100){
            return res.status(400).json(handleError("you can't fix price more than 100 or less than 0",0))
        }

        const checkOrderBook = await getOrderBook(marketId,side);
        let bidOrder = checkOrderBook ;

        if(!checkOrderBook){
            bidOrder = await createBidOrder(marketId,side);
        }
        
        //order matching 
        const checkOppositeOrder = await getOrderBook(marketId,oppSide);
        let askOrder ;
        if(checkOppositeOrder){
            askOrder = await getAsk(checkOppositeOrder.id,checkOppositeOrder.type,oppPrice)
            let remaining = qty;
            if(askOrder && askOrder.length > 0){
                for(const order of askOrder){
                    let maker ;
                    if(remaining>=order.qty){
                        remaining = remaining - order.qty;
                        maker = await deleteAsk(order.id)
                    }else{
                        order.qty = order.qty - remaining;
                        maker = await updateAsk(order.id,order.qty);
                    }
                    await UserRepo.changeBalance(maker.userId,maker.price * maker.qty)
                    await MarketRepo
                    await askUserStockBalance(maker.userId,marketId,oppSide,maker.qty)
                }
            }
        }else{

        }
    } catch (error) {
        console.log(error);
        return res.status(400).json(handleError("SERVER ERROR",0))
    }

}