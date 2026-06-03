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

class OnboardingPage extends ConsumerStatefulWidget {
  const OnboardingPage({super.key});

  @override
  ConsumerState<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends ConsumerState<OnboardingPage> {
  bool _isLoading = false;

  Future<void> _handleSelection(String type) async {
    setState(() => _isLoading = true);
    try {
      if (type == 'user') {
        final success = await ref.read(userServiceProvider).completeOnboarding('user');
        if (success && mounted) {
          ref.invalidate(currentUserProvider);
          ref.read(authBootstrapProvider.notifier).markOnboarded();
          context.go('/');
        }
      } else {
        // Redirect to company registration
        context.push('/company-registration');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'كيف تود استخدام رحلتي؟',
                  style: GoogleFonts.cairo(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF0F172A),
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn().slideY(begin: 0.2),
                const SizedBox(height: 12),
                Text(
                  'اختر نوع الحساب الذي يناسب احتياجاتك للبدء في استكشاف العالم',
                  style: GoogleFonts.cairo(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 100.ms),
                const SizedBox(height: 50),
                
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isWide = constraints.maxWidth > 700;
                    if (isWide) {
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: _buildCompanyCard(),
                          ),
                          const SizedBox(width: 30),
                          Expanded(
                            child: _buildTravelerCard(),
                          ),
                        ],
                      );
                    } else {
                      return Column(
                        children: [
                          _buildTravelerCard(),
                          const SizedBox(height: 24),
                          _buildCompanyCard(),
                        ],
                      );
                    }
                  },
                ),

                if (_isLoading)
                  const Padding(
                    padding: EdgeInsets.only(top: 40),
                    child: CircularProgressIndicator(color: AppColors.primaryOrange),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTravelerCard() {
    return _buildCard(
      icon: Icons.person_outline_rounded,
      iconColor: const Color(0xFF4F46E5),
      iconBgColor: const Color(0xFFEEF2FF),
      title: 'مسافر',
      description: 'استكشف رحلات مميزة، شارك تجاربك مع الآخرين، وتابع أصدقائك في مغامراتهم.',
      features: ['تصفح الرحلات والقصص', 'حجز الرحلات السياحية'],
      buttonText: 'استمرار كمسافر',
      buttonColor: const Color(0xFF4F46E5),
      isOutlined: false,
      onTap: () => _handleSelection('user'),
    );
  }

  Widget _buildCompanyCard() {
    return _buildCard(
      icon: Icons.business_center_outlined,
      iconColor: const Color(0xFFEA580C),
      iconBgColor: const Color(0xFFFFF7ED),
      title: 'شركة سياحة',
      description: 'اعرض رحلاتك لآلاف المسافرين، أدر حجوزاتك، وضاعف مبيعاتك معنا.',
      features: ['لوحة تحكم خاصة', 'أدوات تسويق متقدمة'],
      buttonText: 'تسجيل كشركة',
      buttonColor: const Color(0xFFEA580C),
      isOutlined: true,
      onTap: () => _handleSelection('company'),
    );
  }

  Widget _buildCard({
    required IconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required String title,
    required String description,
    required List<String> features,
    required String buttonText,
    required Color buttonColor,
    required bool isOutlined,
    required VoidCallback onTap,
  }) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: iconBgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 40),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: GoogleFonts.cairo(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: GoogleFonts.cairo(
              fontSize: 13,
              color: Colors.grey[600],
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ...features.map((f) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  f,
                  style: GoogleFonts.cairo(
                    fontSize: 13,
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 8),
                Icon(Icons.check_circle_outline, color: const Color(0xFF10B981), size: 20),
              ],
            ),
          )),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : onTap,
              style: ElevatedButton.styleFrom(
                backgroundColor: isOutlined ? Colors.white : buttonColor,
                foregroundColor: isOutlined ? buttonColor : Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: isOutlined ? BorderSide(color: buttonColor.withOpacity(0.5)) : BorderSide.none,
                ),
                elevation: isOutlined ? 0 : 2,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (isOutlined) const Icon(Icons.arrow_back, size: 18),
                  if (isOutlined) const SizedBox(width: 8),
                  Text(
                    buttonText,
                    style: GoogleFonts.cairo(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ).animate().scale(delay: 200.ms, duration: 400.ms);
  }
}
