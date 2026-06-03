import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../services/pending_payment_store.dart';
import '../../theme/app_colors.dart';

enum PaymentResultStatus { loading, success, pending, failed }

/// Shown after Paymob redirect or when user returns from external checkout.
class BookingPaymentResultPage extends ConsumerStatefulWidget {
  final String? success;
  final String? pending;
  final String? txnResponseCode;
  final String? merchantOrderId;
  final String? orderId;

  const BookingPaymentResultPage({
    super.key,
    this.success,
    this.pending,
    this.txnResponseCode,
    this.merchantOrderId,
    this.orderId,
  });

  @override
  ConsumerState<BookingPaymentResultPage> createState() =>
      _BookingPaymentResultPageState();
}

class _BookingPaymentResultPageState
    extends ConsumerState<BookingPaymentResultPage> {
  PaymentResultStatus _status = PaymentResultStatus.loading;

  @override
  void initState() {
    super.initState();
    _verify();
  }

  String? get _bookingId =>
      widget.merchantOrderId?.trim().isNotEmpty == true
          ? widget.merchantOrderId
          : widget.orderId;

  bool get _urlIndicatesSuccess {
    final ok = widget.success == 'true';
    final code = widget.txnResponseCode;
    if (!ok) return false;
    if (code == null || code.isEmpty) return true;
    return code == 'APPROVED';
  }

  Future<void> _verify() async {
    if (_urlIndicatesSuccess) {
      await PendingPaymentStore.clear();
      if (mounted) setState(() => _status = PaymentResultStatus.success);
      return;
    }

    if (widget.pending == 'true') {
      if (mounted) setState(() => _status = PaymentResultStatus.pending);
      return;
    }

    final bookingId = _bookingId;
    if (bookingId == null || bookingId.isEmpty) {
      if (mounted) setState(() => _status = PaymentResultStatus.failed);
      return;
    }

    final api = ref.read(apiServiceProvider);
    for (var attempt = 0; attempt < 5; attempt++) {
      try {
        final response = await api.get('/paymob/verify/$bookingId');
        final status = response.data?['paymentStatus']?.toString();
        if (status == 'paid') {
          await PendingPaymentStore.clear();
          if (mounted) setState(() => _status = PaymentResultStatus.success);
          return;
        }
      } on DioException catch (e) {
        if (e.response?.statusCode == 404 && attempt == 4) break;
      } catch (_) {}

      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) return;
    }

    if (!mounted) return;
    if (widget.pending == 'true') {
      setState(() => _status = PaymentResultStatus.pending);
    } else {
      setState(() => _status = PaymentResultStatus.failed);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final config = switch (_status) {
      PaymentResultStatus.loading => (
          icon: Icons.hourglass_top,
          color: Colors.indigo,
          title: 'جاري التحقق من الدفع...',
          subtitle: 'يرجى الانتظار بينما نتحقق من حالة معاملتك',
        ),
      PaymentResultStatus.success => (
          icon: Icons.check_circle_outline,
          color: Colors.green,
          title: 'تم الدفع بنجاح!',
          subtitle:
              'تمت معالجة دفعتك بنجاح. يمكنك مراجعة حجوزاتك أو مسح QR التذكرة.',
        ),
      PaymentResultStatus.pending => (
          icon: Icons.schedule,
          color: Colors.orange,
          title: 'الدفع قيد المعالجة',
          subtitle: 'دفعتك قيد المراجعة. ستصلك رسالة تأكيد قريباً.',
        ),
      PaymentResultStatus.failed => (
          icon: Icons.cancel_outlined,
          color: Colors.red,
          title: 'فشلت عملية الدفع',
          subtitle:
              'لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى من صفحة الحجز.',
        ),
    };

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('نتيجة الدفع', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_status == PaymentResultStatus.loading)
                const CircularProgressIndicator(color: AppColors.primaryOrange)
              else
                Icon(config.icon, size: 72, color: config.color),
              const SizedBox(height: 24),
              Text(
                config.title,
                textAlign: TextAlign.center,
                style: GoogleFonts.cairo(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                config.subtitle,
                textAlign: TextAlign.center,
                style: GoogleFonts.cairo(
                  fontSize: 14,
                  color: isDark ? Colors.white70 : Colors.grey.shade700,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 40),
              if (_status != PaymentResultStatus.loading) ...[
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => context.go('/corporate'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primaryOrange,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(
                      'الذهاب للرحلات الجماعية',
                      style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => context.go('/'),
                  child: Text('الصفحة الرئيسية', style: GoogleFonts.cairo()),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
