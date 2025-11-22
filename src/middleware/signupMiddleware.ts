import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const signupMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.jwt
        console.log(token)
        if(!token){
            next()
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET as string)
        if(payload){
            return res.status(409).json({ error: "ALREADY-LOGGED-IN", message: "user is already logged in!"})
        }
    } catch (error) {
        console.log("error in signup middleware:",error)
        return res.status(500).json({ error: "SERVER-ERROR", message: "internal server error" })
    }
}
export default signupMiddleware