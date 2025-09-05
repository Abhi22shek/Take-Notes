import { Router } from "express";
import {  login, signUpOtp ,verifyOtp, resendOtp} from "../controller/authController";


const router = Router();

router.post('/register', signUpOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login',login)
router.post('/resend-otp', resendOtp);



export default router;
