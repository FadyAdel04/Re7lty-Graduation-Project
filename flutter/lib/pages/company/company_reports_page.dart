import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../services/api_service.dart';
import 'package:dio/dio.dart';
import '../../theme/app_colors.dart';

class CompanyReportsPage extends ConsumerStatefulWidget {
  const CompanyReportsPage({super.key});

  @override
  ConsumerState<CompanyReportsPage> createState() => _CompanyReportsPageState();
}

class _CompanyReportsPageState extends ConsumerState<CompanyReportsPage> {
  bool _isLoading = true;
  Map<String, dynamic> _analytics = {};
  List<dynamic> _trips = [];
  List<dynamic> _bookings = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final results = await Future.wait<Response>([
        api.get('/bookings/analytics'),
        api.get('/bookings/company-bookings'),
      ]);
      if (results[0].statusCode == 200) _analytics = results[0].data ?? {};
      if (results[1].statusCode == 200) _bookings = results[1].data ?? [];

      // Get trips too
      final companyRes = await api.get('/corporate/companies/me');
      final companyId = companyRes.data['_id'] ?? companyRes.data['id'];
      if (companyId != null) {
        final tripsRes = await api.get('/corporate/trips?companyId=$companyId');
        final data = tripsRes.data;
        _trips = data is Map ? (data['trips'] ?? []) : (data is List ? data : []);
      }
    } catch (e) {
      debugPrint('Error loading reports: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Calculate stats
    final totalRevenue = (_analytics['revenue']?['total'] ?? 0).toDouble();
    final pendingRevenue = _bookings
        .where((b) => b['status'] == 'accepted' && b['paymentStatus'] == 'pending')
        .fold(0.0, (sum, b) => sum + ((b['totalPrice'] ?? 0) as num).toDouble());
    final totalExpected = _bookings
        .where((b) => b['status'] == 'accepted')
        .fold(0.0, (sum, b) => sum + ((b['totalPrice'] ?? 0) as num).toDouble());
    final conversionRate = _bookings.isEmpty ? 0.0 : (_bookings.where((b) => b['status'] == 'accepted').length / _bookings.length * 100);

    // Booking status breakdown
    final pending = _bookings.where((b) => b['status'] == 'pending').length;
    final accepted = _bookings.where((b) => b['status'] == 'accepted').length;
    final rejected = _bookings.where((b) => b['status'] == 'rejected').length;
    final cancelled = _bookings.where((b) => b['status'] == 'cancelled').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('التقارير والإحصائيات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 18), onPressed: () => Navigator.pop(context)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined, color: Colors.indigo),
            onPressed: _loadData,
          ),
        ],
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange))
          : RefreshIndicator(
              onRefresh: _loadData,
              color: Colors.indigo,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // ===== KPI Cards Row =====
                  Row(
                    children: [
                      Expanded(child: _buildKpiCard('المحصل فعلياً', '${totalRevenue.toStringAsFixed(0)} ج.م', Icons.monetization_on_outlined, Colors.green, '+12%')),
                      const SizedBox(width: 12),
                      Expanded(child: _buildKpiCard('قيد التحصيل', '${pendingRevenue.toStringAsFixed(0)} ج.م', Icons.pending_outlined, Colors.orange, null)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildKpiCard('الإجمالي المتوقع', '${totalExpected.toStringAsFixed(0)} ج.م', Icons.account_balance_wallet_outlined, Colors.blue, null)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildKpiCard('معدل التحويل', '${conversionRate.toStringAsFixed(1)}%', Icons.trending_up_outlined, Colors.purple, null)),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // ===== Booking Status Pie Chart =====
                  if (_bookings.isNotEmpty) ...[
                    Row(
                      children: [
                        Expanded(
                          child: _buildChartCard(
                            title: 'توزيع حالات الحجوزات',
                            child: _buildPieChart(accepted, pending, rejected, cancelled),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildChartCard(
                            title: 'حالة التحصيل المالي',
                            child: _buildPaymentChart(),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ===== Views vs Bookings Bar Chart =====
                  if (_trips.isNotEmpty) ...[
                    _buildChartCard(
                      title: 'المشاهدات مقابل الحجوزات',
                      child: _buildBarChart(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ===== Detailed Trips Table =====
                  _buildTripsTable(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildKpiCard(String label, String value, IconData icon, Color color, String? badge) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, color: color, size: 18),
              ),
              if (badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                  child: Text(badge, style: GoogleFonts.cairo(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(label, style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey[600])),
          const SizedBox(height: 4),
          Text(value, style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 16, color: color)),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  Widget _buildChartCard({required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildPieChart(int accepted, int pending, int rejected, int cancelled) {
    final total = accepted + pending + rejected + cancelled;
    if (total == 0) return Center(child: Text('لا توجد بيانات', style: GoogleFonts.cairo(color: Colors.grey)));

    return SizedBox(
      height: 160,
      child: Row(
        children: [
          Expanded(
            child: PieChart(
              PieChartData(
                sections: [
                  if (accepted > 0) PieChartSectionData(value: accepted.toDouble(), color: Colors.green, title: '$accepted', radius: 40, titleStyle: GoogleFonts.cairo(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                  if (pending > 0) PieChartSectionData(value: pending.toDouble(), color: Colors.orange, title: '$pending', radius: 40, titleStyle: GoogleFonts.cairo(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                  if (rejected > 0) PieChartSectionData(value: rejected.toDouble(), color: Colors.red, title: '$rejected', radius: 40, titleStyle: GoogleFonts.cairo(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                  if (cancelled > 0) PieChartSectionData(value: cancelled.toDouble(), color: Colors.grey, title: '$cancelled', radius: 40, titleStyle: GoogleFonts.cairo(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                ],
                sectionsSpace: 2,
                centerSpaceRadius: 30,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildLegend('مقبول', Colors.green, accepted),
              _buildLegend('انتظار', Colors.orange, pending),
              _buildLegend('مرفوض', Colors.red, rejected),
              _buildLegend('ملغي', Colors.grey, cancelled),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentChart() {
    final paid = _bookings.where((b) => b['paymentStatus'] == 'paid').length.toDouble();
    final unpaid = _bookings.where((b) => b['paymentStatus'] != 'paid').length.toDouble();

    if (paid + unpaid == 0) return Center(child: Text('لا توجد بيانات', style: GoogleFonts.cairo(color: Colors.grey)));

    return SizedBox(
      height: 160,
      child: Row(
        children: [
          Expanded(
            child: PieChart(
              PieChartData(
                sections: [
                  if (paid > 0) PieChartSectionData(value: paid, color: const Color(0xFF4F46E5), title: '${paid.toInt()}', radius: 40, titleStyle: GoogleFonts.cairo(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                  if (unpaid > 0) PieChartSectionData(value: unpaid, color: const Color(0xFFE0E7FF), title: '${unpaid.toInt()}', radius: 40, titleStyle: GoogleFonts.cairo(fontSize: 12, color: Colors.indigo, fontWeight: FontWeight.bold)),
                ],
                sectionsSpace: 2,
                centerSpaceRadius: 30,
              ),
            ),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLegend('مدفوع', const Color(0xFF4F46E5), paid.toInt()),
              _buildLegend('غير مدفوع', Colors.grey, unpaid.toInt()),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBarChart() {
    if (_trips.isEmpty) return const SizedBox();
    final limitedTrips = _trips.take(5).toList();

    return SizedBox(
      height: 200,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: limitedTrips.fold(0.0, (max, t) => (t['views'] ?? 0) > max ? (t['views'] ?? 0).toDouble() : max) + 2,
          barGroups: limitedTrips.asMap().entries.map((entry) {
            return BarChartGroupData(
              x: entry.key,
              barRods: [
                BarChartRodData(
                  toY: (entry.value['views'] ?? 0).toDouble(),
                  color: const Color(0xFF4F46E5),
                  width: 16,
                  borderRadius: const BorderRadius.only(topLeft: Radius.circular(4), topRight: Radius.circular(4)),
                ),
              ],
            );
          }).toList(),
          borderData: FlBorderData(show: false),
          gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (_) => FlLine(color: Colors.grey.shade100, strokeWidth: 1)),
          titlesData: FlTitlesData(
            show: true,
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (v, _) {
                  final idx = v.toInt();
                  if (idx >= limitedTrips.length) return const SizedBox();
                  final title = limitedTrips[idx]['title'] ?? '';
                  return Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(title.length > 6 ? '${title.substring(0, 6)}..' : title, style: GoogleFonts.cairo(fontSize: 9, color: Colors.grey)),
                  );
                },
              ),
            ),
            leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 28, getTitlesWidget: (v, _) => Text(v.toInt().toString(), style: GoogleFonts.cairo(fontSize: 9, color: Colors.grey)))),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
        ),
      ),
    );
  }

  Widget _buildTripsTable() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text('أداء الرحلات التفصيلي', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14)),
          ),
          const Divider(height: 1),
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.grey[50],
            child: Row(
              children: [
                Expanded(flex: 3, child: Text('الرحلة', style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey[600]))),
                Expanded(child: Text('الإيرادات', style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey[600]))),
                Expanded(child: Text('الحجوزات', textAlign: TextAlign.center, style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey[600]))),
                Expanded(child: Text('المشاهدات', textAlign: TextAlign.center, style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey[600]))),
              ],
            ),
          ),
          const Divider(height: 1),
          // Rows
          ..._trips.map((trip) {
            final tripBookings = _bookings.where((b) => b['tripId'] == (trip['_id'] ?? trip['id'])).toList();
            final revenue = tripBookings.where((b) => b['paymentStatus'] == 'paid').fold(0.0, (s, b) => s + ((b['totalPrice'] ?? 0) as num).toDouble());
            final views = trip['views'] ?? 0;
            final bookingsCount = tripBookings.length;
            final convRate = views == 0 ? 0.0 : (bookingsCount / views * 100);

            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      Expanded(flex: 3, child: Text(trip['title'] ?? '', style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      Expanded(child: Text('${revenue.toStringAsFixed(0)} ج.م', style: GoogleFonts.cairo(fontSize: 11, color: Colors.green[700], fontWeight: FontWeight.bold))),
                      Expanded(child: Text('$bookingsCount', textAlign: TextAlign.center, style: GoogleFonts.cairo(fontSize: 11))),
                      Expanded(child: Text('$views', textAlign: TextAlign.center, style: GoogleFonts.cairo(fontSize: 11))),
                    ],
                  ),
                ),
                const Divider(height: 1),
              ],
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildLegend(String label, Color color, int count) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 5),
          Text('$label ($count)', style: GoogleFonts.cairo(fontSize: 10, color: Colors.grey[700])),
        ],
      ),
    );
  }
}
