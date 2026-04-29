import express from 'express';
import axios from 'axios';
import { requireAuthStrict, getAuth } from '../utils/auth';
import { Booking } from '../models/Booking';
import { CorporateTrip } from '../models/CorporateTrip';
import { CorporateCompany } from '../models/CorporateCompany';
import mongoose from 'mongoose';
import { createNotification } from '../utils/notificationDispatcher';
import { handleBookingAccepted } from '../utils/tripChatManager';

const router = express.Router();

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY || '';
const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY || '';
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY || '';
const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

// Integration IDs for payment methods
const PAYMOB_CARD_INTEGRATION_ID = process.env.PAYMOB_CARD_INTEGRATION_ID || '';
const PAYMOB_WALLET_INTEGRATION_ID = process.env.PAYMOB_WALLET_INTEGRATION_ID || '';
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://re7lty-graduation-project.vercel.app' 
    : 'http://localhost:8080');

/**
 * POST /api/paymob/create-payment-intention
 */
router.post('/create-payment-intention', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { bookingId, paymentMethod } = req.body;

    console.log(`[Paymob] Starting payment intention for booking: ${bookingId}, method: ${paymentMethod}, user: ${userId}`);

    if (!bookingId) {
      return res.status(400).json({ error: 'Missing bookingId' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error(`[Paymob] Booking not found: ${bookingId}`);
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      console.error(`[Paymob] Unauthorized access: User ${userId} trying to pay for booking owned by ${booking.userId}`);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const amountCents = Math.round((booking.totalPrice || 0) * 100);
    console.log(`[Paymob] Amount in cents: ${amountCents} (Original: ${booking.totalPrice})`);

    if (amountCents <= 0) {
      console.warn(`[Paymob] Invalid amount for booking ${bookingId}: ${amountCents}`);
      return res.status(400).json({ error: 'مبلغ الدفع يجب أن يكون أكبر من صفر' });
    }

    if (!PAYMOB_API_KEY) {
      console.error('[Paymob] PAYMOB_API_KEY is missing in environment variables');
      throw new Error('PAYMOB_API_KEY is not configured on the server');
    }

    // Step 1: Authentication
    console.log('[Paymob] Step 1: Authenticating with API Key...');
    let authToken;
    try {
      const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
        api_key: PAYMOB_API_KEY,
      });
      authToken = authResponse.data.token;
      console.log('[Paymob] Auth Token received successfully');
    } catch (authError: any) {
      console.error('[Paymob] Auth Error:', authError.response?.data || authError.message);
      throw new Error(`Authentication failed: ${JSON.stringify(authError.response?.data) || authError.message}`);
    }

    // Step 2: Create Order
    console.log('[Paymob] Step 2: Creating order...');
    let orderId;
    try {
      const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
        auth_token: authToken,
        delivery_needed: 'false',
        amount_cents: amountCents,
        currency: 'EGP',
        items: [],
        merchant_order_id: `BOOKING_${bookingId.toString()}_${Date.now()}`, // Make it unique to avoid duplicates if user retries
      });
      orderId = orderResponse.data.id;
      console.log(`[Paymob] Order created successfully: ${orderId}`);
    } catch (orderError: any) {
      console.error('[Paymob] Order Error:', orderError.response?.data || orderError.message);
      throw new Error(`Order creation failed: ${JSON.stringify(orderError.response?.data) || orderError.message}`);
    }

    // Step 3: Generate Payment Key
    console.log('[Paymob] Step 3: Generating payment key...');
    let integrationId = paymentMethod === 'wallet' ? PAYMOB_WALLET_INTEGRATION_ID : PAYMOB_CARD_INTEGRATION_ID;
    
    console.log(`[Paymob] Using integration ID: ${integrationId} for method: ${paymentMethod}`);

    if (!integrationId) {
      console.error(`[Paymob] Integration ID missing for method: ${paymentMethod}`);
      throw new Error(`بوابة الدفع (${paymentMethod}) غير مهيأة بشكل صحيح على الخادم. يرجى التواصل مع الدعم.`);
    }

    const rawPhone = (booking.userPhone || '01000000000').replace(/\D/g, '');
    const phone = rawPhone.startsWith('20') && rawPhone.length > 10 ? rawPhone.substring(2) : rawPhone;

    const billingData = {
      apartment: 'NA',
      email: booking.userEmail || 'customer@re7lty.com',
      floor: 'NA',
      first_name: (booking.userName || 'Guest').split(' ')[0] || 'Guest',
      street: 'Street',
      building: 'NA',
      phone_number: phone,
      shipping_method: 'NA',
      postal_code: 'NA',
      city: 'Cairo',
      country: 'EG',
      last_name: (booking.userName || 'Guest').split(' ').slice(1).join(' ') || 'User',
      state: 'Cairo',
    };

    let paymentKey;
    try {
      const payload = {
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: 'EGP',
        integration_id: parseInt(integrationId.toString() || '0'),
      };
      console.log('[Paymob] Generating payment key with payload:', JSON.stringify(payload).substring(0, 200));
      
      const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', payload);
      paymentKey = paymentKeyResponse.data.token;
      console.log('[Paymob] Payment Key generated successfully');
    } catch (keyError: any) {
      console.error('[Paymob] Payment Key Error:', keyError.response?.data || keyError.message);
      throw new Error(`Payment key generation failed: ${JSON.stringify(keyError.response?.data) || keyError.message}`);
    }

    booking.paymentStatus = 'pending';
    (booking as any).paymobOrderId = orderId.toString();
    await booking.save();

    res.json({
      success: true,
      paymentKey,
      publicKey: PAYMOB_PUBLIC_KEY,
      amount: amountCents,
      orderId: orderId,
    });
  } catch (error: any) {
    console.error('[Paymob] Final Error Handler:', error.message);
    res.status(500).json({
      error: 'فشل في تهيئة الدفع',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

/**
 * POST /api/paymob/webhook
 * Paymob sends payment notifications here.
 * This updates the booking payment status accordingly.
 */
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('[Paymob Webhook]', JSON.stringify(event).substring(0, 400));

    // Paymob sends the transaction object
    const obj = event.obj || event;
    const success = obj?.success === true || obj?.success === 'true';
    const pending = obj?.pending === true;
    const orderId = obj?.order?.id?.toString() || obj?.payment_key_claims?.order_id?.toString();
    const bookingId = obj?.order?.merchant_order_id || 
                      obj?.payment_key_claims?.extras?.booking_id ||
                      obj?.data?.extras?.booking_id;

    if (!bookingId && !orderId) {
      return res.status(200).json({ received: true });
    }

    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking && orderId) {
      booking = await Booking.findOne({ paymobOrderId: orderId } as any);
    }

    if (!booking) {
      console.warn('[Paymob Webhook] Booking not found for orderId:', orderId, 'bookingId:', bookingId);
      return res.status(200).json({ received: true });
    }

    if (success && !pending) {
      // Payment confirmed
      booking.status = 'accepted'; // <--- ADDED THIS
      booking.paymentStatus = 'paid';
      booking.paymentMethod = 'card';
      (booking as any).paymobTransactionId = obj?.id?.toString() || '';
      await booking.save();

      // Automatically add to trip group chat
      await handleBookingAccepted(booking.tripId.toString(), booking.userId);

      // If booking is still pending, auto-accept it (or notify company)
      const company = await CorporateCompany.findById(booking.companyId);
      if (company?.ownerId) {
        await createNotification({
          recipientId: company.ownerId,
          actorId: booking.userId,
          actorName: booking.userName,
          type: 'system',
          message: `✅ تم الدفع بنجاح لحجز رحلة "${booking.tripTitle}" من ${booking.userName}. المبلغ: ${booking.totalPrice} ج.م`,
          metadata: { bookingId: booking._id, status: 'paid', tripId: booking.tripId },
        } as any);
      }

      // Notify user
      await createNotification({
        recipientId: booking.userId,
        actorId: 'system',
        actorName: 'نظام الدفع',
        type: 'system',
        message: `✅ تم تأكيد دفعك لرحلة "${booking.tripTitle}". المبلغ: ${booking.totalPrice} ج.م`,
        metadata: { 
          bookingId: booking._id, 
          status: 'paid',
          merchant_order_id: booking._id 
        },
      } as any);

      console.log(`[Paymob] Payment SUCCESS for booking ${booking._id}`);
    } else if (pending) {
      booking.paymentStatus = 'pending';
      await booking.save();
    } else {
      // Payment failed or declined
      booking.paymentStatus = 'unpaid';
      (booking as any).paymentFailReason = obj?.data?.message || 'فشل الدفع';
      await booking.save();
      console.log(`[Paymob] Payment FAILED/DECLINED for booking ${booking._id}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Paymob Webhook Error]', error.message);
    res.status(200).json({ received: true }); // Always 200 to Paymob
  }
});

/**
 * GET /api/paymob/webhook
 * Paymob redirects the user here after payment.
 * We redirect them back to the frontend result page.
 */
router.get('/webhook', (req, res) => {
  const queryParams = new URLSearchParams(req.query as any).toString();
  console.log('[Paymob Redirect Callback]', req.query);

  const redirectUrl = `${FRONTEND_URL}/booking-payment-result?${queryParams}`;
  
  res.redirect(redirectUrl);
});

/**
 * GET /api/paymob/verify/:bookingId
 * Verify payment status of a booking after redirect
 */
router.get('/verify/:bookingId', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { bookingId } = req.params;

    let booking = null;
    
    // 1. Try finding by ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    
    // 2. Fallback: Try finding by Paymob Order ID (which is a number/string)
    if (!booking) {
      booking = await Booking.findOne({ paymobOrderId: bookingId });
    }
    
    // 3. Fallback: Try finding by Merchant Order ID (which we set to bookingId during order creation)
    if (!booking && mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    }

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    res.json({
      success: true,
      paymentStatus: booking.paymentStatus,
      booking,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/paymob/config
 * Returns public Paymob config for the frontend
 */
router.get('/config', (_req, res) => {
  res.json({
    publicKey: PAYMOB_PUBLIC_KEY,
    cardIntegrationId: parseInt(PAYMOB_CARD_INTEGRATION_ID || '0'),
    walletIntegrationId: parseInt(PAYMOB_WALLET_INTEGRATION_ID || '0'),
    iframeId: parseInt(PAYMOB_IFRAME_ID || '0'),
  });
});

export default router;
