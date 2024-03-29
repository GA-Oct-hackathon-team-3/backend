require('dotenv').config();
import path from 'path';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import sanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import bearer from './middleware/bearer';
import usersRoute from './modules/user/routes/usersRoute';
import friendsRoute from './modules/friends/friendsRoute';
import userProfileRoute from './modules/profile/userProfileRoute';
import tagsRoute from './modules/tags/tagsRoute';
import deviceInfoRoute from './modules/notifications/deviceInfoRoute';
import remindersRoute from './modules/notifications/remindersRoute';
import connectDB from './utilities/db';
import { getApproachingBirthdays, sendExpoNotifications, startAgenda } from './modules/notifications/notificationService';
import { startCleanupAgenda } from './utilities/databaseCleanup';


const DEBUG = process.env.NODE_ENV ? process.env.NODE_ENV.toLocaleLowerCase() !== 'production' : true; // Fix DEBUG logic
const PORT = process.env.PORT || 3010;

export const configureApp = (middleware?: any[]) => {

    const app = express();

    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true,
    }));
    app.use(morgan(DEBUG ? 'dev' : 'short'));
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'build')));
    app.use(sanitize());
    app.use(fileUpload());
    app.use(cookieParser());



    if (middleware) {
        app.use(middleware);
    }

    app.use("/api/users", usersRoute);
    app.use('/api/friends', friendsRoute);

    app.use('/api/users/profile', userProfileRoute);
    app.use('/api/tags', tagsRoute);
    app.use('/api/device', deviceInfoRoute);
    app.use('/api/reminders', remindersRoute);
    // app.get('/test', async (req,res)=>{
    //    const list = await getApproachingBirthdays();
    //     await sendExpoNotifications(list);
    //     res.json(list);
    //     // res.json(await getApproachingBirthdays())
    // })

    return app;
}

const app = configureApp([bearer]);

(async () => {
    await startAgenda(); // send birthday reminders
    await startCleanupAgenda(); // database cleanup (tag, notification, reminder, and verification token collections) 
  })();
  

if (!process.env.NODE_ENV || (process.env.NODE_ENV && process.env.NODE_ENV !== 'test')) {
    connectDB();
    app.listen(PORT, () => {
        console.log(`Express app running on port ${PORT}`);
    });
}
export default app;