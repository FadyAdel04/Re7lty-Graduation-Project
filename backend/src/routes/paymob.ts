import express from 'express';
import axios from 'axios';
import { requireAuthStrict, getAuth } from '../utils/auth';
import { Booking } from '../models/Booking';
import { CorporateTrip } from '../models/CorporateTrip';
import { CorporateCompany } from '../models/CorporateCompany';
import { createNotification } from '../utils/notificationDispatcher';

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

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const amountCents = Math.round((booking.totalPrice || 0) * 100);

    // Step 1: Authentication
    console.log('[Paymob] Step 1: Authenticating...');
    const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: PAYMOB_API_KEY,
    });
    const authToken = authResponse.data.token;

    // Step 2: Create Order
    console.log('[Paymob] Step 2: Creating order...');
    const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: authToken,
      delivery_needed: 'false',
      amount_cents: amountCents,
      currency: 'EGP',
      items: [],
      merchant_order_id: bookingId.toString(), // Link to our booking ID
    });
    const orderId = orderResponse.data.id;

    // Step 3: Generate Payment Key
    console.log('[Paymob] Step 3: Generating payment key (Card Only)...');
    let integrationId = PAYMOB_CARD_INTEGRATION_ID;
    
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

    const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency: 'EGP',
      integration_id: parseInt(integrationId || '0'),
    });

    const paymentKey = paymentKeyResponse.data.token;
    console.log('[Paymob] Payment key generated successfully');

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
    const errorData = error.response?.data;
    console.error('Paymob API Error:', JSON.stringify(errorData || error.message, null, 2));
    
    res.status(500).json({
      error: 'فشل في تهيئة الدفع',
      details: errorData || error.message,
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

    const booking = await Booking.findById(bookingId);
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
