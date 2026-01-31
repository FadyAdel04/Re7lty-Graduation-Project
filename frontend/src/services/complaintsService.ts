import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

export const complaintsService = {
    // Submit a new complaint (public)
    async submitComplaint(data: {
        name: string;
        email: string;
        subject?: string;
        message: string;
    }, token?: string) {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/complaints`, data, {
                headers: getAuthHeaders(token),
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

            const response = await axios.get(`${API_BASE_URL}/api/complaints`, {
                params,
                headers: getAuthHeaders(token),
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
            const response = await axios.patch(`${API_BASE_URL}/api/complaints/${id}`, data, {
                headers: getAuthHeaders(token),
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
            const response = await axios.delete(`${API_BASE_URL}/api/complaints/${id}`, {
                headers: getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting complaint:', error);
            throw error;
        }
    },
    // === Comment Moderation Endpoints (Admin) ===

    async getCommentStats(token?: string) {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/complaints/comments/stats`, {
                headers: getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching comment stats:', error);
            throw error;
        }
    },

    async getRemovedComments(token?: string, page = 1) {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/complaints/comments/removed`, {
                params: { page },
                headers: getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching removed comments:', error);
            throw error;
        }
    },

    async getAllComments(token?: string, page = 1) {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/complaints/comments/all`, {
                params: { page },
                headers: getAuthHeaders(token),
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching all comments:', error);
            throw error;
        }
    }
};
