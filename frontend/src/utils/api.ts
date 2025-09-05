import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers:{
        'Content-Type': 'application/json'
    },
    timeout: 5000
})

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if(token){
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
    return response
}, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
})





export const api = {
    register : async (name:string,email:string,password:string) => {
        try {
            const response = await apiClient.post('/auth/register',
            {
                name,
                email,
                password
            })
            return response.data
        } catch (error) {
            throw error;
        }
    },

    verifyOtp: async(email:string,otp:string) => {
        try {
            const response = await apiClient.post('/auth/verify-otp',{
                email,
                otp
            })
            return response.data
        } catch (error) {
            throw error;    
        }
    },
    

    login:async(email:string,password:string) => {
        try {
            const response = await apiClient.post('/auth/login', {
                email,
                password
            })
            return response.data        
        } catch (error) {
            throw error;
        }
    },


    getNotes: async () => {
        try {
            const response = await apiClient.get('/notes');
            return response.data
        } catch (error) {
            throw error;
        }
    },
    createNotes: async (title:string, content:string) => {
        try {
            const response = await apiClient.post('/notes',{
                title,
                content
            })
            return response.data
        } catch (error) {
            throw error;
        }
    },
    updateNotes : async (id:string,title:string,content:string) => {
        try {
            const response = await apiClient.put(`/notes/${id}`,{
                title,
                content
            })
            return response.data
        } catch (error) {
            throw error;
        }
    },

    deleteNotes :async (id:string) => {
        try {
            const response = await apiClient.delete(`/notes/${id}`);
            return response.data
        } catch (error) {
            throw error;
        }
    },

    resendOtp: async (email: string) => {
        try {
            const response = await apiClient.post('/auth/resend-otp', { email });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}