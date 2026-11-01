import { env } from "bun";
import express from "express";
import authRouter from "./routes/auth.route";
import marketRouter from "./routes/market.route";


const app = express();
app.use(express.json());


app.use("/api/v1/",authRouter)
app.use("/api/v1/",marketRouter)


app.listen(env.PORT,()=>{
    console.log(`Listening to the port : ${env.PORT}`);
})