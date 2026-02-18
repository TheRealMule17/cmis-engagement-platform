// API Configuration
// Update VITE_API_GATEWAY_URL in .env when backend is deployed
export const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
    events: `${API_BASE_URL}/events`,
    eventById: (id) => `${API_BASE_URL}/events/${id}`,
    rsvp: (id) => `${API_BASE_URL}/events/${id}/rsvp`,
};

// For development/testing without backend
export const USE_MOCK_DATA = !import.meta.env.VITE_API_GATEWAY_URL;
