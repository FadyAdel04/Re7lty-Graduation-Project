import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/story.dart';
import '../../providers/story_provider.dart';

class StoryViewerPage extends ConsumerStatefulWidget {
  final UserStoriesGroup group;
  final bool isOwnStories;

  const StoryViewerPage({
    super.key,
    required this.group,
    this.isOwnStories = false,
  });

  @override
  ConsumerState<StoryViewerPage> createState() => _StoryViewerPageState();
}

class _StoryViewerPageState extends ConsumerState<StoryViewerPage> {
  late int _index;
  Timer? _timer;
  bool _isDeleting = false;

  List<Story> get _stories => widget.group.stories;

  @override
  void initState() {
    super.initState();
    _index = 0;
    _onStoryShown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _onStoryShown() {
    _timer?.cancel();
    if (_stories.isEmpty) return;

    final story = _stories[_index];
    if (!widget.isOwnStories) {
      ref.read(storyServiceProvider).markAsViewed(story.id);
    }

    _timer = Timer(const Duration(seconds: 5), _goNext);
  }

  void _goPrev() {
    if (_index > 0) {
      setState(() => _index--);
      _onStoryShown();
    }
  }

  void _goNext() {
    if (_index < _stories.length - 1) {
      setState(() => _index++);
      _onStoryShown();
    } else {
      Navigator.pop(context, true);
    }
  }

  Future<void> _deleteCurrent() async {
    final story = _stories[_index];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('حذف القصة؟', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        content: Text('لن تتمكن من استرجاعها بعد الحذف.', style: GoogleFonts.cairo()),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('إلغاء', style: GoogleFonts.cairo())),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('حذف', style: GoogleFonts.cairo(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;

    setState(() => _isDeleting = true);
    try {
      await ref.read(storyServiceProvider).deleteStory(story.id);
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تعذر حذف القصة', style: GoogleFonts.cairo())),
        );
      }
    } finally {
      if (mounted) setState(() => _isDeleting = false);
    }
  }

  Future<void> _showViewers() async {
    final story = _stories[_index];
    try {
      final viewers = await ref.read(storyServiceProvider).getViewers(story.id);
      if (!mounted) return;
      showModalBottomSheet(
        context: context,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        builder: (ctx) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('المشاهدات (${viewers.length})', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 12),
              if (viewers.isEmpty)
                Text('لا يوجد مشاهدون بعد', style: GoogleFonts.cairo(color: Colors.grey))
              else
                ...viewers.map((v) => ListTile(
                      leading: CircleAvatar(
                        backgroundImage: v['imageUrl'] != null ? NetworkImage(v['imageUrl']) : null,
                        child: v['imageUrl'] == null ? const Icon(Icons.person) : null,
                      ),
                      title: Text(v['fullName']?.toString() ?? 'مستخدم', style: GoogleFonts.cairo()),
                    )),
            ],
          ),
        ),
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_stories.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: Text('لا توجد قصص', style: GoogleFonts.cairo(color: Colors.white))),
      );
    }

    final story = _stories[_index];

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapUp: (details) {
          final w = MediaQuery.of(context).size.width;
          if (details.localPosition.dx < w * 0.35) {
            _goPrev();
          } else {
            _goNext();
          }
        },
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (story.mediaType == 'video')
              Center(
                child: Text('عرض الفيديو قريباً', style: GoogleFonts.cairo(color: Colors.white70)),
              )
            else
              CachedNetworkImage(imageUrl: story.mediaUrl, fit: BoxFit.contain),

            SafeArea(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    child: Row(
                      children: List.generate(_stories.length, (i) {
                        return Expanded(
                          child: Container(
                            height: 3,
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            decoration: BoxDecoration(
                              color: i <= _index ? Colors.white : Colors.white24,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundImage: widget.group.imageUrl != null ? NetworkImage(widget.group.imageUrl!) : null,
                          child: widget.group.imageUrl == null ? const Icon(Icons.person, color: Colors.white) : null,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            widget.group.fullName,
                            style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  if (story.caption != null && story.caption!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        story.caption!,
                        style: GoogleFonts.cairo(color: Colors.white, fontSize: 15),
                      ),
                    ),
                  if (widget.isOwnStories)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                      child: Row(
                        children: [
                          TextButton.icon(
                            onPressed: _isDeleting ? null : _showViewers,
                            icon: const Icon(Icons.visibility_outlined, color: Colors.white),
                            label: Text('المشاهدات', style: GoogleFonts.cairo(color: Colors.white)),
                          ),
                          const Spacer(),
                          TextButton.icon(
                            onPressed: _isDeleting ? null : _deleteCurrent,
                            icon: _isDeleting
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : const Icon(Icons.delete_outline, color: Colors.white),
                            label: Text('حذف', style: GoogleFonts.cairo(color: Colors.white)),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Opens story viewer; returns true if stories changed (deleted).
Future<bool?> openStoryViewer(
  BuildContext context, {
  required UserStoriesGroup group,
  bool isOwnStories = false,
}) {
  return Navigator.push<bool>(
    context,
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => StoryViewerPage(group: group, isOwnStories: isOwnStories),
    ),
  );
}
