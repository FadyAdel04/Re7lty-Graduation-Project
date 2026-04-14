import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/trip_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/trip_post_card.dart';
import '../../widgets/corporate_trip_card.dart';
import '../../models/corporate_trip.dart';
import 'package:go_router/go_router.dart';
import '../../providers/story_provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import 'package:clerk_flutter/clerk_flutter.dart';

final homeFilterProvider = StateProvider<String>((ref) => 'all');

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedFilter = ref.watch(homeFilterProvider);
    final corporateTripsAsync = ref.watch(corporateTripsProvider(null));
    final tripsAsync = ref.watch(tripsProvider(TripFilter(
      type: selectedFilter == 'all' ? null : selectedFilter,
      sort: 'recent',
    )));
    final storiesAsync = ref.watch(followingStoriesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final clerkUser = ClerkAuth.of(context).user;
    final userAvatar = clerkUser?.imageUrl;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.grey.shade50,
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/create-trip'),
        backgroundColor: AppColors.primaryOrange,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      drawer: Drawer(
        child: Container(
          color: isDark ? AppColors.darkBackground : Colors.white,
          child: Column(
            children: [
              UserAccountsDrawerHeader(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.cardDark : AppColors.primaryOrange,
                ),
                currentAccountPicture: CircleAvatar(
                  backgroundImage: userAvatar != null ? NetworkImage(userAvatar) : null,
                  child: userAvatar == null ? const Icon(Icons.person, size: 40) : null,
                ),
                accountName: Text(clerkUser?.name ?? 'مستكشف رحلتي'),
                accountEmail: Text(clerkUser?.email ?? ''),
              ),
              ListTile(
                leading: Icon(isDark ? Icons.dark_mode : Icons.light_mode, color: AppColors.primaryOrange),
                title: const Text('الوضع الليلي'),
                trailing: Switch(
                  value: isDark,
                  activeColor: AppColors.primaryOrange,
                  onChanged: (val) => ref.read(themeProvider.notifier).toggleTheme(),
                ),
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.person_outline),
                title: const Text('الملف الشخصي'),
                onTap: () => context.push('/profile'),
              ),
              ListTile(
                leading: const Icon(Icons.settings_outlined),
                title: const Text('الإعدادات'),
                onTap: () => context.push('/settings'),
              ),
              const Spacer(),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('تسجيل الخروج', style: TextStyle(color: Colors.red)),
                onTap: () => ClerkAuth.of(context).signOut(),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
      appBar: AppBar(
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Hero(
          tag: 'logo',
          child: Image.asset(
            'assets/images/logo.png',
            height: 35,
            errorBuilder: (c, e, s) => Text(
              'Re7lty',
              style: GoogleFonts.grandHotel(
                fontSize: 32,
                color: AppColors.primaryOrange,
              ),
            ),
          ),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10),
            child: ElevatedButton.icon(
              onPressed: () => context.push('/create-trip'),
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Trip', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: isDark ? AppColors.cardDark : Colors.grey[100],
                foregroundColor: isDark ? Colors.white : Colors.black,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.person_search_outlined),
            onPressed: () => context.push('/friends'),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none_outlined),
            onPressed: () => context.push('/notifications'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
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
                  _buildYourStory(userAvatar),
                  const SizedBox(width: 12),
                  storiesAsync.when(
                    data: (groups) => Row(
                      children: groups.map((group) => _StoryCircle(group: group)).toList(),
                    ),
                    loading: () => const SizedBox.shrink(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
          ),

          // Search & Filter Bar
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    _filterChip(ref, 'كل الرحلات', 'all'),
                    _filterChip(ref, 'شركات سياحة', 'company'),
                    _filterChip(ref, 'رحلات أفراد', 'user'),
                  ],
                ),
              ),
            ),
          ),

          // Featured Corporate Trips - Only show if current filter allows
          if (selectedFilter == 'all' || selectedFilter == 'company')
            SliverToBoxAdapter(
              child: _buildFeaturedCorporateTrips(ref, corporateTripsAsync),
            ),

          // Main Feed
          tripsAsync.when(
            data: (trips) => SliverPadding(
              padding: const EdgeInsets.only(top: 8, bottom: 100),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => TripPostCard(trip: trips[index]),
                  childCount: trips.length,
                ),
              ),
            ),
            loading: () => const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
            ),
            error: (err, _) => SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.cloud_off, size: 48, color: Colors.grey),
                    const SizedBox(height: 12),
                    Text('تأكد من تشغيل السيرفر يا فادي! 🚀', style: TextStyle(color: Colors.grey[600])),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(WidgetRef ref, String label, String value) {
    final selected = ref.watch(homeFilterProvider) == value;
    final isDark = Theme.of(ref.context).brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: () => ref.read(homeFilterProvider.notifier).state = value,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        margin: const EdgeInsets.only(left: 10),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryOrange : (isDark ? AppColors.cardDark : Colors.white),
          borderRadius: BorderRadius.circular(30),
          boxShadow: selected ? [
            BoxShadow(
              color: AppColors.primaryOrange.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            )
          ] : null,
          border: Border.all(
            color: selected ? AppColors.primaryOrange : (isDark ? Colors.white12 : Colors.black12),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildFeaturedCorporateTrips(WidgetRef ref, AsyncValue<List<CorporateTrip>> corporateTripsAsync) {
    final isDark = Theme.of(ref.context).brightness == Brightness.dark;

    return corporateTripsAsync.when(
      data: (trips) {
        if (trips.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            SizedBox(
              height: 480, // Increased height
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 0), // No padding on horizontal list
                itemCount: trips.length,
                itemBuilder: (context, index) {
                  return SizedBox(
                    width: MediaQuery.of(context).size.width, // FULL WIDTH like a post
                    child: CorporateTripCard(trip: trips[index]),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
          ],
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildYourStory(String? avatarUrl) {
    return Column(
      children: [
        Stack(
          children: [
            Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Colors.grey, Colors.blueGrey],
                ),
              ),
              child: CircleAvatar(
                radius: 35,
                backgroundColor: Colors.grey[900],
                backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                child: avatarUrl == null ? const Icon(Icons.person, color: Colors.white, size: 30) : null,
              ),
            ),
            Positioned(
              bottom: 0,
              right: 2,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: AppColors.primaryOrange,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.add, size: 14, color: Colors.white),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text('قصتك', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

class _StoryCircle extends StatelessWidget {
  final dynamic group;
  const _StoryCircle({required this.group});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
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
            group.fullName.split(' ')[0],
            style: const TextStyle(fontSize: 11),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ).animate().scale(delay: 100.ms, duration: 400.ms, curve: Curves.easeOutBack),
    );
  }
}
