import { Request, Response } from "express";
import { S3Client } from "@aws-sdk/client-s3";
import multer from 'multer';
import multerS3 from 'multer-s3';
import UserProfile from "../models/userProfile";
import { HTTPError, sendError } from "../utilities/utils";
import { IUserProfileDetails } from "../interfaces/userProfile";
import { IExtReq } from "../interfaces/auth";
import { uploadPhoto } from "../utilities/aws";

const { AWS_REGION, AWS_SECRET, AWS_S3_BUCKET, AWS_ID } = process.env!;

export async function updateProfileDetails(req: Request & IExtReq, res: Response) {
    try {
        const details: Partial<IUserProfileDetails> = req.body;
        const allowedKeys: (keyof IUserProfileDetails)[] = ['dob', 'bio'];
        const profile = await UserProfile.findOne({ user: req.user });
        if (!profile) throw { status: 404, message: "Profile not found" };

        for (let key of allowedKeys) {
            if (details.hasOwnProperty(key)) {
                (profile as any)[key] = details[key];
            }
        }
        await profile.save();
        res.status(200).json({ message: "User profile updated", profile });

    } catch (error: any) {
        if ('status' in error && 'message' in error) {
            sendError(res, error as HTTPError);
        } else {
            return res.status(500).json({ message: error.message });
        }
    }
}

export async function getUserProfile(req: Request & IExtReq, res: Response) {
    try {
        const profile = await UserProfile.findOne({ user: req.user });
        if (!profile) throw { status: 404, message: "Profile not found" };
        res.status(200).json({ profile });
    } catch (error: any) {
        if ('status' in error && 'message' in error) {
            sendError(res, error as HTTPError);
        } else {
            return res.status(500).json({ message: error.message });
        }
    }
}

export async function uploadUserPhoto(req: Request & IExtReq, res: Response) {
    try {
        const profile = await UserProfile.findOne({user: req.user});
        if(!profile) throw {status: 404, message: "Profile not found"};
        uploadPhoto(req, res, req.user!.toString(), async (err, url) => {
            if (err) return;
            // persist to database
            profile.photo = url;
            await profile.save();
        });
    } catch (error: any) {
        if ('status' in error && 'message' in error) {
            sendError(res, error as HTTPError);
        } else {
            return res.status(500).json({ message: error.message });
        }
    }
}