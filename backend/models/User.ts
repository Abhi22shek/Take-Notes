import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';


export interface IUser extends Document{
    name: string;
    email:string;
    password?: string;
    googleId?:string;
    otpHash?:string;
    otpExpiry?: Date;
    createdAt: Date;
}

 const User = new Schema<IUser>({
    name: {type:String, required:true},
    email: {type:String, required:true, unique:true},
    password: {type:String},
    googleId: {type:String},
    otpHash: {type:String},
    otpExpiry: {type:Date},
    createdAt: {type:Date, default: Date.now}
},
    {timestamps:true}

)

//bcrypt password before saving to db
User.pre('save', async function (this: mongoose.Document & IUser, next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
});



export default mongoose.model<IUser>('User', User);