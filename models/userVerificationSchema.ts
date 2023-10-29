import mongoose from "mongoose";

const userVerificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    isVerified:{
        type: Boolean,
        required: true,
        default: false
    }
},
{
    timestamps: true
});

export default userVerificationSchema;