import bcrypt from 'bcrypt';

export const generateOtp =  () =>{
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const hashOtp = async (otp:string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
}

export const verifyOtp = async (otp:string , hashOtp:string) => {
    return bcrypt.compare(otp, hashOtp);
}
