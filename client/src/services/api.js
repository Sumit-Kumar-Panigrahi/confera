const API_BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export const getApiUrl = () => API_BASE;

export const createApiClient = (getToken) => {
  const request = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (getToken) {
      try {
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn('Failed to retrieve Clerk auth token:', err);
      }
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  };

  return {
    createMeeting: (title) => request('/api/meetings', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
    getMeeting: (meetingId) => request(`/api/meetings/${meetingId}`),
    endMeeting: (meetingId) => request(`/api/meetings/${meetingId}/end`, {
      method: 'PATCH',
    }),
    getUserSessions: () => request('/api/meetings/sessions'),
    getSessionDetails: (id) => request(`/api/meetings/sessions/${id}`),
    getMeetingStats: () => request('/api/meetings/stats'),
  };
};
