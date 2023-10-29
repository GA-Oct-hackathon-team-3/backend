import mongoose, { CallbackError } from "mongoose";
import { compareHash, hashString } from "../utilities/cryptoService";
import userProfileSchema from "./userProfileSchema";
import userVerificationSchema from "./userVerificationSchema";
import { sendVerificationEmail } from "../utilities/verificationService";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validateEmailPattern, "{PATH} does not match acceptable email pattern"],
    },
    name: {
        type: String,
        required: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        enum: ["female", "male", "other"],
        required: true,
    },
    tel: {
        type: Number,
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_, ret) {
            delete ret.passwordHash;
            if (ret.dob instanceof Date) {
                ret.dob = ret.dob.toISOString().split('T')[0]; // Format date as 'yyyy-mm-dd'
            }
        }
    }
});

function validatePasswordPattern(val: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\.\*!@_\-\(\)\[\]\=\?\'\"\\\/\#\$\%\|\^\&\+\:\;\!\<\>])[a-zA-Z\d\.\*!@_\-\(\)\[\]\=\?\'\"\\\/\#\$\%\|\^\&\+\:\;\!\<\>]{8,}$/.test(val);
}

function validateEmailPattern(val: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/gi.test(val);
}

userSchema.pre("save", async function (next) {
    // Automatically create a new blank user profile when user is created
    if (this.isNew) {
        const Profile = mongoose.model("UserProfile", userProfileSchema);
        await Profile.create({ user: this._id });
        const Verification = mongoose.model("UserVerification", userVerificationSchema);
        await Verification.create({ user: this._id });
        sendVerificationEmail(this.email, this._id.toString());
    }

    if (this.isModified('dob')) {
        if (this.dob > new Date()) {
            const error = new Error('Date of birth cannot be in the future');
            return next(error);
        }
    }

    if (!this.isModified('passwordHash')) {
        return next();
    }
    try {
        if (!validatePasswordPattern(this.passwordHash!))
            throw new Error("Password must have at least 1 lower-case, 1 upper-case letter, 1 digit and 1 special character");
        this.passwordHash = await hashString(this.passwordHash!)
        next();
    } catch (error: any) {
        return next(error);
    }
});

userSchema.methods.checkPassword = function (password: string) {
    return compareHash(password, this.passwordHash);
}

export interface IUserMethods {
    checkPassword(password: string): Promise<boolean>;
}

export interface IUserDocument extends mongoose.Document, IUserMethods {
    email: string;
    name: string;
    passwordHash: string;
    tel: number;
    dob: Date;
    gender: string;
}

export default mongoose.model<IUserDocument>("User", userSchema);