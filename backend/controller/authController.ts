import { Request, Response } from 'express';
import { generateOtp,  hashOtp } from '../utils/generateOTP';
import User from '../models/User';
import { transporter } from '../config/email';
import {verifyOtp as checkOtp} from '../utils/generateOTP';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'



export const signUpOtp = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Please fill all the fields' 
            });
        }

        // Email format validation (basic)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                message: 'Please enter a valid email address' 
            });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: "User already exists. You can login directly." 
            });
        }

        // Generate OTP
        const otp = generateOtp();
        const otpHash = await hashOtp(otp);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create new user with OTP details
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password, // Make sure this is hashed in your User model pre-save hook
            otpHash,
            otpExpiry,
            isVerified: false
        });

        // Send OTP via email
        const emailInfo = await transporter.sendMail({
            from: `"Notes App" <no-reply@notesapp.com>`,
            to: user.email,
            subject: 'Your OTP for Account Verification - Notes App',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Account Verification</h2>
                    <p>Hello ${user.name},</p>
                    <p>Your OTP for account verification is:</p>
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="color: #666;">This OTP is valid for 10 minutes only.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
                </div>
            `,
            text: `Hello ${user.name},\n\nYour OTP for account verification is: ${otp}\n\nThis OTP is valid for 10 minutes only.\n\nIf you didn't request this, please ignore this email.`
        });

        console.log(`OTP sent to ${email} - MessageID: ${emailInfo.messageId}`);

        return res.status(200).json({ 
            success: true,
            message: 'OTP sent to your email successfully. Please check your inbox.',
            data: {
                email: user.email,
                otpExpiresAt: otpExpiry
            }
        });

    } catch (error) {
        console.error('SignUp OTP Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred. Please try again later.'
        });
    }
}

export const verifyOtp = async (req:Request, res:Response) => {
    try{
        const {email,otp} = req.body

        if(!email || !otp){
            return res.status(400).json({message: 'Please provide all the fields'});
        }
        const user = await User.findOne({email});

    
        if( !user || !user.otpHash || !user.otpExpiry){
            return res.status(400).json({message: 'Otp not requested'});
        }

        if(user.otpExpiry < new Date()){
            return res.status(400).json({message: 'Otp expired'});
        }

        const isValid = await checkOtp (otp, user.otpHash);

        if(!isValid){
            return res.status(400).json({message:"Invalid Otp"});
        }

        user.otpHash = undefined;
        user.otpExpiry = undefined;
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

        res.status(201).json({
            message:'User verified successfully',
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email
            }
        })

    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Server error' });
    }
}



export const login = async (req:Request, res:Response) => {
    try {
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({message:"All fields are required"})
        }

        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                message:"User not found"
            })
        }

       const isMatch = await bcrypt.compare(password, user.password as string);
       if(!isMatch){
        return res.status(400).json({
            message:"Invalid credentials"
        });
       }

       const token = jwt.sign({
        userId:user._id,
        email:user.email
       },
       process.env.JWT_SECRET as string,

       {expiresIn:'12h'}
    )
        res.status(201).json({
            token,
            user:{
                userId:user._id,
                email:user.email,
                name:user.name,
            },
            message:"login successfully"
        })
    } catch (error) {
         res.status(500).json({ message: "Server error" });
    }
}
