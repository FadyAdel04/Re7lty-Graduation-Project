import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/user.dart';
import '../../providers/api_provider.dart';
import '../../theme/app_colors.dart';

enum ProfileNetworkType { followers, following }

/// Followers or following list (web /user/:id/network).
class ProfileNetworkPage extends ConsumerStatefulWidget {
  final String clerkId;
  final ProfileNetworkType type;

  const ProfileNetworkPage({
    super.key,
    required this.clerkId,
    required this.type,
  });

  @override
  ConsumerState<ProfileNetworkPage> createState() => _ProfileNetworkPageState();
}

class _ProfileNetworkPageState extends ConsumerState<ProfileNetworkPage> {
  late Future<List<User>> _usersFuture;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final service = ref.read(userServiceProvider);
    _usersFuture = widget.type == ProfileNetworkType.followers
        ? service.getFollowersUsers(widget.clerkId)
        : service.getFollowingUsers(widget.clerkId);
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.type == ProfileNetworkType.followers ? 'المتابعون' : 'يتابع';

    return Scaffold(
      appBar: AppBar(
        title: Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: FutureBuilder<List<User>>(
        future: _usersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange));
          }
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('تعذر تحميل القائمة', style: GoogleFonts.cairo()),
                  TextButton(onPressed: () => setState(_load), child: const Text('إعادة المحاولة')),
                ],
              ),
            );
          }
          final users = snapshot.data ?? [];
          if (users.isEmpty) {
            return Center(child: Text('لا يوجد مستخدمون', style: GoogleFonts.cairo(color: Colors.grey)));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: users.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final user = users[index];
              final id = user.clerkId.isNotEmpty ? user.clerkId : user.id;
              return ListTile(
                onTap: () => context.push('/user/$id'),
                leading: CircleAvatar(
                  backgroundImage: user.imageUrl != null && user.imageUrl!.isNotEmpty
                      ? CachedNetworkImageProvider(user.imageUrl!)
                      : null,
                  child: user.imageUrl == null || user.imageUrl!.isEmpty
                      ? Text((user.fullName ?? '?')[0])
                      : null,
                ),
                title: Text(user.fullName ?? user.username ?? 'مسافر', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                subtitle: Text(user.bio ?? user.location ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                trailing: const Icon(Icons.chevron_left),
              );
            },
          );
        },
      ),
    );
  }
}
