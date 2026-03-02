import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/notifications';

const notificationApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

notificationApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const notificationService = {
  // Send event result notification to all participants
  sendEventResultNotification: async (data) => {
    try {
      const response = await notificationApi.post('/email/sendEventResult', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send event result notifications');
    }
  },

  // Send event reminder to all participants
  sendEventReminder: async (data) => {
    try {
      const response = await notificationApi.post('/email/sendEventReminder', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send event reminders');
    }
  },

  // Send bulk emails
  sendBulkEmails: async (emails) => {
    try {
      const response = await notificationApi.post('/email/sendBulk', { emails });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send bulk emails');
    }
  },

  // Send single email notification
  sendEmail: async (to, subject, message) => {
    try {
      const response = await notificationApi.post('/email/send', { to, subject, message });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send email');
    }
  }
};

export default notificationService;
