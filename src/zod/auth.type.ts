import z from "zod"

export const userSchema = z.object({
    username : z.string().trim().min(3).max(50),
    password : z.string().trim().min(3).max(100)
})

export const betSchema = z.object({
    bet : z.coerce.bigint()
})

export const resolveSchema = z.object({
    resolve : z.enum(["YES","NO"],{
        message:"Outcome must be either 'YES' or 'NO'"
    }),
})