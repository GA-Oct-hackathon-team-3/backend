import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { Request, Response } from 'express';
import { IExtReq } from '../interfaces/auth';

const { AWS_REGION, AWS_SECRET, AWS_S3_BUCKET, AWS_ID } = process.env!;

const s3Client = new S3Client({ region: AWS_REGION, credentials: { accessKeyId: AWS_ID!, secretAccessKey: AWS_SECRET! } });

const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: AWS_S3_BUCKET!,
        key: function (req: Request & IExtReq, file, cb) {
            cb(null, `${req.filename}`);
        }
    })
}).single('photo');

export function uploadPhoto(req: Request & IExtReq, res: Response, filename: string, callback: (err: any, photoUrl?: string) => void) {
    req.filename = filename;
    upload(req, res, function (err) {
        if (err) {
            callback(err);
            return res.status(500).json({ error: err.message });
        }
        const photoUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${filename}`
        callback(null, photoUrl)
        res.status(200).json({ photoUrl, message: 'File uploaded successfully' });
    });
}