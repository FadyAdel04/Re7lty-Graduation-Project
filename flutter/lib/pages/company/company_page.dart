import 'package:re7lty_app/theme/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../models/user.dart';
import '../../providers/trip_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/trip_post_card.dart';
import '../../pages/profile/profile_page.dart'; // To reuse some logic if needed

class CompanyPage extends ConsumerWidget {
  final String companyId;
  const CompanyPage({super.key, required this.companyId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final companyAsync = ref.watch(userProfileProvider(companyId));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return companyAsync.when(
      data: (company) => Scaffold(
        backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
        body: CustomScrollView(
          slivers: [
            _buildSliverAppBar(context, company, isDark),
            SliverToBoxAdapter(child: _buildCompanyInfo(company)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('أحدث العروض والرحلات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const Icon(Icons.grid_view, size: 20, color: Colors.grey),
                  ],
                ),
              ),
            ),
            _buildTripsList(ref, company.id),
          ],
        ),
      ),
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, s) => Scaffold(body: Center(child: Text('فشل تحميل بيانات الشركة'))),
    );
  }

  Widget _buildSliverAppBar(BuildContext context, User company, bool isDark) {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      flexibleSpace: FlexibleSpaceBar(
        background: CachedNetworkImage(
          imageUrl: company.coverImage ?? 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',
          fit: BoxFit.cover,
        ),
      ),
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () => context.pop(),
      ),
      actions: [
        IconButton(icon: const Icon(Icons.share_outlined), onPressed: () {}),
      ],
    );
  }

  Widget _buildCompanyInfo(User company) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.primaryOrange, width: 2),
                  shape: BoxShape.circle,
                ),
                child: CircleAvatar(
                  radius: 35,
                  backgroundImage: company.avatar != null && company.avatar!.isNotEmpty
                      ? NetworkImage(company.avatar!)
                      : null,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(company.fullName ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                        const SizedBox(width: 6),
                        const Icon(Icons.verified, color: AppColors.primaryOrange, size: 18),
                      ],
                    ),
                    Text(company.location ?? 'مصر', style: const TextStyle(color: Colors.grey, fontSize: 14)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 16),
                        const Text(' 4.8 ', style: TextStyle(fontWeight: FontWeight.bold)),
                        const Text('(120 تقييم)', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (company.bio != null)
            Text(company.bio!, style: const TextStyle(height: 1.5, fontSize: 14)),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.chat_outlined),
                  label: const Text('تواصل معنا'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryOrange,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.primaryOrange),
                    foregroundColor: AppColors.primaryOrange,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('الموقع الإلكتروني'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTripsList(WidgetRef ref, String companyId) {
    final tripsAsync = ref.watch(tripsProvider(TripFilter(authorId: companyId)));

    return tripsAsync.when(
      data: (trips) => SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) => TripPostCard(trip: trips[index]),
          childCount: trips.length,
        ),
      ),
      loading: () => const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator())),
      error: (e, s) => const SliverToBoxAdapter(child: SizedBox.shrink()),
    );
  }
}



