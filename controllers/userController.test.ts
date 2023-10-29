require('dotenv').config();
import mongoose from "mongoose";
import request from 'supertest';
import User from "../models/user";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { configureApp } from '../index';
import bearer from "../middleware/bearer";
import userProfile from "../models/userProfile";
import friend from "../models/friend";
import userVerification from "../models/userVerification";
import cache from "../utilities/cache";

const app = configureApp([bearer]);

declare global {
    var __MONGO_URI__: string;
}

beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__);
    await friend.deleteMany({});
    await userProfile.deleteMany({});
    await User.deleteMany({});
});

afterAll(async () => {
    await mongoose.connection.close();
});

// Test variables
let token: string;

describe('User Controller', () => {

    // Test user sign-up
    it('should create a new user', async () => {
        const res = await request(app)
            //@ts-ignore
            .post('/api/users/')
            .send({
                email: "can@xn--glolu-jua30a.com",
                password: "123456Aa!",
                name: "test",
                dob: "1990-01-01",
                gender: "male",
            })
            .expect(201);
    });

    // Test user login
    it('should login a user', async () => {
        const res = await request(app)
            //@ts-ignore
            .post('/api/users/login')
            .send({
                email: "can@xn--glolu-jua30a.com",
                password: "123456Aa!",
            })
            .expect(200);
        token = res.body.accessToken;
    });

    // Test email verification
    it('should verify a user\'s e-mail', async () => {
        const userId = (jwt.decode(token) as JwtPayload).payload;
        const verification = cache.emailVerificationTokenCache.get(`verification:${userId}`);
        const response = await request(app)
            .post('/api/users/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({ token: JSON.parse(verification!).token })
            .expect(200);
        const verificationRec = await userVerification.findOne({ user: new mongoose.Types.ObjectId(userId) });
        expect(verificationRec?.isVerified).toBe(true);
    });

    // Test updating user details
    it('should update user details', async () => {
        const res = await request(app)
            //@ts-ignore
            .put('/api/users/')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: "new name"
            })
            .expect(200);
        const user = await User.findOne({});
        expect(user?.name).toEqual("new name");
    });

    // Test updating password
    it('should update user password', async () => {
        const res = await request(app)
            //@ts-ignore
            .put('/api/users/password')
            .set('Authorization', `Bearer ${token}`)
            .send({
                oldPassword: "123456Aa!",
                newPassword: "987654Bb!"
            })
            .expect(200);

    });

    // Test user deletion
    it('should delete a user', async () => {
        const res = await request(app)
            //@ts-ignore
            .delete('/api/users/')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        const confirmationToken = res.body.confirmationToken;
        const deleteRes = await request(app)
            // @ts-ignore
            .post("/api/users/confirm-delete")
            .set('Authorization', `Bearer ${token}`)
            .send({
                confirmationToken
            })
            .expect(200);
        const users = await User.find({});
        expect(users.length).toEqual(0);
    });

    it("should delete associated user profiles on user deletion", async () => {
        // assert user was deleted
        const users = await User.find({});
        expect(users.length).toEqual(0);
        // assert user profile was also deleted
        const profiles = await userProfile.find({});
        expect(profiles.length).toEqual(0);
        const verifications = await userVerification.find({});
        expect(verifications.length).toBe(0);
    });

    // Test confirmation token expiration -- Long Running test + need to modify .env to work.
    // it("should not delete user if confirmation token expired", async () => {
    //     const res = await request(app)
    //         //@ts-ignore
    //         .post('/api/users')
    //         .send({
    //             email: "test@email.com",
    //             password: "123456Aa!",
    //             firstName: "first",
    //             lastName: "last"
    //         })
    //         .expect(201);
    //     token = res.body.accessToken;

    //     const deleteRes = await request(app)
    //         //@ts-ignore
    //         .delete('/api/users/')
    //         .set('Authorization', `Bearer ${token}`)
    //         .expect(200);
    //     const confirmationToken = deleteRes.body.confirmationToken;

    //     // set expiry to < 3 seconds in the .env for this test
    //     await new Promise(res => setTimeout(res, 3000));
    //     // Attempt to confirm deletion with expired token
    //     await request(app)
    //         //@ts-ignore
    //         .post("/api/users/confirm-delete")
    //         .set('Authorization', `Bearer ${token}`)
    //         .send({
    //             confirmationToken
    //         })
    //         .expect(400);

    //     // Validate that the user still exists
    //     const users = await User.find({});
    //     expect(users.length).toEqual(1);
    // }, 10000);

    // Test protected routes
    it('should require login for protected routes', async () => {
        await request(app)
            //@ts-ignore
            .put('/api/users/')
            .send({
                name: "should not change"
            })
            .expect(401);
    });


});