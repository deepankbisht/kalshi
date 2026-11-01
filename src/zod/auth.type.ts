import z from "zod"

export const userSchema = z.object({
    username : z.string().trim().min(3).max(50),
    password : z.string().trim().min(3).max(100)
})