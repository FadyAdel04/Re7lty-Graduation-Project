import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'dart:async';
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';
import '../../services/api_service.dart';
import '../../services/pusher_service.dart';

class DirectChatPage extends ConsumerStatefulWidget {
  final String conversationId;
  const DirectChatPage({super.key, required this.conversationId});

  @override
  ConsumerState<DirectChatPage> createState() => _DirectChatPageState();
}

class _DirectChatPageState extends ConsumerState<DirectChatPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<dynamic> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  Timer? _timer;
  int _lastMessageCount = 0;
  String? _myId;
  Map<String, dynamic>? _otherParticipant;

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    _markAsRead();
    _timer = Timer.periodic(const Duration(seconds: 12), (_) => _fetchMessages(silent: true));
    
    // Initialize Pusher
    final pusher = ref.read(pusherServiceProvider);
    pusher.initPusher(onEvent: _onPusherEvent);
    pusher.subscribeToChannel('direct-conversation-${widget.conversationId}');
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
    ref.read(pusherServiceProvider).unsubscribeFromChannel('direct-conversation-${widget.conversationId}');
    super.dispose();
  }

  Future<void> _fetchMessages({bool silent = false}) async {
    if (!silent && mounted) setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/directChat/${widget.conversationId}/messages');
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
      await api.post('/directChat/${widget.conversationId}/read');
    } catch (_) {}
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    _messageController.clear();
    if (mounted) setState(() => _isSending = true);

    // Optimistic insert
    final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final tempMsg = <String, dynamic>{
      '_id': tempId,
      'content': text,
      'senderId': _myId,
      'type': 'text',
      'createdAt': DateTime.now().toIso8601String(),
    };
    if (mounted) setState(() => _messages = [..._messages, tempMsg]);
    _scrollToBottom();

    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/directChat/${widget.conversationId}/messages', data: {
        'content': text,
        'type': 'text',
      });
      await _fetchMessages(silent: true);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('فشل إرسال الرسالة')),
      );
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

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF1A1A2E) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: Colors.blue.withValues(alpha: 0.15),
              child: const Icon(Icons.person, color: Colors.blue, size: 20),
            ),
            const SizedBox(width: 8),
            Text(
              _otherParticipant?['fullName'] as String? ?? 'محادثة خاصة',
              style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
        backgroundColor: isDark ? const Color(0xFF16213E) : Colors.white,
        centerTitle: true,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.exit_to_app, color: Colors.red),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Colors.blue))
                : _messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey.withValues(alpha: 0.3)),
                            const SizedBox(height: 12),
                            Text('ابدأ المحادثة الآن', style: GoogleFonts.cairo(color: Colors.grey)),
                            const SizedBox(height: 8),
                            Text(
                              'يجب أن تتابعوا بعضكم لإرسال الرسائل',
                              style: GoogleFonts.cairo(color: Colors.grey[400], fontSize: 12),
                              textAlign: TextAlign.center,
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
                          return _buildMessageBubble(
                            msg: msg,
                            isMe: isMe,
                            type: type,
                            isTemp: isTemp,
                          );
                        },
                      ),
          ),
          _buildMessageInput(isDark),
        ],
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
    final createdAt = msg['createdAt'] as String?;
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
          color: isMe ? Colors.blue : (Theme.of(context).brightness == Brightness.dark ? Colors.grey[800] : Colors.white),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: isMe ? const Radius.circular(4) : const Radius.circular(18),
            bottomRight: isMe ? const Radius.circular(18) : const Radius.circular(4),
          ),
          boxShadow: [
            BoxShadow(
              color: isMe
                  ? Colors.blue.withValues(alpha: 0.25)
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
            if (type == 'image' && msg['mediaUrl'] != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.network(
                  msg['mediaUrl'] as String,
                  fit: BoxFit.cover,
                  height: 200,
                  width: double.infinity,
                ),
              ),
            if (type == 'voice' && msg['mediaUrl'] != null)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.mic, size: 16, color: Colors.white70),
                  const SizedBox(width: 4),
                  Text('رسالة صوتية', style: GoogleFonts.cairo(color: Colors.white70, fontSize: 13)),
                ],
              ),
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
                      color: isMe ? Colors.white.withValues(alpha: 0.7) : Colors.grey,
                      fontSize: 10,
                    ),
                  ),
                if (isTemp && isMe) ...[
                  const SizedBox(width: 4),
                  Icon(Icons.schedule, size: 12, color: Colors.white.withValues(alpha: 0.5)),
                ] else if (!isTemp && isMe) ...[
                  const SizedBox(width: 4),
                  Icon(Icons.done_all, size: 12, color: Colors.white.withValues(alpha: 0.7)),
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
                color: _isSending ? Colors.grey : Colors.blue,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.blue.withValues(alpha: 0.3),
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
