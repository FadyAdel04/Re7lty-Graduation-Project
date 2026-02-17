import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

export interface Coupon {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    expiryDate: string;
    companyId: string;
    isActive: boolean;
    usageLimit?: number;
    usageCount: number;
    applicableTrips: string[];
    createdAt: string;
}

export const couponService = {
    getMyCoupons: async (token?: string): Promise<Coupon[]> => {
        const response = await axios.get(`${API_URL}/api/coupons/my-coupons`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response.data;
    },

    createCoupon: async (couponData: Partial<Coupon>, token?: string): Promise<Coupon> => {
        const response = await axios.post(`${API_URL}/api/coupons`, couponData, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response.data;
    },

    deleteCoupon: async (id: string, token?: string): Promise<void> => {
        await axios.delete(`${API_URL}/api/coupons/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    },

    validateCoupon: async (code: string, tripId: string): Promise<{
        success: boolean;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        couponId: string;
    }> => {
        const response = await axios.post(`${API_URL}/api/coupons/validate`, { code, tripId });
        return response.data;
    }
};
