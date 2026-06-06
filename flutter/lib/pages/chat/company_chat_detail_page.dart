import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';
import '../../services/api_service.dart';
import '../../services/pusher_service.dart';
import '../../providers/user_provider.dart';

class CompanyChatDetailPage extends ConsumerStatefulWidget {
  final String conversationId;
  const CompanyChatDetailPage({super.key, required this.conversationId});

  @override
  ConsumerState<CompanyChatDetailPage> createState() => _CompanyChatDetailPageState();
}

class _CompanyChatDetailPageState extends ConsumerState<CompanyChatDetailPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<dynamic> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  Timer? _timer;
  int _lastMessageCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    _markAsRead();
    // Poll every 3 seconds for real-time updates (Pusher keys may not be configured)
    _timer = Timer.periodic(const Duration(seconds: 3), (_) => _fetchMessages(silent: true));
    
    // Initialize Pusher
    final pusher = ref.read(pusherServiceProvider);
    pusher.initPusher(onEvent: _onPusherEvent);
    pusher.subscribeToChannel('conversation-${widget.conversationId}');
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
    ref.read(pusherServiceProvider).unsubscribeFromChannel('conversation-${widget.conversationId}');
    super.dispose();
  }

  Future<void> _fetchMessages({bool silent = false}) async {
    if (!silent) {
      if (mounted) setState(() => _isLoading = true);
    }
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/chat/${widget.conversationId}/messages');
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
    } catch (e) {
      if (!silent && mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead() async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/chat/${widget.conversationId}/read');
    } catch (_) {}
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    final role = ref.read(userRoleProvider);
    final senderType = role == 'company' ? 'company' : 'user';

    _messageController.clear();
    if (mounted) setState(() => _isSending = true);

    // Optimistic insert
    final tempMsg = <String, dynamic>{
      '_id': 'temp_${DateTime.now().millisecondsSinceEpoch}',
      'content': text,
      'senderType': senderType,
      'createdAt': DateTime.now().toIso8601String(),
    };
    if (mounted) setState(() => _messages = [..._messages, tempMsg]);
    _scrollToBottom();

    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/chat/${widget.conversationId}/messages', data: {
        'content': text,
        'senderType': senderType,
      });
      // Refresh to get the real server message replacing the temp one
      await _fetchMessages(silent: true);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('فشل إرسال الرسالة، يرجى المحاولة مرة أخرى')),
      );
      // Remove optimistic message on failure
      if (mounted) {
        setState(() {
          _messages = _messages.where((m) => m['_id'] != tempMsg['_id']).toList();
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
    final role = ref.watch(userRoleProvider);
    final mySenderType = role == 'company' ? 'company' : 'user';
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF4F46E5).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.business_center_outlined, color: Color(0xFF4F46E5), size: 20),
            ),
            const SizedBox(width: 8),
            Text(
              mySenderType == 'user' ? 'محادثة مع الشركة' : 'محادثة مع المسافر',
              style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
        backgroundColor: isDark ? const Color(0xFF16213E) : Colors.white,
        centerTitle: true,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () async {
            final confirm = await _showExitConfirmation();
            if (confirm && mounted) Navigator.pop(context);
          },
        ),
        actions: [
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
                            Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey.withValues(alpha: 0.3)),
                            const SizedBox(height: 12),
                            Text('ابدأ المحادثة الآن', style: GoogleFonts.cairo(color: Colors.grey)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMe = (msg['senderType'] as String?) == mySenderType;
                          return _buildMessageBubble(
                            content: msg['content'] as String? ?? '',
                            isMe: isMe,
                            createdAt: msg['createdAt'] as String?,
                            isTemp: (msg['_id'] as String?)?.startsWith('temp_') ?? false,
                          );
                        },
                      ),
          ),
          _buildMessageInput(isDark),
        ],
      ),
    ));
  }

  Widget _buildMessageBubble({
    required String content,
    required bool isMe,
    required String? createdAt,
    bool isTemp = false,
  }) {
    DateTime? time;
    if (createdAt != null) {
      try { time = DateTime.parse(createdAt); } catch (_) {}
    }

    return Align(
      alignment: isMe ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFF4F46E5) : (Theme.of(context).brightness == Brightness.dark ? Colors.grey[800] : Colors.white),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: isMe ? const Radius.circular(4) : const Radius.circular(18),
            bottomRight: isMe ? const Radius.circular(18) : const Radius.circular(4),
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
                      color: isMe ? Colors.white.withValues(alpha: 0.7) : Colors.grey,
                      fontSize: 10,
                    ),
                  ),
                if (isTemp && isMe) ...[
                  const SizedBox(width: 4),
                  Icon(Icons.schedule, size: 12, color: Colors.white.withValues(alpha: 0.5)),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput(bool isDark) {
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
                hintText: 'اكتب رسالتك...',
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
