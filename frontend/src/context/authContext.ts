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
            let errorMessage = 'Signup failed';

            // Handle axios errors
            if (err?.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err?.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err?.message) {
                errorMessage = err.message;
            }

            console.log('Registration error:', errorMessage);

            // Check if user already exists
            if (
                errorMessage.toLowerCase().includes('exists') ||
                errorMessage.toLowerCase().includes('already') ||
                errorMessage.toLowerCase().includes('duplicate') ||
                errorMessage.toLowerCase().includes('registered')
            ) {
                errorMessage = 'User already exists';
                setError(errorMessage);
                showToast.update(toastId, errorMessage, 'error');
                return { userExists: true };
            }

            setError(errorMessage);
            showToast.update(toastId, errorMessage, 'error');
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };


     const verifyOtp = async (email: string, otp: string) => {
        // Input validation
        if (!email || !email.trim()) {
            const errorMessage = 'Email is required for OTP verification';
            setError(errorMessage);
            showToast.error(`${errorMessage} ❌`);
            throw new Error(errorMessage);
        }

        if (!otp || !otp.trim()) {
            const errorMessage = 'OTP is required';
            setError(errorMessage);
            showToast.error(`${errorMessage} ❌`);
            throw new Error(errorMessage);
        }

        // Validate OTP format (assuming 6-digit numeric OTP)
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
            
            // Log response for debugging
            console.log('API Response:', response);

            // Handle different possible response structures
            let responseData;
            if (response?.data) {
                responseData = response.data;
            } else if (response?.token && response?.user) {
                // Direct response without .data wrapper
                responseData = response;
            } else if (response) {
                // Response might be the data itself
                responseData = response;
            } else {
                throw new Error('No response received from server');
            }

            // Validate that we have the required fields
            const token = responseData.token || responseData.accessToken || responseData.access_token;
            const user = responseData.user || responseData.userData || responseData.data?.user;

            if (!token) {
                console.error('Missing token in response:', responseData);
                throw new Error('Authentication token not received from server');
            }

            if (!user) {
                console.error('Missing user data in response:', responseData);
                throw new Error('User information not received from server');
            }

            setToken(token);
            setUser(user);

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            showToast.update(toastId, `Welcome, ${user.name || 'User'}! Account verified successfully 🎉`, 'success');

            return responseData; // Return the response data for potential use by caller
        } catch (err: unknown) {
            console.error('OTP Verification Error:', err);
            
            let errorMessage = 'OTP verification failed';
            
            if (err instanceof Error) {
                errorMessage = err.message;
            }

            // Handle specific error cases
            if (errorMessage.toLowerCase().includes('expired')) {
                errorMessage = 'OTP has expired. Please request a new one';
            } else if (errorMessage.toLowerCase().includes('invalid')) {
                errorMessage = 'Invalid OTP. Please check and try again';
            } else if (errorMessage.toLowerCase().includes('network')) {
                errorMessage = 'Network error. Please check your connection and try again';
            } else if (errorMessage.toLowerCase().includes('token')) {
                errorMessage = 'Server authentication error. Please try again or contact support';
            }

            setError(errorMessage);

            showToast.update(toastId, `${errorMessage} ❌`, 'error');

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

    const value: AuthContextType = {
        user,
        token,
        login,
        register,
        verifyOtp,
        logout,
        loading: isLoading,
        error,
        isInitializing,
    };

    return React.createElement(AuthContext.Provider, { value }, children);
};


