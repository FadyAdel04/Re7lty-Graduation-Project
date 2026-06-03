import 'package:shared_preferences/shared_preferences.dart';

/// Persists booking id while user completes Paymob in external browser.
class PendingPaymentStore {
  static const _key = 'pending_payment_booking_id';

  static Future<void> set(String bookingId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, bookingId);
  }

  static Future<String?> get() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key);
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
