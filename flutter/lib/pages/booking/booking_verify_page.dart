import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../providers/api_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

class BookingVerifyPage extends ConsumerStatefulWidget {
  final String? initialReference;

  const BookingVerifyPage({super.key, this.initialReference});

  @override
  ConsumerState<BookingVerifyPage> createState() => _BookingVerifyPageState();
}

class _BookingVerifyPageState extends ConsumerState<BookingVerifyPage> {
  late final TextEditingController _refController;
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    _refController = TextEditingController(text: widget.initialReference ?? '');
    if (widget.initialReference != null && widget.initialReference!.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _lookup(widget.initialReference!));
    }
  }

  @override
  void dispose() {
    _refController.dispose();
    super.dispose();
  }

  Future<void> _lookup(String reference) async {
    final code = reference.trim();
    if (code.isEmpty) return;

    setState(() {
      _loading = true;
      _error = null;
      _data = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/bookings/verify/$code');
      if (response.statusCode == 200) {
        setState(() => _data = Map<String, dynamic>.from(response.data as Map));
      } else {
        setState(() => _error = 'لم يتم العثور على الحجز');
      }
    } catch (e) {
      setState(() => _error = 'المرجع غير صحيح أو الحجز غير موجود');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('التحقق من الحجز', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'أدخل رقم مرجع الحجز للتحقق من صحته',
              style: GoogleFonts.cairo(color: Colors.grey, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _refController,
              decoration: InputDecoration(
                hintText: 'رقم المرجع',
                hintStyle: GoogleFonts.cairo(),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.confirmation_number_outlined),
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _loading ? null : () => _lookup(_refController.text),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryOrange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _loading
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text('تحقق الآن', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 24),
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red),
                    const SizedBox(width: 12),
                    Expanded(child: Text(_error!, style: GoogleFonts.cairo(color: Colors.red.shade800))),
                  ],
                ),
              ),
            if (_data != null) _buildResultCard(_data!, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildResultCard(Map<String, dynamic> data, bool isDark) {
    final booking = data['booking'] as Map<String, dynamic>? ?? data;
    final trip = data['trip'] as Map<String, dynamic>? ?? {};
    final company = data['company'] as Map<String, dynamic>? ?? {};

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified, color: Colors.green, size: 28),
              const SizedBox(width: 10),
              Text('حجز صالح', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green)),
            ],
          ),
          const Divider(height: 24),
          _row('المرجع', booking['bookingReference']?.toString() ?? '—'),
          _row('المسافر', booking['travelerName']?.toString() ?? booking['firstName']?.toString() ?? '—'),
          _row('الرحلة', trip['title']?.toString() ?? booking['tripTitle']?.toString() ?? '—'),
          _row('الشركة', company['name']?.toString() ?? '—'),
          _row('الحالة', booking['status']?.toString() ?? '—'),
          _row('الدفع', booking['paymentStatus']?.toString() ?? '—'),
          if (booking['passengers'] != null) _row('المسافرون', '${booking['passengers']}'),
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 90, child: Text(label, style: GoogleFonts.cairo(color: Colors.grey, fontSize: 13))),
          Expanded(child: Text(value, style: GoogleFonts.cairo(fontWeight: FontWeight.w600, fontSize: 14))),
        ],
      ),
    );
  }
}
