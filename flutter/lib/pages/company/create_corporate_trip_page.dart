import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

import '../../theme/app_colors.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../providers/corporate_trip_draft_provider.dart';
import '../../providers/api_provider.dart';
import '../../services/api_service.dart';
import '../../services/corporate_trip_service.dart';

class CreateCorporateTripPage extends ConsumerStatefulWidget {
  final Map<String, dynamic>? existingTrip; // null = create, non-null = edit
  const CreateCorporateTripPage({super.key, this.existingTrip});

  @override
  ConsumerState<CreateCorporateTripPage> createState() => _CreateCorporateTripPageState();
}

class _CreateCorporateTripPageState extends ConsumerState<CreateCorporateTripPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isPublishing = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    if (widget.existingTrip != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadExistingTripForEdit());
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadExistingTripForEdit() async {
    final trip = widget.existingTrip!;
    final notifier = ref.read(corporateTripDraftProvider.notifier);
    final slug = trip['slug']?.toString();
    final id = trip['_id']?.toString() ?? trip['id']?.toString();
    final key = slug ?? id;

    if (key != null && key.isNotEmpty) {
      try {
        final api = ref.read(apiServiceProvider);
        final response = await api.get('/corporate/trips/$key');
        if (response.statusCode == 200 && response.data != null) {
          final data = response.data;
          final Map<String, dynamic> full = data is Map<String, dynamic>
              ? data
              : Map<String, dynamic>.from(data as Map);
          notifier.loadFromMap(full);
          return;
        }
      } catch (_) {
        // fallback to list payload (may omit heavy fields)
      }
    }
    notifier.loadFromMap(trip);
  }

  Future<void> _publishTrip() async {
    final draft = ref.read(corporateTripDraftProvider);
    if (draft.title.trim().isEmpty || draft.destination.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('يرجى تعبئة الحقول الأساسية (العنوان والوجهة)', style: GoogleFonts.cairo()), backgroundColor: Colors.red),
      );
      _tabController.animateTo(0);
      return;
    }
    if (draft.price.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('يرجى إدخال سعر الرحلة', style: GoogleFonts.cairo()), backgroundColor: Colors.red),
      );
      _tabController.animateTo(0);
      return;
    }
    if (draft.description.trim().length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('يرجى إضافة وصف للرحلة (10 أحرف على الأقل)', style: GoogleFonts.cairo()), backgroundColor: Colors.red),
      );
      _tabController.animateTo(1);
      return;
    }

    setState(() => _isPublishing = true);
    final isEditMode = widget.existingTrip != null;
    final tripId = widget.existingTrip?['_id']?.toString() ?? widget.existingTrip?['id']?.toString();
    final slug = widget.existingTrip?['slug']?.toString();

    try {
      final service = ref.read(corporateTripServiceProvider);
      if (isEditMode && tripId != null) {
        await service.updateTrip(tripId, draft, slug: slug ?? tripId);
      } else {
        await service.createTrip(draft);
      }

      if (mounted) {
        setState(() => _isPublishing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isEditMode ? 'تم تعديل الرحلة بنجاح!' : 'تم إضافة الرحلة بنجاح!',
              style: GoogleFonts.cairo(),
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 5),
          ),
        );
        ref.read(corporateTripDraftProvider.notifier).reset();
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isPublishing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'خطأ أثناء حفظ الرحلة: ${CorporateTripService.extractErrorMessage(e)}',
              style: GoogleFonts.cairo(),
            ),
            backgroundColor: Colors.redAccent,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          children: [
            Text(widget.existingTrip != null ? 'تعديل الرحلة' : 'إضافة رحلة جديدة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
            Text(widget.existingTrip != null ? 'عدّل بيانات رحلتك' : 'إضافة رحلة جديدة لقائمة رحلات شركتك', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
          ],
        ),
        centerTitle: true,
        backgroundColor: isDark ? AppColors.cardDark : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? Colors.black12 : Colors.grey[100],
              borderRadius: BorderRadius.circular(15),
            ),
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              indicator: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.primaryOrange, width: 1.5),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))
                ]
              ),
              labelColor: AppColors.primaryOrange,
              unselectedLabelColor: Colors.grey,
              labelStyle: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: GoogleFonts.cairo(fontWeight: FontWeight.w600, fontSize: 12),
              padding: const EdgeInsets.all(4),
              tabs: const [
                Tab(child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.info_outline, size: 16), SizedBox(width: 4), Text('أساسي')])),
                Tab(child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.list_alt, size: 16), SizedBox(width: 4), Text('تفاصيل')])),
                Tab(child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.hotel_outlined, size: 16), SizedBox(width: 4), Text('الإقامة')])),
                Tab(child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.layers_outlined, size: 16), SizedBox(width: 4), Text('برنامج')])),
                Tab(child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.camera_alt_outlined, size: 16), SizedBox(width: 4), Text('صور')])),
                Tab(child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.settings_outlined, size: 16), SizedBox(width: 4), Text('إعدادات')])),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _Step1Basic(),
          _Step2Details(),
          _Step3Accommodation(),
          _Step4Program(),
          _Step5Images(),
          _Step6Settings(),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
        ),
        child: Row(
          children: [
            TextButton(
              onPressed: () => context.pop(),
              child: Text('إلغاء', style: GoogleFonts.cairo(color: Colors.grey, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: _isPublishing ? null : _publishTrip,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigoAccent,
                padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: _isPublishing
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(widget.existingTrip != null ? 'حفظ التعديلات' : 'نشر الرحلة', style: GoogleFonts.cairo(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}

// =========================================================================
// STEP 1: BASIC INFO (أساسي)
// =========================================================================
class _Step1Basic extends ConsumerWidget {
  const _Step1Basic();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(corporateTripDraftProvider);
    final notifier = ref.read(corporateTripDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildTextField(
          label: '* عنوان الرحلة',
          hint: 'مثال: رحلة استكشاف جبال العلا',
          initialValue: draft.title,
          onChanged: (v) => notifier.updateBasicInfo(title: v),
        ),
        const SizedBox(height: 16),
        _buildDropdown(
          label: 'الموسم المفضل',
          value: draft.season,
          items: const ['winter', 'summer', 'spring', 'fall'],
          labels: const ['الشتاء', 'الصيف', 'الربيع', 'الخريف'],
          onChanged: (v) => notifier.updateBasicInfo(season: v),
        ),
        const SizedBox(height: 16),
        _buildTextField(
          label: '* الوجهة (في مصر)',
          hint: 'اختر الوجهة (مثال: شرم الشيخ، الأقصر...)',
          initialValue: draft.destination,
          onChanged: (v) => notifier.updateBasicInfo(destination: v),
          icon: Icons.location_on_outlined,
        ),
        const SizedBox(height: 16),
        _buildDropdown(
          label: 'الصعوبة',
          value: draft.difficulty,
          items: const ['easy', 'medium', 'hard'],
          labels: const ['سهل', 'متوسط', 'صعب'],
          onChanged: (v) => notifier.updateBasicInfo(difficulty: v),
        ),
        const SizedBox(height: 16),
        _buildTextField(
          label: '* نقطة التجمع (MEETING LOCATION)',
          hint: 'مثال: ميدان التحرير، أمام فندق ريتز كارلتون',
          initialValue: draft.meetingLocation,
          onChanged: (v) => notifier.updateBasicInfo(meetingLocation: v),
          icon: Icons.location_on_outlined,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          label: '* السعر (ج.م)',
          hint: 'مثال: 2500',
          initialValue: draft.price,
          keyboardType: TextInputType.number,
          onChanged: (v) => notifier.updateBasicInfo(price: v),
          icon: Icons.payments_outlined,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                label: 'عدد الركاب',
                hint: 'مثال: 10',
                initialValue: draft.maxPassengers.toString(),
                keyboardType: TextInputType.number,
                onChanged: (v) => notifier.updateBasicInfo(maxPassengers: int.tryParse(v) ?? 10),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildTextField(
                label: 'التقييم',
                hint: '4.5',
                initialValue: draft.defaultRating.toString(),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                onChanged: (v) => notifier.updateBasicInfo(defaultRating: double.tryParse(v) ?? 4.5),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('تاريخ البداية', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () async {
                      final d = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime.now(), lastDate: DateTime(2030));
                      if (d != null) notifier.updateBasicInfo(startDate: d);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(10)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(draft.startDate != null ? "${draft.startDate!.year}/${draft.startDate!.month}/${draft.startDate!.day}" : 'البداية', style: GoogleFonts.cairo()),
                          const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                        ],
                      ),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('تاريخ النهاية', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () async {
                      final d = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime.now(), lastDate: DateTime(2030));
                      if (d != null) notifier.updateBasicInfo(endDate: d);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(10)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(draft.endDate != null ? "${draft.endDate!.year}/${draft.endDate!.month}/${draft.endDate!.day}" : 'النهاية', style: GoogleFonts.cairo()),
                          const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                        ],
                      ),
                    ),
                  )
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('وسائل النقل المخصصة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.indigo)),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(10)),
              child: Text('أتوبيس، سيارة...', style: GoogleFonts.cairo(color: Colors.grey)),
            )
          ],
        ),
      ],
    );
  }

  Widget _buildTextField({required String label, required String hint, required String initialValue, required Function(String) onChanged, IconData? icon, TextInputType keyboardType = TextInputType.text}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey[700])),
        const SizedBox(height: 8),
        TextFormField(
          initialValue: initialValue,
          onChanged: onChanged,
          keyboardType: keyboardType,
          style: GoogleFonts.cairo(),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.cairo(color: Colors.grey[400], fontSize: 13),
            suffixIcon: icon != null ? Icon(icon, color: Colors.grey) : null,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Colors.indigoAccent)),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({required String label, required String value, required List<String> items, required List<String> labels, required Function(String) onChanged}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey[700])),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: value,
          icon: const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
          ),
          items: List.generate(items.length, (index) {
            return DropdownMenuItem(
              value: items[index],
              child: Text(labels[index], style: GoogleFonts.cairo()),
            );
          }),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ],
    );
  }
}

// =========================================================================
// STEP 2: DETAILS (تفاصيل)
// =========================================================================
class _Step2Details extends ConsumerWidget {
  const _Step2Details();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(corporateTripDraftProvider);
    final notifier = ref.read(corporateTripDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('* التجربة الكاملة للرحلة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey[700])),
        const SizedBox(height: 8),
        TextFormField(
          initialValue: draft.description,
          onChanged: (v) => notifier.updateDetails(description: v, included: draft.included, notIncluded: draft.notIncluded),
          maxLines: 6,
          decoration: InputDecoration(
            hintText: '...اكتب تفاصيل الرحلة، ما الذي سيختبره المسافر، ولماذا هذه الرحلة مميزة',
            hintStyle: GoogleFonts.cairo(color: Colors.grey),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
          ),
        ),
        const SizedBox(height: 30),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(width: 4, height: 20, color: Colors.indigoAccent),
                    const SizedBox(width: 8),
                    Text('المزايا والمرافق', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.indigo)),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () {
                        notifier.updateDetails(description: draft.description, included: [...draft.included, ''], notIncluded: draft.notIncluded);
                      },
                      icon: const Icon(Icons.add, size: 16, color: Colors.green),
                      label: Text('إضافة', style: GoogleFonts.cairo(color: Colors.green, fontWeight: FontWeight.bold)),
                      style: TextButton.styleFrom(backgroundColor: Colors.green.withOpacity(0.1)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (draft.included.isEmpty)
                  TextFormField(
                    decoration: InputDecoration(
                      hintText: '...إفطار، تنقلات',
                      hintStyle: GoogleFonts.cairo(color: Colors.grey),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
                    ),
                    onChanged: (v) {
                      notifier.updateDetails(description: draft.description, included: [v], notIncluded: draft.notIncluded);
                    },
                  ),
                ...draft.included.asMap().entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            initialValue: entry.value,
                            onChanged: (v) {
                              final newList = [...draft.included];
                              newList[entry.key] = v;
                              notifier.updateDetails(description: draft.description, included: newList, notIncluded: draft.notIncluded);
                            },
                            decoration: InputDecoration(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red),
                          onPressed: () {
                            final newList = [...draft.included];
                            newList.removeAt(entry.key);
                            notifier.updateDetails(description: draft.description, included: newList, notIncluded: draft.notIncluded);
                          },
                        )
                      ],
                    ),
                  );
                }).toList()
              ],
            ),
            const SizedBox(height: 30),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(width: 4, height: 20, color: Colors.redAccent),
                    const SizedBox(width: 8),
                    Text('غير مشمول', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.redAccent)),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () {
                        notifier.updateDetails(description: draft.description, included: draft.included, notIncluded: [...draft.notIncluded, '']);
                      },
                      icon: const Icon(Icons.add, size: 16, color: Colors.grey),
                      label: Text('إضافة', style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold)),
                      style: TextButton.styleFrom(backgroundColor: Colors.grey.withOpacity(0.1)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (draft.notIncluded.isEmpty)
                  TextFormField(
                    decoration: InputDecoration(
                      hintText: '...تأمين سفر، مشتريات',
                      hintStyle: GoogleFonts.cairo(color: Colors.grey),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
                    ),
                    onChanged: (v) {
                      notifier.updateDetails(description: draft.description, included: draft.included, notIncluded: [v]);
                    },
                  ),
                ...draft.notIncluded.asMap().entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            initialValue: entry.value,
                            onChanged: (v) {
                              final newList = [...draft.notIncluded];
                              newList[entry.key] = v;
                              notifier.updateDetails(description: draft.description, included: draft.included, notIncluded: newList);
                            },
                            decoration: InputDecoration(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red),
                          onPressed: () {
                            final newList = [...draft.notIncluded];
                            newList.removeAt(entry.key);
                            notifier.updateDetails(description: draft.description, included: draft.included, notIncluded: newList);
                          },
                        )
                      ],
                    ),
                  );
                }).toList()
              ],
            ),
          ],
        )
      ],
    );
  }
}

// =========================================================================
// STEP 3: ACCOMMODATION (الإقامة)
// =========================================================================
class _Step3Accommodation extends ConsumerWidget {
  const _Step3Accommodation();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(corporateTripDraftProvider);
    final notifier = ref.read(corporateTripDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(width: 4, height: 20, color: Colors.indigoAccent),
                const SizedBox(width: 8),
                Expanded(
                  child: Text('تفاصيل الإقامة والفنادق', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.indigo)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: () {}, // AI Suggestion placeholder
              icon: const Icon(Icons.auto_awesome, color: Colors.indigoAccent, size: 16),
              label: Text('اقتراح فنادق ذكاء اصطناعي', style: GoogleFonts.cairo(color: Colors.indigoAccent, fontWeight: FontWeight.bold)),
              style: TextButton.styleFrom(backgroundColor: Colors.indigoAccent.withOpacity(0.1)),
            ),
          ],
        ),
        const SizedBox(height: 20),
        ...draft.hotels.asMap().entries.map((entry) {
          final idx = entry.key;
          final hotel = entry.value;
          return Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: Colors.blueAccent, borderRadius: BorderRadius.circular(8)),
                          child: const Icon(Icons.hotel, color: Colors.white, size: 16),
                        ),
                        const SizedBox(width: 8),
                        Text('مكان الإقامة ${idx + 1}', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15)),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.red),
                      onPressed: () {
                        final newList = [...draft.hotels];
                        newList.removeAt(idx);
                        notifier.updateHotels(newList);
                      },
                    )
                  ],
                ),
                const SizedBox(height: 16),
                Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image selector
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('صور الفندق', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
                    Text('صورة 0', style: GoogleFonts.cairo(fontSize: 12, color: Colors.blue)),
                  ],
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () async {
                    final p = ImagePicker();
                    final file = await p.pickImage(source: ImageSource.gallery);
                    if (file != null) {
                      final newList = [...draft.hotels];
                      newList[idx] = CorporateDraftHotel(
                        name: hotel.name,
                        details: hotel.details,
                        image: File(file.path),
                        imageUrl: hotel.imageUrl,
                      );
                      notifier.updateHotels(newList);
                    }
                  },
                  child: Container(
                    height: 150,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                      borderRadius: BorderRadius.circular(15),
                      image: hotel.image != null
                          ? DecorationImage(image: FileImage(hotel.image!), fit: BoxFit.cover)
                          : (hotel.imageUrl != null && hotel.imageUrl!.isNotEmpty)
                              ? null
                              : null,
                    ),
                    child: hotel.image == null && hotel.imageUrl != null && hotel.imageUrl!.isNotEmpty
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(15),
                            child: CachedNetworkImage(imageUrl: hotel.imageUrl!, fit: BoxFit.cover, width: double.infinity, height: 150),
                          )
                        : hotel.image == null
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.camera_alt_outlined, color: Colors.grey[400]),
                                const SizedBox(height: 8),
                                Text('إضافة صور', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey[600])),
                              ],
                            ),
                          )
                        : null,
                  ),
                )
              ],
            ),
            const SizedBox(height: 16),
            // Details
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('* اسم الفندق', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 8),
                TextFormField(
                  initialValue: hotel.name,
                  onChanged: (v) {
                    final newList = [...draft.hotels];
                    newList[idx] = CorporateDraftHotel(name: v, details: hotel.details, image: hotel.image);
                    notifier.updateHotels(newList);
                  },
                  decoration: InputDecoration(
                    hintText: '...مثال: فندق هيلتون, ريكسوس',
                    hintStyle: GoogleFonts.cairo(color: Colors.grey, fontSize: 13),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
                const SizedBox(height: 16),
                Text('التفاصيل / المميزات', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 8),
                TextFormField(
                  initialValue: hotel.details,
                  onChanged: (v) {
                    final newList = [...draft.hotels];
                    newList[idx] = CorporateDraftHotel(name: hotel.name, details: v, image: hotel.image);
                    notifier.updateHotels(newList);
                  },
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: '...أهم المميزات، نوع الغرفة، الوجبات، المرافق المتاحة',
                    hintStyle: GoogleFonts.cairo(color: Colors.grey, fontSize: 13),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
                  ),
                ),
              ],
            ),
          ],
        )
              ],
            ),
          );
        }),
        InkWell(
          onTap: () {
            notifier.updateHotels([...draft.hotels, CorporateDraftHotel(name: '', details: '')]);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.05),
              border: Border.all(color: Colors.blue.withOpacity(0.2)),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.add, color: Colors.blue),
                const SizedBox(width: 8),
                Text('إضافة مكان إقامة يدوي', style: GoogleFonts.cairo(color: Colors.blue, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// =========================================================================
// STEP 4: PROGRAM (برنامج)
// =========================================================================
class _Step4Program extends ConsumerWidget {
  const _Step4Program();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(corporateTripDraftProvider);
    final notifier = ref.read(corporateTripDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        ...draft.days.asMap().entries.map((entry) {
          final idx = entry.key;
          final day = entry.value;
          return Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: Colors.indigoAccent, borderRadius: BorderRadius.circular(8)),
                          child: Text('${idx + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 12),
                        Text('أجندة اليوم', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.grey),
                      onPressed: () {
                        final newList = [...draft.days];
                        newList.removeAt(idx);
                        notifier.updateDays(newList);
                      },
                    )
                  ],
                ),
                const SizedBox(height: 16),
                TextFormField(
                  initialValue: day.title,
                  onChanged: (v) {
                    final newList = [...draft.days];
                    newList[idx] = CorporateDraftDay(title: v, details: day.details);
                    notifier.updateDays(newList);
                  },
                  decoration: InputDecoration(
                    hintText: 'عنوان اليوم الرئيسي (مثال: يوم الاستكشاف الجبلي)',
                    hintStyle: GoogleFonts.cairo(color: Colors.grey, fontSize: 13),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  initialValue: day.details,
                  onChanged: (v) {
                    final newList = [...draft.days];
                    newList[idx] = CorporateDraftDay(title: day.title, details: v);
                    notifier.updateDays(newList);
                  },
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: '...صف الأنشطة وجدول المواعيد لهذا اليوم بالتفصيل',
                    hintStyle: GoogleFonts.cairo(color: Colors.grey, fontSize: 13),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
                  ),
                ),
              ],
            ),
          );
        }),
        InkWell(
          onTap: () {
            notifier.updateDays([...draft.days, CorporateDraftDay(title: '', details: '')]);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: Colors.indigo.withOpacity(0.05),
              border: Border.all(color: Colors.indigo.withOpacity(0.2), style: BorderStyle.solid),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.add, color: Colors.indigoAccent),
                const SizedBox(width: 8),
                Text('إضافة يوم جديد للبرنامج', style: GoogleFonts.cairo(color: Colors.indigoAccent, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// =========================================================================
// STEP 5: IMAGES (صور)
// =========================================================================
class _Step5Images extends ConsumerWidget {
  const _Step5Images();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(corporateTripDraftProvider);
    final notifier = ref.read(corporateTripDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          children: [
            Container(width: 4, height: 20, color: Colors.indigo),
            const SizedBox(width: 8),
            Text('صور الرحلة العامة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.indigo)),
          ],
        ),
        if (draft.existingGeneralImageUrls.isNotEmpty) ...[
          _buildUrlImageGrid(
            context,
            urls: draft.existingGeneralImageUrls,
            onRemove: (idx) {
              final urls = [...draft.existingGeneralImageUrls]..removeAt(idx);
              notifier.updateMedia(
                existingGeneralImageUrls: urls,
                generalImages: draft.generalImages,
                transportImages: draft.transportImages,
                existingTransportImageUrls: draft.existingTransportImageUrls,
              );
            },
          ),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 16),
        _buildImageGrid(
          context,
          images: draft.generalImages,
          onAdd: () async {
            final p = ImagePicker();
            final file = await p.pickImage(source: ImageSource.gallery);
            if (file != null) {
              notifier.updateMedia(
                generalImages: [...draft.generalImages, File(file.path)],
                transportImages: draft.transportImages,
                existingGeneralImageUrls: draft.existingGeneralImageUrls,
                existingTransportImageUrls: draft.existingTransportImageUrls,
              );
            }
          },
          onRemove: (idx) {
            final l = [...draft.generalImages]..removeAt(idx);
            notifier.updateMedia(
              generalImages: l,
              transportImages: draft.transportImages,
              existingGeneralImageUrls: draft.existingGeneralImageUrls,
              existingTransportImageUrls: draft.existingTransportImageUrls,
            );
          },
        ),
        const SizedBox(height: 30),
        Row(
          children: [
            Container(width: 4, height: 20, color: Colors.orange),
            const SizedBox(width: 8),
            Text('(Transportation) صور وسائل النقل', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.deepOrange)),
          ],
        ),
        if (draft.existingTransportImageUrls.isNotEmpty) ...[
          _buildUrlImageGrid(
            context,
            urls: draft.existingTransportImageUrls,
            onRemove: (idx) {
              final urls = [...draft.existingTransportImageUrls]..removeAt(idx);
              notifier.updateMedia(
                existingTransportImageUrls: urls,
                generalImages: draft.generalImages,
                transportImages: draft.transportImages,
                existingGeneralImageUrls: draft.existingGeneralImageUrls,
              );
            },
          ),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 16),
        _buildImageGrid(
          context,
          images: draft.transportImages,
          onAdd: () async {
            final p = ImagePicker();
            final file = await p.pickImage(source: ImageSource.gallery);
            if (file != null) {
              notifier.updateMedia(
                generalImages: draft.generalImages,
                transportImages: [...draft.transportImages, File(file.path)],
                existingGeneralImageUrls: draft.existingGeneralImageUrls,
                existingTransportImageUrls: draft.existingTransportImageUrls,
              );
            }
          },
          onRemove: (idx) {
            final l = [...draft.transportImages]..removeAt(idx);
            notifier.updateMedia(
              generalImages: draft.generalImages,
              transportImages: l,
              existingGeneralImageUrls: draft.existingGeneralImageUrls,
              existingTransportImageUrls: draft.existingTransportImageUrls,
            );
          },
          buttonColor: Colors.orange.withOpacity(0.1),
          buttonTextColor: Colors.deepOrange,
        ),
      ],
    );
  }

  Widget _buildUrlImageGrid(BuildContext context, {required List<String> urls, required Function(int) onRemove}) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 1.2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: urls.length,
      itemBuilder: (context, idx) {
        return Stack(
          fit: StackFit.expand,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(15),
              child: CachedNetworkImage(imageUrl: urls[idx], fit: BoxFit.cover),
            ),
            Positioned(
              top: 4,
              right: 4,
              child: InkWell(
                onTap: () => onRemove(idx),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                  child: const Icon(Icons.close, color: Colors.white, size: 14),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildImageGrid(BuildContext context, {required List<File> images, required VoidCallback onAdd, required Function(int) onRemove, Color buttonColor = const Color(0xFFE8EAF6), Color buttonTextColor = Colors.indigo}) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 1.2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: images.length + 1,
      itemBuilder: (context, idx) {
        if (idx == images.length) {
          // Add button
          return InkWell(
            onTap: onAdd,
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(15),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.camera_alt_outlined, color: Colors.grey, size: 28),
                  const SizedBox(height: 8),
                  Text('إضافة صورة أخرى', style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
                ],
              ),
            ),
          );
        }
        // Image item
        return Stack(
          children: [
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(15),
                image: DecorationImage(image: FileImage(images[idx]), fit: BoxFit.cover),
              ),
            ),
            Positioned(
              top: 4,
              right: 4,
              child: InkWell(
                onTap: () => onRemove(idx),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                  child: const Icon(Icons.close, color: Colors.white, size: 14),
                ),
              ),
            )
          ],
        );
      },
    );
  }
}

// =========================================================================
// STEP 6: SETTINGS (إعدادات)
// =========================================================================
class _Step6Settings extends ConsumerWidget {
  const _Step6Settings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(corporateTripDraftProvider);
    final notifier = ref.read(corporateTripDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('طرق الحجز والدفع', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(color: Colors.indigoAccent, borderRadius: BorderRadius.circular(10)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.chat_bubble_outline, color: Colors.white, size: 18),
                        const SizedBox(width: 8),
                        Text('واتساب مباشر', style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const Icon(Icons.check_circle, color: Colors.white, size: 18),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(color: Colors.indigoAccent, borderRadius: BorderRadius.circular(10)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.phone_outlined, color: Colors.white, size: 18),
                        const SizedBox(width: 8),
                        Text('اتصال هاتفي', style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const Icon(Icons.check_circle, color: Colors.white, size: 18),
                  ],
                ),
              ),
            )
          ],
        ),
        const SizedBox(height: 16),
        TextFormField(
          initialValue: draft.bookingWebsite,
          onChanged: (v) => notifier.updateSettings(bookingWebsite: v, bookingPhone: draft.bookingPhone, bookingWhatsapp: draft.bookingWhatsapp, isPublished: draft.isPublished),
          decoration: InputDecoration(
            hintText: 'الموقع الرسمي',
            hintStyle: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold),
            prefixIcon: const Icon(Icons.open_in_new, color: Colors.grey),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
        const SizedBox(height: 40),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            border: Border.all(color: Colors.grey.shade200),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)]),
                    child: const Icon(Icons.layers, color: Colors.indigoAccent),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('تفعيل الرحلة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('اجعل الرحلة مرئية للجمهور', style: GoogleFonts.cairo(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ],
              ),
              Switch(
                value: draft.isPublished,
                onChanged: (val) {
                  notifier.updateSettings(bookingWebsite: draft.bookingWebsite, bookingPhone: draft.bookingPhone, bookingWhatsapp: draft.bookingWhatsapp, isPublished: val);
                },
                activeColor: Colors.indigoAccent,
              )
            ],
          ),
        )
      ],
    );
  }
}
