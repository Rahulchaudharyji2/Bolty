import type{ Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
   
   if(!token){
        return res.status(401).json({error: "Unauthorized"});
   }else{
    try {
        const decoded = jwt.verify(token, process.env.JWT_PUBLICKEY!,{
            algorithms: ["RS256"]
        });
        
        const userId = (decoded as any).sub;
        console.log("Extracted userId from JWT:", userId);
        req.userId = userId;
        next();

    } catch (err) {
        console.error("JWT Verification failed:", err);
        return res.status(401).json({error: "Invalid token"});
    }

   }
   
}