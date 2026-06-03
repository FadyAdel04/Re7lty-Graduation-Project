import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import 'package:dio/dio.dart';
import '../../theme/app_colors.dart';

class CompanyMessagesPage extends ConsumerStatefulWidget {
  const CompanyMessagesPage({super.key});

  @override
  ConsumerState<CompanyMessagesPage> createState() => _CompanyMessagesPageState();
}

class _CompanyMessagesPageState extends ConsumerState<CompanyMessagesPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<dynamic> _directConversations = [];
  List<dynamic> _tripGroups = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadMessages();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final results = await Future.wait<Response?>([
        api.get('/chat/conversations').catchError((_) => null),
        api.get('/trip-groups').catchError((_) => null),
      ]);

      if (results[0] != null && results[0]!.statusCode == 200) {
        final data = results[0]!.data;
        _directConversations = data is List ? data : (data['conversations'] ?? []);
      }
      if (results[1] != null && results[1]!.statusCode == 200) {
        final data = results[1]!.data;
        _tripGroups = data is List ? data : (data['groups'] ?? []);
      }
    } catch (e) {
      debugPrint('Error loading messages: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('الرسائل', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 18), onPressed: () => Navigator.pop(context)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_outlined, color: Colors.blue), onPressed: _loadMessages),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.blue,
          labelColor: Colors.blue,
          unselectedLabelColor: Colors.grey,
          labelStyle: GoogleFonts.cairo(fontWeight: FontWeight.bold),
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.chat_outlined, size: 16),
                  const SizedBox(width: 6),
                  Text('الاستفسارات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13)),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.group_outlined, size: 16),
                  const SizedBox(width: 6),
                  Text('مجموعات الرحلات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13)),
                ],
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.blue))
          : RefreshIndicator(
              onRefresh: _loadMessages,
              color: Colors.blue,
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildDirectMessages(),
                  _buildTripGroups(),
                ],
              ),
            ),
    );
  }

  Widget _buildDirectMessages() {
    if (_directConversations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey.withOpacity(0.3)),
            const SizedBox(height: 16),
            Text('لا توجد محادثات حالياً', style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('سيظهر هنا رسائل العملاء واستفساراتهم', style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey[400])),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _directConversations.length,
      itemBuilder: (_, i) {
        final conv = _directConversations[i];
        final unread = conv['unreadCount'] ?? 0;
        final lastMessage = conv['lastMessage'] ?? {};
        final otherUser = conv['otherUser'] ?? {};
        DateTime? lastTime;
        try { lastTime = DateTime.parse(lastMessage['createdAt'] ?? ''); } catch (_) {}

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
          ),
          child: InkWell(
            onTap: () => _openConversation(conv),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Avatar
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 26,
                        backgroundColor: Colors.blue.withOpacity(0.1),
                        backgroundImage: otherUser['imageUrl'] != null && otherUser['imageUrl'].toString().isNotEmpty
                            ? NetworkImage(otherUser['imageUrl'])
                            : null,
                        child: otherUser['imageUrl'] == null
                            ? Text((otherUser['fullName'] ?? 'م').toString().substring(0, 1), style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.blue))
                            : null,
                      ),
                      if (unread > 0)
                        Positioned(
                          right: 0,
                          top: 0,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                            child: Text('$unread', style: GoogleFonts.cairo(fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(child: Text(otherUser['fullName'] ?? 'مسافر', style: GoogleFonts.cairo(fontWeight: unread > 0 ? FontWeight.bold : FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis)),
                            if (lastTime != null) Text(_formatTime(lastTime), style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          lastMessage['content'] ?? 'ابدأ المحادثة...',
                          style: GoogleFonts.cairo(fontSize: 13, color: unread > 0 ? Colors.black87 : Colors.grey[500], fontWeight: unread > 0 ? FontWeight.bold : FontWeight.normal),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ).animate().fadeIn(delay: (i * 60).ms);
      },
    );
  }

  Widget _buildTripGroups() {
    if (_tripGroups.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.group_outlined, size: 64, color: Colors.grey.withOpacity(0.3)),
            const SizedBox(height: 16),
            Text('لا توجد مجموعات رحلات', style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('تظهر هنا مجموعات المسافرين لكل رحلة', style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey[400])),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _tripGroups.length,
      itemBuilder: (_, i) {
        final group = _tripGroups[i];
        final unread = group['unreadCount'] ?? 0;
        final memberCount = (group['members'] as List?)?.length ?? 0;
        final lastMsg = group['lastMessage'] ?? {};
        DateTime? lastTime;
        try { lastTime = DateTime.parse(lastMsg['createdAt'] ?? ''); } catch (_) {}

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
          ),
          child: InkWell(
            onTap: () => _openGroup(group),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Group icon
                  Stack(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)]),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.group, color: Colors.white, size: 26),
                      ),
                      if (unread > 0)
                        Positioned(
                          right: 0,
                          top: 0,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                            child: Text('$unread', style: GoogleFonts.cairo(fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(child: Text(group['tripTitle'] ?? group['name'] ?? 'مجموعة رحلة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis)),
                            if (lastTime != null) Text(_formatTime(lastTime), style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.people_outline, size: 13, color: Colors.grey[400]),
                            const SizedBox(width: 4),
                            Text('$memberCount عضو', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey[500])),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                lastMsg['content'] ?? 'لا توجد رسائل بعد',
                                style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey[400]),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ).animate().fadeIn(delay: (i * 60).ms);
      },
    );
  }

  void _openConversation(Map<String, dynamic> conv) {
    // Navigate to chat screen - can be implemented with existing chat page
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('فتح المحادثة مع ${conv['otherUser']?['fullName'] ?? 'المسافر'}', style: GoogleFonts.cairo()),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  void _openGroup(Map<String, dynamic> group) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('فتح مجموعة: ${group['tripTitle'] ?? group['name']}', style: GoogleFonts.cairo()),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 60) return 'منذ ${diff.inMinutes} د';
    if (diff.inHours < 24) return 'منذ ${diff.inHours} س';
    return DateFormat('dd/MM').format(time);
  }
}
