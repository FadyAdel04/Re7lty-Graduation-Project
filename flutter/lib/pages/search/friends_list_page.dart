import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../services/user_service.dart';
import '../../providers/api_provider.dart';
import '../../models/user.dart';

final usersSearchProvider = FutureProvider.family<List<User>, String>((ref, query) {
  return ref.read(userServiceProvider).searchUsers(query);
});

class FriendsListPage extends ConsumerStatefulWidget {
  const FriendsListPage({super.key});

  @override
  ConsumerState<FriendsListPage> createState() => _FriendsListPageState();
}

class _FriendsListPageState extends ConsumerState<FriendsListPage> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final usersAsync = ref.watch(usersSearchProvider(_query));
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
                hintText: 'ابحث عن أصدقاء...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
        ),
      ),
      body: usersAsync.when(
        data: (users) => ListView.builder(
          itemCount: users.length,
          itemBuilder: (context, index) {
            final user = users[index];
            return ListTile(
              leading: CircleAvatar(
                backgroundImage: user.avatar != null ? NetworkImage(user.avatar!) : null,
                child: user.avatar == null ? const Icon(Icons.person) : null,
              ),
              title: Text(user.fullName ?? user.username ?? 'مسافر'),
              subtitle: Text('@${user.username ?? ""}'),
              trailing: ElevatedButton(
                onPressed: () => _handleFollow(user.id),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryOrange,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text('متابعة'),
              ),
              onTap: () => context.push('/profile/${user.id}'),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('خطأ: $e')),
      ),
    );
  }

  void _handleFollow(String userId) async {
    await ref.read(userServiceProvider).toggleFollow(userId);
    if (mounted) {
       ScaffoldMessenger.of(context).showSnackBar(
         const SnackBar(content: Text('تمت العملية بنجاح')),
       );
    }
  }
}
