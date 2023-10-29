import { Request, Response } from "express";
import jwt, { Secret } from 'jsonwebtoken';
import mongoose from "mongoose";
import { IChangePasswordRequest, IExtReq, ILoginRequest, ISignupRequest } from "../interfaces/auth";
import User, { IUserDocument } from "../models/user";
import { IUserDetails } from "../interfaces/user";
import userProfile from "../models/userProfile";
import { HTTPError, sendError } from "../utilities/utils";
import { verifyFromCache } from "../utilities/verificationService";
import UserVerification from "../models/userVerification";
import userVerification from "../models/userVerification";

const { AUTH_JWT_SECRET, AUTH_JWT_EXPIRE, CONFIRM_DELETE_EXPIRE } = process.env;


export async function loginLocal(req: Request, res: Response) {
    try {
        const { email, password }: ILoginRequest = req.body;
        const user: IUserDocument | null = await User.findOne({ email });
        if (user && await user.checkPassword(password)) {
            const accessToken = createJwt(user._id);
            return res.status(200).json({ accessToken });
        } else {
            throw { status: 401, message: "Invalid credentials" };
        }
    } catch (error: any) {
        if ('status' in error && 'message' in error) {
            sendError(res, error as HTTPError);
        } else {
            return res.status(500).json({ message: error.message });
        }
    }
}


export async function updatePassword(req: Request & IExtReq, res: Response) {
    const { oldPassword, newPassword }: IChangePasswordRequest = req.body;
    const user = req.user;

    try {
        if (!user || !oldPassword || !newPassword) {
            throw { status: 400, message: "Missing parameters" };
        }

        const foundUser = await User.findById(user);
        if (!foundUser) {
            throw { status: 404, message: "User not found" };
        }

        if (!(await foundUser.checkPassword(oldPassword))) {
            throw { status: 401, message: "Invalid old password" };
        }

        foundUser.passwordHash = newPassword;

        try {
            await foundUser.save();
        } catch (err: any) {
            throw { status: 400, message: `Save failed: ${err.message}` };
        }

        res.status(200).json({ message: "Password changed" });

    } catch (error: any) {
        if ('status' in error && 'message' in error) {
            sendError(res, error as HTTPError);
        } else {
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

export async function updateUserDetails(req: Request & IExtReq, res: Response) {
    const details: Partial<IUserDetails> = req.body;
    const allowedKeys: (keyof IUserDetails)[] = ['name', 'dob', 'gender', 'tel'];

    try {
        const user = await User.findById(req.user);
        if (!user) throw { status: 404, message: "User not found" };

        for (let key of allowedKeys) {
            if (details.hasOwnProperty(key)) {
                (user as any)[key] = details[key];
            }
        }

        await user.save();
        res.status(200).json({ message: "User details updated" });
    } catch (error: any) {
        if ('status' in error && 'message' in error) {
            sendError(res, error as HTTPError);
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

export async function deleteUser(req: Request & IExtReq, res: Response) {
    try {
        const user = await User.findById(req.user);
        if (!user) throw { status: 404, message: "User not found" };
        const confirmationToken = createJwt(user._id, CONFIRM_DELETE_EXPIRE);
        res.status(200).json({ confirmationToken });
    } catch (error: any) {
        if ('status' in error && 'message' in error) {
            sendError(res, error as HTTPError);
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

export async function confirmDeleteUser(req: Request & IExtReq, res: Response) {
    try {
        const { confirmationToken } = req.body;
        if (!confirmationToken) throw { status: 400, message: "No confirmation token provided" };

        let decoded: any;
        try {
            decoded = jwt.verify(confirmationToken, AUTH_JWT_SECRET as Secret);
        } catch (e) {
            throw { status: 400, message: "Invalid or expired confirmation token" };
        }
        if (!req.user || req.user !== decoded.payload) throw { status: 403, message: "Forbidden" };
        const user = await User.findById(decoded.payload);
        if (!user) throw { status: 404, message: "User not found" };

        await user.deleteOne();
        // TODO: Clean other records belonging to user, such as friends, profile, etc.
        await userProfile.deleteMany({ user: user._id });
        await userVerification.deleteMany({user: user._id});

        res.status(200).json({ message: "User deleted" });
    } catch (error: any) {
        if ('status' in error && 'message' in error) {
            sendError(res, error as HTTPError);
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

export async function signup(req: Request, res: Response) {
    try {
        const { email, password, name, tel, dob, gender }: ISignupRequest = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) throw { status: 400, message: "Email already in use" };

        const user: IUserDocument = new User({ email, passwordHash: password, name, tel, dob, gender });

        await user.save();

        // TODO: Send activation/verification e-mail?

        res.status(201).json({ message: "User successfully created", accessToken: createJwt(user._id) });
    } catch (error: any) {
        if ('status' in error && 'message' in error) {
            sendError(res, error as HTTPError);
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

export async function verifyEmail(req: Request & IExtReq, res: Response) {
    try {
        const { token } = req.body;
        const verification = verifyFromCache(token);
        if (!verification) throw { status: 400, message: "Token expired or invalid" };
        const updated = await UserVerification.findOneAndUpdate(
            { user: new mongoose.Types.ObjectId(verification.user) },
            { isVerified: true }, 
            { new: true, upsert: false });
        if(!updated) throw {status: 500, message: "Verification record not found"};
        res.status(200).json({message: "User verified"});
    } catch (error: any) {
        if ('status' in error && 'message' in error) {
            sendError(res, error as HTTPError);
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

function createJwt(payload: any, expires: any = AUTH_JWT_EXPIRE) {
    return jwt.sign(
        // data payload
        { payload },
        (AUTH_JWT_SECRET as Secret),
        { expiresIn: expires }
    );
}