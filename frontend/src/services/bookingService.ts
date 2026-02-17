import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

const API_URL = API_BASE_URL;

export interface Booking {
    _id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    tripId: string;
    tripTitle: string;
    tripDestination: string;
    tripPrice: string;
    transportationType?: string;
    companyId: string;
    companyName: string;
    numberOfPeople: number;
    bookingDate: string;
    specialRequests: string;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    statusUpdatedAt?: string;
    rejectionReason?: string;
    totalPrice: number;
    bookingReference: string;
    seatNumber?: string;
    selectedSeats?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface BookingAnalytics {
    overview: {
        totalBookings: number;
        pendingBookings: number;
        acceptedBookings: number;
        todayBookings: number;
        weekBookings: number;
        monthBookings: number;
    };
    revenue: {
        total: number;
        commission: number;
        net: number;
        today: number;
        week: number;
        month: number;
        paid: number;
        paidCommission: number;
        paidNet: number;
        pending: number;
        refunded: number;
    };
    bookingsByTrip: Array<{
        _id: string;
        count: number;
        revenue: number;
        commission: number;
        net: number;
    }>;
    dailyBookings: Array<{
        _id: string;
        count: number;
        revenue: number;
        commission: number;
        net: number;
    }>;
}

export const bookingService = {
    // Create a new booking
    createBooking: async (data: {
        tripId: string;
        numberOfPeople: number;
        bookingDate: string;
        userPhone: string;
        firstName: string;
        lastName: string;
        email: string;
        specialRequests?: string;
        selectedSeats?: string[];
    }, token?: string): Promise<{ success: boolean; booking: Booking }> => {
        try {
            const response = await axios.post(`${API_URL}/api/bookings`, data, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    },

    // Get user's bookings
    getMyBookings: async (token?: string): Promise<Booking[]> => {
        try {
            const response = await axios.get(`${API_URL}/api/bookings/my-bookings`, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user bookings:', error);
            throw error;
        }
    },

    // Get company's bookings (for company dashboard)
    getCompanyBookings: async (token?: string): Promise<Booking[]> => {
        try {
            const response = await axios.get(`${API_URL}/api/bookings/company-bookings`, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching company bookings:', error);
            throw error;
        }
    },

    // Accept a booking (company owner only)
    acceptBooking: async (bookingId: string, token?: string): Promise<{ success: boolean; booking: Booking }> => {
        try {
            const response = await axios.post(`${API_URL}/api/bookings/${bookingId}/accept`, {}, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error accepting booking:', error);
            throw error;
        }
    },

    // Reject a booking (company owner only)
    rejectBooking: async (bookingId: string, reason?: string, token?: string): Promise<{ success: boolean; booking: Booking }> => {
        try {
            const response = await axios.post(`${API_URL}/api/bookings/${bookingId}/reject`, { reason }, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error rejecting booking:', error);
            throw error;
        }
    },

    // Get booking analytics for dashboard
    getAnalytics: async (token?: string): Promise<BookingAnalytics> => {
        try {
            const response = await axios.get(`${API_URL}/api/bookings/analytics`, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    },

    // Cancel a booking by company (even after accept)
    cancelBookingByCompany: async (bookingId: string, reason?: string, token?: string): Promise<{ success: boolean; booking: Booking }> => {
        try {
            const response = await axios.post(`${API_URL}/api/bookings/${bookingId}/cancel-by-company`, { reason }, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw error;
        }
    },

    // Update payment status (company owner only)
    updatePaymentStatus: async (bookingId: string, data: { paymentStatus?: string; paymentMethod?: string }, token?: string): Promise<{ success: boolean; booking: Booking }> => {
        try {
            const response = await axios.put(`${API_URL}/api/bookings/${bookingId}/payment`, data, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error updating payment:', error);
            throw error;
        }
    },
    // Cancel a booking by the user
    cancelBookingByUser: async (bookingId: string, token?: string): Promise<{ success: boolean; booking: Booking }> => {
        try {
            const response = await axios.post(`${API_URL}/api/bookings/${bookingId}/cancel`, {}, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw error;
        }
    },

    // Update a booking by the user
    updateBookingByUser: async (bookingId: string, data: any, token?: string): Promise<{ success: boolean; booking: Booking }> => {
        try {
            const response = await axios.put(`${API_URL}/api/bookings/${bookingId}`, data, {
                headers: getAuthHeaders(token),
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    },
};
