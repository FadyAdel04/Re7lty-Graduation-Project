import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:clerk_auth/clerk_auth.dart' as clerk;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:uuid/uuid.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../theme/app_colors.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/exceptions.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  final _usernameController = TextEditingController();
  bool _isLoading = false;
  bool _isCodeSent = false;
  bool _isMissingUsername = false;

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _usernameController.dispose();
    super.dispose();
  }

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
                        if (_isMissingUsername) ...[
                          Text(
                            'Fill in missing fields',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(color: Colors.black87, fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Please fill in the remaining details to continue.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.cairo(color: Colors.grey, fontSize: 13),
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'Username',
                            style: TextStyle(
                              color: Colors.black87,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 8),
                          _buildUsernameField(),
                          const SizedBox(height: 24),
                          _buildSubmitUsernameButton(context),
                          const SizedBox(height: 16),
                          TextButton(
                            onPressed: () => setState(() => _isMissingUsername = false),
                            child: const Text('Back to sign in', style: TextStyle(color: Colors.grey)),
                          ),
                        ] else if (!_isCodeSent) ...[
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
                        ] else ...[
                          Text(
                            'Enter the 6-digit code sent to ${_emailController.text}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.black87),
                          ),
                          const SizedBox(height: 20),
                          _buildCodeField(),
                          const SizedBox(height: 24),
                          _buildVerifyButton(context),
                          TextButton(
                            onPressed: () => setState(() => _isCodeSent = false),
                            child: const Text('Change Email', style: TextStyle(color: Colors.grey)),
                          ),
                        ],
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
              child: const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
            ),
        ],
      ),
    );
  }

  Widget _buildCodeField() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9), 
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: AppColors.primaryOrange.withOpacity(0.3)),
      ),
      child: TextField(
        controller: _codeController,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        style: const TextStyle(color: Colors.black87, fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
        decoration: const InputDecoration(
          hintText: '000000',
          hintStyle: TextStyle(color: Colors.grey, letterSpacing: 8),
          border: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  Widget _buildVerifyButton(BuildContext context) {
    return ElevatedButton(
      onPressed: _handleVerifyCode,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      child: const Text('Verify & Sign In', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }

  Future<void> _handleVerifyCode() async {
    final code = _codeController.text.trim();
    if (code.length < 6) {
      _showError('برجاء إدخال الكود المكون من 6 أرقام');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final auth = ClerkAuth.of(context);
      // Check if we are in sign up or sign in mode
      if (auth.session == null) {
        // Try sign in verification
        try {
          await auth.attemptSignIn(
            strategy: clerk.Strategy.emailCode,
            code: code,
          );
        } catch (e) {
          // If sign in verification fails, try sign up verification
          try {
            await auth.attemptSignUp(
              strategy: clerk.Strategy.emailCode,
              code: code,
            );
          } catch (signUpError) {
            final errorStr = signUpError.toString().toLowerCase();
            if (errorStr.contains('username') || errorStr.contains('missing')) {
              setState(() => _isMissingUsername = true);
              return;
            } else {
              rethrow;
            }
          }
        }
      }
      print('🚀 LoginPage: Verification successful');
    } catch (e) {
      print('❌ LoginPage Verify Error: $e');
      _showError('الكود غير صحيح أو انتهت صلاحيته');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleGoogleLogin() async {
    setState(() => _isLoading = true);
    try {
      final auth = ClerkAuth.of(context);
      final serverClientId = dotenv.get('GOOGLE_SERVER_CLIENT_ID', fallback: dotenv.get('GOOGLE_CLIENT_ID', fallback: ''));

      if (serverClientId.isNotEmpty) {
        try {
          final google = GoogleSignIn.instance;
          await google.initialize(serverClientId: serverClientId, nonce: const Uuid().v4());
          final account = await google.authenticate(scopeHint: const ['openid', 'email', 'profile']);
          final idToken = account.authentication.idToken;
          if (idToken != null && idToken.isNotEmpty) {
            await auth.attemptSignIn(
              strategy: clerk.Strategy.oauthTokenGoogle,
              token: idToken,
            );
            if (mounted) context.go('/splash');
            return;
          }
        } catch (e) {
          final errStr = e.toString().toLowerCase();
          if (errStr.contains('cancel')) return;
          debugPrint('Native Google sign-in failed, falling back to Clerk: $e');
        }
      }

      await auth.ssoSignIn(context, clerk.Strategy.oauthGoogle);
    } catch (e, stack) {
      debugPrint('❌ LoginPage Google Error: $e\n$stack');
      final errStr = e.toString().toLowerCase();
      if (errStr.contains('already signed in') || errStr.contains('already sign')) {
        if (mounted) context.go('/splash');
        return;
      }
      if (errStr.contains('cancel')) return;
      if (errStr.contains('username') || errStr.contains('missing')) {
        setState(() => _isMissingUsername = true);
        return;
      }
      _showError(e is AppException ? e.message : 'خطأ في تسجيل الدخول');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSocialLogin(clerk.Strategy strategy) async {
    if (strategy == clerk.Strategy.oauthGoogle) {
      await _handleGoogleLogin();
      return;
    }

    print('🚀 LoginPage: Starting social login with strategy: ${strategy.name}');

    final auth = ClerkAuth.of(context);
    if (auth.session != null) {
      if (mounted) context.go('/splash');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await auth.ssoSignIn(context, strategy);
    } catch (e, stack) {
      print('❌ LoginPage Social Error: $e');
      print(stack);
      final errStr = e.toString().toLowerCase();
      if (errStr.contains('already signed in') || errStr.contains('already sign')) {
        if (mounted) context.go('/splash');
        return;
      }
      String msg = 'خطأ في تسجيل الدخول';
      if (e is AppException) {
        msg = e.message;
      } else if (errStr.contains('cancelled') || errStr.contains('cancel')) {
        return;
      } else if (errStr.contains('username') || errStr.contains('missing')) {
        setState(() => _isMissingUsername = true);
        return;
      } else {
        msg = '$msg: $e';
      }
      _showError(msg);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSignUp() async {
    print('🚀 LoginPage: Navigating to Sign Up');
    _handleEmailLogin();
  }

  Future<void> _handleEmailLogin() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _showError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    print('🚀 LoginPage: Starting email auth for: $email');
    setState(() => _isLoading = true);
    try {
      final auth = ClerkAuth.of(context);
      try {
        // 1. Try Sign In
        print('🚀 LoginPage: Attempting SignIn...');
        await auth.attemptSignIn(
          strategy: clerk.Strategy.emailCode,
          identifier: email,
        );
      } catch (e) {
        // 2. If Sign In fails because user not found, try Sign Up
        if (e.toString().contains('not found') || e.toString().contains('find your account')) {
          print('🚀 LoginPage: User not found, attempting SignUp...');
          try {
            await auth.attemptSignUp(
              strategy: clerk.Strategy.emailCode,
              emailAddress: email,
              username: _usernameController.text.isNotEmpty ? _usernameController.text.trim() : null,
            );
          } catch (signUpErr) {
            final errStr = signUpErr.toString().toLowerCase();
            if (errStr.contains('username') || errStr.contains('missing')) {
              setState(() => _isMissingUsername = true);
              return;
            } else {
              rethrow;
            }
          }
        } else {
          rethrow;
        }
      }
      
      print('🚀 LoginPage: Email code sent successfully');
      _showSuccess('تم إرسال الكود لبريدك الإلكتروني');
      setState(() => _isCodeSent = true);
    } catch (e) {
      print('❌ LoginPage Email Error: $e');
      String msg = 'خطأ في إرسال الكود';
      if (e is AppException) {
        msg = e.message;
      } else {
        msg = '$msg: $e';
      }
      _showError(msg);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    if(!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(fontWeight: FontWeight.bold)), 
      backgroundColor: Colors.redAccent,
      behavior: SnackBarBehavior.floating,
    ));
  }

  void _showSuccess(String msg) {
    if(!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(fontWeight: FontWeight.bold)), 
      backgroundColor: Colors.green,
      behavior: SnackBarBehavior.floating,
    ));
  }

  Widget _buildBackground() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0D1B4B),
            Color(0xFF1A3561),
            Color(0xFF0F3460),
            Color(0xFF16213E),
          ],
          stops: [0.0, 0.3, 0.7, 1.0],
        ),
      ),
    );
  }

  Widget _buildHeaderText() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Column(
            children: [
              Image.asset(
                'assets/images/logo.png',
                height: 100,
              ).animate().fadeIn(duration: 800.ms).scale(begin: const Offset(0.8, 0.8)),
              const SizedBox(height: 10),
            ],
          ),
        ),
        const SizedBox(height: 30),
        Text('WELCOME TO YOUR JOURNEY', 
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 2)),
        const SizedBox(height: 8),
        Row(
          children: [
            Text('Rahlaty', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 32)),
            const SizedBox(width: 12),
            Text('(رحلتي)', style: GoogleFonts.cairo(color: Colors.orangeAccent, fontWeight: FontWeight.bold, fontSize: 28)),
          ],
        ),
        Text('Explore the world\'s most breathtaking horizons.', 
          style: GoogleFonts.outfit(color: Colors.white70, fontSize: 16)),
      ],
    );
  }

  Widget _socialButton({required String label, required IconData icon, Color? color, required VoidCallback onPressed}) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, color: color ?? Colors.black87, size: 28),
      label: Text(label, style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
        side: BorderSide(color: Colors.grey.shade200),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Colors.white,
        elevation: 2,
        shadowColor: Colors.black12,
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
        const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('OR', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold))),
        Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
      ],
    );
  }

  Widget _buildTextField() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9), 
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: TextField(
        controller: _emailController,
        style: const TextStyle(color: Colors.black87),
        decoration: const InputDecoration(
          hintText: 'Enter email or username',
          hintStyle: TextStyle(color: Colors.grey),
          border: InputBorder.none,
          prefixIcon: Icon(Icons.email_outlined, color: Colors.grey),
          contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildUsernameField() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9), 
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: TextField(
        controller: _usernameController,
        style: const TextStyle(color: Colors.black87),
        decoration: const InputDecoration(
          hintText: 'Enter your username',
          hintStyle: TextStyle(color: Colors.grey),
          border: InputBorder.none,
          prefixIcon: Icon(Icons.person_outline, color: Colors.grey),
          contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildContinueButton(BuildContext context) {
    return ElevatedButton(
      onPressed: _handleEmailLogin,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryOrange,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: 4,
        shadowColor: AppColors.primaryOrange.withOpacity(0.4),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('Continue', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          SizedBox(width: 12),
          Icon(Icons.arrow_forward_rounded),
        ],
      ),
    );
  }

  Widget _buildSubmitUsernameButton(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        if (_usernameController.text.trim().length < 4) {
          _showError('Username must be at least 4 characters');
          return;
        }
        setState(() => _isMissingUsername = false);
        _handleEmailLogin();
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF6C47FF), // Clerk purple color from screenshot
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('Continue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          SizedBox(width: 8),
          Icon(Icons.arrow_right_rounded, size: 24),
        ],
      ),
    );
  }

  Widget _buildFooterLinks() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text("Don't have an account?", style: TextStyle(color: Colors.grey)),
        TextButton(
          onPressed: _handleSignUp, 
          child: const Text('Sign up', style: TextStyle(color: AppColors.primaryOrange, fontWeight: FontWeight.bold))
        ),
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


