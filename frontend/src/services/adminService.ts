import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

const API_URL = API_BASE_URL;

export const adminService = {
    // Verify admin status
    async verifyAdmin(token?: string): Promise<boolean> {
        try {
            const response = await axios.get(`${API_URL}/api/admin/verify`, {
                headers: getAuthHeaders(token),
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
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async getSubmissionById(id: string, token?: string) {
        const response = await axios.get(`${API_URL}/api/submissions/admin/${id}`, {
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async approveSubmission(id: string, token?: string, adminNotes?: string) {
        const response = await axios.put(
            `${API_URL}/api/submissions/admin/${id}/approve`,
            { adminNotes },
            {
                headers: getAuthHeaders(token),
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
                headers: getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    async deleteSubmission(id: string, token?: string) {
        const response = await axios.delete(`${API_URL}/api/submissions/admin/${id}`, {
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async getSubmissionStats(token?: string) {
        // Use new dedicated analytics endpoint
        try {
            const response = await axios.get(`${API_URL}/api/analytics/submissions`, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            // Transform to expected format [{name, value}]
            const stats = response.data;
            return [
                { name: 'تمت الموافقة', value: stats.find((s: any) => s.status === 'approved')?.count || 0 },
                { name: 'قيد الانتظار', value: stats.find((s: any) => s.status === 'pending')?.count || 0 },
                { name: 'مرفوضة', value: stats.find((s: any) => s.status === 'rejected')?.count || 0 }
            ];
        } catch (error) {
            console.error('Error fetching submission stats:', error);
            return [];
        }
    },

    // Company Management
    async getCompanyStats(token?: string) {
        // Use new dedicated analytics endpoint
        try {
            const response = await axios.get(`${API_URL}/api/analytics/companies/activity`, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return [
                { name: 'شركات نشطة', value: response.data.active || 0 },
                { name: 'شركات مجمدة', value: response.data.inactive || 0 }
            ];
        } catch (error) {
            console.error('Error fetching company stats:', error);
            return [];
        }
    },

    async getAllCompanies(token?: string) {
        const response = await axios.get(`${API_URL}/api/corporate/companies/admin/all`, {
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async createCompany(companyData: any, token?: string) {
        const response = await axios.post(
            `${API_URL}/api/corporate/companies/admin/create`,
            companyData,
            {
                headers: getAuthHeaders(token),
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
                headers: getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    async deleteCompany(id: string, token?: string) {
        const response = await axios.delete(`${API_URL}/api/corporate/companies/admin/${id}`, {
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async toggleCompanyActive(id: string, token?: string) {
        const response = await axios.put(
            `${API_URL}/api/corporate/companies/admin/${id}/toggle-active`,
            {},
            {
                headers: getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    // Trip Management
    async getTripStats(token?: string) {
        const response = await axios.get(`${API_URL}/api/corporate/trips/admin/stats`, {
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async getAllTrips(token?: string) {
        const response = await axios.get(`${API_URL}/api/corporate/trips/admin/all`, {
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async createTrip(tripData: any, token?: string) {
        const response = await axios.post(
            `${API_URL}/api/corporate/trips/admin/create`,
            tripData,
            {
                headers: getAuthHeaders(token),
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
                headers: getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    async deleteTrip(id: string, token?: string) {
        const response = await axios.delete(`${API_URL}/api/corporate/trips/admin/${id}`, {
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    async toggleTripActive(id: string, token?: string) {
        const response = await axios.put(
            `${API_URL}/api/corporate/trips/admin/${id}/toggle-active`,
            {},
            {
                headers: getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    // Analytics Methods (using new analytics endpoints)
    async getAnalytics(token?: string) {
        try {
            const response = await axios.get(`${API_URL}/api/analytics/overview`, {
                headers: getAuthHeaders(token),
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
                headers: getAuthHeaders(token),
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
                headers: getAuthHeaders(token),
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
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching top trips:', error);
            return [];
        }
    },

    async getDailyActivity(token?: string) {
        try {
            const weeklyData = await this.getWeeklyActivity(token);
            // Return trips and reactions per day
            return weeklyData.map((day: any) => ({
                day: day.dayName,
                trips: day.trips,
                reactions: day.reactions,
                users: day.users
            }));
        } catch (error) {
            return [];
        }
    },

    async getWeeklyUserGrowth(token?: string) {
        try {
            const weeklyData = await this.getWeeklyActivity(token);
            // For now, since we only have 7 days of data, we'll map days to "growth"
            // In a real app with more history, this would group by weeks
            return weeklyData.map((day: any) => ({
                week: day.dayName, // Using day name for now as we don't have historical weeks
                users: day.users
            }));
        } catch (error) {
            return [];
        }
    },

    async getCompositionStats(token?: string) {
        try {
            const analytics = await this.getAnalytics(token);
            const totalTrips = analytics.totalTrips || 0;
            const corporateTrips = analytics.totalCorporateTrips || 0;
            const regularTrips = totalTrips - corporateTrips;

            return [
                { name: 'رحلات شخصية', value: regularTrips },
                { name: 'رحلات شركات', value: corporateTrips }
            ];
        } catch (error) {
            return [
                { name: 'رحلات شخصية', value: 0 },
                { name: 'رحلات شركات', value: 0 }
            ];
        }
    },

    async getBestPerformingTrips(token?: string, limit: number = 10) {
        return this.getTopTrips(token, limit);
    },

    async getBestPerformingCompanies(token?: string, limit: number = 10) {
        try {
            const response = await axios.get(`${API_URL}/api/corporate/companies/admin/all`, {
                headers: getAuthHeaders(token),
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
    },

    async getReportsData(token?: string, period?: string, startDate?: string, endDate?: string) {
        try {
            const params: any = {};
            if (period) params.period = period;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await axios.get(`${API_URL}/api/analytics/reports`, {
                params,
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching reports data:', error);
            throw error;
        }
    }
};
