import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/chat_provider.dart';
import '../../models/chat_state.dart';
import 'package:intl/intl.dart';

class TripAIChatPage extends ConsumerStatefulWidget {
  const TripAIChatPage({super.key});

  @override
  ConsumerState<TripAIChatPage> createState() => _TripAIChatPageState();
}

class _TripAIChatPageState extends ConsumerState<TripAIChatPage> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();

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

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final notifier = ref.read(chatProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('TripAI Assistant', style: TextStyle(fontWeight: FontWeight.bold)),
            Text('مساعدك الذكي للسفر', style: TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
        actions: [
          if (chatState.tripPlan != null)
            TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.save_outlined),
              label: const Text('حفظ'),
            ),
        ],
      ),
      body: Column(
        children: [
          // Extracted Info Toolbar
          if (chatState.extractedData.destination != null || chatState.extractedData.days != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.indigo[50],
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    if (chatState.extractedData.destination != null)
                      _infoChip(Icons.location_on, chatState.extractedData.destination!),
                    if (chatState.extractedData.days != null)
                      _infoChip(Icons.calendar_today, '${chatState.extractedData.days} أيام'),
                    if (chatState.extractedData.budget != null)
                      _infoChip(Icons.attach_money, chatState.extractedData.budget!),
                  ],
                ),
              ),
            ),

          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: chatState.messages.length + (chatState.isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == chatState.messages.length) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.0),
                    child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  );
                }
                final msg = chatState.messages[index];
                return _chatBubble(msg);
              },
            ),
          ),

          if (chatState.isGeneratingPlan)
            const LinearProgressIndicator(color: Colors.orange),

          // Message Input
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: const Offset(0, -2))],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'اكتب رسالتك هنا...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(25), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: Colors.grey[100],
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Colors.indigo,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white),
                    onPressed: () {
                      final text = _controller.text;
                      if (text.isNotEmpty) {
                        notifier.sendMessage(text);
                        _controller.clear();
                        _scrollToBottom();
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoChip(IconData icon, String label) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.indigo[100]!),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.indigo),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.indigo)),
        ],
      ),
    );
  }

  Widget _chatBubble(ChatMessage msg) {
    return Align(
      alignment: msg.isAI ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
        decoration: BoxDecoration(
          color: msg.isAI ? Colors.grey[100] : Colors.indigo,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: msg.isAI ? const Radius.circular(20) : Radius.zero,
            bottomRight: msg.isAI ? Radius.zero : const Radius.circular(20),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              msg.text,
              style: TextStyle(
                color: msg.isAI ? Colors.black87 : Colors.white,
                fontWeight: FontWeight.bold,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              DateFormat('HH:mm').format(msg.timestamp),
              style: TextStyle(
                fontSize: 10,
                color: msg.isAI ? Colors.grey[600] : Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
