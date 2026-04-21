import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/app_colors.dart';
import '../../services/user_service.dart';
import '../../providers/api_provider.dart';

class CompanyRegistrationPage extends ConsumerStatefulWidget {
  const CompanyRegistrationPage({super.key});

  @override
  ConsumerState<CompanyRegistrationPage> createState() => _CompanyRegistrationPageState();
}

class _CompanyRegistrationPageState extends ConsumerState<CompanyRegistrationPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _categoriesController = TextEditingController();
  final _messageController = TextEditingController();
  
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _whatsappController.dispose();
    _categoriesController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final success = await ref.read(userServiceProvider).submitCompanySubmission({
        'companyName': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'whatsapp': _whatsappController.text.trim(),
        'tripTypes': _categoriesController.text.trim(),
        'message': _messageController.text.trim(),
      });

      if (success && mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Text('تم إرسال طلبك', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
            content: Text(
              'شكراً لك! تم استلام طلب انضمام كشركة بنجاح. سنقوم بالرد عليك عبر البريد الإلكتروني قريباً.',
              style: GoogleFonts.cairo(),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).pop();
                },
                child: const Text('إغلاق'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('خطأ: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF101828), // Dark section like website
      appBar: AppBar(
        title: Text('انضم كشريك', style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              _buildWebsiteHeader(),
              const SizedBox(height: 30),
              _buildFormCard(),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWebsiteHeader() {
    return Column(
      children: [
        Text(
          'اضاعف حجوزات شركتك اليوم',
          style: GoogleFonts.cairo(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF14B8A6), // Teal color from screenshot
          ),
          textAlign: TextAlign.center,
        ).animate().fadeIn().slideY(begin: 0.2),
        const SizedBox(height: 12),
        Text(
          'انضم إلى أكبر تجمع للشركات السياحية في مصر. نحن نوفر لك الأدوات اللازمة للوصول لعملائك المستهدفين.',
          style: GoogleFonts.cairo(color: Colors.white70, fontSize: 13, height: 1.6),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildFormCard() {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 40, offset: const Offset(0, 20)),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'سجل اهتمامك الآن',
              style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF14B8A6)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              'خطوات بسيطة وسنتواصل معك لتفعيل حسابك',
              style: GoogleFonts.cairo(color: Colors.grey, fontSize: 12),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 30),
            
            Row(
              children: [
                Expanded(child: _buildInputLabelField('اسم شركتك المعتمد', _nameController, 'مثال: شركة المسافر الدولي')),
                const SizedBox(width: 16),
                Expanded(child: _buildInputLabelField('البريد الإلكتروني للعمل', _emailController, 'business@company.com')),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildInputLabelField('رقم هاتف التواصل', _phoneController, '01xxxxxxxxx')),
                const SizedBox(width: 16),
                Expanded(child: _buildInputLabelField('واتساب الشركة', _whatsappController, '01xxxxxxxxx')),
              ],
            ),
            const SizedBox(height: 16),
            _buildInputLabelField('تخصصات الرحلات', _categoriesController, 'سفاري، رحلات بحرية، السياحة الدينية...'),
            const SizedBox(height: 16),
            _buildInputLabelField('ملاحظات إضافية (اختياري)', _messageController, 'أخبرنا المزيد عن خدماتك أو عدد الفروع...', maxLines: 3),
            
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF97316), // Orange from screenshot
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                elevation: 0,
              ),
              child: _isLoading 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.send_rounded, size: 18),
                      const SizedBox(width: 10),
                      Text('إرسال طلب الانضمام', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
            ),
          ],
        ),
      ),
    ).animate().scale(delay: 200.ms, duration: 500.ms);
  }

  Widget _buildInputLabelField(String label, TextEditingController controller, String hint, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          style: GoogleFonts.cairo(fontSize: 13, color: Colors.black),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.cairo(color: Colors.grey[400], fontSize: 12),
            filled: true,
            fillColor: Colors.grey[50],
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF14B8A6))),
          ),
          validator: (v) => v!.isEmpty && label.contains('اختياري') == false ? 'مطلوب' : null,
        ),
      ],
    );
  }
}
