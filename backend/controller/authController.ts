import { Request, Response, NextFunction } from 'express';
import { generateOtp,  hashOtp } from '../utils/generateOTP';
import User from '../models/User';
import { transporter } from '../config/email';
import {verifyOtp as checkOtp} from '../utils/generateOTP';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'
import { sendResponse } from '../utils/response';
import { AppError } from '../middleware/errorMiddleware';


export const signUpOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return next(new AppError('Please fill all the fields', 400));
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new AppError('Please enter a valid email address', 400));
        }

        if (password.length < 6) {
            return next(new AppError('Password must be at least 6 characters long', 400));
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return next(new AppError('User already exists. You can login directly.', 400));
        }

        const otp = generateOtp();
        const otpHash = await hashOtp(otp);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            otpHash,
            otpExpiry,
            isVerified: false
        });

        await transporter.sendMail({
            from: `"Notes App" <no-reply@notesapp.com>`,
            to: user.email,
            subject: 'Your OTP for Account Verification - Notes App',
            html: `<p>Your OTP for account verification is: <strong>${otp}</strong></p>`
        });

        sendResponse(res, 200, 'OTP sent to your email successfully. Please check your inbox.', {
            email: user.email,
            otpExpiresAt: otpExpiry
        });

    } catch (error) {
        next(error);
    }
}

export const verifyOtp = async (req:Request, res:Response, next: NextFunction) => {
    try{
        const {email,otp} = req.body

        if(!email || !otp){
            return next(new AppError('Please provide all the fields', 400));
        }
        const user = await User.findOne({email});

    
        if( !user || !user.otpHash || !user.otpExpiry){
            return next(new AppError('Otp not requested', 400));
        }

        if(user.otpExpiry < new Date()){
            return next(new AppError('Otp expired', 400));
        }

        const isValid = await checkOtp (otp, user.otpHash);

        if(!isValid){
            return next(new AppError('Invalid Otp', 400));
        }

        user.otpHash = undefined;
        user.otpExpiry = undefined;
        user.isVerified = true;
        await user.save();

        const token  = jwt.sign(
            {
                userId:user._id,
                email:user.email
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn:'12h'
            }
        )

        sendResponse(res, 201, 'User verified successfully', {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    }catch(error){
        next(error);
    }
}



export const login = async (req:Request, res:Response, next: NextFunction) => {
    try {
        const {email,password} = req.body;

        if(!email || !password){
            return next(new AppError('All fields are required', 400));
        }

        const user = await User.findOne({email});

        if(!user){
            return next(new AppError('User not found', 404));
        }

       const isMatch = await bcrypt.compare(password, user.password as string);
       if(!isMatch){
        return next(new AppError('Invalid credentials', 400));
       }

       const token = jwt.sign({
        userId:user._id,
        email:user.email
       },
       process.env.JWT_SECRET as string,

       {expiresIn:'12h'}
    )
        sendResponse(res, 200, 'Login successfully', {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
         next(error);
    }
}

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        if (!email) {
            return next(new AppError('Email is required', 400));
        }

        const user = await User.findOne({ email });

        if (!user) {
            return next(new AppError('User not found', 404));
        }

        if (user.isVerified) {
            return next(new AppError('User is already verified', 400));
        }

        const otp = generateOtp();
        const otpHash = await hashOtp(otp);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otpHash = otpHash;
        user.otpExpiry = otpExpiry;

        await user.save();

        await transporter.sendMail({
            from: `"Notes App" <no-reply@notesapp.com>`,
            to: user.email,
            subject: 'Your New OTP for Account Verification - Notes App',
            html: `<p>Your new OTP for account verification is: <strong>${otp}</strong></p>`
        });

        sendResponse(res, 200, 'OTP resent to your email successfully. Please check your inbox.');

    } catch (error) {
        next(error);
    }
}
