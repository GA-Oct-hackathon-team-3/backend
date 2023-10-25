export interface IUser {
    _id: string;
}

export interface IExtReq {
    user?: IUser | null;
    filename?: string;
    fileExtension?: string;
}

export interface ILoginRequest {
    email: string;
    password: string;
}

export interface ILoginResponse {
    accessToken: string;
}

export interface IChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export interface ISignupRequest {
    email: string;
    password: string;
    name: string;
    dob: Date;
    gender: string;
    tel?: number;
}