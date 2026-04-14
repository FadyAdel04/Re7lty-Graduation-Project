import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/trip.dart';
import '../../providers/api_provider.dart';
import '../../providers/trip_provider.dart';
import '../../theme/app_colors.dart';
import 'package:intl/intl.dart';

class TripCommentsPage extends ConsumerStatefulWidget {
  final String tripId;
  const TripCommentsPage({super.key, required this.tripId});

  @override
  ConsumerState<TripCommentsPage> createState() => _TripCommentsPageState();
}

class _TripCommentsPageState extends ConsumerState<TripCommentsPage> {
  final TextEditingController _controller = TextEditingController();
  bool _isSending = false;

  void _sendComment() async {
    final content = _controller.text.trim();
    if (content.isEmpty) return;

    setState(() => _isSending = true);
    final success = await ref.read(tripServiceProvider).addComment(widget.tripId, content);
    setState(() => _isSending = false);

    if (success) {
      _controller.clear();
      // Invalidate the provider to trigger a fresh fetch automatically
      ref.invalidate(tripDetailProvider(widget.tripId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تمت إضافة التعليق بنجاح')),
        );
      }
    } else {
       if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('فشل إرسال التعليق')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tripAsync = ref.watch(tripDetailProvider(widget.tripId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('التعليقات'),
        backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
      ),
      body: Column(
        children: [
          Expanded(
            child: tripAsync.when(
              data: (trip) {
                if (trip.comments.isEmpty) {
                  return const Center(child: Text('لا توجد تعليقات بعد. كن أول من يعلق!'));
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: trip.comments.length,
                  itemBuilder: (context, index) {
                    final comment = trip.comments[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundImage: comment.authorAvatar != null ? NetworkImage(comment.authorAvatar!) : null,
                            child: comment.authorAvatar == null ? const Icon(Icons.person, size: 20) : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.cardDark : Colors.grey[100],
                                borderRadius: BorderRadius.circular(15),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    comment.author,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    comment.content,
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
              error: (err, _) => Center(child: Text('خطأ في تحميل التعليقات: $err')),
            ),
          ),
          Container(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              top: 16,
              left: 16,
              right: 16,
            ),
            decoration: BoxDecoration(
              color: isDark ? AppColors.cardDark : Colors.white,
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'اكتب تعليقاً...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(30)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: _isSending 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.send, color: AppColors.primaryOrange),
                  onPressed: _sendComment,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
