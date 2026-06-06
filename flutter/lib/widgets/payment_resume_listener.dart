import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/pending_payment_store.dart';

/// When user returns from Paymob in browser, open payment result verification.
class PaymentResumeListener extends StatefulWidget {
  final Widget child;

  const PaymentResumeListener({super.key, required this.child});

  @override
  State<PaymentResumeListener> createState() => _PaymentResumeListenerState();
}

class _PaymentResumeListenerState extends State<PaymentResumeListener>
    with WidgetsBindingObserver {
  bool _checking = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkPendingPayment());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkPendingPayment();
    }
  }

  Future<void> _checkPendingPayment() async {
    if (_checking || !mounted) return;
    final bookingId = await PendingPaymentStore.get();
    if (bookingId == null || bookingId.isEmpty || !mounted) return;

    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/booking-payment-result')) return;

    _checking = true;
    try {
      if (!mounted) return;
      context.go(
        '/booking-payment-result?merchant_order_id=${Uri.encodeComponent(bookingId)}',
      );
    } finally {
      _checking = false;
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
