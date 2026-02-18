// API Configuration for Team 12th Man Event Service
const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://ckj49oe5ya.execute-api.us-east-1.amazonaws.com/demo';

// Log configuration on load (helps with debugging)
console.log('🔧 API Configuration:', {
    baseUrl: API_BASE_URL,
    isProduction: !!import.meta.env.VITE_API_GATEWAY_URL
});

export { API_BASE_URL };

export const API_ENDPOINTS = {
    ping: `${API_BASE_URL}/ping`,
    events: `${API_BASE_URL}/events`,
    eventById: (id) => `${API_BASE_URL}/events/${id}`,
    rsvp: (id) => `${API_BASE_URL}/events/${id}/rsvp`,
};
