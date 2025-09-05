import { Request,Response,NextFunction } from "express";
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export interface AuthRequest extends Request {
    user:{
        id:string,
        email:string
    }
}

export const Authmiddleware = (
    req:AuthRequest,res:Response,next:NextFunction
) => {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(400).json({
            message:"No token Provided"
        })
    }

    const token = authHeader.split(" ")[1]
    try {
        const decoded = jwt.verify(token,JWT_SECRET) as {id:string, email:string}
        req.user = decoded;
        next()
    } catch (error) {
        console.log(error, "server error")
    }

}