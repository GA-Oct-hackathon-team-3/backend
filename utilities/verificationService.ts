import mongoose from "mongoose";
import crypto from 'crypto';
import cache from "./cache";
import { sendEmail } from "./utils";
import { FRONTEND_VERIFY_URL } from "./constants";

const { AUTH_SIGN_SECRET } = process.env;
const MAX_RETRIES = 3;


interface IVerificationCache {
    user: string | mongoose.Types.ObjectId;
    token: string;

}

interface IVerificationCacheCounter {
    counter: number;
}

function generateToken(user: string | mongoose.Types.ObjectId) {
    return `verify_${user}_${Date.now()}`;
}

function signToken(token: string) {
    const encoded = btoa(token);
    const hmac = crypto.createHmac('sha256', AUTH_SIGN_SECRET!);
    hmac.update(encoded);
    const signature = hmac.digest('base64');
    return `${encoded}.${signature}`;
}

function verifySignedToken(token: string) {
    const [encoded, signature] = token.split('.');
    const hmac = crypto.createHmac('sha256', AUTH_SIGN_SECRET!);
    hmac.update(encoded);
    return signature === hmac.digest('base64');
}

function createTokenForUser(user: string | mongoose.Types.ObjectId) {
    const token = generateToken(user);
    const signedToken = signToken(token);
    const verification: IVerificationCache = {
        token: signedToken,
        user
    }
    return verification;
}
export function verifyToken(token: string) {
    if (!verifySignedToken(token)) return null;
    const encoded = token.split('.')[0];
    const decoded = atob(encoded);
    const [_, user, timestamp] = decoded.split('_');
    return { user, timestamp: parseInt(timestamp) };
}

export function createAndCacheTokenForUser(user: string | mongoose.Types.ObjectId) {
    try {
        const cached = cache.emailVerificationTokenCache.get(`verification:${user}`);
        let counter = 0;
        if (cached) {
            const storedToken: IVerificationCache & IVerificationCacheCounter = JSON.parse(cached);
            counter = storedToken.counter + 1;
        }
        if (counter > MAX_RETRIES) throw new Error("Max retries reached");
        const verification: IVerificationCache = createTokenForUser(user);
        const verificationCache: IVerificationCache & IVerificationCacheCounter = {
            counter,
            ...verification
        };
        cache.emailVerificationTokenCache.set(`verification:${user}`, JSON.stringify(verificationCache));
        return verificationCache;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export function sendVerificationEmail(email:string, id: string){
    try {
        const verification = createAndCacheTokenForUser(id);
        sendEmail({
            recipient: email,
            subject: "🎁 Welcome to PresenTly",
            body: `Thank you for registering with PresenTly. Copy and paste the following link to never miss your friends' birthdays again: ${FRONTEND_VERIFY_URL}?t=${verification.token}`
        });
    } catch (error) {
        throw error;
    }
}

export function verifyFromCache(token: string): { user: string, retries: number } | null {
    try {
        const verifiedToken = verifyToken(token);
        if (!verifiedToken) {
            return null;
        }
        const { user } = verifiedToken;
        const cached = cache.emailVerificationTokenCache.get(`verification:${user}`);
        if (!cached) {
            return null;
        }
        const storedToken: IVerificationCache & IVerificationCacheCounter = JSON.parse(cached);
        if (storedToken.token !== token) {
            return null;
        }
        if (storedToken.counter > MAX_RETRIES) {
            return null;
        }
        return { user, retries: storedToken.counter };
    } catch (error) {
        console.error(error);
        return null;
    }
}
