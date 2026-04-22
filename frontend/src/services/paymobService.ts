import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

const API_URL = API_BASE_URL;

export interface PaymobIntentionResponse {
  success: boolean;
  clientSecret: string;
  paymentKey?: string;
  publicKey: string;
  amount: number;
  currency: string;
  orderId: string;
  bookingReference: string;
}

export interface PaymobConfig {
  publicKey: string;
  cardIntegrationId: number;
  walletIntegrationId: number;
  iframeId: number;
}

export const paymobService = {
  /**
   * Create a Paymob payment intention for a booking.
   * Returns clientSecret + publicKey needed to render the Paymob UI.
   */
  createPaymentIntention: async (
    bookingId: string,
    paymentMethod: 'card' | 'wallet' | 'instapay',
    token?: string
  ): Promise<PaymobIntentionResponse> => {
    const response = await axios.post(
      `${API_URL}/api/paymob/create-payment-intention`,
      { bookingId, paymentMethod },
      {
        headers: getAuthHeaders(token),
        withCredentials: true,
      }
    );
    return response.data;
  },

  /**
   * Get Paymob public configuration (integration IDs).
   */
  getConfig: async (): Promise<PaymobConfig> => {
    const response = await axios.get(`${API_URL}/api/paymob/config`);
    return response.data;
  },

  /**
   * Verify payment status after redirect.
   */
  verifyPayment: async (
    bookingId: string,
    token?: string
  ): Promise<{ success: boolean; paymentStatus: string; booking: any }> => {
    const response = await axios.get(
      `${API_URL}/api/paymob/verify/${bookingId}`,
      {
        headers: getAuthHeaders(token),
        withCredentials: true,
      }
    );
    return response.data;
  },

  /**
   * Build the Paymob hosted checkout URL using the payment key.
   * This redirects the user to Paymob's hosted payment page.
   */
  buildHostedCheckoutUrl: (paymentKey: string, iframeId: number = 887453): string => {
    return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;
  },
};

/**
 * Load the Paymob SDK script dynamically.
 */
export const loadPaymobSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('paymob-sdk')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'paymob-sdk';
    script.src = 'https://uae.paymob.com/v1/sdk.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paymob SDK'));
    document.body.appendChild(script);
  });
};
