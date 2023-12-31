import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/user';
import VerificationToken, { IVerificationTokenDocument } from "../models/verificationToken";
import { hashString, compareHash } from '../../../utilities/cryptoService';
import { toSeconds } from '../../../utilities/utils';
import { createJwt } from "./tokenService";
import { SendMailOptions } from 'nodemailer';
import { sendMail } from "../../../utilities/emailService";
import { FRONTEND_BASE_URL } from '../../../utilities/constants';


const { EMAIL_SECRET, EMAIL_USER, EMAIL_JWT_EXPIRE, EMAIL_FORGOT_EXPIRE } = process.env;

export async function sendEmailVerification (id : string) {
    try {
        // finds user with id returned from signup service
        const user = await User.findById(id);
        if (!user) throw new Error('User not found');

        if (user && user.verified) return; // return if user is already verified

        // creates token for verification
        const emailToken = createJwt(user._id, // for user identification
            EMAIL_SECRET, 
            EMAIL_JWT_EXPIRE,
        );

        // saves token tp database for cross reference
        const validToken = await VerificationToken.create({ 
            user: user._id,
            token: await hashString(emailToken),
            expiresAt: new Date((Date.now() / 1000 + toSeconds(EMAIL_JWT_EXPIRE!)!) * 1000)
        });

        // frontend url
        const url = `${FRONTEND_BASE_URL}/verify-email?et=${encodeURIComponent(emailToken)}`;

        const mailOptions : SendMailOptions = { // email info
            from: `Presently 🎁 <${EMAIL_USER}>`,
            to: user.email,
            subject: 'Presently Email Confirmation',
            html: `Please click on this link to verify your email address: <a href="${url}">${url}</a>`
        }

        const result = await sendMail(mailOptions); // sends mail

        // if result.messageId, then successfully send email
        return result.messageId || null;

    } catch (error : any) {
        console.error(error);
        throw error;
    }
}

export async function verifyUserEmail (emailToken : string) {
    try {
        const decode = await jwt.verify(emailToken.toString(), EMAIL_SECRET!) as JwtPayload;

        // find user
        const user = await User.findById(decode.payload);
        if (!user) throw new Error('User not found');

        // update user and save changes
        user.verified = true;
        await user.save();

        // return success message
        return 'User\'s email was verified successfully';

    } catch (error : any) {
        console.error(error);
        throw error;
    }
}

export async function sendForgotPasswordEmail (id : string, email : string) {
    try {
        // creates token
        const emailToken = createJwt(id, 
            EMAIL_SECRET, 
            EMAIL_FORGOT_EXPIRE,
        );

        // saves token to database for cross reference
        const validToken = await VerificationToken.create({
            user: id,
            token: await hashString(emailToken),
            expiresAt: new Date((Date.now() / 1000 + toSeconds(EMAIL_FORGOT_EXPIRE!)!) * 1000)
        });

        // frontend url
        const url = `${FRONTEND_BASE_URL}/reset-password?et=${encodeURIComponent(emailToken)}`;

        const mailOptions : SendMailOptions = { // email info
            from: `Presently 🎁 <${EMAIL_USER}>`,
            to: email,
            subject: 'Reset Password',
            html: `Please click on this link to reset your password: <a href="${url}">${url}</a>`
        }
        
        const result = await sendMail(mailOptions); // sends mail
        
        // if result.messageId, then successfully send email
        return result.messageId || null;

    } catch (error : any) {
        console.error(error);
        throw error;
    }
}

export async function validateTokenAgainstDatabase (emailToken: string): Promise<IVerificationTokenDocument | null> {
    try {
        const activeTokens = await VerificationToken.find({ expiresAt: { $gt: Date.now() }}); // uses expiration to narrow down search
        let validToken : IVerificationTokenDocument | null = null; // initialize object to return
        for (const token of activeTokens) {
            const isValid = await compareHash(emailToken, token.token); // compare each activeToken.token hash to emailToken input
            if (isValid) {
                validToken = token as IVerificationTokenDocument; // if valid, return that token
                break; // exit early if found
            }
        }

        if (!validToken) throw new Error('Token is invalid or expired');
    
        return validToken;
    } catch (error) {
        throw new Error('Failed to validate token against the database');
    }
}
