import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class SupportPage extends StatelessWidget {
  const SupportPage({super.key});

  static const _supportEmail = 'support@re7lty.com';
  static const _supportPhone = '+201234567890';

  Future<void> _launch(Uri uri) async {
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw Exception('تعذر فتح الرابط');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('الدعم الفني', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Icon(Icons.support_agent, size: 80, color: Colors.orange),
          const SizedBox(height: 24),
          Text(
            'كيف يمكننا مساعدتك؟',
            textAlign: TextAlign.center,
            style: GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Text(
            'فريق الدعم الفني متواجد على مدار الساعة لحل أي مشكلة تواجهك أو الإجابة على استفساراتك.',
            textAlign: TextAlign.center,
            style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey, height: 1.5),
          ),
          const SizedBox(height: 40),
          _buildContactButton(
            context,
            Icons.chat,
            'محادثة مباشرة',
            'افتح صندوق الرسائل',
            Colors.orange,
            () => context.push('/messages'),
          ),
          const SizedBox(height: 16),
          _buildContactButton(
            context,
            Icons.email,
            'تواصل عبر البريد',
            _supportEmail,
            Colors.blue,
            () => _launch(Uri.parse('mailto:$_supportEmail?subject=${Uri.encodeComponent('دعم Re7lty')}')),
          ),
          const SizedBox(height: 16),
          _buildContactButton(
            context,
            Icons.phone,
            'اتصل بنا',
            _supportPhone,
            Colors.green,
            () => _launch(Uri(scheme: 'tel', path: _supportPhone)),
          ),
        ],
      ),
    );
  }

  Widget _buildContactButton(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle,
    Color color,
    Future<void> Function() action,
  ) {
    return InkWell(
      onTap: () async {
        try {
          await action();
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('تعذر تنفيذ الإجراء', style: GoogleFonts.cairo())),
            );
          }
        }
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade200),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: GoogleFonts.cairo(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
