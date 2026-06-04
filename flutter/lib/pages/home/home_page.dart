import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/trip_provider.dart';
import '../../providers/user_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/trip_post_card.dart';
import '../../widgets/trip_post_shimmer.dart';
import '../../widgets/corporate_trip_card.dart';
import '../../models/corporate_trip.dart';
import 'package:go_router/go_router.dart';
import '../../providers/story_provider.dart';
import '../../providers/api_provider.dart';
import '../../models/story.dart';
import '../story/story_viewer_page.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

final homeFilterProvider = StateProvider<TripFilter>((ref) => const TripFilter());

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _picker = ImagePicker();
  bool _isUploadingStory = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      final currentFilter = ref.read(homeFilterProvider);
      ref.read(feedProvider(currentFilter).notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(homeFilterProvider);
    final feedState = ref.watch(feedProvider(filter));
    final storiesAsync = ref.watch(followingStoriesProvider);
    final myStoriesAsync = ref.watch(myStoriesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final clerkUser = ClerkAuth.of(context).user;
    final userAvatar = clerkUser?.imageUrl;
    final myStories = myStoriesAsync.valueOrNull ?? [];
    final activeRole = ref.watch(userRoleProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.grey.shade50,
      floatingActionButton: activeRole == 'company' ? null : FloatingActionButton(
        onPressed: () => context.push('/create-trip'),
        backgroundColor: AppColors.primaryOrange,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      appBar: _buildAppBar(context, isDark),
      body: RefreshIndicator(
        onRefresh: () => ref.read(feedProvider(filter).notifier).refresh(),
        color: AppColors.primaryOrange,
        child: CustomScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Stories Section
            SliverToBoxAdapter(
              child: Container(
                height: 120,
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _buildYourStory(
                      avatarUrl: userAvatar,
                      clerkId: clerkUser?.id,
                      displayName: clerkUser?.name ?? 'قصتك',
                      myStories: myStories,
                    ),
                    const SizedBox(width: 12),
                    storiesAsync.when(
                      data: (groups) => Row(
                        children: groups
                            .map((group) => _StoryCircle(
                                  group: group,
                                  onTap: () => _openStoriesGroup(group, isOwn: false),
                                ))
                            .toList(),
                      ),
                      loading: () => const SizedBox.shrink(),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
            ),

            // Simplified Filters Bar
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: _buildPostTypeFilters(ref, filter),
              ),
            ),

            // Main Feed
            if (feedState.isLoading && feedState.trips.isEmpty)
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => const TripPostShimmer(),
                  childCount: 3,
                ),
              )
            else if (feedState.errorMessage != null && feedState.trips.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.cloud_off, size: 48, color: Colors.grey),
                      const SizedBox(height: 12),
                      Text('تأكد من تشغيل السيرفر يا فادي! 🚀', style: TextStyle(color: isDark ? Colors.white70 : Colors.grey[600])),
                      TextButton(
                        onPressed: () => ref.read(feedProvider(filter).notifier).refresh(),
                        child: const Text('إعادة المحاولة'),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.only(top: 8, bottom: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      if (index == feedState.trips.length) {
                        return feedState.hasMore 
                            ? const Padding(
                                padding: EdgeInsets.all(16.0),
                                child: Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
                              )
                            : const Padding(
                                padding: EdgeInsets.all(32.0),
                                child: Center(child: Text('وصلت للنهاية! 🎉', style: TextStyle(color: Colors.grey))),
                              );
                      }
                      return TripPostCard(trip: feedState.trips[index])
                        .animate()
                        .fadeIn(duration: 400.ms, delay: (index % 5 * 100).ms)
                        .slideY(begin: 0.1, end: 0);
                    },
                    childCount: feedState.trips.length + (feedState.trips.isEmpty ? 0 : 1),
                  ),
                ),
              ),
            
            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }

  Widget _buildPostTypeFilters(WidgetRef ref, TripFilter filter) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _filterBadge(ref, 'الكل', null, filter.postType == null),
          _filterBadge(ref, 'رحلة مفصلة', 'detailed', filter.postType == 'detailed'),
          _filterBadge(ref, 'منشور سريع', 'quick', filter.postType == 'quick'),
          _filterBadge(ref, 'سؤال', 'ask', filter.postType == 'ask'),
        ],
      ),
    );
  }

  Widget _filterBadge(WidgetRef ref, String label, String? value, bool selected) {
    final isDark = Theme.of(ref.context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () {
        final current = ref.read(homeFilterProvider);
        if (value == null) {
          ref.read(homeFilterProvider.notifier).state = current.copyWith(clearPostType: true);
        } else {
          ref.read(homeFilterProvider.notifier).state = current.copyWith(postType: value, clearPostType: false);
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(left: 10),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryOrange : (isDark ? AppColors.cardDark : Colors.white),
          borderRadius: BorderRadius.circular(20),
          boxShadow: selected ? [BoxShadow(color: AppColors.primaryOrange.withOpacity(0.2), blurRadius: 8, offset: const Offset(0, 4))] : null,
          border: Border.all(
            color: selected ? AppColors.primaryOrange : (isDark ? Colors.white10 : Colors.black12),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : (isDark ? Colors.white70 : Colors.black54),
            fontSize: 13,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  AppBar _buildAppBar(BuildContext context, bool isDark) {
    return AppBar(
      leading: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: const Icon(Icons.notifications_none_outlined, size: 24),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.people_outline, size: 24),
            onPressed: () => context.push('/friends'),
          ),
        ],
      ),
      leadingWidth: 100,
      title: GestureDetector(
        onTap: () {
          _scrollController.animateTo(
            0,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
          );
        },
        child: Hero(
          tag: 'logo',
          child: Image.asset(
            'assets/images/logo.png',
            height: 50,
            width: 80,
            fit: BoxFit.contain,
            errorBuilder: (c, e, s) => Text(
              'Re7lty',
              style: GoogleFonts.grandHotel(
                fontSize: 32,
                color: AppColors.primaryOrange,
              ),
            ),
          ),
        ),
      ),
      centerTitle: true,
      elevation: 0,
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      actions: [
        IconButton(
          icon: Transform.rotate(
            angle: .5,
            child: const Icon(Icons.send_outlined, size: 26),
          ),
          tooltip: 'الرسائل',
          onPressed: () {
            final role = ref.read(userRoleProvider);
            if (role == 'company') {
              context.push('/company-messages');
            } else {
              context.push('/messages');
            }
          },
        ),
        IconButton(
          icon: const Icon(Icons.emoji_events_outlined, color: Colors.orange, size: 28),
          onPressed: () => context.push('/leaderboard'),
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  Future<void> _openStoriesGroup(UserStoriesGroup group, {required bool isOwn}) async {
    if (group.stories.isEmpty) return;
    final changed = await openStoryViewer(context, group: group, isOwnStories: isOwn);
    if (changed == true && mounted) {
      ref.invalidate(myStoriesProvider);
      ref.invalidate(followingStoriesProvider);
    }
  }

  void _showYourStoryOptions({
    required bool hasStories,
    required UserStoriesGroup? ownGroup,
  }) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasStories && ownGroup != null)
              ListTile(
                leading: const Icon(Icons.play_circle_outline, color: AppColors.primaryOrange),
                title: const Text('مشاهدة قصصي'),
                onTap: () {
                  Navigator.pop(ctx);
                  _openStoriesGroup(ownGroup, isOwn: true);
                },
              ),
            ListTile(
              leading: const Icon(Icons.add_circle_outline, color: AppColors.primaryOrange),
              title: Text(hasStories ? 'إضافة قصة جديدة' : 'رفع قصة'),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndUploadStory();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildYourStory({
    required String? avatarUrl,
    required String? clerkId,
    required String displayName,
    required List<Story> myStories,
  }) {
    final hasStories = myStories.isNotEmpty;
    final ownGroup = hasStories && clerkId != null
        ? UserStoriesGroup(
            userId: clerkId,
            fullName: displayName,
            imageUrl: avatarUrl,
            hasUnseen: false,
            stories: myStories,
          )
        : null;

    return GestureDetector(
      onTap: _isUploadingStory
          ? null
          : () {
              if (hasStories && ownGroup != null) {
                _openStoriesGroup(ownGroup, isOwn: true);
              }
            },
      onLongPress: _isUploadingStory ? null : () => _showYourStoryOptions(hasStories: hasStories, ownGroup: ownGroup),
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: hasStories
                        ? const [Colors.orange, Colors.pink, Colors.purpleAccent]
                        : const [Colors.grey, Colors.blueGrey],
                  ),
                ),
                child: CircleAvatar(
                  radius: 35,
                  backgroundColor: Colors.grey[900],
                  backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: _isUploadingStory
                      ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                      : (avatarUrl == null ? const Icon(Icons.person, color: Colors.white, size: 30) : null),
                ),
              ),
              if (!_isUploadingStory)
                Positioned(
                  bottom: 0,
                  right: 2,
                  child: GestureDetector(
                    onTap: () => _pickAndUploadStory(),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppColors.primaryOrange,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.add, size: 14, color: Colors.white),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(hasStories ? 'قصتك (${myStories.length})' : 'قصتك', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Future<void> _pickAndUploadStory() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 70,
      );

      if (image == null) return;

      setState(() => _isUploadingStory = true);

      final mediaUrl = await ref.read(mediaUploadServiceProvider).uploadImageFile(File(image.path));

      await ref.read(storyServiceProvider).createStory(
        mediaUrl,
        'image',
        caption: 'قصة جديدة من رحلتي',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم رفع القصة بنجاح! ✨')),
        );
        ref.invalidate(followingStoriesProvider);
        ref.invalidate(myStoriesProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل رفع القصة: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingStory = false);
    }
  }
}

class _StoryCircle extends StatelessWidget {
  final UserStoriesGroup group;
  final VoidCallback onTap;

  const _StoryCircle({required this.group, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [Colors.orange, Colors.pink, Colors.purpleAccent],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: CircleAvatar(
              radius: 35,
              backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
              child: CircleAvatar(
                radius: 32,
                backgroundImage: group.imageUrl != null ? NetworkImage(group.imageUrl!) : null,
                child: group.imageUrl == null ? const Icon(Icons.person) : null,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            group.fullName.split(' ').first,
            style: const TextStyle(fontSize: 11),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
      ).animate().scale(delay: 100.ms, duration: 400.ms, curve: Curves.easeOutBack),
    );
  }
}
