import axios from 'axios';
import { Company, Trip, TripFilters } from '@/types/corporateTrips';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

const API_URL = API_BASE_URL;

export const corporateTripsService = {
    // Get all companies
    async getAllCompanies(): Promise<Company[]> {
        try {
            const response = await axios.get(`${API_URL}/api/corporate/companies`);
            return response.data.map((company: any) => ({
                ...company,
                id: company._id
            }));
        } catch (error) {
            console.error('Error fetching companies:', error);
            return [];
        }
    },

    // Get company by ID
    async getCompanyById(id: string): Promise<Company | undefined> {
        try {
            const response = await axios.get(`${API_URL}/api/corporate/companies/${id}`);
            return { ...response.data, id: response.data._id };
        } catch (error) {
            console.error('Error fetching company:', error);
            return undefined;
        }
    },

    // Get all trips
    async getAllTrips(): Promise<Trip[]> {
        try {
            const response = await axios.get(`${API_URL}/api/corporate/trips`);
            return response.data.trips.map((trip: any) => ({
                ...trip,
                id: trip.slug,
                companyId: trip.companyId._id || trip.companyId
            }));
        } catch (error) {
            console.error('Error fetching trips:', error);
            return [];
        }
    },

    // Get trip by slug
    async getTripBySlug(slug: string): Promise<Trip | undefined> {
        try {
            const response = await axios.get(`${API_URL}/api/corporate/trips/${slug}`);
            return {
                ...response.data,
                id: response.data.slug,
                companyId: response.data.companyId._id || response.data.companyId
            };
        } catch (error) {
            console.error('Error fetching trip:', error);
            return undefined;
        }
    },

    // Get trips by company
    async getTripsByCompany(companyId: string): Promise<Trip[]> {
        try {
            const response = await axios.get(`${API_URL}/api/corporate/trips/company/${companyId}`);
            return response.data.map((trip: any) => ({
                ...trip,
                id: trip.slug,
                companyId: trip.companyId._id || trip.companyId
            }));
        } catch (error) {
            console.error('Error fetching company trips:', error);
            return [];
        }
    },

    // Filter and search trips (client-side for now)
    async filterTrips(filters: TripFilters): Promise<Trip[]> {
        try {
            const params: any = {};
            if (filters.destination) params.destination = filters.destination;
            if (filters.companyId) params.companyId = filters.companyId;
            if (filters.season) params.season = filters.season;
            if (filters.minRating) params.minRating = filters.minRating;

            const response = await axios.get(`${API_URL}/api/corporate/trips`, { params });
            let trips = response.data.trips.map((trip: any) => ({
                ...trip,
                id: trip.slug,
                companyId: trip.companyId._id || trip.companyId
            }));

            // Client-side filtering for additional criteria
            if (filters.priceRange) {
                trips = trips.filter((trip: Trip) => {
                    const price = parseInt(trip.price);
                    return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
                });
            }

            if (filters.duration) {
                trips = trips.filter((trip: Trip) => trip.duration.includes(filters.duration!));
            }

            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase();
                trips = trips.filter((trip: Trip) =>
                    trip.title.toLowerCase().includes(query) ||
                    trip.destination.toLowerCase().includes(query) ||
                    trip.shortDescription.toLowerCase().includes(query)
                );
            }

            return trips;
        } catch (error) {
            console.error('Error filtering trips:', error);
            return [];
        }
    },

    // Get featured trips
    async getFeaturedTrips(limit: number = 4): Promise<Trip[]> {
        try {
            const response = await axios.get(`${API_URL}/api/corporate/trips/featured/top`, {
                params: { limit }
            });
            return response.data.map((trip: any) => ({
                ...trip,
                id: trip.slug,
                companyId: trip.companyId._id || trip.companyId
            }));
        } catch (error) {
            console.error('Error fetching featured trips:', error);
            return [];
        }
    },

    // Get unique destinations
    getDestinations(): string[] {
        // This will be populated from fetched trips
        return ['العلا', 'جدة', 'أبها', 'الرياض', 'الطائف', 'جزر فرسان', 'الربع الخالي', 'دبي'];
    },

    // Get price range
    getPriceRange(): { min: number; max: number } {
        return { min: 0, max: 5000 };
    },

    // Submit company registration
    async submitCompanyRegistration(data: {
        companyName: string;
        email: string;
        phone: string;
        whatsapp: string;
        tripTypes: string;
        message?: string;
    }, token?: string) {
        try {
            const response = await axios.post(`${API_URL}/api/submissions`, data, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error submitting company registration:', error);
            throw error;
        }
    }
};
