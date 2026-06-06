import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import 'package:go_router/go_router.dart';

class MessagesPage extends ConsumerStatefulWidget {
  const MessagesPage({super.key});

  @override
  ConsumerState<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends ConsumerState<MessagesPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<dynamic> _companyConversations = [];
  List<dynamic> _directConversations = [];
  List<dynamic> _tripGroups = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadMessages();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    if (mounted) setState(() => _isLoading = true);
    final api = ref.read(apiServiceProvider);

    // Fetch all three endpoints independently so one failure doesn't break others
    try {
      final r = await api.get('/chat/conversations');
      if (r.statusCode == 200) {
        final d = r.data;
        if (mounted) setState(() => _companyConversations = d is List ? d : (d['conversations'] ?? []));
      }
    } catch (_) {}

    try {
      final r = await api.get('/directChat/conversations');
      if (r.statusCode == 200) {
        final d = r.data;
        if (mounted) setState(() => _directConversations = d is List ? d : (d['conversations'] ?? []));
      }
    } catch (_) {}

    try {
      final r = await api.get('/trip-groups');
      if (r.statusCode == 200) {
        final d = r.data;
        if (mounted) setState(() => _tripGroups = d is List ? d : (d['groups'] ?? []));
      }
    } catch (_) {}

    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor ?? (isDark ? Colors.grey[900] : Colors.white),
        elevation: 0,
        title: Text('الرسائل', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18, color: theme.textTheme.titleLarge?.color)),
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: theme.iconTheme.color),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_outlined, color: isDark ? Colors.blue[300] : Colors.blue),
            onPressed: _loadMessages,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.blue,
          labelColor: Colors.blue,
          unselectedLabelColor: Colors.grey,
          labelStyle: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 12),
          tabs: const [
            Tab(text: 'الشركات', icon: Icon(Icons.business_center_outlined, size: 20)),
            Tab(text: 'الخاصة', icon: Icon(Icons.person_outline, size: 20)),
            Tab(text: 'المجموعات', icon: Icon(Icons.group_outlined, size: 20)),
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
                  _buildCompanyMessages(),
                  _buildDirectMessages(),
                  _buildTripGroups(),
                ],
              ),
            ),
    );
  }

  Widget _buildCompanyMessages() {
    if (_companyConversations.isEmpty) {
      return _buildEmptyState(Icons.business_center_outlined, 'لا توجد محادثات مع شركات', 'ستظهر هنا رسائلك مع الشركات السياحية');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _companyConversations.length,
      itemBuilder: (_, i) {
        final conv = _companyConversations[i];
        final company = conv['companyId'] is Map ? conv['companyId'] : <String, dynamic>{};
        return _buildConversationCard(
          title: company['name'] as String? ?? 'شركة',
          subtitle: conv['lastMessage'] as String? ?? 'ابدأ المحادثة...',
          imageUrl: company['logo'] as String?,
          unreadCount: (conv['unreadCount'] as int?) ?? 0,
          timeStr: conv['lastMessageAt'] as String?,
          onTap: () => context.push('/chat/company/${conv['_id']}'),
        );
      },
    );
  }

  Widget _buildDirectMessages() {
    if (_directConversations.isEmpty) {
      return _buildEmptyState(Icons.chat_bubble_outline, 'لا توجد محادثات خاصة', 'ستظهر هنا رسائلك مع أصدقائك');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _directConversations.length,
      itemBuilder: (_, i) {
        final conv = _directConversations[i];
        final otherUser = conv['otherParticipant'] is Map ? conv['otherParticipant'] : <String, dynamic>{};
        return _buildConversationCard(
          title: otherUser['fullName'] as String? ?? 'صديق',
          subtitle: conv['lastMessage'] as String? ?? 'ابدأ المحادثة...',
          imageUrl: otherUser['imageUrl'] as String?,
          unreadCount: (conv['unreadCount'] as int?) ?? 0,
          timeStr: conv['lastMessageAt'] as String?,
          onTap: () => context.push('/chat/direct/${conv['_id']}'),
        );
      },
    );
  }

  Widget _buildTripGroups() {
    if (_tripGroups.isEmpty) {
      return _buildEmptyState(Icons.group_outlined, 'لا توجد مجموعات رحلات', 'ستظهر هنا مجموعات الرحلات التي انضممت إليها');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _tripGroups.length,
      itemBuilder: (_, i) {
        final group = _tripGroups[i];
        final participants = group['participants'] as List?;
        final memberCount = participants?.length ?? 0;
        final lastMsg = group['lastMessage'] as String? ?? 'لا توجد رسائل بعد';
        return _buildConversationCard(
          title: group['name'] as String? ?? 'مجموعة',
          subtitle: '$memberCount عضو • $lastMsg',
          imageUrl: group['companyLogo'] as String?,
          unreadCount: (group['unreadCount'] as num?)?.toInt() ?? 0,
          timeStr: group['lastMessageAt'] as String?,
          onTap: () => context.push('/chat/group/${group['_id']}'),
          isGroup: true,
        );
      },
    );
  }

  Widget _buildConversationCard({
    required String title,
    required String subtitle,
    required String? imageUrl,
    required int unreadCount,
    required String? timeStr,
    required VoidCallback onTap,
    bool isGroup = false,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    DateTime? lastTime;
    try {
      lastTime = timeStr != null ? DateTime.parse(timeStr) : null;
    } catch (_) {}

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[800] : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  isGroup
                      ? Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.group, color: Colors.white, size: 26),
                        )
                      : CircleAvatar(
                          radius: 26,
                          backgroundColor: Colors.blue.withValues(alpha: 0.1),
                          backgroundImage: imageUrl != null && imageUrl.isNotEmpty
                              ? NetworkImage(imageUrl)
                              : null,
                          child: imageUrl == null || imageUrl.isEmpty
                              ? Text(
                                  title.isNotEmpty ? title.substring(0, 1) : 'م',
                                  style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.blue),
                                )
                              : null,
                        ),
                  if (unreadCount > 0)
                    Positioned(
                      right: -4,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                        child: Text(
                          '$unreadCount',
                          style: GoogleFonts.cairo(fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold),
                        ),
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
                        Expanded(
                          child: Text(
                            title,
                            style: GoogleFonts.cairo(
                              fontWeight: unreadCount > 0 ? FontWeight.bold : FontWeight.w600,
                              fontSize: 14,
                              color: theme.textTheme.bodyLarge?.color,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (lastTime != null)
                          Text(
                            _formatTime(lastTime),
                            style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: GoogleFonts.cairo(
                        fontSize: 13,
                        color: unreadCount > 0 
                            ? (isDark ? Colors.white : Colors.black87) 
                            : (isDark ? Colors.grey[400] : Colors.grey[500]),
                        fontWeight: unreadCount > 0 ? FontWeight.bold : FontWeight.normal,
                      ),
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
    );
  }

  Widget _buildEmptyState(IconData icon, String title, String subtitle) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: Colors.grey.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text(title, style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(subtitle, style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey[400])),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 60) return 'منذ ${diff.inMinutes} د';
    if (diff.inHours < 24) return 'منذ ${diff.inHours} س';
    return DateFormat('dd/MM').format(time);
  }
}
