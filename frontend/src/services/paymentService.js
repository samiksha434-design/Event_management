import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const paymentApi = axios.create({
    baseURL: `${API_URL}/payment`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
paymentApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const paymentService = {
    initializePayment: async (email, amount, callback_url, eventId, registrationData) => {
        const response = await paymentApi.post('/initialize', { email, amount, callback_url, eventId, registrationData });
        return response.data;
    },

    verifyPayment: async (reference) => {
        const response = await paymentApi.get(`/verify/${reference}`);
        return response.data;
    }
};
