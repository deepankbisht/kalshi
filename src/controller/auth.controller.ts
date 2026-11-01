import { env } from "bun";
import type { Request, Response } from "express";
import { userSchema } from "../zod/auth.type";
import UserRepo from "../db/repository/user.repo";
import { handleError, handleReponse } from "../utils";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { success } from "zod";

export const signup = async (req: Request, res: Response) => {
    try {
        const response = userSchema.safeParse(req.body);

        if (!response.success) {
            throw new Error("Incorrect request schema");
        }

        
        const { username, password } = response.data;

        const exist = await UserRepo.getUser(username);

        if (exist) {
            return res
                .status(403)
                .send(handleError("Username already exist", 0));
        }

        const hashedPassword = await bcrypt.hash(
            password,
            Number(env.SALTROUND)
        );
        await UserRepo.userCreate(username, hashedPassword);
        return res
            .status(200)
            .send(handleReponse("signup done", 1));
    } catch (error) {
        console.log(error);
        if (error instanceof Error) {
            return res.status(500).send(handleError(error.message, 0));
        } else {
            return res
                .status(500)
                .send(
                    handleError(
                        "Server Error. Failed to process request /signup",
                        0
                    )
                );
        }
    }
};

export const signin = async (req: Request, res: Response) => {
    try {
        const response = userSchema.safeParse(req.body);

        if (!response.success) {
            throw new Error("Incorrect Schema");
        }

        const { username, password } = response.data;

        const exist = await UserRepo.getUser(username);

        if (!exist) {
            return res.status(403).send(handleError("User don't exist", 0));
        }

        const check = await bcrypt.compare(password, exist.password);

        if (check) {
            const token = jwt.sign({ userId: exist.id.toString() }, env.JWT_URL!);
            return res.status(200).json({
                success: true,
                token: token,
            });
        }
    } catch (error) {
        console.log(error);

        if (error instanceof Error) {
            return res.status(500).send(handleError(error.message, 0));
        } else {
            return res
                .status(500)
                .send(handleError("Invalid error in /signin", 0));
        }
    }
};
