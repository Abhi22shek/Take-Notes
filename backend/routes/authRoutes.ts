import { Router } from "express";
import {  login, signUpOtp ,verifyOtp} from "../controller/authController";


const router = Router();

router.post('/register', signUpOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login',login)



export default router;
