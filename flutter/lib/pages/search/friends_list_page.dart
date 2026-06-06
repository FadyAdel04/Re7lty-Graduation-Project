import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../providers/api_provider.dart';
import '../../providers/discover_provider.dart';
import '../../providers/suggested_users_provider.dart';
import '../../models/user.dart';
import '../../utils/user_utils.dart';

final usersSearchProvider = FutureProvider.family<List<User>, String>((ref, query) {
  if (query.trim().isEmpty) return Future.value([]);
  return ref.read(userServiceProvider).searchUsers(query.trim());
});

class FriendsListPage extends ConsumerStatefulWidget {
  const FriendsListPage({super.key});

  @override
  ConsumerState<FriendsListPage> createState() => _FriendsListPageState();
}

class _FriendsListPageState extends ConsumerState<FriendsListPage> {
  String _query = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadFollowing());
  }

  void _loadFollowing() {
    final clerkId = ClerkAuth.of(context).user?.id;
    ref.read(discoverFollowingIdsProvider.notifier).load(clerkId);
  }

  @override
  Widget build(BuildContext context) {
    final isSearching = _query.trim().isNotEmpty;
    final usersAsync = isSearching
        ? ref.watch(usersSearchProvider(_query))
        : ref.watch(suggestedUsersProvider);
    final followingIds = ref.watch(discoverFollowingIdsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text('اكتشف مسافرين', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: 'ابحث عن مسافرين...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
        ),
      ),
      body: usersAsync.when(
        data: (users) {
          if (users.isEmpty) {
            return Center(
              child: Text(
                isSearching ? 'لم نجد نتائج' : 'لا توجد اقتراحات حالياً',
                style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold),
              ),
            );
          }
          return ListView(
            padding: const EdgeInsets.symmetric(vertical: 8),
            children: [
              if (!isSearching)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: Text(
                    'مسافرون مقترحون',
                    style: GoogleFonts.cairo(
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                ),
              ...users.map((user) => _UserTile(
                    user: user,
                    isFollowing: followingIds.contains(userProfileId(user)),
                    onFollow: () => _handleFollow(user),
                    onTap: () => context.push('/user/${userProfileId(user)}'),
                  )),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
        error: (e, s) => Center(child: Text('خطأ: $e')),
      ),
    );
  }

  Future<void> _handleFollow(User user) async {
    final userId = userProfileId(user);
    final wasFollowing = ref.read(discoverFollowingIdsProvider).contains(userId);
    ref.read(discoverFollowingIdsProvider.notifier).setFollowing(userId, !wasFollowing);
    try {
      await ref.read(userServiceProvider).toggleFollow(userId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(wasFollowing ? 'تم إلغاء المتابعة' : 'تمت المتابعة')),
        );
      }
    } catch (_) {
      ref.read(discoverFollowingIdsProvider.notifier).setFollowing(userId, wasFollowing);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('فشلت العملية'), backgroundColor: Colors.red),
        );
      }
    }
  }
}

class _UserTile extends StatelessWidget {
  final User user;
  final bool isFollowing;
  final VoidCallback onFollow;
  final VoidCallback onTap;

  const _UserTile({
    required this.user,
    required this.isFollowing,
    required this.onFollow,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundImage: user.avatar != null ? NetworkImage(user.avatar!) : null,
        child: user.avatar == null ? const Icon(Icons.person) : null,
      ),
      title: Text(user.fullName ?? user.username ?? 'مسافر'),
      subtitle: Text('@${user.username ?? ""}'),
      trailing: TextButton(
        onPressed: onFollow,
        style: TextButton.styleFrom(
          backgroundColor: isFollowing ? Colors.grey.shade200 : AppColors.primaryOrange,
          foregroundColor: isFollowing ? Colors.black87 : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        child: Text(isFollowing ? 'متابَع' : 'متابعة'),
      ),
      onTap: onTap,
    );
  }
}
