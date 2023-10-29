import { Response } from "express";
import { SlidingWindowRateLimiter } from "./slidingWindowRateLimiter";
import { IEmail } from "../interfaces/email";
import emailQueue from "./emailQueue";

export const rateLimiterBing = new SlidingWindowRateLimiter(3, 1000);
export const rateLimiterOpenAI = new SlidingWindowRateLimiter(3, 60000);

export function toSeconds(timeString: string) {
    const validUnits = ['s', 'm', 'h', 'd', 'w'];
    const unit = timeString.substring(timeString.length - 1);

    if (!validUnits.includes(unit)) throw new Error('Invalid time unit');

    const num = Number(timeString.substring(0, timeString.length - 1));

    if (isNaN(num)) {
        throw new Error('Invalid number in time string');
    }

    // convert time unit to seconds
    switch (unit) {
        case 's':
            return num;
        case 'm':
            return num * 60;
        case 'h':
            return num * 3600;
        case 'd':
            return num * 86400;
        case 'w':
            return num * 604800;
    }
}



export type HTTPError = { status: number, message: string };

export function sendError(res: Response, { status, message }: HTTPError) {
    res.status(status).json({ message });
}

export async function fetchImageThumbnail(query: string, apiKey: string) {
    if (rateLimiterBing.isRateLimited("default")) return "";
    const endpoint = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(query)}`;
    const headers = { 'Ocp-Apim-Subscription-Key': apiKey };
    try {
        const response = await fetch(endpoint, { headers });
        if (response.ok) {
            const data = await response.json();
            const thumbnailUrl = data.value[0]?.thumbnailUrl;
            return thumbnailUrl;
        } else {
            console.error(`API request failed: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Fetch error: ${error}`);
        return null;
    }
}

export function sendEmail(data: IEmail){
    emailQueue.push({
        recipient: data.recipient,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        body: data.body,
        bodyHtml: data.bodyHtml,
    });
}