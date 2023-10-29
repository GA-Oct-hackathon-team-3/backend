import mongoose from "mongoose";
import userVerificationSchema from "./userVerificationSchema";

export default mongoose.model('UserVerification', userVerificationSchema);