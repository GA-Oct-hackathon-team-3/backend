import { NextFunction, Request, Response } from "express";
import { IExtReq } from "../interfaces/auth";
import userVerification from "../models/userVerification";

export default async (req: Request & IExtReq, res:Response, next: NextFunction) => {
    try {
        const verification = await userVerification.findOne({user: req.user});
        if(!verification) return res.status(500).json({message: "Verification Data Missing, DB state inconsistent"});
        if(!verification?.isVerified) return res.status(401).json({message: "User must be verified to access this route"});
        next();
    } catch (error) {
        next(error);
    }
}