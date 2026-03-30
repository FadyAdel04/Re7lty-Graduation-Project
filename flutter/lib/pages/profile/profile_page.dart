import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/user.dart';
import '../../services/user_service.dart';
import '../../providers/trip_provider.dart';
import '../../widgets/trip_card.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../services/api_service.dart';

final userServiceProvider = Provider((ref) => UserService(ref.watch(apiServiceProvider)));

final userProfileProvider = FutureProvider.family<User, String>((ref, id) {
  return ref.watch(userServiceProvider).getUserById(id);
});

class UserProfilePage extends ConsumerWidget {
  final String userId;

  const UserProfilePage({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Backend supports 'me' as a keyword
    final effectiveId = userId;
    final userAsync = ref.watch(userProfileProvider(effectiveId));

    return Scaffold(
      backgroundColor: Colors.white,
      body: userAsync.when(
        data: (user) => DefaultTabController(
          length: 3,
          child: NestedScrollView(
            headerSliverBuilder: (context, innerBoxIsScrolled) => [
              SliverAppBar(
                expandedHeight: 320,
                pinned: true,
                stretch: true,
                backgroundColor: Colors.orange,
                flexibleSpace: FlexibleSpaceBar(
                  stretchModes: const [StretchMode.zoomBackground, StretchMode.blurBackground],
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Cover Image
                      CachedNetworkImage(
                        imageUrl: user.coverImage ?? 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
                        fit: BoxFit.cover,
                        errorWidget: (c, u, e) => Container(color: Colors.orange[100]),
                      ),
                      // Gradient Overlay
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black87],
                          ),
                        ),
                      ),
                      // Profile Info
                      Positioned(
                        bottom: 40,
                        right: 20,
                        left: 20,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Hero(
                              tag: 'profile_${user.id}',
                              child: Container(
                                padding: const EdgeInsets.all(3),
                                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                                child: CircleAvatar(
                                  radius: 45,
                                  backgroundImage: user.imageUrl != null ? NetworkImage(user.imageUrl!) : null,
                                  child: user.imageUrl == null ? const Icon(Icons.person, size: 45) : null,
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    user.fullName ?? user.username ?? 'مستخدم',
                                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 4),
                                  if (user.location != null)
                                    Row(
                                      children: [
                                        const Icon(Icons.location_on, color: Colors.white70, size: 14),
                                        const SizedBox(width: 4),
                                        Text(user.location!, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                                      ],
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
                actions: [
                  IconButton(icon: const Icon(Icons.share, color: Colors.white), onPressed: () {}),
                  if (userId == 'me')
                    IconButton(icon: const Icon(Icons.settings, color: Colors.white), onPressed: () {}),
                ],
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _statItem('رحلات', user.tripsCount.toString()),
                          _statItem('متابعين', user.followers.toString()),
                          _statItem('يتابع', user.following.toString()),
                        ],
                      ),
                      const SizedBox(height: 24),
                      if (user.bio != null)
                        Text(
                          user.bio!,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey[800], height: 1.5),
                        ),
                      const SizedBox(height: 24),
                      if (userId != 'me')
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                            ),
                            child: const Text('متابعة', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        )
                      else
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: () {},
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                            ),
                            child: const Text('تعديل الملف الشخصي'),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              SliverPersistentHeader(
                pinned: true,
                delegate: _SliverAppBarDelegate(
                  const TabBar(
                    indicatorColor: Colors.orange,
                    indicatorWeight: 3,
                    labelColor: Colors.black,
                    unselectedLabelColor: Colors.grey,
                    labelStyle: TextStyle(fontWeight: FontWeight.bold),
                    tabs: [
                      Tab(text: 'الرحلات'),
                      Tab(text: 'المحفوظات'),
                      Tab(text: 'الإعجابات'),
                    ],
                  ),
                ),
              ),
            ],
            body: TabBarView(
              children: [
                _UserTripsList(userId: effectiveId),
                _SavedTripsList(),
                _UserTripsList(userId: effectiveId),
              ],
            ),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator(color: Colors.orange)),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _statItem(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
      ],
    );
  }
}

class _UserTripsList extends ConsumerWidget {
  final String userId;
  const _UserTripsList({required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripsAsync = ref.watch(tripsProvider(TripFilter(authorId: userId)));

    return tripsAsync.when(
      data: (trips) => trips.isEmpty
          ? _buildEmptyState('لا توجد رحلات بعد')
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: trips.length,
              itemBuilder: (context, index) => TripCard(trip: trips[index]).animate().fadeIn(delay: (index * 100).ms).slideX(),
            ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('Error: $err')),
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.map_outlined, size: 64, color: Colors.grey[200]),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}

class _SavedTripsList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const Center(child: Text('بإمكانك حفظ الرحلات للعودة إليها لاحقاً'));
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);
  final TabBar _tabBar;

  @override double get minExtent => _tabBar.preferredSize.height;
  @override double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(color: Colors.white, child: _tabBar);
  }

  @override bool shouldRebuild(_SliverAppBarDelegate oldDelegate) => false;
}
