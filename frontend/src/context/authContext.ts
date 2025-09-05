import React, { createContext, useEffect, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import { api } from '../utils/api';
import type { User } from '../types';
import type { AuthContextType } from '../types';
import { showToast } from '../utils/toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isInitializing, setIsInitializing] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeAuth = async () => {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (savedToken && savedUser) {
                try {
                    // Set token first so API calls work
                    setToken(savedToken);
                    
                    // Validate token by making a test API call
                    await api.getNotes();
                    
                    // If successful, restore user state
                    setUser(JSON.parse(savedUser) as User);
                } catch (error) {
                    // Token is invalid, clear auth state
                    console.log('Token validation failed, clearing auth state');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsInitializing(false);
        };

        initializeAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const toastId = showToast.loading('Login... ⏳');
        try {
            setIsLoading(true);
            setError(null);

            const response = await api.login(email, password) as any;

            console.log('Login response:', response);

            if (!response.token || !response.user) {
                throw new Error('Invalid response from server');
            }

            setToken(response.token);
            setUser(response.user);

            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            showToast.update(toastId, `Welcome back, ${response.user.name}! 🎉`, 'success');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            setError(errorMessage);

            showToast.update(toastId, `Login failed: ${errorMessage} ❌`, 'error');

            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        const toastId = showToast.loading('Creating account... ⏳');
        try {
            setIsLoading(true);
            setError(null);

            await api.register(name, email, password);

            showToast.update(toastId, 'Account created. Check your email for OTP', 'success');
            return { success: true };
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Signup failed';
            setError(errorMessage);
            showToast.update(toastId, errorMessage, 'error');
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };


     const verifyOtp = async (email: string, otp: string) => {
        if (!email || !email.trim() || !otp || !otp.trim()) {
            const errorMessage = 'Email and OTP are required';
            setError(errorMessage);
            showToast.error(`${errorMessage} ❌`);
            throw new Error(errorMessage);
        }

        const otpRegex = /^\d{6}$/;
        if (!otpRegex.test(otp.trim())) {
            const errorMessage = 'OTP must be a 6-digit number';
            setError(errorMessage);
            showToast.error(`${errorMessage} ❌`);
            throw new Error(errorMessage);
        }

        const toastId = showToast.loading('Verifying OTP... ⏳');
        try {
            setIsLoading(true);
            setError(null);

            const response = await api.verifyOtp(email.trim(), otp.trim());
            
            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error('Invalid response from server');
            }

            setToken(token);
            setUser(user);

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            showToast.update(toastId, `Welcome, ${user.name || 'User'}! Account verified successfully 🎉`, 'success');

            return response.data;
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'OTP verification failed';
            setError(errorMessage);
            showToast.update(toastId, errorMessage, 'error');
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
  

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        showToast.info('Logged out 👋');
    };

    const resendOtp = async (email: string) => {
        const toastId = showToast.loading('Resending OTP... ⏳');
        try {
            setIsLoading(true);
            setError(null);
            await api.resendOtp(email);
            showToast.update(toastId, 'OTP resent successfully! Check your email', 'success');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP';
            setError(errorMessage);
            showToast.update(toastId, `Failed to resend OTP: ${errorMessage}`, 'error');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        token,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        loading: isLoading,
        error,
        isInitializing,
    };

    return React.createElement(AuthContext.Provider, { value }, children);
};


