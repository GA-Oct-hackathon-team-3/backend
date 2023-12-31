import mongoose from "mongoose";
import Friend from "./friend";
import User from "../../user/models/user";

const now = new Date();
let userId: string;
declare global {
    var __MONGO_URI__: string;
}

beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__);
    await Friend.deleteMany({});
    await User.deleteMany({});
    const user = await User.create({
        email: "test@email.com",
        passwordHash: "123456Aa!",
        name: "test",
        dob: "1990-08-08",
        gender: "female",
        lastName: "user"
    });
    userId = user._id.toString();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Friend DOB Validation', () => {
    it('should allow DOB in the past', async () => {
        const validDOB = new Date(now);
        validDOB.setFullYear(now.getFullYear() - 100);

        const validFriend = await Friend.create({
            name: 'test',
            dob: validDOB,
            photo: 'test',
            gender: 'female',
            user: userId
        });

        expect(validFriend).toBeDefined();
    });

    it('should reject a future date for DOB', async () => {
        const futureDOB = new Date(now);
        futureDOB.setFullYear(now.getFullYear() + 1);

        try {
            await Friend.create({
                name: 'test',
                dob: futureDOB,
                photo: 'test',
                gender: 'female',
                user: userId,
            });

            fail('Expected an error, but the friend was created'); // fails test if friend was created with invalid DOB
        } catch (error: any) {
            expect(error.message).toContain('Date of birth cannot be in the future'); // passes test if friend is not created
        }
    });


    it('should allow a DOB that is equal to the current date', async () => {
        const newborn = await Friend.create({
            name: 'test',
            dob: now,
            photo: 'test',
            gender: 'female',
            user: userId,
        });

        expect(newborn).toBeDefined();
    });
});

// // will handle in the controller
// describe('Friend deletion and cascade deletion of associated gifts', () => {
//     it('should delete a friend and cascade delete associated gifts', async () => {
//         expect.assertions(2);

//         // create friend to delete
//         const friend = await Friend.create({
//             name: 'test',
//             dob: new Date(),
//             photo: 'test',
//         });

//         // create gifts
//         const giftOne = await Gift.create({
//             name: 'Gift 1',
//             friend: friend._id,
//         });
//         const giftTwo = await Gift.create({
//             name: 'Gift 2',
//             friend: friend._id,
//         });

//         // delete the friend
//         await friend.deleteOne();

//         // check if friend is deleted
//         const deletedFriend = await Friend.findById(friend);
//         expect(deletedFriend).toBeNull();

//         const deletedGiftOne = await Gift.findById(giftOne);
//         const deletedGiftTwo = await Gift.findById(giftTwo);

//         // check if gifts were deleted
//         expect(deletedGiftOne).toBeNull();
//         expect(deletedGiftTwo).toBeNull();
//     });
// });