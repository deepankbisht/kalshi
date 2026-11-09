-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Resolution" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "StockType" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "available_balance" BIGINT NOT NULL DEFAULT 0,
    "reserved_balance" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "markets" (
    "id" BIGSERIAL NOT NULL,
    "creatorId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "totalIssued" BIGINT NOT NULL DEFAULT 0,
    "resolution" "Resolution",

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderbook" (
    "id" BIGSERIAL NOT NULL,
    "marketId" BIGINT NOT NULL,
    "type" "StockType" NOT NULL,

    CONSTRAINT "orderbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stockBalance" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "marketId" BIGINT NOT NULL,
    "type" "StockType" NOT NULL,
    "qty" BIGINT NOT NULL DEFAULT 0,
    "locked" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "stockBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" BIGSERIAL NOT NULL,
    "orderbookId" BIGINT NOT NULL,
    "price" BIGINT NOT NULL,
    "qty" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "stockType" "StockType" NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asks" (
    "id" BIGSERIAL NOT NULL,
    "orderbookId" BIGINT NOT NULL,
    "price" BIGINT NOT NULL,
    "qty" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "stockType" "StockType" NOT NULL,

    CONSTRAINT "asks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fills" (
    "id" BIGSERIAL NOT NULL,
    "orderbookId" BIGINT NOT NULL,
    "price" BIGINT NOT NULL,
    "qty" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "makerId" BIGINT NOT NULL,
    "takerId" BIGINT NOT NULL,

    CONSTRAINT "fills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tx_log" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "amount" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tx_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_id_idx" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "orderbook_marketId_type_key" ON "orderbook"("marketId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "stockBalance_userId_marketId_type_key" ON "stockBalance"("userId", "marketId", "type");

-- CreateIndex
CREATE INDEX "bids_orderbookId_price_idx" ON "bids"("orderbookId", "price" ASC);

-- CreateIndex
CREATE INDEX "asks_orderbookId_price_idx" ON "asks"("orderbookId", "price" ASC);

-- AddForeignKey
ALTER TABLE "markets" ADD CONSTRAINT "markets_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderbook" ADD CONSTRAINT "orderbook_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stockBalance" ADD CONSTRAINT "stockBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stockBalance" ADD CONSTRAINT "stockBalance_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_orderbookId_fkey" FOREIGN KEY ("orderbookId") REFERENCES "orderbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asks" ADD CONSTRAINT "asks_orderbookId_fkey" FOREIGN KEY ("orderbookId") REFERENCES "orderbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asks" ADD CONSTRAINT "asks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fills" ADD CONSTRAINT "fills_orderbookId_fkey" FOREIGN KEY ("orderbookId") REFERENCES "orderbook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fills" ADD CONSTRAINT "fills_takerId_fkey" FOREIGN KEY ("takerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fills" ADD CONSTRAINT "fills_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tx_log" ADD CONSTRAINT "tx_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
