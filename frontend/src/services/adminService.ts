import axios from 'axios';

// Normalize API URL: remove trailing slashes to avoid double slashes in URLs
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = rawApiUrl.replace(/\/+$/, ''); // Remove trailing slashes

// Helper to get auth headers with Clerk token
const getAuthHeaders = async (token?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

export const adminService = {
    // Verify admin status
    async verifyAdmin(token?: string): Promise<boolean> {
        try {
            const response = await axios.get(`${API_URL}/api/admin/verify`, {
                headers: await getAuthHeaders(token),
                withCredentials: true
            });
            return response.data.isAdmin;
        } catch (error) {
            return false;
        }
    },

    // Submission Management
    async getSubmissions(token?: string, status?: string) {
        const response = await axios.get(`${API_URL}/api/submissions/admin`, {
            params: { status },
            headers: await getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async getSubmissionById(id: string, token?: string) {
        const response = await axios.get(`${API_URL}/api/submissions/admin/${id}`, {
            headers: await getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async approveSubmission(id: string, token?: string, adminNotes?: string) {
        const response = await axios.put(
            `${API_URL}/api/submissions/admin/${id}/approve`,
            { adminNotes },
            {
                headers: await getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    async rejectSubmission(id: string, rejectionReason: string, token?: string, adminNotes?: string) {
        const response = await axios.put(
            `${API_URL}/api/submissions/admin/${id}/reject`,
            { rejectionReason, adminNotes },
            {
                headers: await getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    async deleteSubmission(id: string, token?: string) {
        const response = await axios.delete(`${API_URL}/api/submissions/admin/${id}`, {
            headers: await getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async getSubmissionStats(token?: string) {
        const response = await axios.get(`${API_URL}/api/submissions/admin/stats`, {
            headers: await getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    // Company Management
    async getCompanyStats(token?: string) {
        const response = await axios.get(`${API_URL}/api/corporate/companies/admin/stats`, {
            headers: await getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async getAllCompanies(token?: string) {
        const response = await axios.get(`${API_URL}/api/corporate/companies/admin/all`, {
            headers: await getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async createCompany(companyData: any, token?: string) {
        const response = await axios.post(
            `${API_URL}/api/corporate/companies/admin/create`,
            companyData,
            {
                headers: await getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    async updateCompany(id: string, companyData: any, token?: string) {
        const response = await axios.put(
            `${API_URL}/api/corporate/companies/admin/${id}`,
            companyData,
            {
                headers: await getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    async deleteCompany(id: string, token?: string) {
        const response = await axios.delete(`${API_URL}/api/corporate/companies/admin/${id}`, {
            headers: await getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async toggleCompanyActive(id: string, token?: string) {
        const response = await axios.put(
            `${API_URL}/api/corporate/companies/admin/${id}/toggle-active`,
            {},
            {
                headers: await getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    // Trip Management
    async getTripStats(token?: string) {
        const response = await axios.get(`${API_URL}/api/corporate/trips/admin/stats`, {
            headers: await getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async getAllTrips(token?: string) {
        const response = await axios.get(`${API_URL}/api/corporate/trips/admin/all`, {
            headers: await getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async createTrip(tripData: any, token?: string) {
        const response = await axios.post(
            `${API_URL}/api/corporate/trips/admin/create`,
            tripData,
            {
                headers: await getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    async updateTrip(id: string, tripData: any, token?: string) {
        const response = await axios.put(
            `${API_URL}/api/corporate/trips/admin/${id}`,
            tripData,
            {
                headers: await getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    async deleteTrip(id: string, token?: string) {
        const response = await axios.delete(`${API_URL}/api/corporate/trips/admin/${id}`, {
            headers: await getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async toggleTripActive(id: string, token?: string) {
        const response = await axios.put(
            `${API_URL}/api/corporate/trips/admin/${id}/toggle-active`,
            {},
            {
                headers: await getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    }
};
