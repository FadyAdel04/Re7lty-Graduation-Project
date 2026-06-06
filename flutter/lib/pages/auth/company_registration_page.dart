import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/app_colors.dart';
import '../../services/user_service.dart';
import '../../providers/api_provider.dart';
import '../../providers/user_provider.dart';
import '../../providers/auth_bootstrap_provider.dart';

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
        // Mark as onboarded with 'user' role so they don't see onboarding again
        // They will be a regular user until admin approves them
        await ref.read(userServiceProvider).completeOnboarding('user');
        ref.invalidate(currentUserProvider);
        ref.read(authBootstrapProvider.notifier).markOnboarded();

        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Text('تم إرسال طلبك', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
            content: Text(
              'شكراً لك! تم استلام طلب انضمام كشركة بنجاح. سنقوم بالرد عليك عبر البريد الإلكتروني قريباً، وحتى ذلك الحين يمكنك استخدام التطبيق كمسافر.',
              style: GoogleFonts.cairo(),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  context.go('/');
                },
                child: const Text('حسناً، الذهاب للرئيسية'),
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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('العودة لاختيار نوع الحساب', style: GoogleFonts.cairo(color: Colors.black87, fontSize: 14, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth > 800;
                return Container(
                  constraints: const BoxConstraints(maxWidth: 1000),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 30,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: isWide 
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(flex: 4, child: _buildOrangePanel()),
                            Expanded(flex: 6, child: _buildFormPanel()),
                          ],
                        )
                      : Column(
                          children: [
                            _buildOrangePanel(),
                            _buildFormPanel(),
                          ],
                        ),
                ).animate().fadeIn().scale(delay: 100.ms);
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOrangePanel() {
    return Container(
      color: const Color(0xFFF97316),
      padding: const EdgeInsets.all(40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.business_center_outlined, color: Colors.white, size: 32),
          ),
          const SizedBox(height: 24),
          Text(
            'هل أنت شركة\nسياحية؟',
            style: GoogleFonts.cairo(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w900,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'انضم إلينا اليوم واعرض رحلاتك لآلاف المسافرين الباحثين عن تجارب مميزة.',
            style: GoogleFonts.cairo(
              color: Colors.white.withOpacity(0.9),
              fontSize: 16,
              height: 1.6,
            ),
          ),
          const Spacer(),
          const SizedBox(height: 40),
          _buildBenefitItem('زيادة مبيعاتك'),
          const SizedBox(height: 16),
          _buildBenefitItem('سهولة التسجيل'),
          const SizedBox(height: 16),
          _buildBenefitItem('دعم فني متواصل'),
        ],
      ),
    );
  }

  Widget _buildBenefitItem(String text) {
    return Row(
      children: [
        const Icon(Icons.check_circle_outline, color: Colors.white, size: 24),
        const SizedBox(width: 12),
        Text(
          text,
          style: GoogleFonts.cairo(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildFormPanel() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(40),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              'سجل اهتمامك الآن',
              style: GoogleFonts.cairo(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF0F172A),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'املأ النموذج وسنتواصل معك في أقرب وقت لتوثيق حسابك.',
              style: GoogleFonts.cairo(color: Colors.grey[600], fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            
            Row(
              children: [
                Expanded(child: _buildInputLabelField('البريد الإلكتروني', _emailController, 'yousefelkhyoty255@gmail.com')),
                const SizedBox(width: 16),
                Expanded(child: _buildInputLabelField('اسم الشركة', _nameController, 'مثال: شركة المسافر')),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildInputLabelField('رقم الواتساب', _whatsappController, '01x xxxx xxxx')),
                const SizedBox(width: 16),
                Expanded(child: _buildInputLabelField('رقم الهاتف', _phoneController, '01x xxxx xxxx')),
              ],
            ),
            const SizedBox(height: 16),
            _buildInputLabelField('نوع الرحلات التي تقدمها', _categoriesController, 'مثال: رحلات بحرية، سفاري، تاريخية...'),
            const SizedBox(height: 16),
            _buildInputLabelField('رسالة قصيرة (اختياري)', _messageController, 'أضف أي تفاصيل أخرى تود إخبارنا بها...', maxLines: 4),
            
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF97316),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: _isLoading 
                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.send_rounded, size: 18),
                        const SizedBox(width: 12),
                        Text('إرسال الطلب', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputLabelField(String label, TextEditingController controller, String hint, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(label, style: GoogleFonts.cairo(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.grey[700])),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          textAlign: TextAlign.right,
          style: GoogleFonts.cairo(fontSize: 14, color: Colors.black87),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.cairo(color: Colors.grey[400], fontSize: 13),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFF97316))),
          ),
          validator: (v) => v!.isEmpty && label.contains('اختياري') == false ? 'هذا الحقل مطلوب' : null,
        ),
      ],
    );
  }
}
