import mongoose from 'mongoose';
import Gift from './gift';

const friendSchema = new mongoose.Schema({
    firstName: {
        type: String,
        maxLength: 30,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        maxLength: 30,
        required: true,
        trim: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    photo: {
        type: String,
        required: true,
        default: 'some url'
    },
    bio: {
        type: String,
        maxLength: 200,
        trim: true,
    },
    interests: {
        type: [ String ],
    },
    tags: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tags'
        }
    ],
    gifts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GiftRecommendations'
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// validation for DOB input
friendSchema.pre('save', function (next) {
    const now = new Date();
    if (this.dob > now) {
        const error = new Error('Date of birth cannot be in the future');
        return next(error);
    }
    next();
});

export interface IFriendDocument extends mongoose.Document {
    firstName: string;
    lastName: string;
    dob: Date;
    photo: string;
    bio: string;
    interests: string[];
    tags: mongoose.Types.ObjectId[],
    gifts: mongoose.Types.ObjectId[],
    user: mongoose.Types.ObjectId[],
}

export default mongoose.model <IFriendDocument> ('Friend', friendSchema);
