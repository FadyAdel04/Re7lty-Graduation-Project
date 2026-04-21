import 'package:flutter/material.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/app_colors.dart';
import '../../services/user_service.dart';
import '../../providers/api_provider.dart';

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
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset('assets/images/logo.png', height: 80).animate().fadeIn().scale(),
              const SizedBox(height: 40),
              Text(
                'اختر نوع الحساب',
                style: GoogleFonts.cairo(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'كيف ترغب في استخدام رحلتي؟',
                style: GoogleFonts.cairo(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 40),
              _buildOption(
                title: 'مسافر (Traveler)',
                description: 'استكشف الرحلات، شارك تجاربك، وتابع أصدقائك.',
                icon: Icons.person_pin_circle_outlined,
                color: AppColors.primaryOrange,
                onTap: () => _handleSelection('user'),
              ),
              const SizedBox(height: 20),
              _buildOption(
                title: 'شركة سياحة (Company)',
                description: 'نظم رحلاتك، سوق لخدماتك، وتواصل مع المسافرين.',
                icon: Icons.business_outlined,
                color: const Color(0xFF2563EB),
                onTap: () => _handleSelection('company'),
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
    );
  }

  Widget _buildOption({
    required String title,
    required String description,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          border: Border.all(color: color.withOpacity(0.3), width: 2),
          borderRadius: BorderRadius.circular(20),
          color: color.withOpacity(0.02),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.cairo(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: GoogleFonts.cairo(
                      fontSize: 13,
                      color: Colors.black54,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, color: color.withOpacity(0.5), size: 16),
          ],
        ),
      ).animate().slideX(begin: 0.1, duration: 500.ms).fadeIn(),
    );
  }
}
