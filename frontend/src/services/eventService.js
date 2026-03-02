import axios from 'axios';

// Base URL for event service through API Gateway
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/events';

// Create axios instance with default config
const eventApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available

eventApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Event service functions
const eventService = {
  // Get all events
  getAllEvents: async (filters = {}) => {
    try {
      const response = await eventApi.get('/', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch events');
    }
  },

  // Get event by ID
  getEventById: async (eventId) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid _id: ' + eventId);
    }

    try {
      const response = await eventApi.get(`/${eventId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event details');
    }
  },

  // Create new event
  createEvent: async (eventData) => {
    try {
      const response = await eventApi.post('/', eventData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('CreateEvent error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      const serverMsg = error.response?.data?.message || error.response?.data || error.message;
      throw new Error(typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg));
    }
  },

  // Update event
  updateEvent: async (eventId, eventData) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for update');
    }

    try {
      const response = await eventApi.put(`/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update event');
    }
  },

  // Delete event
  deleteEvent: async (eventId) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for delete');
    }

    try {
      const response = await eventApi.delete(`/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete event');
    }
  },

  // Get user event history
  getUserEventHistory: async () => {
    try {
      const response = await eventApi.get('/history');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event history');
    }
  },

  // Download certificate
  getCertificate: async (eventId) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for certificate');
    }

    try {
      const response = await eventApi.get(`/${eventId}/certificate`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      if (error.response && error.response.data instanceof Blob) {
        let json;
        let textContent = '';
        try {
          textContent = await error.response.data.text();
          json = JSON.parse(textContent);
        } catch (e) {
          throw new Error(`Server returned error status ${error.response.status}. Raw response: ${textContent.substring(0, 100)}`);
        }
        throw new Error(`Server Error: ${json.message || 'Unknown server error'}`);
      }
      // If it's a network error or no response
      throw new Error(`Network/Request Error: ${error.message}`);
    }
  },

  // Submit feedback
  submitFeedback: async (eventId, feedbackData) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for feedback');
    }

    try {
      const response = await eventApi.post(`/${eventId}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit feedback');
    }
  },

  // Vote for event
  voteForEvent: async (eventId, voteData) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for voting');
    }

    try {
      const response = await eventApi.post(`/${eventId}/vote`, voteData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit vote');
    }
  },

  // Verify votes (admin only)
  verifyVotes: async (eventId) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for vote verification');
    }

    try {
      const response = await eventApi.put(`/${eventId}/verify-votes`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to verify votes');
    }
  },

  // Get event analytics
  getEventAnalytics: async (college) => {
    try {
      const params = college ? { college } : {};
      const response = await eventApi.get('/analytics', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics');
    }
  },

  // Register for an event
  registerForEvent: async (eventId, registrationData) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for registration');
    }

    try {
      const response = await eventApi.post(`/${eventId}/register`, registrationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to register for event');
    }
  },

  // Cancel event registration
  cancelRegistration: async (eventId) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for cancellation');
    }

    try {
      const response = await eventApi.delete(`/${eventId}/register`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel registration');
    }
  },

  // Get event participants (organizer/admin)
  getEventParticipants: async (eventId) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for participants');
    }

    try {
      const response = await eventApi.get(`/${eventId}/participants`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch participants');
    }
  },

  // Update participant attendance and rank
  updateAttendance: async (eventId, attendanceData) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for attendance update');
    }

    try {
      const response = await eventApi.put(`/${eventId}/attendance`, attendanceData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update attendance');
    }
  }
};

export default eventService;
