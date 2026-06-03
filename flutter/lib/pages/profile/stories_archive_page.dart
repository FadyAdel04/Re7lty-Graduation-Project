import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/api_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import 'package:dio/dio.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/story.dart';
import '../story/story_viewer_page.dart';
import 'package:clerk_flutter/clerk_flutter.dart';

class StoriesArchivePage extends ConsumerWidget {
  const StoriesArchivePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final archiveAsync = ref.watch(storiesArchiveProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      appBar: AppBar(
        title: Text('أرشيف القصص', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: archiveAsync.when(
        data: (groupedStories) {
          if (groupedStories.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history, size: 80, color: Colors.grey.withOpacity(0.5)),
                  const SizedBox(height: 16),
                  Text('لا يوجد قصص في الأرشيف بعد', style: GoogleFonts.cairo(color: Colors.grey)),
                ],
              ),
            );
          }

          final dates = groupedStories.keys.toList()..sort((a, b) => b.compareTo(a));

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: dates.length,
            itemBuilder: (context, index) {
              final date = dates[index];
              final stories = groupedStories[date]!;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      _formatDate(date),
                      style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primaryOrange),
                    ),
                  ),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 0.7,
                    ),
                    itemCount: stories.length,
                    itemBuilder: (context, sIndex) {
                      final story = stories[sIndex];
                      return GestureDetector(
                        onTap: () {
                          final clerk = ClerkAuth.of(context).user;
                          final s = Story.fromJson(Map<String, dynamic>.from(story as Map));
                          final group = UserStoriesGroup(
                            userId: clerk?.id ?? '',
                            fullName: clerk?.name ?? 'أنت',
                            imageUrl: clerk?.imageUrl,
                            hasUnseen: false,
                            stories: [s],
                          );
                          openStoryViewer(context, group: group, isOwnStories: true);
                        },
                        child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            CachedNetworkImage(
                              imageUrl: story['mediaUrl'],
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(color: Colors.grey[200]),
                            ),
                            if (story['mediaType'] == 'video')
                              const Center(child: Icon(Icons.play_circle_fill, color: Colors.white, size: 30)),
                            Positioned(
                              bottom: 8,
                              left: 8,
                              child: Row(
                                children: [
                                  const Icon(Icons.visibility, color: Colors.white, size: 12),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${(story['viewedBy'] as List?)?.length ?? 0}',
                                    style: const TextStyle(color: Colors.white, fontSize: 10),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      );
                    },
                  ),
                  const SizedBox(height: 20),
                ],
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('حدث خطأ أثناء جلب الأرشيف', style: GoogleFonts.cairo())),
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      if (date.year == now.year && date.month == now.month && date.day == now.day) return 'اليوم';
      if (date.year == now.year && date.month == now.month && date.day == now.day - 1) return 'أمس';
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }
}

final storiesArchiveProvider = FutureProvider<Map<String, List<dynamic>>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  final response = await api.get('/stories/archive');
  return Map<String, List<dynamic>>.from(response.data);
});
