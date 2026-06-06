import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';
import '../../providers/api_provider.dart';
import 'corporate_booking_page.dart';
import '../../widgets/report_trip_dialog.dart';

class CorporateTripDetailsPage extends ConsumerWidget {
  final Map<String, dynamic> trip;

  const CorporateTripDetailsPage({super.key, required this.trip});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final companyName = (trip['companyId'] as Map?)?['name'] ?? 'شركة سياحة';
    final images = (trip['images'] as List?)?.cast<String>() ?? [];
    final itinerary = (trip['itinerary'] as List?) ?? [];
    final included = (trip['includedServices'] as List?)?.cast<String>() ?? [];
    final excluded = (trip['excludedServices'] as List?)?.cast<String>() ?? [];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(context, trip, images),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   _buildHeader(trip, companyName, isDark),
                   const SizedBox(height: 16),
                   _buildContactCompanyButton(context, trip),
                   const SizedBox(height: 24),
                   _buildDescription(trip['fullDescription'] ?? trip['shortDescription']),
                   const SizedBox(height: 32),
                   if (itinerary.isNotEmpty) ...[
                     _buildSectionTitle('برنامج الرحلة', Icons.event_note),
                     const SizedBox(height: 16),
                     _buildItinerary(itinerary),
                     const SizedBox(height: 32),
                   ],
                   
                   _buildSectionTitle('وسيلة النقل', Icons.directions_bus_filled_outlined),
                   const SizedBox(height: 16),
                   _buildTransportationSection(trip, isDark),
                   const SizedBox(height: 32),

                   _buildIncludedExcludedLayout(included, excluded),
                   const SizedBox(height: 32),

                   _buildMeetingPointMap(trip['meetingLocation'], isDark),
                   const SizedBox(height: 120), // Spacing for bottom button
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: _buildBookingBar(context, trip, isDark),
    );
  }

  Widget _buildSliverAppBar(
    BuildContext context,
    Map<String, dynamic> trip,
    List<String> images,
  ) {
    return SliverAppBar(
      expandedHeight: 350,
      pinned: true,
      flexibleSpace: FlexibleSpaceBar(
        background: images.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: images[0],
                fit: BoxFit.cover,
              )
            : Container(color: Colors.grey),
      ),
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: CircleAvatar(
          backgroundColor: Colors.white,
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.flag_outlined, color: Colors.white),
          onPressed: () {
            final id = trip['_id']?.toString() ?? '';
            final title = trip['title']?.toString() ?? 'رحلة شركة';
            ReportTripDialog.show(
              context,
              tripId: id,
              tripTitle: title,
              tripModel: 'CorporateTrip',
            );
          },
        ),
      ],
    );
  }

  Widget _buildHeader(Map<String, dynamic> trip, String companyName, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primaryOrange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                trip['destination'] ?? 'وجهة مميزة',
                style: GoogleFonts.cairo(color: AppColors.primaryOrange, fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
            const Spacer(),
            const Icon(Icons.star, color: Colors.amber, size: 20),
            Text(
              ' ${trip['rating'] ?? 4.5}',
              style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          trip['title'] ?? 'عنوان الرحلة',
          style: GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          'بواسطة: $companyName',
          style: GoogleFonts.cairo(color: AppColors.primaryOrange, fontWeight: FontWeight.w600, fontSize: 14),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildQuickStat(Icons.timer_outlined, 'المدة', trip['duration'] ?? '3 أيام', isDark),
            _buildQuickStat(Icons.people_alt_outlined, 'الأفراد', '${trip['maxParticipants'] ?? 50} فرد', isDark),
            _buildQuickStat(Icons.calendar_month_outlined, 'الإنطلاق', 'غداً 7 ص', isDark),
            _buildQuickStat(Icons.verified_outlined, 'الحالة', 'مؤكدة', isDark, color: Colors.green),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickStat(IconData icon, String label, String value, bool isDark, {Color? color}) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: (color ?? AppColors.primaryOrange).withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color ?? AppColors.primaryOrange, size: 20),
        ),
        const SizedBox(height: 6),
        Text(label, style: GoogleFonts.cairo(fontSize: 10, color: Colors.grey)),
        Text(value, style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
      ],
    );
  }

  Widget _buildContactCompanyButton(BuildContext context, Map<String, dynamic> trip) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () {
              // Future: Navigation to direct chat
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('ميزة المراسلة المباشرة ستتوفر قريباً! يمكنك التواصل عبر واتساب حالياً.')),
              );
            },
            icon: const Icon(Icons.chat_bubble_outline, color: AppColors.primaryOrange),
            label: Text('مراسلة الشركة', style: GoogleFonts.cairo(color: AppColors.primaryOrange, fontWeight: FontWeight.bold, fontSize: 13)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.primaryOrange),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () async {
              String phone = (trip['companyId'] as Map?)?['phone'] ?? '201015985881';
              phone = phone.replaceAll(RegExp(r'[^0-9]'), '');
              if (!phone.startsWith('+') && phone.length == 11) phone = '2$phone';
              
              final url = Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent('استفسار بخصوص رحلة: ${trip['title']}')}');
              try {
                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                }
              } catch (e) {
                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تعذر فتح واتساب')));
              }
            },
            icon: const Icon(Icons.message, color: Colors.white), 
            label: Text('واتساب', style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF25D366), 
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF14B8A6), size: 24),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildDescription(String? text) {
    return Text(
      text ?? 'لا يوجد وصف متاح.',
      style: GoogleFonts.cairo(fontSize: 14, height: 1.6, color: Colors.grey[600]),
    );
  }

  Widget _buildItinerary(List<dynamic> itinerary) {
    return Column(
      children: itinerary.map((day) {
        int index = itinerary.indexOf(day);
        return Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  CircleAvatar(
                    radius: 12,
                    backgroundColor: const Color(0xFF14B8A6),
                    child: Text('${index + 1}', style: const TextStyle(color: Colors.white, fontSize: 10)),
                  ),
                  if (index != itinerary.length - 1)
                    Container(width: 1, height: 50, color: const Color(0xFF14B8A6).withOpacity(0.3)),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(day['title'] ?? 'اليوم ${index + 1}', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15)),
                    Text(day['description'] ?? '', style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey[600])),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTransportationSection(Map<String, dynamic> trip, bool isDark) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Bus Info Card
        Expanded(
          flex: 4,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.cardDark : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.withOpacity(0.1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.airport_shuttle, color: Color(0xFF14B8A6)),
                    const SizedBox(width: 8),
                    Text('حافلة الرحلة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: const Color(0xFF14B8A6))),
                  ],
                ),
                const SizedBox(height: 8),
                Text('نضمن لك رحلة مريحة مع أحدث الحافلات المزودة بشاشات وتكييف.', style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey)),
                const SizedBox(height: 16),
                _buildTransportInfoRow('إجمالي المقاعد', '28'),
                _buildTransportInfoRow('تكييف', 'متوفر'),
                _buildTransportInfoRow('شاشات / USB', 'متوفر'),
                _buildTransportInfoRow('خدمة WiFi', 'متوفر'),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Seat Preview Card
        Expanded(
          flex: 3,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? AppColors.cardDark : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.withOpacity(0.1)),
            ),
            child: Column(
              children: [
                Text('مخطط المقاعد', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 11)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 4,
                  runSpacing: 4,
                  children: List.generate(12, (index) => Container(
                    width: 15,
                    height: 15,
                    decoration: BoxDecoration(
                      color: index == 5 ? Colors.orange : Colors.grey[200],
                      borderRadius: BorderRadius.circular(4),
                    ),
                  )),
                ),
                const SizedBox(height: 12),
                Text('اضغط للحجز', style: GoogleFonts.cairo(fontSize: 9, color: AppColors.primaryOrange)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTransportInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.cairo(fontSize: 10, color: Colors.grey)),
          Text(value, style: GoogleFonts.cairo(fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildIncludedExcludedLayout(List<String> included, List<String> excluded) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Included
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.05),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.green.withOpacity(0.1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.check_circle_outline, color: Colors.green, size: 18),
                    const SizedBox(width: 6),
                    Text('ما هو مشمول؟', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.green, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 12),
                ...included.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      const CircleAvatar(radius: 2, backgroundColor: Colors.green),
                      const SizedBox(width: 6),
                      Expanded(child: Text(item, style: GoogleFonts.cairo(fontSize: 11))),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Excluded
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.05),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.red.withOpacity(0.1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.cancel_outlined, color: Colors.red, size: 18),
                    const SizedBox(width: 6),
                    Text('غير مشمول', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 12),
                ...excluded.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      const CircleAvatar(radius: 2, backgroundColor: Colors.red),
                      const SizedBox(width: 6),
                      Expanded(child: Text(item, style: GoogleFonts.cairo(fontSize: 11))),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMeetingPointMap(String? loc, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF101828), // Dark section
        borderRadius: BorderRadius.circular(25),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.location_on, color: Color(0xFFF97316), size: 24),
              const SizedBox(width: 8),
              Text('نقطة التجمع', style: GoogleFonts.cairo(color: const Color(0xFF14B8A6), fontWeight: FontWeight.bold, fontSize: 18)),
            ],
          ),
          const SizedBox(height: 8),
          Text(loc ?? 'بنك الاهلي مطروح', style: GoogleFonts.cairo(color: Colors.white, fontSize: 13)),
          const SizedBox(height: 24),
          const CircleAvatar(
             radius: 30,
             backgroundColor: Colors.white10,
             child: Icon(Icons.my_location, color: Color(0xFFF97316)),
          ),
          const SizedBox(height: 20),
          Text('سيتم إرسال الموقع الدقيق عبر الواتساب فور الحجز', style: GoogleFonts.cairo(color: Colors.white60, fontSize: 11)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
             onPressed: () async {
               final query = Uri.encodeComponent(loc ?? trip['destination']?.toString() ?? '');
               final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
               if (await canLaunchUrl(uri)) {
                 await launchUrl(uri, mode: LaunchMode.externalApplication);
               }
             },
             icon: const Icon(Icons.map_outlined),
             label: Text('فتح في خرائط جوجل', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
             style: ElevatedButton.styleFrom(
               backgroundColor: Colors.white.withOpacity(0.1),
               foregroundColor: Colors.white,
               shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
             ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingBar(BuildContext context, Map<String, dynamic> trip, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Row(
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('السعر الإجمالي', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
              Text('${trip['price']} ج.م', style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.green)),
            ],
          ),
          const SizedBox(width: 24),
          Expanded(
            child: ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => CorporateBookingPage(trip: trip))),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1), // Indigo/Blue from screenshot
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: Text('تأكيد وحجز الآن', style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}

class CorporateTripLoader extends ConsumerStatefulWidget {
  final String tripId;
  const CorporateTripLoader({super.key, required this.tripId});

  @override
  ConsumerState<CorporateTripLoader> createState() => _CorporateTripLoaderState();
}

class _CorporateTripLoaderState extends ConsumerState<CorporateTripLoader> {
  Map<String, dynamic>? _trip;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/corporate/trips/${widget.tripId}');
      if (!mounted) return;
      setState(() {
        _trip = Map<String, dynamic>.from(response.data as Map);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_error != null || _trip == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('تعذّر تحميل الرحلة', style: GoogleFonts.cairo())),
      );
    }
    return CorporateTripDetailsPage(trip: _trip!);
  }
}
