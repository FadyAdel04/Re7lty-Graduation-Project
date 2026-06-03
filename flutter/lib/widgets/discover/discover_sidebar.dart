import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import '../../models/user.dart';
import '../../providers/discover_provider.dart';
import '../../models/trip.dart';
import '../../providers/api_provider.dart';
import '../../theme/app_colors.dart';
import '../../pages/discover/discover_pulse_map_page.dart';
import 'live_pulse_map_widget.dart';

class DiscoverTravelersPanel extends ConsumerWidget {
  final List<User> users;
  final bool isLoading;

  const DiscoverTravelersPanel({super.key, required this.users, required this.isLoading});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final followingIds = ref.watch(discoverFollowingIdsProvider);
    final clerkId = ClerkAuth.of(context).user?.id;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade200),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 24, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text('مسافرون مميزون', style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 18)),
              const SizedBox(width: 10),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primaryOrange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.auto_awesome, color: AppColors.primaryOrange),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (isLoading)
            ...List.generate(3, (_) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white10 : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ))
          else if (users.isEmpty)
            Text('لا يوجد اقتراحات حالياً', style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold))
          else
            ...users.take(5).map((user) {
              final userId = user.clerkId.isNotEmpty ? user.clerkId : user.id;
              final isFollowing = followingIds.contains(userId);
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  children: [
                    _FollowButton(
                      isFollowing: isFollowing,
                      enabled: clerkId != null,
                      onTap: () async {
                        if (clerkId == null) return;
                        ref.read(discoverFollowingIdsProvider.notifier).setFollowing(userId, !isFollowing);
                        try {
                          await ref.read(userServiceProvider).toggleFollow(userId);
                        } catch (_) {
                          ref.read(discoverFollowingIdsProvider.notifier).setFollowing(userId, isFollowing);
                        }
                      },
                    ),
                    const Spacer(),
                    InkWell(
                      onTap: () => context.push('/user/$userId'),
                      borderRadius: BorderRadius.circular(16),
                      child: Row(
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                user.fullName ?? user.username ?? 'مسافر',
                                style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 13),
                              ),
                              Text(
                                user.bio ?? 'مسافر شغوف 🌍',
                                style: GoogleFonts.cairo(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.w600),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                          const SizedBox(width: 10),
                          Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: CachedNetworkImage(
                                  imageUrl: user.imageUrl ?? '',
                                  width: 52,
                                  height: 52,
                                  fit: BoxFit.cover,
                                  errorWidget: (_, __, ___) => Container(
                                    width: 52,
                                    height: 52,
                                    color: Colors.grey.shade300,
                                    child: const Icon(Icons.person),
                                  ),
                                ),
                              ),
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: Container(
                                  width: 12,
                                  height: 12,
                                  decoration: BoxDecoration(
                                    color: Colors.green,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: isDark ? AppColors.cardDark : Colors.white, width: 2),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _FollowButton extends StatelessWidget {
  final bool isFollowing;
  final bool enabled;
  final VoidCallback onTap;

  const _FollowButton({required this.isFollowing, required this.enabled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: enabled ? onTap : null,
      style: TextButton.styleFrom(
        backgroundColor: isFollowing ? AppColors.primaryOrange.withOpacity(0.08) : AppColors.primaryOrange,
        foregroundColor: isFollowing ? AppColors.primaryOrange : Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: isFollowing ? BorderSide(color: AppColors.primaryOrange.withOpacity(0.3)) : BorderSide.none,
        ),
      ),
      child: Text(
        isFollowing ? 'تمت المتابعة' : 'متابعة',
        style: GoogleFonts.cairo(fontSize: 10, fontWeight: FontWeight.w900),
      ),
    );
  }
}

class DiscoverTrendingDestinations extends StatelessWidget {
  final ValueChanged<String> onDestinationTap;

  const DiscoverTrendingDestinations({super.key, required this.onDestinationTap});

  static const _tags = ['دهب', 'سيوة', 'أسوان', 'سانت كاترين', 'الفيوم'];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppColors.orangeGradient,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(color: AppColors.primaryOrange.withOpacity(0.35), blurRadius: 24, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text('وجهات رائجة 🔥', style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.end,
            children: _tags.map((tag) {
              return ActionChip(
                label: Text('#$tag', style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
                backgroundColor: Colors.white.withOpacity(0.15),
                side: BorderSide.none,
                onPressed: () => onDestinationTap(tag),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          Divider(color: Colors.white24),
          const SizedBox(height: 8),
          Text(
            'اكتشف أكثر من 1000 وجهة',
            style: GoogleFonts.cairo(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
          ),
        ],
      ),
    );
  }
}

class DiscoverMapTeaser extends StatelessWidget {
  final List<Trip> trips;

  const DiscoverMapTeaser({super.key, required this.trips});

  void _openFullMap(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DiscoverPulseMapPage(initialTrips: trips),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        LivePulseMapWidget(
          trips: trips,
          height: 220,
          showOverlay: true,
          markersInteractive: true,
        ),
        Positioned(
          top: 10,
          left: 10,
          child: Material(
            color: Colors.white.withOpacity(0.95),
            borderRadius: BorderRadius.circular(14),
            elevation: 4,
            child: InkWell(
              onTap: () => _openFullMap(context),
              borderRadius: BorderRadius.circular(14),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.fullscreen, size: 18, color: AppColors.primaryOrange),
                    const SizedBox(width: 6),
                    Text('توسيع', style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 12)),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
