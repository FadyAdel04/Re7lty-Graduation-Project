import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

class SeatAllocationPage extends ConsumerStatefulWidget {
  const SeatAllocationPage({super.key});

  @override
  ConsumerState<SeatAllocationPage> createState() => _SeatAllocationPageState();
}

class _SeatAllocationPageState extends ConsumerState<SeatAllocationPage> {
  bool _isLoadingTrips = true;
  bool _isLoadingBookings = false;
  bool _isSaving = false;
  List<dynamic> _trips = [];
  Map<String, dynamic>? _selectedTrip;
  
  // The actual saved/edited seat assignments: seatNumber -> passengerName
  Map<String, String> _seatAssignments = {}; 
  
  // For multi-select of empty seats
  Set<String> _selectedEmptySeats = {};

  String _searchQuery = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadTrips();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadTrips() async {
    setState(() => _isLoadingTrips = true);
    try {
      final api = ref.read(apiServiceProvider);
      final companyRes = await api.get('/corporate/companies/me');
      final companyId = companyRes.data['_id'] ?? companyRes.data['id'];
      if (companyId != null) {
        final tripsRes = await api.get('/corporate/trips?companyId=$companyId');
        final data = tripsRes.data;
        setState(() {
          _trips = data is Map ? (data['trips'] ?? []) : (data is List ? data : []);
        });
      }
    } catch (e) {
      debugPrint('Error loading trips: $e');
    } finally {
      if (mounted) setState(() => _isLoadingTrips = false);
    }
  }

  Future<void> _selectTrip(Map<String, dynamic> trip) async {
    setState(() {
      _selectedTrip = trip;
      _isLoadingBookings = true;
      _seatAssignments = {};
      _selectedEmptySeats.clear();
    });

    try {
      final api = ref.read(apiServiceProvider);
      final tripId = trip['_id'] ?? trip['id'];

      // Load existing seat assignments from trip
      final tripRes = await api.get('/corporate/trips/$tripId');
      final freshTrip = tripRes.data is Map ? tripRes.data : trip;

      final seatBookings = freshTrip['seatBookings'] as List? ?? [];
      final assignments = <String, String>{};
      for (final sb in seatBookings) {
        assignments[sb['seatNumber'].toString()] = sb['passengerName'].toString();
      }

      setState(() {
        _selectedTrip = freshTrip;
        _seatAssignments = assignments;
      });
    } catch (e) {
      debugPrint('Error loading trip details: $e');
    } finally {
      if (mounted) setState(() => _isLoadingBookings = false);
    }
  }

  Future<void> _saveSeats() async {
    if (_selectedTrip == null) return;
    setState(() => _isSaving = true);
    try {
      final api = ref.read(apiServiceProvider);
      final tripId = _selectedTrip!['_id'] ?? _selectedTrip!['id'];
      final seatBookings = _seatAssignments.entries
          .map((e) => {'seatNumber': e.key, 'passengerName': e.value})
          .toList();

      await api.patch('/corporate/trips/$tripId', data: {'seatBookings': seatBookings});

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('تم حفظ توزيع المقاعد بنجاح ✓', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('فشل حفظ المقاعد', style: GoogleFonts.cairo()),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _handleSeatTap(String seatNum) {
    if (_seatAssignments.containsKey(seatNum)) {
      // Seat is booked -> show edit/delete dialog
      _showEditDialog(seatNum, _seatAssignments[seatNum]!);
    } else {
      // Seat is empty -> toggle selection
      setState(() {
        if (_selectedEmptySeats.contains(seatNum)) {
          _selectedEmptySeats.remove(seatNum);
        } else {
          _selectedEmptySeats.add(seatNum);
        }
      });
    }
  }

  void _showAssignDialog() {
    if (_selectedEmptySeats.isEmpty) return;
    final nameCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.airline_seat_recline_normal, color: Colors.orange, size: 40),
                const SizedBox(height: 12),
                Text('تخصيص الحجز', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 20)),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _selectedEmptySeats.map((s) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text('مقعد $s', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.black87)),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),
                Align(
                  alignment: Alignment.centerRight,
                  child: Text('اسم المسافر', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: nameCtrl,
                  decoration: InputDecoration(
                    hintText: 'الاسم بالكامل...',
                    hintStyle: GoogleFonts.cairo(color: Colors.grey),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.orange)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.orange)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.orange, width: 2)),
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      final name = nameCtrl.text.trim();
                      if (name.isNotEmpty) {
                        setState(() {
                          for (final s in _selectedEmptySeats) {
                            _seatAssignments[s] = name;
                          }
                          _selectedEmptySeats.clear();
                        });
                        Navigator.pop(context);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('حفظ الحجز', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('إلغاء التحديد', style: GoogleFonts.cairo(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          ),
        );
      },
    );
  }

  void _showEditDialog(String seatNum, String currentName) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.airline_seat_recline_normal, color: Colors.orange, size: 40),
                const SizedBox(height: 12),
                Text('تعديل الحجز', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 20)),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(20)),
                  child: Text('مقعد $seatNum', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.black87)),
                ),
                const SizedBox(height: 24),
                Align(
                  alignment: Alignment.centerRight,
                  child: Text('اسم المسافر', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Text(currentName, style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _seatAssignments.remove(seatNum);
                        _selectedEmptySeats.remove(seatNum); // just in case
                      });
                      Navigator.pop(context);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.redAccent,
                      side: const BorderSide(color: Colors.redAccent),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('حذف الحجز / إلغاء التحديد', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('إغلاق', style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final maxSeats = _selectedTrip != null ? (_selectedTrip!['maxGroupSize'] ?? _selectedTrip!['availableSeats'] ?? 28) : 28;
    final assignedCount = _seatAssignments.length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('توزيع مقاعد الركاب', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 18), onPressed: () => Navigator.pop(context)),
        actions: [
          if (_selectedTrip != null)
            TextButton(
              onPressed: _isSaving ? null : _saveSeats,
              child: _isSaving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.indigo))
                  : Text('حفظ التعديلات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.indigo, fontSize: 16)),
            ),
        ],
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1)),
      ),
      body: _isLoadingTrips
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange))
          : _selectedTrip == null
              ? _buildTripList()
              : _isLoadingBookings
                  ? const Center(child: CircularProgressIndicator(color: Colors.indigo))
                  : _buildSeatLayout(maxSeats, assignedCount),
      // Floating button for assigning selected empty seats
      floatingActionButton: _selectedEmptySeats.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: _showAssignDialog,
              backgroundColor: Colors.orange,
              icon: const Icon(Icons.check, color: Colors.white),
              label: Text('تخصيص الحجز (${_selectedEmptySeats.length})', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.white)),
            )
          : null,
      bottomNavigationBar: _selectedTrip == null ? null : SafeArea(
        child: Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => setState(() { _selectedTrip = null; _seatAssignments = {}; _selectedEmptySeats.clear(); }),
                  icon: const Icon(Icons.arrow_back, size: 18),
                  label: Text('تغيير الرحلة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.indigo,
                    side: const BorderSide(color: Colors.indigo),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _saveSeats,
                  icon: _isSaving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.save_outlined, size: 18),
                  label: Text('حفظ للرحلة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTripList() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('اختر رحلة لتنظيم مقاعدها', style: GoogleFonts.cairo(color: Colors.grey, fontSize: 13)),
              const SizedBox(height: 12),
              TextFormField(
                controller: _searchCtrl,
                onChanged: (v) => setState(() => _searchQuery = v),
                style: GoogleFonts.cairo(fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'ابحث عن رحلة...',
                  hintStyle: GoogleFonts.cairo(color: Colors.grey[400], fontSize: 13),
                  prefixIcon: const Icon(Icons.search, size: 20),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _trips.length,
            itemBuilder: (_, i) {
              final trip = _trips[i];
              // Apply local search filter
              if (_searchQuery.isNotEmpty) {
                final tName = (trip['title'] ?? '').toString().toLowerCase();
                if (!tName.contains(_searchQuery.toLowerCase())) return const SizedBox();
              }
              final startDate = DateTime.tryParse(trip['startDate'] ?? '');
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
                ),
                child: InkWell(
                  onTap: () => _selectTrip(trip),
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(trip['title'] ?? '', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(Icons.event_outlined, size: 14, color: Colors.grey[400]),
                            const SizedBox(width: 4),
                            Text(startDate != null ? DateFormat('d/M/yyyy').format(startDate) : '', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
                            const SizedBox(width: 12),
                            Icon(Icons.airline_seat_recline_normal_outlined, size: 14, color: Colors.grey[400]),
                            const SizedBox(width: 4),
                            Text('${trip['maxGroupSize'] ?? trip['availableSeats'] ?? 0} مقعد', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ).animate().fadeIn(delay: (i * 50).ms);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSeatLayout(int maxSeats, int assignedCount) {
    final seatsPerRow = 4;
    final rows = (maxSeats / seatsPerRow).ceil();

    return Column(
      children: [
        // Trip header
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.white,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(_selectedTrip!['title'] ?? '', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: Colors.indigo.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                    child: Text('ميني باص', style: GoogleFonts.cairo(fontSize: 12, color: Colors.indigo, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Stats
              Row(
                children: [
                  _buildStatChip('متاح', maxSeats - assignedCount, Colors.green),
                  const SizedBox(width: 8),
                  _buildStatChip('محجوز', assignedCount, Colors.orange),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.orange.withOpacity(0.05), borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.orange.withOpacity(0.2))),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.orange, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'اضغط على المقاعد الفارغة لتحديدها وتخصيصها لراكب، أو اضغط على مقعد محجوز لتعديله.',
                        style: GoogleFonts.cairo(fontSize: 12, color: Colors.black87),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        // Seat grid
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)],
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  children: List.generate(rows, (rowIndex) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(seatsPerRow, (colIndex) {
                          // Seat layout based on Image 3 (RTL):
                          // 4  3   [space]   2  1
                          // 8  7   [space]   6  5
                          
                          // Determine actual seat number based on colIndex (0 to 3)
                          // colIndex 0 = seat 4 (Left-most)
                          // colIndex 1 = seat 3
                          // colIndex 2 = seat 2
                          // colIndex 3 = seat 1 (Right-most)
                          final seatInRow = 4 - colIndex; // 4, 3, 2, 1
                          final realSeatNum = rowIndex * seatsPerRow + seatInRow;

                          // Insert an aisle in the middle (between seat 3 and 2, which corresponds to colIndex 1 and 2)
                          final isAisle = colIndex == 2;
                          
                          Widget seatWidget = const SizedBox();
                          if (realSeatNum <= maxSeats) {
                            final strSeatNum = realSeatNum.toString();
                            final isBooked = _seatAssignments.containsKey(strSeatNum);
                            final isSelected = _selectedEmptySeats.contains(strSeatNum);
                            final passengerName = _seatAssignments[strSeatNum];
                            
                            seatWidget = GestureDetector(
                              onTap: () => _handleSeatTap(strSeatNum),
                              child: Container(
                                width: 60,
                                height: 60,
                                margin: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: isBooked ? Colors.orange : (isSelected ? Colors.indigo.withOpacity(0.1) : Colors.white),
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: isBooked ? [BoxShadow(color: Colors.orange.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))] : [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4)],
                                  border: Border.all(
                                    color: isBooked ? Colors.orange : (isSelected ? Colors.indigo : Colors.grey.shade200),
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (isBooked && passengerName != null && passengerName.isNotEmpty) ...[
                                      Text(passengerName.split(' ').first, style: GoogleFonts.cairo(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                                      const SizedBox(height: 2),
                                    ],
                                    Text(
                                      strSeatNum,
                                      style: GoogleFonts.cairo(
                                        fontWeight: FontWeight.w900,
                                        fontSize: 15,
                                        color: isBooked ? Colors.white : (isSelected ? Colors.indigo : Colors.black87),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }

                          if (isAisle) {
                            return Row(
                              children: [
                                const SizedBox(width: 30), // The Aisle
                                seatWidget,
                              ],
                            );
                          }
                          return seatWidget;
                        }),
                      ),
                    );
                  }),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatChip(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text('$label: $count', style: GoogleFonts.cairo(fontSize: 12, color: color, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
