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
    },

    // Analytics Methods (using new analytics endpoints)
    async getAnalytics(token?: string) {
        try {
            const response = await axios.get(`${API_URL}/api/analytics/overview`, {
                headers: await getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            // Return default structure to avoid breaking the dashboard
            return {
                totalUsers: 0,
                weeklyActiveUsers: 0,
                totalTrips: 0,
                weeklyTrips: 0,
                totalReactions: 0,
                weeklyReactions: 0,
                totalComments: 0,
                weeklyComments: 0,
                totalCompanies: 0,
                totalCorporateTrips: 0
            };
        }
    },

    async getWeeklyActivity(token?: string) {
        try {
            const response = await axios.get(`${API_URL}/api/analytics/weekly-activity`, {
                headers: await getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching weekly activity:', error);
            return [];
        }
    },

    async getAllUsers(token?: string) {
        try {
            const response = await axios.get(`${API_URL}/api/analytics/users/all`, {
                headers: await getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching all users:', error);
            return [];
        }
    },

    async getTopTrips(token?: string, limit: number = 5) {
        try {
            const response = await axios.get(`${API_URL}/api/analytics/top-trips?limit=${limit}`, {
                headers: await getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching top trips:', error);
            return [];
        }
    },

    async getDailySales(token?: string) {
        // Use weekly activity data for daily sales
        try {
            const weeklyData = await this.getWeeklyActivity(token);
            return weeklyData.map((day: any) => ({
                day: day.dayName,
                sales: day.trips * 5000 + day.reactions * 100 // Mock revenue calculation
            }));
        } catch (error) {
            return [];
        }
    },

    async getWeeklySales(token?: string) {
        // Aggregate weekly data into weeks
        try {
            const weeklyData = await this.getWeeklyActivity(token);
            const weeks = ['الأسبوع 1'];
            const totalSales = weeklyData.reduce((sum: number, day: any) =>
                sum + (day.trips * 5000 + day.reactions * 100), 0
            );
            return [{ week: weeks[0], sales: totalSales }];
        } catch (error) {
            return [];
        }
    },

    async getOrderStatus(token?: string) {
        // Mock data based on real metrics - can be enhanced later
        try {
            const analytics = await this.getAnalytics(token);
            const total = analytics.totalTrips || 100;
            return [
                { name: 'مؤكد', value: Math.floor(total * 0.65) },
                { name: 'قيد التنفيذ', value: Math.floor(total * 0.25) },
                { name: 'ملغي', value: Math.floor(total * 0.10) }
            ];
        } catch (error) {
            return [
                { name: 'مؤكد', value: 145 },
                { name: 'قيد التنفيذ', value: 67 },
                { name: 'ملغي', value: 23 }
            ];
        }
    },

    async getBestPerformingTrips(token?: string, limit: number = 10) {
        return this.getTopTrips(token, limit);
    },

    async getBestPerformingCompanies(token?: string, limit: number = 10) {
        try {
            const response = await axios.get(`${API_URL}/api/corporate/companies/admin/all`, {
                headers: await getAuthHeaders(token),
                withCredentials: true
            });

            // Sort by tripsCount and return top performers
            const companies = response.data || [];
            return companies
                .sort((a: any, b: any) => (b.tripsCount || 0) - (a.tripsCount || 0))
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching best performing companies:', error);
            return [];
        }
    }
};
