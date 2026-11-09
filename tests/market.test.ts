import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { app } from "../src/index";
import { prisma } from "../src/db/client";
import UserRepo from "../src/db/repository/user.repo";
import type { Server } from "http";

describe("Kalshi Prediction Market Full Suite (Commands + Queries)", () => {
    let server: Server;
    let baseUrl: string;

    // Test users
    let aliceToken: string;
    let aliceId: bigint;
    let bobToken: string;
    let bobId: bigint;
    let adminToken: string;
    let adminId: bigint;

    // Test market
    let marketId: string;
    const marketTitle = `Will Bun overtake Node in 2026?_${Date.now()}`;

    const timestamp = Date.now();
    const aliceUsername = `alice_${timestamp}`;
    const bobUsername = `bob_${timestamp}`;
    const adminUsername = `admin_${timestamp}`;

    // Helper for making HTTP requests to the test server
    async function api(path: string, options: { method?: string; token?: string; body?: any } = {}): Promise<{ status: number; body: any }> {
        const { method = "GET", token, body } = options;
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["token"] = `Bearer ${token}`;
        }

        const res = await fetch(`${baseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const json: any = await res.json().catch(() => ({}));
        return { status: res.status, body: json };
    }

    beforeAll(async () => {
        // Start ephemeral server on random available port
        server = app.listen(0);
        const address = server.address();
        if (address && typeof address === "object") {
            baseUrl = `http://localhost:${address.port}`;
        } else {
            throw new Error("Failed to start test HTTP server");
        }

        // 1. Create Alice
        await api("/api/v1/signup", {
            method: "POST",
            body: { username: aliceUsername, password: "password123" },
        });
        const aliceLogin = await api("/api/v1/signin", {
            method: "POST",
            body: { username: aliceUsername, password: "password123" },
        });
        aliceToken = aliceLogin.body.token;
        const aliceUser = await UserRepo.getUser(aliceUsername);
        aliceId = aliceUser!.id;

        // 2. Create Bob
        await api("/api/v1/signup", {
            method: "POST",
            body: { username: bobUsername, password: "password123" },
        });
        const bobLogin = await api("/api/v1/signin", {
            method: "POST",
            body: { username: bobUsername, password: "password123" },
        });
        bobToken = bobLogin.body.token;
        const bobUser = await UserRepo.getUser(bobUsername);
        bobId = bobUser!.id;

        // 3. Create Admin
        await api("/api/v1/signup", {
            method: "POST",
            body: { username: adminUsername, password: "password123" },
        });
        const adminLogin = await api("/api/v1/signin", {
            method: "POST",
            body: { username: adminUsername, password: "password123" },
        });
        adminToken = adminLogin.body.token;
        const adminUser = await UserRepo.getUser(adminUsername);
        adminId = adminUser!.id;

        // Elevate Admin user role in DB
        await prisma.user.update({
            where: { id: adminId },
            data: { role: "ADMIN" },
        });

        // Seed wallet balances for trading: 10,000 cents ($100.00) each
        await UserRepo.increaseBalance(aliceId, 10000n);
        await UserRepo.increaseBalance(bobId, 10000n);
    }, 30000);

    afterAll(async () => {
        if (server) {
            server.close();
        }
        // Cleanup test data created during this suite
        try {
            if (marketId) {
                const mId = BigInt(marketId);
                await prisma.txLog.deleteMany({
                    where: { userId: { in: [aliceId, bobId, adminId] } },
                });
                await prisma.fill.deleteMany({
                    where: { makerId: { in: [aliceId, bobId] } },
                });
                await prisma.ask.deleteMany({
                    where: { userId: { in: [aliceId, bobId] } },
                });
                await prisma.bid.deleteMany({
                    where: { userId: { in: [aliceId, bobId] } },
                });
                await prisma.stockBalance.deleteMany({
                    where: { marketId: mId },
                });
                await prisma.orderbook.deleteMany({
                    where: { marketId: mId },
                });
                await prisma.market.deleteMany({
                    where: { id: mId },
                });
            }
            await prisma.user.deleteMany({
                where: { id: { in: [aliceId, bobId, adminId] } },
            });
        } catch (e) {
            // Silently ignore cleanup errors
        }
    }, 30000);

    // ==========================================
    // 1. AUTHENTICATION & ONRAMP
    // ==========================================
    describe("1. Authentication & Wallet Onramp", () => {
        test("Alice onramps funds (+50 cents) via /onramp and logs transaction", async () => {
            const initialUser = await UserRepo.getUserViaUserId(aliceId);
            const initialBalance = initialUser!.available_balance;

            const res = await api("/api/v1/onramp", {
                method: "POST",
                token: aliceToken,
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const updatedUser = await UserRepo.getUserViaUserId(aliceId);
            expect(updatedUser!.available_balance).toBe(initialBalance + 50n);

            // Verify tx_log entry
            const tx = await prisma.txLog.findFirst({
                where: { userId: aliceId, type: "increase balance" },
                orderBy: { id: "desc" },
            });
            expect(tx).not.toBeNull();
            expect(tx!.amount).toBe(50n);
        });
    });

    // ==========================================
    // 2. MARKET CREATION & READ (GET /market)
    // ==========================================
    describe("2. Market Lifecycle Creation & Fetching", () => {
        test("Admin creates a prediction market", async () => {
            const res = await api("/api/v1/market", {
                method: "POST",
                token: adminToken,
                body: { title: marketTitle },
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.marketId).toBeDefined();

            marketId = res.body.marketId;

            // Verify initial state in DB
            const market = await prisma.market.findUnique({
                where: { id: BigInt(marketId) },
            });
            expect(market).not.toBeNull();
            expect(market!.totalIssued).toBe(0n);
            expect(market!.resolution).toBeNull();
        });

        test("GET /market returns the list of active unresolved markets", async () => {
            const res = await api("/api/v1/market", {
                method: "GET",
                token: aliceToken,
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.market)).toBe(true);

            const found = res.body.market.find((m: any) => String(m.id) === String(marketId));
            expect(found).toBeDefined();
            expect(found.title).toBe(marketTitle);
        });
    });

    // ==========================================
    // 3. SPLIT (MINTING SHARES)
    // ==========================================
    describe("3. Split Functionality (Minting Pairs)", () => {
        test("Rejects split with invalid bet multiple (not multiple of 100)", async () => {
            const res = await api(`/api/v1/split/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { bet: 250 },
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("multiple of 100");
        });

        test("Alice splits 2000 cents ($20.00) to mint 20 YES and 20 NO pairs", async () => {
            const userBefore = await UserRepo.getUserViaUserId(aliceId);
            const balanceBefore = userBefore!.available_balance;

            const res = await api(`/api/v1/split/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { bet: 2000 },
            });

            expect(res.status).toBe(200);
            expect(res.body.total_YES).toBe("20");
            expect(res.body.total_NO).toBe("20");

            // Verify cash deducted
            const userAfter = await UserRepo.getUserViaUserId(aliceId);
            expect(userAfter!.available_balance).toBe(balanceBefore - 2000n);

            // Verify market totalIssued incremented by 20
            const market = await prisma.market.findUnique({
                where: { id: BigInt(marketId) },
            });
            expect(market!.totalIssued).toBe(20n);

            // Verify stock balances in DB
            const yesBalance = await prisma.stockBalance.findUnique({
                where: {
                    userId_marketId_type: {
                        userId: aliceId,
                        marketId: BigInt(marketId),
                        type: "YES",
                    },
                },
            });
            const noBalance = await prisma.stockBalance.findUnique({
                where: {
                    userId_marketId_type: {
                        userId: aliceId,
                        marketId: BigInt(marketId),
                        type: "NO",
                    },
                },
            });
            expect(yesBalance!.qty).toBe(20n);
            expect(noBalance!.qty).toBe(20n);

            // Verify tx_log entry for split
            const tx = await prisma.txLog.findFirst({
                where: { userId: aliceId, type: "split" },
                orderBy: { id: "desc" },
            });
            expect(tx).not.toBeNull();
            expect(tx!.amount).toBe(2000n);
        }, 20000);

        test("Rejects split when available balance is insufficient", async () => {
            const res = await api(`/api/v1/split/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { bet: 999999900 },
            });

            expect(res.status).toBe(400);
        });
    });

    // ==========================================
    // 4. ORDER MATCHING (ASK & BID)
    // ==========================================
    describe("4. Direct Order Placement & Matching (Ask & Bid)", () => {
        test("Alice places resting Ask: sells 10 YES shares at 60 cents", async () => {
            const res = await api(`/api/v1/create/ask/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { side: "YES", price: 60, qty: 10 },
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Ask order is placed");
            expect(res.body.stockBalance).toBe("10"); // 20 - 10 = 10 available
            expect(res.body.lockStockBalance).toBe("10"); // 10 locked in escrow

            // Verify resting ask exists in database
            const restingAsk = await prisma.ask.findFirst({
                where: { userId: aliceId, price: 60n },
            });
            expect(restingAsk).not.toBeNull();
            expect(restingAsk!.qty).toBe(10n);
        }, 20000);

        test("Bob places Bid: buys 4 YES shares at 60 cents (Direct Match against Alice)", async () => {
            const bobBefore = await UserRepo.getUserViaUserId(bobId);
            const aliceBefore = await UserRepo.getUserViaUserId(aliceId);

            const res = await api(`/api/v1/create/bid/${marketId}`, {
                method: "POST",
                token: bobToken,
                body: { side: "YES", price: 60, qty: 4 },
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("order executed");

            // Bob paid 4 * 60 = 240 cents
            const bobAfter = await UserRepo.getUserViaUserId(bobId);
            expect(bobAfter!.available_balance).toBe(bobBefore!.available_balance - 240n);

            // Alice received 4 * 60 = 240 cents
            const aliceAfter = await UserRepo.getUserViaUserId(aliceId);
            expect(aliceAfter!.available_balance).toBe(aliceBefore!.available_balance + 240n);

            // Bob received 4 YES shares
            const bobStock = await prisma.stockBalance.findUnique({
                where: {
                    userId_marketId_type: {
                        userId: bobId,
                        marketId: BigInt(marketId),
                        type: "YES",
                    },
                },
            });
            expect(bobStock!.qty).toBe(4n);

            // Alice's locked shares decremented by 4 (from 10 to 6)
            const aliceStock = await prisma.stockBalance.findUnique({
                where: {
                    userId_marketId_type: {
                        userId: aliceId,
                        marketId: BigInt(marketId),
                        type: "YES",
                    },
                },
            });
            expect(aliceStock!.locked).toBe(6n);
            expect(aliceStock!.qty).toBe(10n);

            // Alice's resting Ask in DB decreased from 10 to 6
            const remainingAsk = await prisma.ask.findFirst({
                where: { userId: aliceId, price: 60n },
            });
            expect(remainingAsk!.qty).toBe(6n);

            // Verify Fill record
            const fill = await prisma.fill.findFirst({
                where: { makerId: aliceId, takerId: bobId },
                orderBy: { id: "desc" },
            });
            expect(fill).not.toBeNull();
            expect(fill!.qty).toBe(4n);
            expect(fill!.price).toBe(60n);

            // Verify tx_log entries
            const bobTx = await prisma.txLog.findFirst({
                where: { userId: bobId, type: "buying" },
                orderBy: { id: "desc" },
            });
            expect(bobTx!.amount).toBe(240n);

            const aliceTx = await prisma.txLog.findFirst({
                where: { userId: aliceId, type: "selling" },
                orderBy: { id: "desc" },
            });
            expect(aliceTx!.amount).toBe(240n);
        }, 20000);

        test("Rejects Ask when user does not own enough unlocked shares", async () => {
            // Alice has 10 available, tries to sell 15
            const res = await api(`/api/v1/create/ask/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { side: "YES", price: 70, qty: 15 },
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("low balance stock");
        });
    });

    // ==========================================
    // 5. READ ENDPOINTS (PORTFOLIO, BALANCE, FILLS, TRANSACTIONS)
    // ==========================================
    describe("5. User Read Queries (/balance, /portfolio, /fills, /transaction)", () => {
        test("GET /balance returns current available and reserved balances", async () => {
            const res = await api("/api/v1/balance/", {
                method: "GET",
                token: aliceToken,
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.username).toBe(aliceUsername);
            expect(res.body.role).toBe("USER");
            expect(res.body.balance).toBeDefined();
            expect(res.body.locked_balance).toBeDefined();
        }, 20000);

        test("GET /portfolio returns current user positions across markets", async () => {
            const res = await api("/api/v1/portfolio/", {
                method: "GET",
                token: aliceToken,
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.portfolio)).toBe(true);

            // Alice should have both YES and NO positions
            const yesPosition = res.body.portfolio.find(
                (p: any) => String(p.marketId) === String(marketId) && p.type === "YES"
            );
            const noPosition = res.body.portfolio.find(
                (p: any) => String(p.marketId) === String(marketId) && p.type === "NO"
            );

            expect(yesPosition).toBeDefined();
            expect(String(yesPosition.qty)).toBe("10");
            expect(String(yesPosition.locked)).toBe("6"); // 6 locked in resting Ask

            expect(noPosition).toBeDefined();
            expect(String(noPosition.qty)).toBe("20");
            expect(String(noPosition.locked)).toBe("0");
        }, 20000);

        test("GET /fills returns trade execution history for taker", async () => {
            // Bob was the taker in the 4-share direct fill
            const res = await api("/api/v1/fills/", {
                method: "GET",
                token: bobToken,
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.Fills)).toBe(true);
            expect(res.body.Fills.length).toBeGreaterThan(0);

            const fill = res.body.Fills[0];
            expect(String(fill.qty)).toBe("4");
            expect(String(fill.price)).toBe("60");
            expect(fill.type).toBe("BUY");
        }, 20000);

        test("GET /transaction returns full user ledger audit log", async () => {
            const res = await api("/api/v1/transaction/", {
                method: "GET",
                token: aliceToken,
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.transaction_History)).toBe(true);

            const txTypes = res.body.transaction_History.map((t: any) => t.type);
            expect(txTypes).toContain("increase balance");
            expect(txTypes).toContain("split");
            expect(txTypes).toContain("selling");
        }, 20000);

        test("Rejects read endpoints when token header is omitted", async () => {
            const res = await api("/api/v1/portfolio/", { method: "GET" });
            expect(res.status).toBe(400);
        });
    });

    // ==========================================
    // 6. MERGE (BURNING SHARES)
    // ==========================================
    describe("6. Merge Functionality (Burning Pairs for Cash)", () => {
        test("Alice merges 5 complete pairs (5 YES + 5 NO) for 500 cents cash", async () => {
            const userBefore = await UserRepo.getUserViaUserId(aliceId);
            const marketBefore = await prisma.market.findUnique({
                where: { id: BigInt(marketId) },
            });

            const res = await api(`/api/v1/merge/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { bet: 5 },
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(String(res.body.total_Market_Stock)).toBe(String(marketBefore!.totalIssued - 5n));

            // Cash balance increased by 5 * 100 = 500 cents
            const userAfter = await UserRepo.getUserViaUserId(aliceId);
            expect(userAfter!.available_balance).toBe(userBefore!.available_balance + 500n);

            // Market totalIssued decremented by 5
            const marketAfter = await prisma.market.findUnique({
                where: { id: BigInt(marketId) },
            });
            expect(marketAfter!.totalIssued).toBe(marketBefore!.totalIssued - 5n);

            // Stock balances decremented by 5
            const yesBalance = await prisma.stockBalance.findUnique({
                where: {
                    userId_marketId_type: {
                        userId: aliceId,
                        marketId: BigInt(marketId),
                        type: "YES",
                    },
                },
            });
            const noBalance = await prisma.stockBalance.findUnique({
                where: {
                    userId_marketId_type: {
                        userId: aliceId,
                        marketId: BigInt(marketId),
                        type: "NO",
                    },
                },
            });
            expect(yesBalance!.qty).toBe(5n); // 10 - 5 = 5
            expect(noBalance!.qty).toBe(15n); // 20 - 5 = 15

            // Verify tx_log entry for merge
            const tx = await prisma.txLog.findFirst({
                where: { userId: aliceId, type: "merge" },
                orderBy: { id: "desc" },
            });
            expect(tx).not.toBeNull();
            expect(tx!.amount).toBe(500n);
        }, 20000);

        test("Rejects merge when user does not have enough shares on both sides", async () => {
            // Alice only has 5 available YES shares left, attempts to merge 10
            const res = await api(`/api/v1/merge/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { bet: 10 },
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("not enough YES or NO");
        });
    });

    // ==========================================
    // 7. MARKET RESOLUTION & SETTLEMENT
    // ==========================================
    describe("7. Market Resolution & Winner Payout", () => {
        test("Rejects resolution request from non-admin user", async () => {
            const res = await api(`/api/v1/market/resolve/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { resolve: "YES" },
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("Only Admin");
        });

        test("Rejects resolution with invalid outcome payload", async () => {
            const res = await api(`/api/v1/market/resolve/${marketId}`, {
                method: "POST",
                token: adminToken,
                body: { resolve: "MAYBE" },
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test("Admin resolves market as YES: cancels open orders and pays winners 100c/share", async () => {
            // Check state before resolution:
            // Alice has 5 available YES shares, plus 6 resting locked YES shares in Ask table!
            // Total Alice YES = 5 + 6 = 11 shares.
            // Bob has 4 available YES shares.
            // Total winning shares = 11 + 4 = 15 shares.
            const aliceBefore = await UserRepo.getUserViaUserId(aliceId);
            const bobBefore = await UserRepo.getUserViaUserId(bobId);

            const res = await api(`/api/v1/market/resolve/${marketId}`, {
                method: "POST",
                token: adminToken,
                body: { resolve: "YES" },
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.resolve).toBe("YES");

            // Verify market resolution in DB
            const market = await prisma.market.findUnique({
                where: { id: BigInt(marketId) },
            });
            expect(market!.resolution).toBe("YES");

            // Open orders should be deleted
            const remainingAsks = await prisma.ask.findMany({
                where: { userId: aliceId },
            });
            expect(remainingAsks.length).toBe(0);

            // Alice had 5 qty + 6 unlocked from ask = 11 winning shares -> receives 11 * 100 = 1100 cents
            const aliceAfter = await UserRepo.getUserViaUserId(aliceId);
            expect(aliceAfter!.available_balance).toBe(aliceBefore!.available_balance + 1100n);

            // Bob had 4 winning shares -> receives 4 * 100 = 400 cents
            const bobAfter = await UserRepo.getUserViaUserId(bobId);
            expect(bobAfter!.available_balance).toBe(bobBefore!.available_balance + 400n);

            // Verify tx_log win entries
            const aliceWinTx = await prisma.txLog.findFirst({
                where: { userId: aliceId, type: "Win" },
                orderBy: { id: "desc" },
            });
            expect(aliceWinTx).not.toBeNull();
            expect(aliceWinTx!.amount).toBe(1100n);

            const bobWinTx = await prisma.txLog.findFirst({
                where: { userId: bobId, type: "Win" },
                orderBy: { id: "desc" },
            });
            expect(bobWinTx).not.toBeNull();
            expect(bobWinTx!.amount).toBe(400n);
        }, 20000);

        test("Rejects duplicate resolution on already resolved market", async () => {
            const res = await api(`/api/v1/market/resolve/${marketId}`, {
                method: "POST",
                token: adminToken,
                body: { resolve: "YES" },
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("already executed");
        });

        test("Rejects placing bid on resolved market", async () => {
            const res = await api(`/api/v1/create/bid/${marketId}`, {
                method: "POST",
                token: bobToken,
                body: { side: "YES", price: 50, qty: 1 },
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("already executed");
        });

        test("Rejects placing ask on resolved market", async () => {
            const res = await api(`/api/v1/create/ask/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { side: "YES", price: 50, qty: 1 },
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("already executed");
        });

        test("Rejects split on resolved market", async () => {
            const res = await api(`/api/v1/split/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { bet: 100 },
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("already executed");
        });

        test("Rejects merge on resolved market", async () => {
            const res = await api(`/api/v1/merge/${marketId}`, {
                method: "POST",
                token: aliceToken,
                body: { bet: 1 },
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("already executed");
        });
    });
});
