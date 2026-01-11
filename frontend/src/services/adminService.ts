import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to get auth headers from Clerk
const getAuthHeaders = async () => {
    // This will be populated by Clerk's session token
    return {
        'Content-Type': 'application/json'
    };
};

export const adminService = {
    // Verify admin status
    async verifyAdmin(): Promise<boolean> {
        try {
            const response = await axios.get(`${API_URL}/api/admin/verify`, {
                headers: await getAuthHeaders(),
                withCredentials: true
            });
            return response.data.isAdmin;
        } catch (error) {
            return false;
        }
    },

    // Submission Management
    async getSubmissions(status?: string) {
        const response = await axios.get(`${API_URL}/api/submissions/admin`, {
            params: { status },
            headers: await getAuthHeaders(),
            withCredentials: true
        });
        return response.data;
    },

    async getSubmissionById(id: string) {
        const response = await axios.get(`${API_URL}/api/submissions/admin/${id}`, {
            headers: await getAuthHeaders(),
            withCredentials: true
        });
        return response.data;
    },

    async approveSubmission(id: string, adminNotes?: string) {
        const response = await axios.put(
            `${API_URL}/api/submissions/admin/${id}/approve`,
            { adminNotes },
            {
                headers: await getAuthHeaders(),
                withCredentials: true
            }
        );
        return response.data;
    },

    async rejectSubmission(id: string, rejectionReason: string, adminNotes?: string) {
        const response = await axios.put(
            `${API_URL}/api/submissions/admin/${id}/reject`,
            { rejectionReason, adminNotes },
            {
                headers: await getAuthHeaders(),
                withCredentials: true
            }
        );
        return response.data;
    },

    async deleteSubmission(id: string) {
        const response = await axios.delete(`${API_URL}/api/submissions/admin/${id}`, {
            headers: await getAuthHeaders(),
            withCredentials: true
        });
        return response.data;
    },

    async getSubmissionStats() {
        const response = await axios.get(`${API_URL}/api/submissions/admin/stats`, {
            headers: await getAuthHeaders(),
            withCredentials: true
        });
        return response.data;
    },

    // Company Management
    async getCompanyStats() {
        const response = await axios.get(`${API_URL}/api/corporate/companies/admin/stats`, {
            headers: await getAuthHeaders(),
            withCredentials: true
        });
        return response.data;
    },

    async getAllCompanies() {
        const response = await axios.get(`${API_URL}/api/corporate/companies/admin/all`, {
            headers: await getAuthHeaders(),
            withCredentials: true
        });
        return response.data;
    },

    async createCompany(companyData: any) {
        const response = await axios.post(
            `${API_URL}/api/corporate/companies/admin/create`,
            companyData,
            {
                headers: await getAuthHeaders(),
                withCredentials: true
            }
        );
        return response.data;
    },

    async updateCompany(id: string, companyData: any) {
        const response = await axios.put(
            `${API_URL}/api/corporate/companies/admin/${id}`,
            companyData,
            {
                headers: await getAuthHeaders(),
                withCredentials: true
            }
        );
        return response.data;
    },

    async deleteCompany(id: string) {
        const response = await axios.delete(`${API_URL}/api/corporate/companies/admin/${id}`, {
            headers: await getAuthHeaders(),
            withCredentials: true
        });
        return response.data;
    },

    async toggleCompanyActive(id: string) {
        const response = await axios.put(
            `${API_URL}/api/corporate/companies/admin/${id}/toggle-active`,
            {},
            {
                headers: await getAuthHeaders(),
                withCredentials: true
            }
        );
        return response.data;
    },

    // Trip Management
    async getTripStats() {
        const response = await axios.get(`${API_URL}/api/corporate/trips/admin/stats`, {
            headers: await getAuthHeaders(),
            withCredentials: true
        });
        return response.data;
    },

    async getAllTrips() {
        const response = await axios.get(`${API_URL}/api/corporate/trips/admin/all`, {
            headers: await getAuthHeaders(),
            withCredentials: true
        });
        return response.data;
    },

    async createTrip(tripData: any) {
        const response = await axios.post(
            `${API_URL}/api/corporate/trips/admin/create`,
            tripData,
            {
                headers: await getAuthHeaders(),
                withCredentials: true
            }
        );
        return response.data;
    },

    async updateTrip(id: string, tripData: any) {
        const response = await axios.put(
            `${API_URL}/api/corporate/trips/admin/${id}`,
            tripData,
            {
                headers: await getAuthHeaders(),
                withCredentials: true
            }
        );
        return response.data;
    },

    async deleteTrip(id: string) {
        const response = await axios.delete(`${API_URL}/api/corporate/trips/admin/${id}`, {
            headers: await getAuthHeaders(),
            withCredentials: true
        });
        return response.data;
    },

    async toggleTripActive(id: string) {
        const response = await axios.put(
            `${API_URL}/api/corporate/trips/admin/${id}/toggle-active`,
            {},
            {
                headers: await getAuthHeaders(),
                withCredentials: true
            }
        );
        return response.data;
    }
};
