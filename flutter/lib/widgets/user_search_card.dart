import 'package:re7lty_app/theme/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../providers/api_provider.dart';
import '../providers/discover_provider.dart';
import '../utils/user_utils.dart';
import 'package:go_router/go_router.dart';

class UserSearchCard extends ConsumerStatefulWidget {
  final User user;
  const UserSearchCard({super.key, required this.user});

  @override
  ConsumerState<UserSearchCard> createState() => _UserSearchCardState();
}

class _UserSearchCardState extends ConsumerState<UserSearchCard> {
  bool _loading = false;

  String get _userId => userProfileId(widget.user);

  bool get _isFollowing {
    final ids = ref.watch(discoverFollowingIdsProvider);
    return ids.contains(_userId) || widget.user.viewerFollows;
  }

  Future<void> _toggleFollow() async {
    if (_loading) return;
    final wasFollowing = _isFollowing;
    setState(() => _loading = true);
    ref.read(discoverFollowingIdsProvider.notifier).setFollowing(_userId, !wasFollowing);
    try {
      final result = await ref.read(userServiceProvider).toggleFollow(_userId);
      ref.read(discoverFollowingIdsProvider.notifier).setFollowing(_userId, result.following);
    } catch (_) {
      ref.read(discoverFollowingIdsProvider.notifier).setFollowing(_userId, wasFollowing);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final following = _isFollowing;
    return ListTile(
      onTap: () => context.push('/user/$_userId'),
      leading: CircleAvatar(
        radius: 20,
        backgroundColor: AppColors.primaryOrange.withOpacity(0.1),
        backgroundImage: widget.user.avatar != null && widget.user.avatar!.isNotEmpty
            ? NetworkImage(widget.user.avatar!)
            : null,
        child: (widget.user.avatar == null || widget.user.avatar!.isEmpty)
            ? Text(
                (widget.user.fullName != null && widget.user.fullName!.isNotEmpty)
                    ? widget.user.fullName![0].toUpperCase()
                    : '?',
                style: const TextStyle(color: AppColors.primaryOrange),
              )
            : null,
      ),
      title: Text(
        widget.user.fullName ?? '',
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
      ),
      subtitle: Text(
        widget.user.username != null
            ? '@${widget.user.username}'
            : '@${(widget.user.fullName ?? "user").toLowerCase().replaceAll(' ', '_')}',
        style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
      ),
      trailing: _loading
          ? const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : ElevatedButton(
              onPressed: _toggleFollow,
              style: ElevatedButton.styleFrom(
                backgroundColor: following ? Colors.grey.shade300 : AppColors.primaryOrange,
                foregroundColor: following ? Colors.black87 : Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                minimumSize: const Size(0, 32),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: Text(
                following ? 'متابَع' : 'متابعة',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
    );
  }
}
