import mongoose from 'mongoose';
import request from 'supertest';
import { configureApp } from '../index';
import bearer from '../middleware/bearer';
import jwt, { JwtPayload } from 'jsonwebtoken';

import Friend from "../models/friend";
import User from '../models/user';
import Tag from '../models/tag';
import giftRecommendation from '../models/giftRecommendation';


let token: string;
let user: JwtPayload;
let friendId: string;
let tag1Id: string;
let tag2Id: string;
let favId: string;

const app = configureApp([bearer]);

declare global {
    var __MONGO_URI__: string;
}

beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__);
    await Friend.deleteMany({});
    await User.deleteMany({});
    await Tag.deleteMany({});

    const userResponse = await request(app)
        .post('/api/users/')
        .send({
            email: "test@email.com",
            password: "123456Aa!",
            name: "test",
            dob: "1990-08-08",
            gender: "female",
            lastName: "user"
        });

    token = userResponse.body.accessToken;
    user = jwt.decode(token) as JwtPayload;

    const tagData1 = { title: "family", type: "custom" };
    const tag1 = await Tag.create(tagData1);
    tag1Id = tag1._id;

    const tagData2 = { title: "gamer", type: "custom" };
    const tag2 = await Tag.create(tagData2);
    tag2Id = tag2._id;

    const friendData = {
        name: 'test',
        gender: 'female',
        dob: '1997-01-26',
        photo: 'string',
        bio: 'a test user',
        interests: ['testing', 'this is a test'],
        tags: [tag1Id, tag2Id],
        user: user.payload
    }

    const friend = await Friend.create(friendData);
    friendId = friend._id.toString();

});

afterAll(async () => {
    await mongoose.connection.close();
});


// describe('openai call for gift recommendations', () => {
//     it('should return a json of gift recommendations', async () => {

//         const req = {
//             tags: ['family', 'gamer'],
//             giftTypes: ['present', 'experience', 'donation'],
//             budget: 50
//         }

//         const response = await request(app)
//             .post(`/api/friends/${friendId}/generate-gift`)
//             .send(req)
//             .set('Authorization', `Bearer ${token}`)

//         expect(response.status).toBe(200);
//         expect(response.body.recommendations).toBeDefined();

//     }, 30000);
// });

describe("gift recommendation controller", () => {
    it("should return an empty object if no favorite gifts", async () => {
        const response = await request(app)
            .get(`/api/friends/${friendId}/favorites`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
    it("should save a favorite gift", async () => {
        const req = {
            title: "Live monkey",
            reason: "Your friend looks like a monkey",
            imageSearchQuery: "live monkey",
            imgSrc: "https://placeholder.com/monkey.png",
            estimatedCost: "$500",
            giftType: "Present"
        };
        const response = await request(app)
            .post(`/api/friends/${friendId}/favorites`)
            .set('Authorization', `Bearer ${token}`)
            .send(req)
            .expect(201);
        expect(response.body.recommendation).toBeDefined();
    });
    it("should return a list of favorite recommendations", async () => {
        const response = await request(app)
            .get(`/api/friends/${friendId}/favorites`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(response.body.favorites).toBeDefined();
        expect(response.body.favorites.length).toBeGreaterThan(0);
        favId = response.body.favorites[0]._id;
    });
    it("should delete a favorited gift", async () => {
        const response = await request(app)
            .delete(`/api/friends/${friendId}/favorites/${favId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(response.body.message).toBe("Favorite gift removed");

        await request(app)
            .get(`/api/friends/${friendId}/favorites`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});