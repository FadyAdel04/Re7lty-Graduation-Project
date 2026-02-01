import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

const API_URL = API_BASE_URL;

export const companyService = {
    // Get current user's company profile
    async getMyCompany(token?: string) {
        const response = await axios.get(`${API_URL}/api/corporate/companies/me`, {
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    // Update current user's company profile
    async updateMyCompany(companyData: any, token?: string) {
        const response = await axios.put(
            `${API_URL}/api/corporate/companies/me`,
            companyData,
            {
                headers: getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    // Get company dashboard stats (trips, bookings, etc.)
    // We can add more specific methods here later
};
