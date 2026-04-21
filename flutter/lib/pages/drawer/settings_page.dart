import 'package:re7lty_app/theme/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import '../../providers/theme_provider.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      appBar: AppBar(
        title: const Text('الإعدادات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 20),
            _buildSectionHeader('المظهر'),
            ListTile(
              leading: Icon(isDark ? Icons.light_mode : Icons.dark_mode, color: AppColors.primaryOrange),
              title: const Text('الوضع الداكن'),
              trailing: Switch(
                value: isDark,
                onChanged: (val) => ref.read(themeProvider.notifier).toggleTheme(),
                activeColor: AppColors.primaryOrange,
              ),
            ),
            const Divider(),
            
            _buildSectionHeader('الحساب'),
            _buildListTile(Icons.person_outline, 'المعلومات الشخصية'),
            _buildListTile(Icons.notifications_none, 'الإشعارات'),
            _buildListTile(Icons.language, 'لغة التطبيق', trailingText: 'العربية'),
            const Divider(),

            _buildSectionHeader('أخرى'),
            _buildListTile(Icons.privacy_tip_outlined, 'سياسة الخصوصية'),
            _buildListTile(Icons.info_outline, 'عن التطبيق', trailingText: 'v1.1.0'),
            
            const SizedBox(height: 40),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: ElevatedButton.icon(
                onPressed: () async {
                  await ClerkAuth.of(context).signOut();
                },
                icon: const Icon(Icons.logout),
                label: const Text('تسجيل الخروج', style: TextStyle(fontWeight: FontWeight.bold)),
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

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Align(
        alignment: Alignment.centerRight,
        child: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryOrange, fontSize: 13),
        ),
      ),
    );
  }

  Widget _buildListTile(IconData icon, String title, {String? trailingText}) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey.shade600),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      trailing: trailingText != null 
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(trailingText, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
              ],
            )
          : const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
      onTap: () {},
    );
  }
}



