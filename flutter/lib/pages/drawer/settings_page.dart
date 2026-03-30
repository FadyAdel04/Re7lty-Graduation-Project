import 'package:flutter/material.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإعدادات', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 20),
            _buildSectionHeader('الحساب'),
            _buildListTile(Icons.person, 'المعلومات الشخصية'),
            _buildListTile(Icons.security, 'كلمة المرور والأمان'),
            const Divider(),
            
            _buildSectionHeader('التفضيلات'),
            _buildListTile(Icons.language, 'لغة التطبيق', trailingText: 'العربية'),
            _buildListTile(Icons.dark_mode, 'المظهر', trailingText: 'فاتح'),
            _buildListTile(Icons.notifications, 'الإشعارات'),
            const Divider(),

            _buildSectionHeader('أخرى'),
            _buildListTile(Icons.privacy_tip, 'سياسة الخصوصية'),
            _buildListTile(Icons.description, 'الشروط والأحكام'),
            _buildListTile(Icons.info, 'عن التطبيق', trailingText: 'v1.0.0'),
            
            const SizedBox(height: 40),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.logout),
                label: const Text('تسجيل الخروج'),
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
          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.orange, fontSize: 13),
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
                Text(trailingText, style: const TextStyle(color: Colors.grey)),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
              ],
            )
          : const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
      onTap: () {},
    );
  }
}
