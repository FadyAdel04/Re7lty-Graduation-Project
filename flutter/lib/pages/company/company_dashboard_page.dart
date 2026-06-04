import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';
import '../../theme/app_colors.dart';
import '../../providers/api_provider.dart';
import '../../providers/user_provider.dart';
import '../../providers/auth_bootstrap_provider.dart';
import '../../services/api_service.dart';
import '../../core/exceptions.dart';
import 'company_settings_page.dart';
import 'company_coupons_page.dart';
import 'company_reports_page.dart';
import 'qr_scanner_page.dart';
import 'seat_allocation_page.dart';
import 'company_messages_page.dart';
import 'create_corporate_trip_page.dart';
import '../../providers/theme_provider.dart';
import 'package:clerk_flutter/clerk_flutter.dart';

class CompanyDashboardPage extends ConsumerStatefulWidget {
  const CompanyDashboardPage({super.key});

  @override
  ConsumerState<CompanyDashboardPage> createState() => _CompanyDashboardPageState();
}

class _CompanyDashboardPageState extends ConsumerState<CompanyDashboardPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;

  // Real-world fetched data
  Map<String, dynamic> _companyProfile = {};
  Map<String, dynamic> _analytics = {};
  List<dynamic> _trips = [];
  List<dynamic> _bookings = [];
  
  // Tab index tracking
  int _activeTabIndex = 0;
  
  // Bookings filter
  String _bookingsFilter = 'all'; // 'all', 'pending', 'accepted', 'rejected', 'cancelled'

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _activeTabIndex = _tabController.index;
      });
    });
    Future.microtask(() => _fetchDashboardData());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchDashboardData() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      
      // 1. Fetch Company Profile
      final companyResponse = await api.get('/corporate/companies/me');
      if (companyResponse.statusCode == 200) {
        _companyProfile = companyResponse.data;
      }

      final companyId = _companyProfile['_id'] ?? _companyProfile['id'];
      
      if (companyId != null) {
        // 2. Fetch Trips, Bookings, Analytics in parallel
        final results = await Future.wait([
          api.get('/corporate/trips?companyId=$companyId'),
          api.get('/bookings/company-bookings'),
          api.get('/bookings/analytics'),
        ]);

        if (results[0].statusCode == 200) {
          final data = results[0].data;
          _trips = data is Map ? (data['trips'] ?? []) : (data is List ? data : []);
        }
        
        if (results[1].statusCode == 200) {
          _bookings = results[1].data ?? [];
        }

        if (results[2].statusCode == 200) {
          _analytics = results[2].data ?? {};
        }
      }
    } catch (e) {
      debugPrint('❌ Error fetching dashboard data: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('حدث خطأ أثناء تحميل البيانات: $e', style: GoogleFonts.cairo()),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  // Action methods
  Future<void> _acceptBooking(String bookingId) async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.post('/bookings/$bookingId/accept');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        _showSnackBar('تم قبول الحجز بنجاح وإشعار المسافر 🎉', Colors.green);
        await _fetchDashboardData();
      }
    } catch (e) {
      _showErrorSnackBar(e);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _rejectBooking(String bookingId, String reason) async {
    if (reason.trim().isEmpty) {
      _showSnackBar('يرجى كتابة سبب الرفض', Colors.orange);
      return;
    }
    Navigator.pop(context); // Close dialog
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.post('/bookings/$bookingId/reject', data: {
        'reason': reason,
      });
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        _showSnackBar('تم رفض الحجز وإرسال السبب للمسافر', Colors.redAccent);
        await _fetchDashboardData();
      }
    } catch (e) {
      _showErrorSnackBar(e);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updatePayment(String bookingId, String paymentStatus, String paymentMethod) async {
    Navigator.pop(context); // Close dialog/sheet
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.put('/bookings/$bookingId/payment', data: {
        'paymentStatus': paymentStatus,
        'paymentMethod': paymentMethod,
      });
      
      if (response.statusCode == 200) {
        _showSnackBar('تم تحديث حالة الدفع بنجاح 💳', Colors.blue);
        await _fetchDashboardData();
      }
    } catch (e) {
      _showErrorSnackBar(e);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showSnackBar(String message, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _showErrorSnackBar(dynamic e) {
    if (!mounted) return;
    String errorMsg = 'حدث خطأ غير متوقع';
    if (e is DioException) {
      try {
        errorMsg = handleDioError(e).message;
      } catch (_) {
        errorMsg = e.response?.data?['error'] ?? e.message ?? errorMsg;
      }
    } else {
      errorMsg = e.toString();
    }
    _showSnackBar(errorMsg, Colors.redAccent);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final pendingBookings = _bookings.where((b) => b['status'] == 'pending').length;
    final totalRevenue = (_analytics['revenue']?['total'] ?? 0);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.cardDark : Colors.white,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              _companyProfile['name'] ?? 'لوحة تحكم الشركة',
              style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Text('لوحتي', style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey)),
          ],
        ),
        centerTitle: true,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            onSelected: (value) async {
              if (value == 'settings') {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanySettingsPage()));
              } else if (value == 'theme') {
                ref.read(themeProvider.notifier).toggleTheme();
              } else if (value == 'logout') {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    title: Text('تسجيل الخروج', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                    content: Text('هل أنت متأكد أنك تريد تسجيل الخروج؟', style: GoogleFonts.cairo()),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('إلغاء', style: GoogleFonts.cairo())),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                        onPressed: () => Navigator.pop(ctx, true),
                        child: Text('خروج', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                );
                if (confirmed == true && mounted) {
                  await ClerkAuth.of(context).signOut();
                  ref.read(authBootstrapProvider.notifier).reset();
                  if (context.mounted) context.go('/login');
                }
              } else if (value == 'support') {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('تواصل معنا على: support@re7lty.com', style: GoogleFonts.cairo()), backgroundColor: AppColors.primaryOrange),
                );
              }
            },
            itemBuilder: (_) {
              final isDarkNow = Theme.of(context).brightness == Brightness.dark;
              return [
                PopupMenuItem(value: 'settings', child: Row(children: [const Icon(Icons.settings_outlined, size: 20), const SizedBox(width: 10), Text('الإعدادات', style: GoogleFonts.cairo())])),
                PopupMenuItem(value: 'theme', child: Row(children: [Icon(isDarkNow ? Icons.light_mode_outlined : Icons.dark_mode_outlined, size: 20), const SizedBox(width: 10), Text(isDarkNow ? 'الوضع الفاتح' : 'الوضع الداكن', style: GoogleFonts.cairo())])),
                PopupMenuItem(value: 'support', child: Row(children: [const Icon(Icons.support_agent_outlined, size: 20), const SizedBox(width: 10), Text('الدعم', style: GoogleFonts.cairo())])),
                const PopupMenuDivider(),
                PopupMenuItem(value: 'logout', child: Row(children: [const Icon(Icons.logout, size: 20, color: Colors.red), const SizedBox(width: 10), Text('تسجيل الخروج', style: GoogleFonts.cairo(color: Colors.red))])),
              ];
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primaryOrange,
          labelColor: AppColors.primaryOrange,
          unselectedLabelColor: Colors.grey,
          labelStyle: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'الرحلات'),
            Tab(text: 'الحجوزات'),
            Tab(text: 'المزيد'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchDashboardData,
        color: AppColors.primaryOrange,
        child: _isLoading && _companyProfile.isEmpty
            ? const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange))
            : TabBarView(
                controller: _tabController,
                children: [
                  _buildTripsTab(isDark),
                  _buildBookingsTab(isDark),
                  _buildMenuTab(isDark, pendingBookings, totalRevenue),
                ],
              ),
      ),
      floatingActionButton: _activeTabIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/create-corporate-trip'),
              backgroundColor: AppColors.primaryOrange,
              label: Text('رحلة جديدة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.white)),
              icon: const Icon(Icons.add, color: Colors.white),
            )
          : null,
    );
  }

  // ===== MENU TAB (Quick Actions Grid) =====
  Widget _buildMenuTab(bool isDark, int pendingCount, dynamic totalRevenue) {
    final sections = [
      {
        'label': 'توزيع المقاعد',
        'icon': Icons.airline_seat_recline_normal_outlined,
        'gradient': [const Color(0xFFA855F7), const Color(0xFFEC4899)],
        'badge': null,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SeatAllocationPage())),
      },
      {
        'label': 'كوبونات الخصم',
        'icon': Icons.local_offer_outlined,
        'gradient': [const Color(0xFFF59E0B), const Color(0xFFF97316)],
        'badge': null,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyCouponsPage())),
      },
      {
        'label': 'الرسائل',
        'icon': Icons.chat_bubble_outline,
        'gradient': [const Color(0xFF3B82F6), const Color(0xFF06B6D4)],
        'badge': null,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyMessagesPage())),
      },
      {
        'label': 'التحقق من QR',
        'icon': Icons.qr_code_scanner_outlined,
        'gradient': [const Color(0xFF0EA5E9), const Color(0xFF4F46E5)],
        'badge': null,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const QrScannerPage())),
      },
      {
        'label': 'التقارير',
        'icon': Icons.bar_chart_outlined,
        'gradient': [const Color(0xFFEF4444), const Color(0xFFEC4899)],
        'badge': null,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyReportsPage())),
      },
      {
        'label': 'الإعدادات',
        'icon': Icons.settings_outlined,
        'gradient': [const Color(0xFF374151), const Color(0xFF111827)],
        'badge': null,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanySettingsPage())),
      },
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Stats summary card
        Container(
          margin: const EdgeInsets.only(bottom: 20),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.indigo.withOpacity(0.25), blurRadius: 16, offset: const Offset(0, 6))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('نظرة عامة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _buildStatItem('الرحلات', '${_trips.length}', Icons.map_outlined)),
                  Expanded(child: _buildStatItem('الحجوزات', '${_bookings.length}', Icons.receipt_long_outlined)),
                  Expanded(child: _buildStatItem('الانتظار', '$pendingCount', Icons.pending_outlined)),
                  Expanded(child: _buildStatItem('الإيرادات', '$totalRevenue ج.م', Icons.payments_outlined)),
                ],
              ),
              if (pendingCount > 0) ...[  
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                  child: Row(
                    children: [
                      const Icon(Icons.notifications_active_outlined, size: 16, color: Colors.yellow),
                      const SizedBox(width: 8),
                      Text('لديك $pendingCount حجز جديد بانتظار الموافقة', style: GoogleFonts.cairo(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),

        // Sections grid
        Text('الأقسام', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.grey[700])),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.95,
          ),
          itemCount: sections.length,
          itemBuilder: (_, i) {
            final s = sections[i];
            final gradient = s['gradient'] as List<Color>;
            final badge = s['badge'] as String?;
            return GestureDetector(
              onTap: s['onTap'] as VoidCallback,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [BoxShadow(color: gradient[0].withOpacity(0.25), blurRadius: 10, offset: const Offset(0, 4))],
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(s['icon'] as IconData, color: Colors.white, size: 30),
                          const SizedBox(height: 8),
                          Text(
                            s['label'] as String,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                    if (badge != null)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.all(5),
                          decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                          child: Text(badge, style: GoogleFonts.cairo(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ),
                  ],
                ),
              ),
            ).animate().fadeIn(delay: (i * 80).ms).scale(begin: const Offset(0.9, 0.9));
          },
        ),
      ],
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white70, size: 18),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.white), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
        Text(label, style: GoogleFonts.cairo(fontSize: 10, color: Colors.white70), textAlign: TextAlign.center),
      ],
    );
  }

  // --- TAB 1: TRIPS TAB ---
  Widget _buildTripsTab(bool isDark) {
    if (_trips.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.map_outlined, size: 64, color: Colors.grey.withOpacity(0.3)),
            const SizedBox(height: 16),
            Text('لا توجد رحلات مضافة بعد', style: GoogleFonts.cairo(color: Colors.grey)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.push('/create-corporate-trip'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryOrange),
              child: Text('أنشئ رحلتك الأولى الآن', style: GoogleFonts.cairo(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _trips.length,
      itemBuilder: (context, index) {
        final trip = _trips[index];
        final images = trip['images'] as List?;
        final imageUrl = (images != null && images.isNotEmpty) ? images[0] : '';
        final bookedSeats = (trip['seatBookings'] as List?)?.length ?? 0;
        final totalSeats = trip['maxGroupSize'] ?? trip['availableSeats'] ?? 0;

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.cardDark : Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              if (!isDark) BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          child: Column(
            children: [
              Row(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.only(topRight: Radius.circular(20), bottomRight: Radius.circular(20)),
                    child: imageUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: imageUrl,
                            width: 100,
                            height: 100,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(color: Colors.grey[200]),
                            errorWidget: (context, url, error) => Container(color: Colors.grey[200], child: const Icon(Icons.image_not_supported)),
                          )
                        : Container(width: 100, height: 100, color: Colors.grey[200], child: const Icon(Icons.image)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            trip['title'] ?? '',
                            style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '📍 ${trip['destination'] ?? ''}',
                            style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.blue.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '👤 $bookedSeats / $totalSeats مقعد',
                                  style: GoogleFonts.cairo(fontSize: 10, color: Colors.blue, fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${trip['price'] ?? 0} ج.م',
                                style: GoogleFonts.cairo(fontWeight: FontWeight.w900, color: AppColors.primaryOrange, fontSize: 13),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(right: 4),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit_outlined, size: 18, color: Colors.indigo),
                          tooltip: 'تعديل الرحلة',
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => CreateCorporateTripPage(existingTrip: trip),
                              ),
                            ).then((_) => _fetchDashboardData());
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                          onPressed: () {
                            context.push('/corporate-trip/${trip['_id'] ?? trip['id']}', extra: trip);
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.1);
      },
    );
  }

  // --- TAB 2: BOOKINGS TAB ---
  Widget _buildBookingsTab(bool isDark) {
    // Filter bookings locally
    List<dynamic> filtered = _bookings;
    if (_bookingsFilter != 'all') {
      filtered = _bookings.where((b) => b['status'] == _bookingsFilter).toList();
    }

    return Column(
      children: [
        // Horizontal Filter Chips
        Container(
          height: 60,
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              _buildFilterChip('الكل', 'all'),
              _buildFilterChip('قيد الانتظار', 'pending'),
              _buildFilterChip('مقبول', 'accepted'),
              _buildFilterChip('مرفوض', 'rejected'),
              _buildFilterChip('ملغي', 'cancelled'),
            ],
          ),
        ),
        
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey.withOpacity(0.3)),
                      const SizedBox(height: 16),
                      Text('لا توجد حجوزات تطابق الفلتر', style: GoogleFonts.cairo(color: Colors.grey)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final booking = filtered[index];
                    final date = DateTime.tryParse(booking['createdAt'] ?? '') ?? DateTime.now();
                    final formattedDate = DateFormat('yyyy/MM/dd hh:mm a').format(date);
                    
                    return Card(
                      color: isDark ? AppColors.cardDark : Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                        side: BorderSide(
                          color: isDark ? Colors.white10 : Colors.grey.shade100,
                        ),
                      ),
                      margin: const EdgeInsets.only(bottom: 12),
                      child: InkWell(
                        onTap: () => _showBookingDetailsSheet(booking, isDark),
                        borderRadius: BorderRadius.circular(15),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      booking['userName'] ?? 'مسافر مجهول',
                                      style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16),
                                    ),
                                  ),
                                  _buildStatusBadge(booking['status'] ?? 'pending'),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'الرحلة: ${booking['tripTitle'] ?? ''}',
                                style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${booking['totalPrice'] ?? 0} ج.م • ${booking['numberOfPeople']} أفراد',
                                    style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: AppColors.primaryOrange, fontSize: 14),
                                  ),
                                  Text(
                                    formattedDate,
                                    style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey),
                                  ),
                                ],
                              ),
                              if (booking['selectedSeats'] != null && (booking['selectedSeats'] as List).isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 6,
                                  children: (booking['selectedSeats'] as List).map<Widget>((s) {
                                    return Chip(
                                      label: Text('مقعد $s', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                      padding: EdgeInsets.zero,
                                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    );
                                  }).toList(),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ).animate().fadeIn(delay: (index * 40).ms).slideY(begin: 0.1);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _bookingsFilter == value;
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: ChoiceChip(
        label: Text(label, style: GoogleFonts.cairo(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, fontSize: 12)),
        selected: isSelected,
        onSelected: (selected) {
          if (selected) {
            setState(() => _bookingsFilter = value);
          }
        },
        selectedColor: AppColors.primaryOrange.withOpacity(0.2),
        labelStyle: TextStyle(color: isSelected ? AppColors.primaryOrange : Colors.grey),
        side: BorderSide(color: isSelected ? AppColors.primaryOrange : Colors.grey.shade300),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    String text;
    
    switch (status) {
      case 'accepted':
        bg = Colors.green.withOpacity(0.1);
        fg = Colors.green;
        text = 'مقبول';
        break;
      case 'rejected':
        bg = Colors.red.withOpacity(0.1);
        fg = Colors.red;
        text = 'مرفوض';
        break;
      case 'cancelled':
        bg = Colors.grey.withOpacity(0.1);
        fg = Colors.grey;
        text = 'ملغي';
        break;
      case 'pending':
      default:
        bg = Colors.amber.withOpacity(0.1);
        fg = Colors.amber.shade800;
        text = 'انتظار';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(text, style: GoogleFonts.cairo(color: fg, fontWeight: FontWeight.bold, fontSize: 11)),
    );
  }

  // Dialog/Sheet to accept or reject bookings
  void _showBookingDetailsSheet(Map<String, dynamic> booking, bool isDark) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppColors.cardDark : Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
      builder: (context) {
        final status = booking['status'] ?? 'pending';
        final isPending = status == 'pending';
        final isAccepted = status == 'accepted';
        final paymentStatus = booking['paymentStatus'] ?? 'pending';
        
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('تفاصيل طلب الحجز', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
                  _buildStatusBadge(status),
                ],
              ),
              const Divider(height: 30),
              
              _buildDetailRow('اسم العميل:', booking['userName'] ?? ''),
              _buildDetailRow('رقم الهاتف:', booking['userPhone'] ?? ''),
              _buildDetailRow('البريد الإلكتروني:', booking['userEmail'] ?? ''),
              _buildDetailRow('الرحلة المطلوبة:', booking['tripTitle'] ?? ''),
              _buildDetailRow('عدد الأفراد:', '${booking['numberOfPeople']} أفراد'),
              _buildDetailRow('إجمالي التكلفة:', '${booking['totalPrice'] ?? 0} ج.م'),
              _buildDetailRow('المقاعد المختارة:', (booking['selectedSeats'] as List?)?.join(', ') ?? 'لم يتم التحديد'),
              
              const SizedBox(height: 10),
              
              // Payment detail block
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white54.withOpacity(0.05) : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('حالة الدفع:', style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey)),
                    _buildPaymentStatusBadge(paymentStatus),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              if (isPending) ...[
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _acceptBooking(booking['_id'] ?? booking['id']);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                        ),
                        child: Text('قبول الحجز', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          _showRejectionDialog(booking['_id'] ?? booking['id']);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                        ),
                        child: Text('رفض الحجز', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ] else if (isAccepted) ...[
                ElevatedButton.icon(
                  onPressed: () {
                    _showPaymentUpdateDialog(booking, isDark);
                  },
                  icon: const Icon(Icons.payment, color: Colors.white),
                  label: Text('تحديث الدفع وطريقة التحصيل', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.white)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryOrange,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  ),
                ),
              ],
              
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: GoogleFonts.cairo(color: Colors.grey, fontSize: 13)),
          ),
          Expanded(
            child: Text(value, style: GoogleFonts.cairo(fontWeight: FontWeight.w600, fontSize: 14)),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentStatusBadge(String status) {
    String text = 'غير مدفوع';
    Color color = Colors.orange;
    switch (status) {
      case 'paid':
        text = 'تم الدفع';
        color = Colors.green;
        break;
      case 'refunded':
        text = 'مسترجع';
        color = Colors.grey;
        break;
      case 'partially_paid':
        text = 'مدفوع جزئياً';
        color = Colors.blue;
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text, style: GoogleFonts.cairo(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }

  void _showRejectionDialog(String bookingId) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('سبب رفض الحجز', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
          content: TextField(
            controller: controller,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'مثال: جميع المقاعد محجوزة للرحلة...',
              hintStyle: GoogleFonts.cairo(fontSize: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('إلغاء', style: GoogleFonts.cairo(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () => _rejectBooking(bookingId, controller.text),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: Text('رفض الحجز', style: GoogleFonts.cairo(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  void _showPaymentUpdateDialog(Map<String, dynamic> booking, bool isDark) {
    String status = booking['paymentStatus'] ?? 'pending';
    String method = booking['paymentMethod'] ?? 'cash';
    
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text('تحديث حالة التحصيل والـ Payment', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('حالة الدفع:', style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey)),
                  DropdownButton<String>(
                    value: status,
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(value: 'pending', child: Text('معلق / غير مدفوع')),
                      DropdownMenuItem(value: 'paid', child: Text('مدفوع بالكامل')),
                      DropdownMenuItem(value: 'refunded', child: Text('مسترجع / Refunded')),
                    ],
                    onChanged: (val) {
                      if (val != null) setDialogState(() => status = val);
                    },
                  ),
                  const SizedBox(height: 16),
                  Text('طريقة الدفع:', style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey)),
                  DropdownButton<String>(
                    value: method,
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(value: 'cash', child: Text('كاش / نقدي')),
                      DropdownMenuItem(value: 'card', child: Text('فيزا / بطاقة')),
                      DropdownMenuItem(value: 'bank_transfer', child: Text('تحويل بنكي / انستاباي')),
                    ],
                    onChanged: (val) {
                      if (val != null) setDialogState(() => method = val);
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('إلغاء', style: GoogleFonts.cairo(color: Colors.grey)),
                ),
                ElevatedButton(
                  onPressed: () => _updatePayment(booking['_id'] ?? booking['id'], status, method),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  child: Text('حفظ التحديثات', style: GoogleFonts.cairo(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // --- TAB 3: REPORTS TAB ---
  Widget _buildReportsTab(bool isDark) {
    if (_analytics.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange));
    }

    final overview = _analytics['overview'] ?? {};
    final revenue = _analytics['revenue'] ?? {};
    final trends = _analytics['trends'] ?? {};

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('ملخص الحسابات والأداء', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),

          // Cards Grid
          Row(
            children: [
              Expanded(
                child: _buildReportCard(
                  'صافي الأرباح (بعد العمولة)',
                  '${revenue['net'] ?? 0} ج.م',
                  Icons.account_balance_wallet,
                  Colors.green,
                  isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildReportCard(
                  'إجمالي المبيعات (الكل)',
                  '${revenue['total'] ?? 0} ج.م',
                  Icons.trending_up,
                  Colors.blue,
                  isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildReportCard(
                  'عمولة المنصة المقتطعة (5%)',
                  '${revenue['commission'] ?? 0} ج.م',
                  Icons.percent,
                  Colors.orange,
                  isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildReportCard(
                  'مبيعات معلقة (قيد التحصيل)',
                  '${revenue['pending'] ?? 0} ج.م',
                  Icons.hourglass_empty,
                  Colors.amber,
                  isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          Text('إحصائيات إضافية', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark ? AppColors.cardDark : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade100),
            ),
            child: Column(
              children: [
                _buildAnalyticsStatRow('إجمالي الحجوزات المستلمة', '${overview['totalBookings'] ?? 0} حجز'),
                const Divider(),
                _buildAnalyticsStatRow('حجوزات مقبولة وناجحة', '${overview['acceptedBookings'] ?? 0} حجز'),
                const Divider(),
                _buildAnalyticsStatRow('طلبات انتظار جديدة', '${overview['pendingBookings'] ?? 0} طلبات', isHighlight: true),
                const Divider(),
                _buildAnalyticsStatRow('مبيعات اليوم الحالية', '${trends['today'] ?? 0} ج.م'),
                const Divider(),
                _buildAnalyticsStatRow('مبيعات هذا الأسبوع', '${trends['week'] ?? 0} ج.م'),
                const Divider(),
                _buildAnalyticsStatRow('مبيعات هذا الشهر', '${trends['month'] ?? 0} ج.م'),
              ],
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildReportCard(String label, String value, IconData icon, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          if (!isDark) BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 16),
          Text(value, style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(label, style: GoogleFonts.cairo(fontSize: 10, color: Colors.grey)),
        ],
      ),
    ).animate().fadeIn().scale();
  }

  Widget _buildAnalyticsStatRow(String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.cairo(fontSize: 14, color: isHighlight ? AppColors.primaryOrange : null, fontWeight: isHighlight ? FontWeight.bold : null)),
          Text(value, style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold, color: isHighlight ? AppColors.primaryOrange : null)),
        ],
      ),
    );
  }
}
