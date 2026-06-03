import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../theme/app_colors.dart';
import '../../providers/api_provider.dart';
import '../../models/trip.dart';
import '../../providers/api_provider.dart';
import 'package:dio/dio.dart';
import '../../core/exceptions.dart';

class CreateMemoryDialog extends ConsumerStatefulWidget {
  const CreateMemoryDialog({super.key});

  @override
  ConsumerState<CreateMemoryDialog> createState() => _CreateMemoryDialogState();
}

class _CreateMemoryDialogState extends ConsumerState<CreateMemoryDialog> {
  bool _isLoading = false;
  final List<Trip> _selectedTrips = [];
  String _selectedMonth = '';
  late Future<List<Trip>> _myTripsFuture;

  @override
  void initState() {
    super.initState();
    _selectedMonth = _getMonthLabel();
    _myTripsFuture = ref.read(userServiceProvider).getUserTrips('me');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(30),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Blue Header (as per screenshot)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white70),
                        onPressed: () => Navigator.pop(context),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${_selectedTrips.length}/3 ذكريات',
                          style: GoogleFonts.cairo(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'إنشاء ذكرى جديدة ✨',
                    style: GoogleFonts.cairo(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'حول رحلات الشهر إلى فيديو تذكاري رائع',
                    style: GoogleFonts.cairo(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'اختر الشهر الذي تود استخدامه',
                    style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 12),
                  _buildMonthDropdown(isDark),
                  const SizedBox(height: 24),
                  Text(
                    'اختر 3 رحلات من رحلاتك',
                    style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 200,
                    child: FutureBuilder<List<Trip>>(
                      future: _myTripsFuture,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }
                        if (snapshot.hasError) {
                          return Center(child: Text('خطأ في تحميل الرحلات', style: GoogleFonts.cairo()));
                        }
                        final myTrips = (snapshot.data ?? []).where((t) => !t.isAIGenerated).toList();
                        if (myTrips.isEmpty) return Center(child: Text('لا توجد رحلات عامة لديك', style: GoogleFonts.cairo()));
                        return ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: myTrips.length,
                          itemBuilder: (context, index) {
                            final trip = myTrips[index];
                            final isSelected = _selectedTrips.any((t) => t.id == trip.id);
                            return GestureDetector(
                              onTap: () => _toggleTrip(trip),
                              child: Container(
                                width: 130,
                                margin: const EdgeInsets.only(right: 12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(15),
                                  border: Border.all(
                                    color: isSelected ? AppColors.primaryOrange : Colors.transparent,
                                    width: 3,
                                  ),
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    CachedNetworkImage(
                                      imageUrl: trip.image ?? 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
                                      fit: BoxFit.cover,
                                    ),
                                    if (isSelected)
                                      Container(
                                        color: Colors.black26,
                                        child: const Icon(Icons.check_circle, color: AppColors.primaryOrange, size: 40),
                                      ),
                                    Positioned(
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      child: Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: const BoxDecoration(
                                          gradient: LinearGradient(
                                            begin: Alignment.bottomCenter,
                                            end: Alignment.topCenter,
                                            colors: [Colors.black87, Colors.transparent],
                                          ),
                                        ),
                                        child: Text(
                                          trip.title,
                                          style: GoogleFonts.cairo(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            // Footer Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: (_isLoading || _selectedTrips.length != 3) ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B5CF6).withOpacity(0.6),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                        elevation: 0,
                      ),
                      icon: const Icon(Icons.auto_awesome, size: 18),
                      label: Text('إتمام وإنشاء', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: Colors.orange, width: 2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      child: Text('إلغاء', style: GoogleFonts.cairo(color: Colors.black87, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMonthDropdown(bool isDark) {
    final months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    final year = DateTime.now().year;
    final options = months.map((m) => '$m $year').toList();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedMonth,
          isExpanded: true,
          items: options.map((opt) => DropdownMenuItem(
            value: opt,
            child: Text(opt, style: GoogleFonts.cairo()),
          )).toList(),
          onChanged: (val) {
            if (val != null) setState(() => _selectedMonth = val);
          },
        ),
      ),
    );
  }

  void _toggleTrip(Trip trip) {
    setState(() {
      if (_selectedTrips.any((t) => t.id == trip.id)) {
        _selectedTrips.removeWhere((t) => t.id == trip.id);
      } else {
        if (_selectedTrips.length < 3) {
          _selectedTrips.add(trip);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('يمكنك اختيار 3 رحلات فقط')));
        }
      }
    });
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    try {
      final items = _selectedTrips.map((t) => {
        'url': t.image ?? 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b',
        'tripTitle': t.title,
        'destination': t.destination ?? t.city ?? 'وجهة غير معروفة',
        'date': t.postedAt.toIso8601String(),
      }).toList();

      await ref.read(memoryServiceProvider).saveMemory(
        monthLabel: _selectedMonth,
        items: items,
        trackIndex: DateTime.now().month % 5,
      );

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم إنشاء الذكرى بنجاح ✨')));
      }
    } catch (e) {
      if (mounted) {
        String msg;
        if (e is DioException) {
          msg = handleDioError(e).message;
        } else {
          msg = e.toString().replaceAll('Exception: ', '');
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل إنشاء الذكرى: $msg', style: GoogleFonts.cairo()),
            backgroundColor: Colors.redAccent,
          )
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getMonthLabel() {
    final now = DateTime.now();
    final months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return '${months[now.month - 1]} ${now.year}';
  }
}
