import 'package:flutter/material.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:clerk_auth/clerk_auth.dart' as clerk;
import 'package:flutter_animate/flutter_animate.dart';
import '../../theme/app_colors.dart';
import 'package:google_fonts/google_fonts.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          _buildBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 60),
                  _buildHeaderText(),
                  const SizedBox(height: 30),
                  
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // --- 1. Social Login (Google) ---
                        _socialButton(
                          label: 'Continue with Google',
                          icon: Icons.g_mobiledata,
                          onPressed: () => _handleSocialLogin(clerk.Strategy.oauthGoogle),
                        ),
                        const SizedBox(height: 12),
                        
                        // --- 2. Social Login (Facebook) ---
                        _socialButton(
                          label: 'Continue with Facebook',
                          icon: Icons.facebook,
                          color: const Color(0xFF1877F2),
                          onPressed: () => _handleSocialLogin(clerk.Strategy.oauthFacebook),
                        ),
                        
                        const SizedBox(height: 30),
                        _buildDivider(),
                        const SizedBox(height: 30),

                        const Text(
                          'CREDENTIALS',
                          style: TextStyle(
                            color: Color(0xFF2563EB),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildTextField(),
                        
                        const SizedBox(height: 24),
                        
                        // --- 3. Email Login Button ---
                        _buildContinueButton(context),
                        
                        const SizedBox(height: 24),
                        _buildFooterLinks(),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 40),
                  _buildSecuredByClerk(),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
          
          if (_isLoading)
            Container(
              color: Colors.black26,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  // Fixed: Using ssoSignIn from ClerkAuthState
  Future<void> _handleSocialLogin(clerk.Strategy strategy) async {
    setState(() => _isLoading = true);
    try {
      await ClerkAuth.of(context).ssoSignIn(context, strategy);
    } catch (e) {
      _showError('خطأ في تسجيل الدخول: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // Fixed: Using attemptSignIn from Auth
  Future<void> _handleEmailLogin() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _showError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ClerkAuth.of(context).attemptSignIn(
        strategy: clerk.Strategy.emailCode,
        identifier: email,
      );
      _showSuccess('تم إرسال الكود لبريدك الإلكتروني');
    } catch (e) {
      _showError('خطأ: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    if(!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  void _showSuccess(String msg) {
    if(!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.green));
  }

  Widget _buildBackground() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        image: DecorationImage(
          image: NetworkImage('https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2070'),
          fit: BoxFit.cover,
        ),
      ),
      child: Container(color: Colors.black.withOpacity(0.1)),
    );
  }

  Widget _buildHeaderText() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Image.asset(
            'assets/images/logo.png',
            height: 100,
          ).animate().fadeIn(duration: 800.ms).scale(begin: const Offset(0.8, 0.8)),
        ),
        const SizedBox(height: 30),
        Text('WELCOME TO YOUR JOURNEY', 
          style: GoogleFonts.outfit(color: const Color(0xFF1E40AF), fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        Row(
          children: [
            Text('Rahlaty', style: GoogleFonts.outfit(color: Colors.black87, fontWeight: FontWeight.w900, fontSize: 28)),
            const SizedBox(width: 8),
            Text('(رحلتي)', style: GoogleFonts.cairo(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 24)),
          ],
        ),
        Text('Explore the world\'s most breathtaking horizons.', 
          style: GoogleFonts.outfit(color: Colors.black54, fontSize: 16)),
      ],
    );
  }

  Widget _socialButton({required String label, required IconData icon, Color? color, required VoidCallback onPressed}) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, color: color ?? Colors.black87, size: 28),
      label: Text(label, style: const TextStyle(color: Colors.black87)),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        side: BorderSide(color: Colors.grey.shade300),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        backgroundColor: Colors.white,
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(child: Divider(color: Colors.grey.shade300)),
        const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('OR', style: TextStyle(color: Colors.grey))),
        Expanded(child: Divider(color: Colors.grey.shade300)),
      ],
    );
  }

  Widget _buildTextField() {
    return Container(
      decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(15)),
      child: TextField(
        controller: _emailController,
        decoration: const InputDecoration(
          hintText: 'Enter email or username',
          border: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildContinueButton(BuildContext context) {
    return ElevatedButton(
      onPressed: _handleEmailLogin,
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF0052CC),
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('Continue', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          SizedBox(width: 8),
          Icon(Icons.arrow_forward_rounded),
        ],
      ),
    );
  }

  Widget _buildFooterLinks() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text("Don't have an account?", style: TextStyle(color: Colors.grey)),
        TextButton(onPressed: () {}, child: const Text('Sign up', style: TextStyle(color: Color(0xFF0052CC), fontWeight: FontWeight.bold))),
      ],
    );
  }

  Widget _buildSecuredByClerk() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.verified_user_outlined, size: 14, color: Colors.grey),
            const SizedBox(width: 4),
            Text('SECURED BY CLERK', style: GoogleFonts.outfit(color: Colors.grey, fontSize: 10, letterSpacing: 1)),
          ],
        ),
      ],
    );
  }
}


