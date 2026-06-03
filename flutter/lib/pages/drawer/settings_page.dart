import 'package:re7lty_app/theme/app_colors.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/env_config.dart';
import '../../services/api_service.dart';
import '../../providers/trip_wizard_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/user_provider.dart';
import '../../providers/auth_bootstrap_provider.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      appBar: AppBar(
        title: Text('الإعدادات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 20),
            _buildSectionHeader('المظهر'),
            ListTile(
              leading: Icon(isDark ? Icons.light_mode : Icons.dark_mode, color: AppColors.primaryOrange),
              title: Text('الوضع الداكن', style: GoogleFonts.cairo()),
              trailing: Switch(
                value: isDark,
                onChanged: (val) => ref.read(themeProvider.notifier).toggleTheme(),
                activeThumbColor: AppColors.primaryOrange,
              ),
            ),
            const Divider(),

            _buildSectionHeader('الحساب'),
            _buildListTile(context, icon: Icons.person_outline, title: 'الملف الشخصي', onTap: () => context.push('/profile')),
            _buildListTile(context, icon: Icons.notifications_none, title: 'الإشعارات', onTap: () => context.push('/notifications')),
            _buildListTile(context, icon: Icons.confirmation_number_outlined, title: 'التحقق من حجز', onTap: () => context.push('/verify-booking')),
            _buildListTile(
              context,
              icon: Icons.language,
              title: 'لغة التطبيق',
              trailingText: 'العربية',
              onTap: () {},
            ),
            const Divider(),

            _buildSectionHeader('الاتصال بالسيرفر'),
            ListTile(
              leading: const Icon(Icons.dns_outlined, color: AppColors.primaryOrange),
              title: Text('رابط الخادم (API)', style: GoogleFonts.cairo()),
              subtitle: Text(
                EnvConfig.hasApiBaseUrl ? EnvConfig.apiBaseUrl : 'غير مُعد — اضغط للإعداد',
                style: GoogleFonts.cairo(fontSize: 11),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              onTap: () => _showApiUrlSheet(context),
            ),
            const Divider(),

            _buildSectionHeader('أخرى'),
            _buildListTile(context, icon: Icons.support_agent_outlined, title: 'الدعم الفني', onTap: () => context.push('/support')),
            _buildListTile(
              context,
              icon: Icons.info_outline,
              title: 'عن التطبيق',
              trailingText: 'v1.1.0',
              onTap: () {},
            ),
            const Divider(),

            if (kDebugMode) ...[
              _buildSectionHeader('إعدادات المطور (للتجربة)'),
              ListTile(
                leading: const Icon(Icons.bug_report, color: Colors.red),
                title: Text('تبديل لبيئة الشركات', style: GoogleFonts.cairo()),
                subtitle: Text('قم بتفعيل هذا الخيار لرؤية التطبيق كشركة سياحة', style: GoogleFonts.cairo(fontSize: 12)),
                trailing: Switch(
                  value: ref.watch(debugRoleProvider) == 'company',
                  onChanged: (val) {
                    ref.read(debugRoleProvider.notifier).state = val ? 'company' : null;
                  },
                  activeThumbColor: Colors.red,
                ),
              ),
            ],

            const SizedBox(height: 40),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: ElevatedButton.icon(
                onPressed: () async {
                  ref.read(authBootstrapProvider.notifier).reset();
                  await ClerkAuth.of(context).signOut();
                },
                icon: const Icon(Icons.logout),
                label: Text('تسجيل الخروج', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade50,
                  foregroundColor: Colors.red,
                  elevation: 0,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Future<void> _showApiUrlSheet(BuildContext context) async {
    final controller = TextEditingController(
      text: EnvConfig.hasApiBaseUrl
          ? EnvConfig.apiBaseUrl.replaceAll(RegExp(r'/api$'), '')
          : '',
    );
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('رابط الخادم', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 8),
              Text(
                'يعمل من أي شبكة. ${EnvConfig.apiConfigHint}',
                style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                decoration: InputDecoration(
                  hintText: 'https://your-backend.vercel.app',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryOrange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text('حفظ', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
              ),
              TextButton(
                onPressed: () async {
                  await EnvConfig.setApiBaseUrlOverride(null);
                  if (ctx.mounted) Navigator.pop(ctx, true);
                },
                child: Text('استخدام الإعداد من .env', style: GoogleFonts.cairo()),
              ),
            ],
          ),
        );
      },
    );
    if (saved == true && controller.text.trim().isNotEmpty) {
      await EnvConfig.setApiBaseUrlOverride(controller.text.trim());
      ref.invalidate(apiServiceProvider);
      ref.invalidate(tripPlanServiceProvider);
      if (mounted) {
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('تم الحفظ: ${EnvConfig.apiBaseUrl}', style: GoogleFonts.cairo()),
            backgroundColor: Colors.green,
          ),
        );
      }
    } else if (saved == true) {
      ref.invalidate(apiServiceProvider);
      ref.invalidate(tripPlanServiceProvider);
      if (mounted) setState(() {});
    }
    controller.dispose();
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Align(
        alignment: Alignment.centerRight,
        child: Text(
          title,
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: AppColors.primaryOrange, fontSize: 13),
        ),
      ),
    );
  }

  Widget _buildListTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    VoidCallback? onTap,
    String? trailingText,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey.shade600),
      title: Text(title, style: GoogleFonts.cairo(fontSize: 15)),
      trailing: trailingText != null
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(trailingText, style: GoogleFonts.cairo(color: Colors.grey, fontSize: 13)),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
              ],
            )
          : const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
      onTap: onTap,
    );
  }
}
