import 'package:flutter/material.dart';

class SupportPage extends StatelessWidget {
  const SupportPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الدعم الفني', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Icon(Icons.support_agent, size: 80, color: Colors.orange),
          const SizedBox(height: 24),
          const Text(
            'كيف يمكننا مساعدتك؟',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          const Text(
            'فريق الدعم الفني متواجد على مدار الساعة لحل أي مشكلة تواجهك أو الإجابة على استفساراتك بحُب.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Colors.grey, height: 1.5),
          ),
          const SizedBox(height: 40),
          _buildContactButton(context, Icons.chat, 'محادثة مباشرة', 'الرد خلال ٥ دقائق', Colors.orange),
          const SizedBox(height: 16),
          _buildContactButton(context, Icons.email, 'تواصل عبر البريد', 'support@re7lty.com', Colors.blue),
          const SizedBox(height: 16),
          _buildContactButton(context, Icons.phone, 'اتصل بنا', '+20 123 456 7890', Colors.green),
        ],
      ),
    );
  }

  Widget _buildContactButton(BuildContext context, IconData icon, String title, String subtitle, Color color) {
    return InkWell(
      onTap: () {},
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
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 12)),
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


