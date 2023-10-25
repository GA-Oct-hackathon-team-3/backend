require('dotenv').config();
import path from "path";
import mongoose from "mongoose";
import request from 'supertest';
import User from "../models/user";
import * as userCtrl from './userController';
import { configureApp } from '../index';
import bearer from "../middleware/bearer";
import { toSeconds } from "../utilities/utils";
import userProfile from "../models/userProfile";
import jwt, { JwtPayload } from "jsonwebtoken";
import friend from "../models/friend";

const app = configureApp([bearer]);

declare global {
    var __MONGO_URI__: string;
}

// Test variables
let token: string, userId: string;

beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__);
    await friend.deleteMany({});
    await userProfile.deleteMany({});
    await User.deleteMany({});
    const res = await request(app)
        .post('/api/users')
        .send({
            email: "test@email.com",
            password: "123456Aa!",
            dob: "1990-01-01",
            gender: "male",
            name: "test",
        });
    token = res.body.accessToken;

    userId = (jwt.decode(token) as JwtPayload).payload;
});

afterAll(async () => {
    await mongoose.connection.close();
});


describe("User Profile Controller", () => {

    // Add a .png on the root of project to run this test
    it("should upload a photo", async () => {
        const res = await request(app)
            .post('/api/users/profile/upload')
            .set('Authorization', `Bearer ${token}`)
            .attach('photo','./testimage.png');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('File uploaded successfully');
    },10000);

    it("should update user profile", async () => {
        const res = await request(app)
            .put('/api/users/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ bio: 'Test Bio' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User profile updated');
    });

    it("should return user profile", async () => {
        const res = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('profile');
    })
});