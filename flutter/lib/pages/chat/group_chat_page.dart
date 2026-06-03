import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'dart:async';
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';
import '../../services/api_service.dart';
import '../../services/pusher_service.dart';

class GroupChatPage extends ConsumerStatefulWidget {
  final String groupId;
  const GroupChatPage({super.key, required this.groupId});

  @override
  ConsumerState<GroupChatPage> createState() => _GroupChatPageState();
}

class _GroupChatPageState extends ConsumerState<GroupChatPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<dynamic> _messages = [];
  Map<String, dynamic>? _groupInfo;
  bool _isLoading = true;
  bool _isSending = false;
  Timer? _timer;
  int _lastMessageCount = 0;
  String? _myId;
  bool _isLocked = false;

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    _markAsRead();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) => _fetchMessages(silent: true));
    
    // Initialize Pusher
    final pusher = ref.read(pusherServiceProvider);
    pusher.initPusher(onEvent: _onPusherEvent);
    pusher.subscribeToChannel('trip-group-${widget.groupId}');
  }

  void _onPusherEvent(PusherEvent event) {
    if (event.eventName == 'new-message') {
      _fetchMessages(silent: true);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    ref.read(pusherServiceProvider).unsubscribeFromChannel('trip-group-${widget.groupId}');
    super.dispose();
  }

  Future<void> _fetchMessages({bool silent = false}) async {
    if (!silent && mounted) setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/trip-groups/${widget.groupId}/messages');
      if (response.statusCode == 200 && mounted) {
        final newMessages = response.data as List<dynamic>;
        if (newMessages.length != _lastMessageCount) {
          _lastMessageCount = newMessages.length;
          setState(() {
            _messages = newMessages;
            _isLoading = false;
          });
          _scrollToBottom();
        } else {
          if (!silent && mounted) setState(() => _isLoading = false);
        }
      }
    } catch (_) {
      if (!silent && mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead() async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/trip-groups/${widget.groupId}/read');
    } catch (_) {}
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    _messageController.clear();
    if (mounted) setState(() => _isSending = true);

    final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final tempMsg = <String, dynamic>{
      '_id': tempId,
      'content': text,
      'senderId': _myId,
      'senderName': 'أنا',
      'type': 'text',
      'createdAt': DateTime.now().toIso8601String(),
    };
    if (mounted) setState(() => _messages = [..._messages, tempMsg]);
    _scrollToBottom();

    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/trip-groups/${widget.groupId}/messages', data: {
        'content': text,
        'type': 'text',
      });
      await _fetchMessages(silent: true);
    } catch (e) {
      if (!mounted) return;
      final errMsg = e.toString().contains('locked')
          ? 'المجموعة مقفلة - لا يمكن الإرسال حالياً'
          : 'فشل إرسال الرسالة';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errMsg)));
      if (mounted) {
        setState(() {
          _messages = _messages.where((m) => m['_id'] != tempId).toList();
        });
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<bool> _showExitConfirmation() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('تأكيد الخروج', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        content: Text('هل أنت متأكد أنك تريد مغادرة المحادثة؟', style: GoogleFonts.cairo()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('إلغاء', style: GoogleFonts.cairo(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('خروج', style: GoogleFonts.cairo(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    _myId ??= ClerkAuth.of(context).user?.id;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final groupName = _groupInfo?['name'] as String? ?? 'مجموعة الرحلة';
    final companyLogo = _groupInfo?['companyLogo'] as String?;
    final memberCount = (_groupInfo?['participants'] as List?)?.length ?? 0;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final confirm = await _showExitConfirmation();
        if (confirm && mounted) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
      backgroundColor: isDark ? const Color(0xFF1A1A2E) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF4F46E5).withValues(alpha: 0.15),
              backgroundImage: companyLogo != null && companyLogo.isNotEmpty
                  ? NetworkImage(companyLogo)
                  : null,
              child: companyLogo == null || companyLogo.isEmpty
                  ? const Icon(Icons.group, color: Color(0xFF4F46E5), size: 20)
                  : null,
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(groupName, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15)),
                if (memberCount > 0)
                  Text(
                    '$memberCount عضو',
                    style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey),
                  ),
              ],
            ),
          ],
        ),
        backgroundColor: isDark ? const Color(0xFF16213E) : Colors.white,
        centerTitle: false,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () async {
            final confirm = await _showExitConfirmation();
            if (confirm && mounted) Navigator.pop(context);
          },
        ),
        actions: [
          if (_isLocked)
            Container(
              margin: const EdgeInsets.only(left: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.lock, size: 14, color: Colors.red),
                  const SizedBox(width: 4),
                  Text('مقفلة', style: GoogleFonts.cairo(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          IconButton(
            icon: const Icon(Icons.exit_to_app, color: Colors.red),
            onPressed: () async {
              final confirm = await _showExitConfirmation();
              if (confirm && mounted) Navigator.pop(context);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
                : _messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.groups_outlined, size: 72, color: Colors.grey.withValues(alpha: 0.3)),
                            const SizedBox(height: 12),
                            Text('لا توجد رسائل في المجموعة بعد', style: GoogleFonts.cairo(color: Colors.grey)),
                            const SizedBox(height: 8),
                            Text(
                              'كن أول من يبدأ المحادثة!',
                              style: GoogleFonts.cairo(color: Colors.grey[400], fontSize: 12),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMe = (msg['senderId'] as String?) == _myId;
                          final isTemp = (msg['_id'] as String?)?.startsWith('temp_') ?? false;
                          final type = msg['type'] as String? ?? 'text';
                          // Show date separator
                          final showDate = _shouldShowDate(index);
                          return Column(
                            children: [
                              if (showDate) _buildDateSeparator(msg['createdAt'] as String?),
                              _buildMessageBubble(msg: msg, isMe: isMe, type: type, isTemp: isTemp),
                            ],
                          );
                        },
                      ),
          ),
          _buildMessageInput(isDark),
        ],
      ),
    ));
  }

  bool _shouldShowDate(int index) {
    if (index == 0) return true;
    final curr = _messages[index]['createdAt'] as String?;
    final prev = _messages[index - 1]['createdAt'] as String?;
    if (curr == null || prev == null) return false;
    try {
      final currDate = DateTime.parse(curr);
      final prevDate = DateTime.parse(prev);
      return currDate.day != prevDate.day ||
          currDate.month != prevDate.month ||
          currDate.year != prevDate.year;
    } catch (_) {
      return false;
    }
  }

  Widget _buildDateSeparator(String? dateStr) {
    String label = '';
    if (dateStr != null) {
      try {
        final d = DateTime.parse(dateStr);
        final now = DateTime.now();
        final diff = now.difference(d);
        if (diff.inDays == 0) {
          label = 'اليوم';
        } else if (diff.inDays == 1) {
          label = 'أمس';
        } else {
          label = '${d.day}/${d.month}/${d.year}';
        }
      } catch (_) {}
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.grey.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(label, style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey[600])),
        ),
      ),
    );
  }

  Widget _buildMessageBubble({
    required Map<String, dynamic> msg,
    required bool isMe,
    required String type,
    bool isTemp = false,
  }) {
    final content = msg['content'] as String? ?? '';
    final senderName = msg['senderName'] as String? ?? 'عضو';
    final senderImage = msg['senderImage'] as String?;
    final createdAt = msg['createdAt'] as String?;
    final isAnnouncement = msg['isAnnouncement'] == true;

    DateTime? time;
    if (createdAt != null) {
      try { time = DateTime.parse(createdAt); } catch (_) {}
    }

    // System/announcement messages
    if (type == 'system' || isAnnouncement) {
      return Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF4F46E5).withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF4F46E5).withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.campaign_outlined, size: 16, color: Color(0xFF4F46E5)),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                content,
                style: GoogleFonts.cairo(
                  fontSize: 13,
                  color: const Color(0xFF4F46E5),
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: const Color(0xFF4F46E5).withValues(alpha: 0.1),
              backgroundImage: senderImage != null && senderImage.isNotEmpty
                  ? NetworkImage(senderImage)
                  : null,
              child: senderImage == null || senderImage.isEmpty
                  ? Text(
                      senderName.isNotEmpty ? senderName.substring(0, 1) : 'م',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5)),
                    )
                  : null,
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isMe ? const Color(0xFF4F46E5) : (Theme.of(context).brightness == Brightness.dark ? Colors.grey[800] : Colors.white),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: isMe ? const Radius.circular(18) : const Radius.circular(4),
                  bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(18),
                ),
                boxShadow: [
                  BoxShadow(
                    color: isMe
                        ? const Color(0xFF4F46E5).withValues(alpha: 0.25)
                        : Colors.black.withValues(alpha: 0.06),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ],
              ),
              child: Column(
                crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Sender name for others
                  if (!isMe)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        senderName,
                        style: GoogleFonts.cairo(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF4F46E5),
                        ),
                      ),
                    ),
                  // Media content
                  if (type == 'image' && msg['mediaUrl'] != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        msg['mediaUrl'] as String,
                        fit: BoxFit.cover,
                        height: 200,
                        width: double.infinity,
                        loadingBuilder: (ctx, child, progress) =>
                            progress == null ? child : const Center(child: CircularProgressIndicator()),
                      ),
                    ),
                  if (type == 'voice' && msg['mediaUrl'] != null)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.mic, size: 16, color: isMe ? Colors.white70 : Colors.grey),
                        const SizedBox(width: 4),
                        Text(
                          'رسالة صوتية',
                          style: GoogleFonts.cairo(
                            color: isMe ? Colors.white70 : Colors.grey,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  if (type == 'video' && msg['mediaUrl'] != null)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.videocam, size: 16, color: isMe ? Colors.white70 : Colors.grey),
                        const SizedBox(width: 4),
                        Text(
                          'مقطع فيديو',
                          style: GoogleFonts.cairo(
                            color: isMe ? Colors.white70 : Colors.grey,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  // Text content
                  if (content.isNotEmpty)
                    Text(
                      content,
                      style: GoogleFonts.cairo(
                        color: isMe ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87),
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (time != null)
                        Text(
                          '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}',
                          style: GoogleFonts.cairo(
                            color: isMe ? Colors.white.withValues(alpha: 0.65) : Colors.grey,
                            fontSize: 10,
                          ),
                        ),
                      if (isTemp && isMe) ...[
                        const SizedBox(width: 4),
                        Icon(Icons.schedule, size: 11, color: Colors.white.withValues(alpha: 0.5)),
                      ] else if (!isTemp && isMe) ...[
                        const SizedBox(width: 4),
                        Icon(Icons.done_all, size: 11, color: Colors.white.withValues(alpha: 0.65)),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageInput(bool isDark) {
    if (_isLocked) {
      return Container(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 14,
          bottom: MediaQuery.of(context).padding.bottom + 14,
        ),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF16213E) : Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, -5))],
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: Colors.red.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_outline, size: 18, color: Colors.red),
              const SizedBox(width: 8),
              Text(
                'المجموعة مقفلة – الإرسال موقوف مؤقتاً',
                style: GoogleFonts.cairo(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF16213E) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, -5),
          )
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              style: GoogleFonts.cairo(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'اكتب رسالتك للمجموعة...',
                hintStyle: GoogleFonts.cairo(color: Colors.grey, fontSize: 14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: isDark ? const Color(0xFF1A1A2E) : Colors.grey[100],
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              maxLines: null,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _sendMessage,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _isSending ? Colors.grey : const Color(0xFF4F46E5),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF4F46E5).withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: _isSending
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}
