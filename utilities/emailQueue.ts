import Queue from 'better-queue';
import SqliteStore from 'better-queue-sqlite';
import nodemailer from 'nodemailer';
import { IEmail } from '../interfaces/email';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_EMAIL_USER,
        pass: process.env.SMTP_EMAIL_PASSWORD
    }
});


const emailQueue = new Queue(async (input: IEmail, cb) => {
    try {
        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.SMTP_EMAIL_FROM,
            to: input.recipient,
            cc: input.cc,
            bcc: input.bcc,
            subject: input.subject,
            text: input.body,
            html: input.bodyHtml,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: ", info.messageId);
        cb(null, 'success');
    } catch (error: any) {
        console.error("Email could not be sent, ", error.message)
        cb(error);
    }
}, {
    store: new SqliteStore({
        path: './db/emailQueue.sqlite',
        concurrent: 5
    })
});

export default emailQueue;