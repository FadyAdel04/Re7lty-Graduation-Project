import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to get auth headers
const getAuthHeaders = async (token?: string) => {
    const headers: any = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

export const contentReportsService = {
    // Submit a content report (authenticated users)
    async submitReport(
        tripId: string,
        reason: 'spam' | 'inappropriate' | 'misleading' | 'other',
        description?: string,
        token?: string
    ) {
        try {
            const response = await axios.post(
                `${API_URL}/api/content-reports`,
                { tripId, reason, description },
                {
                    headers: await getAuthHeaders(token),
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error submitting report:', error);
            throw error;
        }
    },

    // Get all reports (admin only)
    async getReports(token?: string, status?: 'pending' | 'resolved' | 'dismissed') {
        try {
            const params: any = {};
            if (status) params.status = status;

            const response = await axios.get(`${API_URL}/api/content-reports`, {
                params,
                headers: await getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    },

    // Get reports for a specific trip (admin only)
    async getTripReports(tripId: string, token?: string) {
        try {
            const response = await axios.get(`${API_URL}/api/content-reports/trip/${tripId}`, {
                headers: await getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching trip reports:', error);
            throw error;
        }
    },

    // Update report status (admin only)
    async updateReport(
        id: string,
        data: {
            status?: 'pending' | 'resolved' | 'dismissed';
            adminNotes?: string;
        },
        token?: string
    ) {
        try {
            const response = await axios.patch(`${API_URL}/api/content-reports/${id}`, data, {
                headers: await getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error updating report:', error);
            throw error;
        }
    },

    // Delete report (admin only)
    async deleteReport(id: string, token?: string) {
        try {
            const response = await axios.delete(`${API_URL}/api/content-reports/${id}`, {
                headers: await getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting report:', error);
            throw error;
        }
    },
};
