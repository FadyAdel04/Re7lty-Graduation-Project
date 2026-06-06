import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/exceptions.dart';
import '../providers/api_provider.dart';
import '../theme/app_colors.dart';
import 'package:dio/dio.dart';

/// Dialog to report a trip or corporate trip (matches web ReportTripDialog).
class ReportTripDialog extends ConsumerStatefulWidget {
  final String tripId;
  final String tripTitle;
  final String tripModel;

  const ReportTripDialog({
    super.key,
    required this.tripId,
    required this.tripTitle,
    this.tripModel = 'Trip',
  });

  static Future<void> show(
    BuildContext context, {
    required String tripId,
    required String tripTitle,
    String tripModel = 'Trip',
  }) {
    return showDialog(
      context: context,
      builder: (_) => ReportTripDialog(
        tripId: tripId,
        tripTitle: tripTitle,
        tripModel: tripModel,
      ),
    );
  }

  @override
  ConsumerState<ReportTripDialog> createState() => _ReportTripDialogState();
}

class _ReportTripDialogState extends ConsumerState<ReportTripDialog> {
  static const _reasons = <String, String>{
    'spam': 'محتوى عشوائي أو احتيالي',
    'inappropriate': 'محتوى غير لائق أو مسيء',
    'misleading': 'معلومات مضللة',
    'scam': 'احتيال أو نصب',
    'unsafe': 'محتوى غير آمن',
    'other': 'سبب آخر',
  };

  String _reason = 'spam';
  final _descriptionController = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      await ref.read(contentReportServiceProvider).submitReport(
            tripId: widget.tripId,
            reason: _reason,
            description: _descriptionController.text,
            tripModel: widget.tripModel,
          );
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'تم استلام البلاغ. شكراً لمساعدتنا في الحفاظ على أمان المجتمع.',
            style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.green.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      final msg = e is DioException
          ? handleDioError(e).message
          : e.toString().replaceAll('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg, style: GoogleFonts.cairo()),
          backgroundColor: Colors.red.shade800,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AlertDialog(
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          const Icon(Icons.flag_outlined, color: Colors.redAccent),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'إبلاغ عن محتوى',
              style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'الإبلاغ عن: ${widget.tripTitle}',
              style: GoogleFonts.cairo(
                fontSize: 13,
                color: isDark ? Colors.white70 : Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 16),
            Text('سبب الإبلاغ', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ..._reasons.entries.map(
              (e) => RadioListTile<String>(
                dense: true,
                contentPadding: EdgeInsets.zero,
                title: Text(e.value, style: GoogleFonts.cairo(fontSize: 13)),
                value: e.key,
                groupValue: _reason,
                activeColor: AppColors.primaryOrange,
                onChanged: _loading ? null : (v) => setState(() => _reason = v!),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _descriptionController,
              maxLines: 3,
              enabled: !_loading,
              decoration: InputDecoration(
                labelText: 'تفاصيل إضافية (اختياري)',
                labelStyle: GoogleFonts.cairo(),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _loading ? null : () => Navigator.pop(context),
          child: Text('إلغاء', style: GoogleFonts.cairo()),
        ),
        FilledButton(
          onPressed: _loading ? null : _submit,
          style: FilledButton.styleFrom(backgroundColor: Colors.red.shade600),
          child: _loading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : Text('إرسال البلاغ', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
