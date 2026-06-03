import 'package:re7lty_app/theme/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../providers/api_provider.dart';
import 'package:go_router/go_router.dart';

class UserSearchCard extends ConsumerStatefulWidget {
  final User user;
  const UserSearchCard({super.key, required this.user});

  @override
  ConsumerState<UserSearchCard> createState() => _UserSearchCardState();
}

class _UserSearchCardState extends ConsumerState<UserSearchCard> {
  bool _following = false;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _following = widget.user.viewerFollows;
  }

  Future<void> _toggleFollow() async {
    if (_loading) return;
    setState(() {
      _loading = true;
      _following = !_following;
    });
    try {
      final result =
          await ref.read(userServiceProvider).toggleFollow(widget.user.id);
      if (mounted) setState(() => _following = result.following);
    } catch (_) {
      if (mounted) setState(() => _following = !_following);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: () => context.push('/user/${widget.user.id}'),
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
        widget.user.username ??
            '@${(widget.user.fullName ?? "user").toLowerCase().replaceAll(' ', '_')}',
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
                backgroundColor:
                    _following ? Colors.grey.shade300 : AppColors.primaryOrange,
                foregroundColor: _following ? Colors.black87 : Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                minimumSize: const Size(0, 32),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: Text(
                _following ? 'متابَع' : 'متابعة',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
    );
  }
}
