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

export const complaintsService = {
    // Submit a new complaint (public)
    async submitComplaint(data: {
        name: string;
        email: string;
        subject?: string;
        message: string;
    }, token?: string) {
        try {
            const headers = await getAuthHeaders(token);
            const response = await axios.post(`${API_URL}/api/complaints`, data, {
                headers,
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error submitting complaint:', error);
            throw error;
        }
    },

    // Get all complaints (admin only)
    async getComplaints(token?: string, status?: 'pending' | 'resolved' | 'dismissed') {
        try {
            const params: any = {};
            if (status) params.status = status;

            const response = await axios.get(`${API_URL}/api/complaints`, {
                params,
                headers: await getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching complaints:', error);
            throw error;
        }
    },

    // Update complaint status (admin only)
    async updateComplaint(
        id: string,
        data: {
            status?: 'pending' | 'resolved' | 'dismissed';
            adminNotes?: string;
        },
        token?: string
    ) {
        try {
            const response = await axios.patch(`${API_URL}/api/complaints/${id}`, data, {
                headers: await getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error updating complaint:', error);
            throw error;
        }
    },

    // Delete complaint (admin only)
    async deleteComplaint(id: string, token?: string) {
        try {
            const response = await axios.delete(`${API_URL}/api/complaints/${id}`, {
                headers: await getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting complaint:', error);
            throw error;
        }
    },
};
