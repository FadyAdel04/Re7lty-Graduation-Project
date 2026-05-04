import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/trip_provider.dart';
import '../../theme/app_colors.dart';
import '../corporate/corporate_trip_details_page.dart';
import 'dart:async';

final corporateTripsProvider = FutureProvider.family<List<dynamic>, String>((ref, destination) async {
  final tripService = ref.watch(tripServiceProvider);
  final trips = await tripService.getCorporateTrips(destination: destination.isEmpty ? null : destination);
  return trips.map((e) => e.toJson()).toList();
});

class CorporateTripsPage extends ConsumerStatefulWidget {
  const CorporateTripsPage({super.key});

  @override
  ConsumerState<CorporateTripsPage> createState() => _CorporateTripsPageState();
}

class _CorporateTripsPageState extends ConsumerState<CorporateTripsPage> {
  String _selectedDestination = '';
  String _searchQuery = '';
  String _selectedDuration = 'الكل';
  String _selectedPriceRange = 'الكل';
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      setState(() {
        _searchQuery = query;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final tripsAsync = ref.watch(corporateTripsProvider(_selectedDestination));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('رحلات الشركات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: Column(
        children: [
          _buildFilterSection(isDark),
          Expanded(
            child: tripsAsync.when(
              data: (trips) {
                final filteredTrips = _applyFilters(trips);
                if (filteredTrips.isEmpty) return _buildEmptyState();
                
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  itemCount: filteredTrips.length,
                  itemBuilder: (context, index) {
                    return _buildPremiumTripCard(context, filteredTrips[index], isDark);
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
              error: (e, st) => _buildErrorState(),
            ),
          ),
        ],
      ),
    );
  }

  List<dynamic> _applyFilters(List<dynamic> trips) {
    return trips.where((t) {
      // Search
      bool matchSearch = true;
      if (_searchQuery.isNotEmpty) {
        final title = (t['title'] ?? '').toString().toLowerCase();
        final dest = (t['destination'] ?? '').toString().toLowerCase();
        matchSearch = title.contains(_searchQuery.toLowerCase()) || dest.contains(_searchQuery.toLowerCase());
      }
      if (!matchSearch) return false;

      // Duration
      if (_selectedDuration != 'الكل') {
        final durationStr = (t['duration'] ?? '0').toString();
        final duration = int.tryParse(durationStr.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
        
        if (_selectedDuration == 'يوم واحد' && duration != 1) return false;
        if (_selectedDuration == '3 أيام' && duration != 3) return false;
        if (_selectedDuration == '4 أيام' && duration != 4) return false;
        if (_selectedDuration == 'أسبوع' && duration != 7) return false;
        if (_selectedDuration == 'أكثر من أسبوع' && duration <= 7) return false;
      }

      // Price
      if (_selectedPriceRange != 'الكل') {
        final maxPrice = double.tryParse(_selectedPriceRange) ?? 999999.0;
        final price = double.tryParse((t['price'] ?? '0').toString().replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
        if (price > maxPrice) return false;
      }

      return true;
    }).toList();
  }

  void _showPriceInputDialog() {
    final controller = TextEditingController(text: _selectedPriceRange == 'الكل' ? '' : _selectedPriceRange);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('حدد السعر الأقصى', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'مثلاً: 3000',
                suffixText: 'ج.م',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () {
                      setState(() => _selectedPriceRange = 'الكل');
                      Navigator.pop(context);
                    },
                    child: const Text('إلغاء الفلتر'),
                  ),
                ),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() => _selectedPriceRange = controller.text.isEmpty ? 'الكل' : controller.text);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryOrange, foregroundColor: Colors.white),
                    child: const Text('تطبيق'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterSection(bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        children: [
          // Search Bar
          Container(
            height: 50,
            decoration: BoxDecoration(
              color: isDark ? AppColors.cardDark : Colors.white,
              borderRadius: BorderRadius.circular(15),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)],
            ),
            child: TextField(
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'ابحث عن رحلة أو وجهة...',
                hintStyle: GoogleFonts.cairo(fontSize: 13, color: Colors.grey),
                prefixIcon: const Icon(Icons.search, color: AppColors.primaryOrange, size: 20),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 15),
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Horizontal Filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('المدة', _selectedDuration, () => _showFilterDialog('مدة الرحلة', ['الكل', 'يوم واحد', '3 أيام', '4 أيام', 'أسبوع', 'أكثر من أسبوع'], (v) => setState(() => _selectedDuration = v))),
                const SizedBox(width: 8),
                _buildFilterChip('السعر القصى', _selectedPriceRange == 'الكل' ? 'الكل' : '$_selectedPriceRange ج.م', () => _showPriceInputDialog()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, VoidCallback onTap) {
    bool isDark = Theme.of(context).brightness == Brightness.dark;
    bool isActive = value != 'الكل' && value != '';
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primaryOrange : (isDark ? AppColors.cardDark : Colors.white),
          borderRadius: BorderRadius.circular(25),
          border: Border.all(color: isActive ? AppColors.primaryOrange : (isDark ? Colors.white10 : Colors.grey.shade200)),
        ),
        child: Row(
          children: [
            Text(label, style: GoogleFonts.cairo(fontSize: 11, color: isActive ? Colors.white70 : Colors.grey)),
            const SizedBox(width: 6),
            Text(value, style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold, color: isActive ? Colors.white : (isDark ? Colors.white : Colors.black87))),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down, size: 14, color: isActive ? Colors.white : Colors.grey),
          ],
        ),
      ),
    );
  }

  void _showFilterDialog(String title, List<String> options, Function(String) onSelect) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title, style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: options.map((opt) => ActionChip(
                label: Text(opt, style: GoogleFonts.cairo()),
                onPressed: () {
                  onSelect(opt);
                  Navigator.pop(context);
                },
              )).toList(),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumTripCard(BuildContext context, dynamic trip, bool isDark) {
    final title = trip['title'] ?? 'رحلة بدون اسم';
    final price = trip['price']?.toString() ?? '0';
    final destination = trip['destination'] ?? 'وجهة مميزة';
    final company = trip['companyId'] as Map?;
    final companyName = company?['name'] ?? 'شركة سياحة';
    final companyLogo = company?['logo'] ?? 'https://via.placeholder.com/150';
    final imgUrl = (trip['images'] as List?)?.isNotEmpty == true ? trip['images'][0] : 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=400';

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        children: [
          // Image Section
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                child: CachedNetworkImage(
                  imageUrl: imgUrl,
                  height: 240,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
              // Gradient Overlay
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.black.withOpacity(0.1), Colors.black.withOpacity(0.6)],
                    ),
                  ),
                ),
              ),
              // Top Right: Location Badge
              Positioned(
                top: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white24)),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.white, size: 14),
                      const SizedBox(width: 4),
                      Text(destination, style: GoogleFonts.cairo(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              // Top Left: Company Logo Circle
              Positioned(
                top: 16,
                left: 16,
                child: CircleAvatar(
                  radius: 22,
                  backgroundColor: AppColors.primaryOrange,
                  child: CircleAvatar(
                    radius: 20,
                    backgroundImage: NetworkImage(companyLogo),
                  ),
                ),
              ),
              // Middle Right: Status Badge (Dynamic)
              Positioned(
                top: 80,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: const BoxDecoration(
                    color: Color(0xFFE11D48), // Red/Pink from screenshot
                    borderRadius: BorderRadius.only(topLeft: Radius.circular(20), bottomLeft: Radius.circular(20)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.timer_outlined, color: Colors.white, size: 16),
                      const SizedBox(width: 8),
                      Text('قد بدأت بالفعل / انتهى الحجز', style: GoogleFonts.cairo(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              // Bottom Section of Image: Price and Title
              Positioned(
                bottom: 16,
                left: 16,
                right: 16,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Price Card
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(15)),
                      child: Column(
                        children: [
                          Text('تبدأ من', style: GoogleFonts.cairo(fontSize: 9, color: Colors.black54)),
                          Text(price, style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black)),
                          Text('ج.م', style: GoogleFonts.cairo(fontSize: 9, color: Colors.black54, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Title and Metadata
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(title, style: GoogleFonts.cairo(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold), textAlign: TextAlign.right),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              _iconText(Icons.timer_outlined, '${trip['duration'] ?? "3"} أيام', Colors.white70),
                              const SizedBox(width: 12),
                              _iconText(Icons.star, '${trip['rating'] ?? 4.5}', Colors.amber),
                              const SizedBox(width: 12),
                              _iconText(Icons.visibility_outlined, '${trip['views'] ?? 0}', Colors.white70),
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
          // Description Section
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Text(
                  trip['shortDescription'] ?? 'وصف الرحلة الممتعة التي تقدمها شركتنا...',
                  style: GoogleFonts.cairo(color: Colors.grey, fontSize: 13, height: 1.5),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                // Explore Button
                ElevatedButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => CorporateTripDetailsPage(trip: trip))),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryOrange,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 5,
                    shadowColor: AppColors.primaryOrange.withOpacity(0.4),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.arrow_back, size: 18),
                      const SizedBox(width: 8),
                      Text('اكتشف المزيد', style: GoogleFonts.cairo(fontSize: 15, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                // Footer
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(companyName, style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                    const SizedBox(width: 8),
                    Text('بواسطة', style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey)),
                    const SizedBox(width: 8),
                    CircleAvatar(radius: 12, backgroundImage: NetworkImage(companyLogo)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _iconText(IconData icon, String label, Color color) {
    return Row(
      children: [
        Text(label, style: GoogleFonts.cairo(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(width: 4),
        Icon(icon, color: color, size: 14),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.search_off, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          Text('لم نجد رحلات تطابق هذا البحث', style: GoogleFonts.cairo(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.wifi_off, size: 60, color: Colors.red),
          const SizedBox(height: 16),
          Text('حدث خطأ في الاتصال', style: GoogleFonts.cairo()),
          TextButton(onPressed: () => ref.invalidate(corporateTripsProvider), child: const Text('إعادة المحاولة')),
        ],
      ),
    );
  }
}
