import { env } from "bun";
import express from "express";
import authRouter from "./routes/auth.route";
import marketRouter from "./routes/market.route";
import marketOrder from "./routes/order.route";
import marketResolve from "./routes/resolve.route";
import user from "./routes/user.route";

// Global BigInt JSON serialization fix
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const app = express();
app.use(express.json());

app.use("/api/v1/", authRouter);
app.use("/api/v1/", marketRouter);
app.use("/api/v1/", marketOrder);
app.use("/api/v1/", marketResolve);
app.use("/api/v1/", user);

if (process.env.NODE_ENV !== "test") {
    app.listen(env.PORT, () => {
        console.log(`Listening to the port : ${env.PORT}`);
    });
}
