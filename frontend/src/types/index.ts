export interface User {
    id:string;
    name:string;
    email:string;
}

export interface Note {
    id: string,
    _id?: string,
    title: string,
    content: string,
    createdAt: string,
    updatedAt?: string
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email:string,password:string) => Promise<void>;
    register: (name:string,email:string,password:string) => Promise<{success?:boolean;userExists?:boolean}>;
    verifyOtp : (email:string,otp:string) => Promise<void>;
    resendOtp : (email:string) => Promise<void>;
    logout: () => void;
    loading:boolean;
    error:string | null;
    isInitializing?: boolean;
}