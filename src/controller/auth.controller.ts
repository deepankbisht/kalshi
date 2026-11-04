import { env } from "bun";
import type { Request, Response } from "express";
import { userSchema } from "../zod/auth.type";
import UserRepo from "../db/repository/user.repo";
import { handleError, handleReponse } from "../utils";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req: Request, res: Response) => {
    try {
        const response = userSchema.safeParse(req.body);

        if (!response.success) {
            return res.status(400).json({
                success: false,
                message: response.error.message,
            });
        }
        const { username, password } = response.data;

        const exist = await UserRepo.getUser(username);

        if (exist) {
            return res
                .status(403)
                .json(handleError("Username already exist", 0));
        }

        const hashedPassword = await bcrypt.hash(
            password,
            Number(env.SALTROUND)
        );

        await UserRepo.userCreate(username, hashedPassword);
        return res.status(200).json(handleReponse("signup done", 1));
    } catch (error) {
        console.log(error);
        if (error instanceof Error) {
            return res.status(500).json(handleError(error.message, 0));
        } else {
            return res
                .status(500)
                .json(
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
            return res.status(400).json({
                success: false,
                message: "Invalid schema",
            });
        }

        const { username, password } = response.data;

        const exist = await UserRepo.getUser(username);

        if (!exist) {
            return res.status(403).json(handleError("User don't exist", 0));
        }

        const check = await bcrypt.compare(password, exist.password);

        if (!check) {
            return res.status(403).send(handleError("Invalid password", 0));
        }

        const token = jwt.sign({ userId: exist.id.toString() }, env.JWT_URL!);
        return res.status(200).json({
            success: true,
            token: token,
        });
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
