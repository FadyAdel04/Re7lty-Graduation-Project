import 'package:re7lty_app/theme/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'package:clerk_flutter/clerk_flutter.dart';
import '../../models/user.dart';
import '../../services/user_service.dart';
import '../../providers/trip_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/trip_post_card.dart';

import '../../providers/api_provider.dart';

final userProfileProvider = FutureProvider.family<User, String>((ref, id) {
  return ref.watch(userServiceProvider).getUserById(id);
});

class UserProfilePage extends ConsumerWidget {
  final String userId;
  const UserProfilePage({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(userProfileProvider(userId));
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final clerkUser = ClerkAuth.of(context).user;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      body: userAsync.when(
        data: (user) => CustomScrollView(
          slivers: [
            _buildSliverHeader(context, user, clerkUser, isDark),
            SliverToBoxAdapter(
              child: Column(
                children: [
                  _buildLevelCard(user, isDark),
                  _buildStatsGrid(user, isDark),
                  const SizedBox(height: 20),
                  _buildProfileTabs(isDark),
                ],
              ),
            ),
            _buildTripGridSliver(ref, user),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => const Center(child: Text('خطأ في تحميل البيانات')),
      ),
    );
  }

  Widget _buildSliverHeader(BuildContext context, User user, dynamic clerkUser, bool isDark) {
    final avatarUrl = (userId == 'me' && clerkUser != null) ? clerkUser.imageUrl : user.avatar;
    final name = (userId == 'me' && clerkUser != null) ? clerkUser.name : (user.fullName ?? 'مسافر');

    return SliverAppBar(
      expandedHeight: 220,
      pinned: true,
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.primaryOrange,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDark 
                ? [AppColors.cardDark, AppColors.darkBackground]
                : [AppColors.primaryOrange, AppColors.primaryOrange.withOpacity(0.8)],
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 40),
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                ),
                child: CircleAvatar(
                  radius: 45,
                  backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty 
                      ? NetworkImage(avatarUrl) 
                      : null,
                  child: (avatarUrl == null || avatarUrl.isEmpty) ? const Icon(Icons.person, size: 45) : null,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                name,
                style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
              ),
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  user.badgeLevel != 'none' ? user.badgeLevel.toUpperCase() : 'NEW EXPLORER',
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
          onPressed: () => _showQRCode(context, user.id),
        ),
        IconButton(
          icon: const Icon(Icons.settings, color: Colors.white),
          onPressed: () => context.push('/settings'),
        ),
      ],
    );
  }

  Widget _buildLevelCard(User user, bool isDark) {
    // Dummy XP calculation for demo
    final xp = user.activityScore % 800;
    final lvl = (user.activityScore / 800).floor() + 1;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 5)),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Lvl $lvl', style: TextStyle(color: Colors.deepOrange[800], fontWeight: FontWeight.bold, fontSize: 18)),
              const Text('مستوى المسافر', style: TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: xp / 800,
              minHeight: 8,
              backgroundColor: Colors.grey[200],
              color: Colors.deepOrange[800],
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: Text('XP $xp/800', style: const TextStyle(color: Colors.grey, fontSize: 11)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(User user, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        childAspectRatio: 1.2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        children: [
          _statCard(Icons.group_outlined, _formatCount(user.followers), 'Followers', const Color(0xFF6366F1), isDark),
          _statCard(Icons.public_outlined, user.tripsCount.toString(), 'Trips', const Color(0xFF8B5CF6), isDark),
          _statCard(Icons.person_add_outlined, _formatCount(user.following), 'Following', const Color(0xFFEC4899), isDark),
          _statCard(Icons.favorite_outline, _formatCount(user.totalLikes), 'Likes', const Color(0xFFF43F5E), isDark),
        ],
      ),
    );
  }

  Widget _statCard(IconData icon, String value, String label, Color color, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
    return count.toString();
  }

  Widget _buildProfileTabs(bool isDark) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _tabItem('Public Trips', true),
          _tabItem('Saved', false),
          _tabItem('Favorites', false),
        ],
      ),
    );
  }

  Widget _tabItem(String label, bool active) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: active ? Colors.deepOrange[800] : Colors.grey[200],
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: active ? Colors.white : Colors.grey[600],
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }

  Widget _buildTripGridSliver(WidgetRef ref, User user) {
    final tripsAsync = ref.watch(tripsProvider(TripFilter(authorId: user.clerkId)));

    return tripsAsync.when(
      data: (trips) => SliverPadding(
        padding: const EdgeInsets.all(16),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, index) => GestureDetector(
              onTap: () => context.push('/trip/${trips[index].id}'),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: CachedNetworkImage(
                  imageUrl: trips[index].image ?? 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
                  fit: BoxFit.cover,
                ),
              ),
            ),
            childCount: trips.length,
          ),
        ),
      ),
      loading: () => const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator())),
      error: (e, s) => const SliverToBoxAdapter(child: SizedBox.shrink()),
    );
  }

  void _showQRCode(BuildContext context, String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('QR Code لملفك الشخصي', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              width: 200,
              child: QrImageView(
                data: 'https://re7lty.com/user/$id',
                version: QrVersions.auto,
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('إغلاق'),
            ),
          ],
        ),
      ),
    );
  }

  void _showSettingsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('الإعدادات'),
            onTap: () => context.push('/settings'),
          ),
          ListTile(
            leading: const Icon(Icons.bookmark_outline),
            title: const Text('المحفوظات'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.favorite_outline),
            title: const Text('تسجيلات الإعجاب'),
            onTap: () {},
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  void _handleChangeProfilePic(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('تغيير صورة الملف الشخصي', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          ListTile(
            leading: const Icon(Icons.photo_library),
            title: const Text('اختيار من المعرض'),
            onTap: () => Navigator.pop(context),
          ),
          ListTile(
            leading: const Icon(Icons.camera_alt),
            title: const Text('التقاط صورة'),
            onTap: () => Navigator.pop(context),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}



