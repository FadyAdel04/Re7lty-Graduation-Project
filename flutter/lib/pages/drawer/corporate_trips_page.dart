import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../corporate/corporate_trip_details_page.dart';
import '../auth/company_registration_page.dart';

final corporateTripsProvider = FutureProvider<List<dynamic>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  final response = await api.get('/corporate/trips?limit=20');
  if (response.statusCode == 200) {
    return response.data['trips'] as List<dynamic>;
  }
  throw Exception('Failed to load corporate trips');
});

class CorporateTripsPage extends ConsumerWidget {
  const CorporateTripsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripsAsync = ref.watch(corporateTripsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text('شركات السياحة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        centerTitle: true,
        actions: [
          TextButton.icon(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => CompanyRegistrationPage())),
            icon: const Icon(Icons.add_business, color: AppColors.primaryOrange, size: 20),
            label: Text('انضم إلينا', style: GoogleFonts.cairo(color: AppColors.primaryOrange, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: tripsAsync.when(
        data: (trips) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildAdvancedFilter(isDark),
              Expanded(
                child: trips.isEmpty 
                  ? _buildEmptyState()
                  : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    itemCount: trips.length,
                    itemBuilder: (context, index) {
                      final trip = trips[index];
                      return _buildModernTripCard(context, trip, isDark);
                    },
                  ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
        error: (e, st) => Center(child: Text('حدث خطأ: $e')),
      ),
    );
  }

  Widget _buildAdvancedFilter(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildFilterDropdown(Icons.location_on_outlined, 'كل الوجهات', isDark),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildFilterDropdown(Icons.business_outlined, 'جميع الشركات', isDark),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildFilterDropdown(Icons.timer_outlined, 'المدة الزمنية', isDark),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  height: 45,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: AppColors.primaryOrange,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      'البحث الذكي',
                      style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterDropdown(IconData icon, String label, bool isDark) {
    return Container(
      height: 45,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey[300]!),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primaryOrange),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.cairo(fontSize: 12, color: isDark ? Colors.white70 : Colors.black54),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const Icon(Icons.keyboard_arrow_down, size: 16, color: Colors.grey),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.business_center_outlined, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          Text('لا توجد رحلات شركات حالياً', style: GoogleFonts.cairo(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildModernTripCard(BuildContext context, dynamic trip, bool isDark) {
    final title = trip['title'] ?? 'رحلة بدون اسم';
    final price = trip['price']?.toString() ?? 'غير محدد';
    final companyName = (trip['companyId'] as Map?)?['name'] ?? 'شركة مجهولة';
    final imgUrl = (trip['images'] as List?)?.isNotEmpty == true 
        ? trip['images'][0] 
        : 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=400';

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => CorporateTripDetailsPage(trip: trip)),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          children: [
             Stack(
               children: [
                 ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    child: CachedNetworkImage(
                      imageUrl: imgUrl,
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(color: Colors.grey[200]),
                    ),
                 ),
                 Positioned(
                   top: 16,
                   left: 16,
                   child: Container(
                     padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                     decoration: BoxDecoration(
                       color: Colors.black54,
                       borderRadius: BorderRadius.circular(12),
                     ),
                     child: Text(
                       '${trip['duration'] ?? "3 أيام"}',
                       style: GoogleFonts.cairo(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                     ),
                   ),
                 ),
               ],
             ),
             Padding(
               padding: const EdgeInsets.all(20),
               child: Column(
                 crossAxisAlignment: CrossAxisAlignment.start,
                 children: [
                   Row(
                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
                     children: [
                       Expanded(
                         child: Text(
                           title,
                           style: GoogleFonts.cairo(fontSize: 17, fontWeight: FontWeight.bold),
                           maxLines: 1,
                           overflow: TextOverflow.ellipsis,
                         ),
                       ),
                       Text(
                         '$price ج.م',
                         style: GoogleFonts.cairo(color: AppColors.primaryOrange, fontWeight: FontWeight.bold, fontSize: 16),
                       ),
                     ],
                   ),
                   const SizedBox(height: 8),
                   Row(
                     children: [
                       const Icon(Icons.business_center, color: Colors.grey, size: 14),
                       const SizedBox(width: 6),
                       Text(companyName, style: GoogleFonts.cairo(color: Colors.grey, fontSize: 12)),
                       const Spacer(),
                       const Icon(Icons.star, color: Colors.amber, size: 14),
                       Text(' ${trip['rating'] ?? 4.5}', style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold)),
                     ],
                   ),
                 ],
               ),
             ),
          ],
        ),
      ),
    );
  }
}
