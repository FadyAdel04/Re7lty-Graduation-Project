import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:io';
import 'dart:convert';
import 'package:image_picker/image_picker.dart' as picker;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mb hide ImageSource;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:dio/dio.dart';
import '../../providers/trip_draft_provider.dart';
import '../../providers/trip_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_colors.dart';

enum TripPostType { detailed, quick, ask }
class CreateTripPage extends ConsumerStatefulWidget {
  CreateTripPage({super.key});

  @override
  ConsumerState<CreateTripPage> createState() => _CreateTripPageState();
}

class _CreateTripPageState extends ConsumerState<CreateTripPage> {
  int _currentStep = 1; // 1-indexed
  bool _isPublishing = false;

  Future<void> _publishTrip(TripPostType type, [Map<String, dynamic>? extraData]) async {
    if (_isPublishing) return;
    setState(() => _isPublishing = true);

    try {
      final tripService = ref.read(tripServiceProvider);
      Map<String, dynamic> payload = {};

      if (type == TripPostType.detailed) {
        final draft = ref.read(tripDraftProvider);
        String? base64Image;
        if (draft.coverImageUrl.isNotEmpty) {
          try {
            final file = File(draft.coverImageUrl);
            if (await file.exists()) {
              final bytes = await file.readAsBytes();
              final ext = draft.coverImageUrl.split('.').last.toLowerCase();
              final mimeType = ext == 'png' ? 'image/png' : 'image/jpeg';
              base64Image = 'data:$mimeType;base64,${base64Encode(bytes)}';
            }
          } catch (e) {
            print('Error reading image: $e');
          }
        }
        
        payload = {
          'title': draft.title.isNotEmpty ? draft.title : 'رحلة مفصلة',
          'destination': draft.destination,
          'duration': draft.duration,
          'budget': draft.budget,
          'season': draft.season,
          'description': draft.description,
          'postType': 'detailed',
          'activities': draft.activities.map((a) => {
            'name': a.name,
            'coordinates': {'lat': a.lat, 'lng': a.lng},
          }).toList(),
          'days': draft.days.map((d) => {
            'title': d.title,
            'activities': d.activityIndices,
          }).toList(),
          'image': base64Image ?? 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=500',
        };
      } else if (type == TripPostType.quick) {
        payload = {
           'title': extraData?['title'] ?? 'لحظات سريعة',
           'description': extraData?['description'] ?? '',
           'destination': extraData?['destination'] ?? '',
           'postType': 'quick',
           'image': extraData?['image'] ?? 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=500',
        };
      } else if (type == TripPostType.ask) {
        payload = {
           'title': extraData?['title'] ?? 'سؤال',
           'description': extraData?['description'] ?? '',
           'destination': extraData?['destination'] ?? '',
           'postType': 'ask',
        };
      }

      await tripService.createTrip(payload);
      
      // Refresh feed
      ref.invalidate(feedProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم النشر بنجاح!'), backgroundColor: Colors.green),
        );
        ref.read(tripCreationTypeProvider.notifier).state = null;
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('حدث خطأ أثناء النشر: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isPublishing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final postType = ref.watch(tripCreationTypeProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.grey[50],
      appBar: AppBar(
        title: Text(postType == null ? 'شارك رحلتك' : _getStepTitle(postType)),
        backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (postType == TripPostType.detailed && _currentStep > 1) {
              setState(() => _currentStep--);
            } else if (postType != null) {
              ref.read(tripCreationTypeProvider.notifier).state = null;
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: postType == null
          ? _PostTypeSelection(onSelect: (type) {
              ref.read(tripCreationTypeProvider.notifier).state = type;
            })
          : _buildWorkflow(postType),
    );
  }

  String _getStepTitle(TripPostType type) {
    switch (type) {
      case TripPostType.detailed:
        return 'إضافة رحلة مفصلة';
      case TripPostType.quick:
        return 'منشور سريع';
      case TripPostType.ask:
        return 'اسأل عن رحلة';
    }
  }

  Widget _buildWorkflow(TripPostType type) {
    switch (type) {
      case TripPostType.detailed:
        return _DetailedTripWorkflow(
          step: _currentStep,
          isPublishing: _isPublishing,
          onNext: () {
            if (_currentStep == 6) {
              _publishTrip(TripPostType.detailed);
            } else {
              setState(() => _currentStep++);
            }
          },
          onPrev: () => setState(() => _currentStep--),
        );
      case TripPostType.quick:
        return _QuickPostForm(
          isPublishing: _isPublishing,
          onPublish: (data) => _publishTrip(TripPostType.quick, data),
        );
      case TripPostType.ask:
        return _AskPostForm(
          isPublishing: _isPublishing,
          onPublish: (data) => _publishTrip(TripPostType.ask, data),
        );
    }
  }
}

// ... _PostTypeSelection and _SelectionCard remain similar ...

class _DetailedTripWorkflow extends ConsumerWidget {
  final int step;
  final VoidCallback onNext;
  final VoidCallback onPrev;
  final bool isPublishing;

  const _DetailedTripWorkflow({
    required this.step,
    required this.onNext,
    required this.onPrev,
    required this.isPublishing,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(tripDraftProvider);

    return Column(
      children: [
        // Stepper Header
        _WorkflowStepper(currentStep: step),
        Expanded(
          child: _buildStepContent(step, ref),
        ),
        // Bottom Navigation
        _WorkflowNavigation(
          step: step,
          onNext: onNext,
          onPrev: onPrev,
          isPublishing: isPublishing,
        ),
      ],
    );
  }

  Widget _buildStepContent(int step, WidgetRef ref) {
    switch (step) {
      case 1:
        return const _StepBasicInfo();
      case 2:
        return const _StepMapActivities();
      case 3:
        return const _StepOrganizeDays();
      case 4:
        return const _StepFoodPlaces();
      case 5:
        return const _StepHotels();
      case 6:
        return const _StepFinalReview();
      default:
        return const Center(child: Text('قريباً...'));
    }
  }
}

class _WorkflowStepper extends StatelessWidget {
  final int currentStep;

  const _WorkflowStepper({required this.currentStep});

  @override
  Widget build(BuildContext context) {
    final steps = ['معلومات', 'أنشطة', 'أيام', 'مطاعم', 'إقامة', 'مراجعة'];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(steps.length, (index) {
          final stepNum = index + 1;
          final isActive = currentStep == stepNum;
          final isCompleted = currentStep > stepNum;

          return Expanded(
            child: Column(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isActive ? Colors.orange : (isCompleted ? Colors.green : Colors.grey[200]),
                    boxShadow: isActive ? [BoxShadow(color: Colors.orange.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))] : null,
                  ),
                  child: Center(
                    child: isCompleted
                        ? const Icon(Icons.check, size: 16, color: Colors.white)
                        : Text(stepNum.toString(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isActive ? Colors.white : Colors.grey[600])),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  steps[index],
                  style: TextStyle(fontSize: 10, fontWeight: isActive ? FontWeight.bold : FontWeight.normal, color: isActive ? Colors.black : Colors.grey),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

class _StepBasicInfo extends ConsumerWidget {
  const _StepBasicInfo();

  static final List<Map<String, dynamic>> egyptGovernorates = [
    {'name': 'القاهرة', 'lat': 30.0444, 'lng': 31.2357},
    {'name': 'الإسكندرية', 'lat': 31.2001, 'lng': 29.9187},
    {'name': 'الجيزة', 'lat': 30.0131, 'lng': 31.2089},
    {'name': 'الأقصر', 'lat': 25.6872, 'lng': 32.6396},
    {'name': 'أسوان', 'lat': 24.0889, 'lng': 32.8998},
    {'name': 'شرم الشيخ', 'lat': 27.9158, 'lng': 34.3299},
    {'name': 'الغردقة', 'lat': 27.2579, 'lng': 33.8116},
    {'name': 'دهب', 'lat': 28.5064, 'lng': 34.5126},
    {'name': 'سيوه', 'lat': 29.2032, 'lng': 25.5195},
    {'name': 'الساحل الشمالي', 'lat': 30.9328, 'lng': 28.9322},
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(tripDraftProvider);
    final notifier = ref.read(tripDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Text('المعلومات الأساسية', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 24),
        // Governorate Selection Moved Here
        const Text('اختر الوجهة / المحافظة', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        SizedBox(
          height: 45,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: egyptGovernorates.length,
            itemBuilder: (context, i) {
              final gov = egyptGovernorates[i];
              final isSelected = draft.destination == gov['name'];
              return Padding(
                padding: const EdgeInsets.only(right: 10),
                child: ChoiceChip(
                  label: Text(gov['name']),
                  selected: isSelected,
                  onSelected: (val) {
                    notifier.updateBasicInfo(destination: gov['name']);
                  },
                  selectedColor: Colors.orange,
                  labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 24),
        // Cover Image Picker
        InkWell(
          onTap: () async {
            final imagePicker = picker.ImagePicker();
            final image = await imagePicker.pickImage(source: picker.ImageSource.gallery);
            if (image != null) {
              notifier.updateBasicInfo(coverImage: File(image.path), coverImageUrl: image.path);
            }
          },
          child: Container(
            height: 200,
            decoration: BoxDecoration(
              color: Colors.orange[50],
              borderRadius: BorderRadius.circular(20),
              image: draft.coverImageUrl.isNotEmpty
                  ? DecorationImage(image: FileImage(File(draft.coverImageUrl)), fit: BoxFit.cover)
                  : null,
            ),
            child: draft.coverImageUrl.isEmpty
                ? const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add_a_photo, size: 40, color: Colors.orange),
                      SizedBox(height: 8),
                      Text('أضف صورة غلاف', style: TextStyle(color: Colors.orange)),
                    ],
                  )
                : null,
          ),
        ),
        const SizedBox(height: 24),
        _buildTextField(
          label: 'عنوان الرحلة',
          initialValue: draft.title,
          onChanged: (v) => notifier.updateBasicInfo(title: v),
          hint: 'مثال: رحلة استكشافية في الأقصر',
        ),
        const SizedBox(height: 16),
        _buildTextField(
          label: 'المدينة / المنطقة بالتحديد',
          initialValue: draft.city,
          onChanged: (v) => notifier.updateBasicInfo(city: v),
          hint: 'مثال: حي المنشية، جزيرة الفنتين...',
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                label: 'المدة',
                initialValue: draft.duration,
                onChanged: (v) => notifier.updateBasicInfo(duration: v),
                hint: 'مثال: ٣ أيام',
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildTextField(
                label: 'الميزانية',
                initialValue: draft.budget,
                onChanged: (v) => notifier.updateBasicInfo(budget: v),
                hint: 'مثال: ٢٠٠٠ جنيه',
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const Text('الموسم', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: ['winter', 'summer', 'fall', 'spring'].map((s) {
            final isActive = draft.season == s;
            return ChoiceChip(
              label: Text(_translateSeason(s)),
              selected: isActive,
              selectedColor: Colors.orange,
              onSelected: (val) => notifier.updateBasicInfo(season: s),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        _buildTextField(
          label: 'وصف الرحلة',
          initialValue: draft.description,
          onChanged: (v) => notifier.updateBasicInfo(description: v),
          hint: 'احكِ لنا عن تجربتك...',
          maxLines: 5,
        ),
      ],
    );
  }

  String _translateSeason(String s) {
    switch (s) {
      case 'winter': return 'شتاء';
      case 'summer': return 'صيف';
      case 'fall': return 'خريف';
      case 'spring': return 'ربيع';
      default: return s;
    }
  }

  Widget _buildTextField({
    required String label,
    required String initialValue,
    required Function(String) onChanged,
    String? hint,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        TextFormField(
          initialValue: initialValue,
          onChanged: onChanged,
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
          ),
        ),
      ],
    );
  }
}

class _WorkflowNavigation extends StatelessWidget {
  final int step;
  final VoidCallback onNext;
  final VoidCallback onPrev;
  final bool isPublishing;

  const _WorkflowNavigation({
    required this.step,
    required this.onNext,
    required this.onPrev,
    this.isPublishing = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -2))],
      ),
      child: Row(
        children: [
          if (step > 1)
            Expanded(
              child: OutlinedButton(
                onPressed: isPublishing ? null : onPrev,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                ),
                child: const Text('السابق'),
              ),
            ),
          if (step > 1) const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: isPublishing ? null : onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              ),
              child: isPublishing
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(step == 6 ? 'نشر الرحلة' : 'التالي'),
            ),
          ),
        ],
      ),
    );
  }
}



class _StepMapActivities extends ConsumerStatefulWidget {
  const _StepMapActivities({super.key});

  @override
  ConsumerState<_StepMapActivities> createState() => _StepMapActivitiesState();
}

class _StepMapActivitiesState extends ConsumerState<_StepMapActivities> {
  mb.MapboxMap? _mapController;
  mb.PointAnnotationManager? _pointManager;
  int? _selectedActivityIndex;
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _latController = TextEditingController();
  final TextEditingController _lngController = TextEditingController();
  bool _isSearching = false;
  List<Map<String, dynamic>> _searchResults = [];

  // ── Mapbox Geocoding Search ───────────────────────────────────────────────
  Future<void> _searchPlace(String query) async {
    if (query.trim().isEmpty) return;
    setState(() { _isSearching = true; _searchResults = []; });

    try {
      final token = dotenv.env['MAPBOX_ACCESS_TOKEN'] ?? '';
      final draft = ref.read(tripDraftProvider);
      // Use proximity of current map center if available, fallback to Cairo
      final prox = _StepBasicInfo.egyptGovernorates.firstWhere(
        (g) => g['name'] == draft.destination,
        orElse: () => _StepBasicInfo.egyptGovernorates[0],
      );
      final url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
          '${Uri.encodeComponent(query)}.json'
          '?proximity=${prox["lng"]},${prox["lat"]}'
          '&country=EG&language=ar&limit=5&access_token=$token';

      final response = await Dio().get(url);
      final features = response.data['features'] as List? ?? [];

      setState(() {
        _searchResults = features.map<Map<String, dynamic>>((f) => {
          'name': f['place_name'] ?? f['text'] ?? '',
          'lat': (f['geometry']['coordinates'][1] as num).toDouble(),
          'lng': (f['geometry']['coordinates'][0] as num).toDouble(),
        }).toList();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ في البحث: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  void _selectSearchResult(Map<String, dynamic> result) {
    final lat = result['lat'] as double;
    final lng = result['lng'] as double;
    _moveToLocation(lat, lng);

    // If an activity is selected, update its location
    if (_selectedActivityIndex != null) {
      final draft = ref.read(tripDraftProvider);
      final notifier = ref.read(tripDraftProvider.notifier);
      final items = List<DraftActivity>.from(draft.activities);
      items[_selectedActivityIndex!] = DraftActivity(
        name: items[_selectedActivityIndex!].name,
        lat: lat,
        lng: lng,
      );
      notifier.setActivities(items);
      _updateMarkers();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تم تحديد موقع "${result['name'].toString().split(',')[0]}" للنشاط المختار ✅')),
      );
    }

    setState(() {
      _searchController.clear();
      _searchResults = [];
    });
  }

  void _moveToLocation(double lat, double lng) {
    _mapController?.setCamera(mb.CameraOptions(
      center: mb.Point(coordinates: mb.Position(lng, lat)),
      zoom: 12.0,
    ));
  }

  void _addLocationManually() {
    final lat = double.tryParse(_latController.text.trim());
    final lng = double.tryParse(_lngController.text.trim());
    if (lat == null || lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('⚠️ أدخل إحداثيات صحيحة'), backgroundColor: Colors.red),
      );
      return;
    }

    final draft = ref.read(tripDraftProvider);
    final notifier = ref.read(tripDraftProvider.notifier);
    final newActivities = List<DraftActivity>.from(draft.activities);

    if (_selectedActivityIndex != null) {
      // Update existing activity
      newActivities[_selectedActivityIndex!] = DraftActivity(
        name: newActivities[_selectedActivityIndex!].name,
        lat: lat,
        lng: lng,
      );
    } else {
      // Create new activity with these coordinates
      newActivities.add(DraftActivity(
        name: 'نشاط ${newActivities.length + 1}',
        lat: lat,
        lng: lng,
      ));
      setState(() => _selectedActivityIndex = newActivities.length - 1);
    }

    notifier.setActivities(newActivities);
    _updateMarkers();
    _moveToLocation(lat, lng);
    _latController.clear();
    _lngController.clear();
    Navigator.pop(context);
  }

  void _showManualLocationDialog() {
    // If no activity selected, offer to create one with the coordinates
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('📍 إضافة موقع بالإحداثيات'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_selectedActivityIndex == null)
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: Colors.orange[50], borderRadius: BorderRadius.circular(8)),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange, size: 18),
                    SizedBox(width: 8),
                    Expanded(child: Text('لا يوجد نشاط محدد. سيتم إنشاء نشاط جديد بهذا الموقع.', style: TextStyle(fontSize: 12))),
                  ],
                ),
              ),
            if (_selectedActivityIndex == null) const SizedBox(height: 10),
            TextField(
              controller: _latController,
              decoration: const InputDecoration(
                labelText: 'خط العرض (Latitude)',
                hintText: 'مثال: 30.0444',
                prefixIcon: Icon(Icons.my_location),
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _lngController,
              decoration: const InputDecoration(
                labelText: 'خط الطول (Longitude)',
                hintText: 'مثال: 31.2357',
                prefixIcon: Icon(Icons.my_location),
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
            ),
            const SizedBox(height: 8),
            const Text('💡 يمكنك الحصول على الإحداثيات من Google Maps بالضغط المطوّل على الخريطة', style: TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          ElevatedButton(
            onPressed: _addLocationManually,
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
            child: const Text('تأكيد', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _onMapCreated(mb.MapboxMap controller) async {
    _mapController = controller;
    _pointManager = await controller.annotations.createPointAnnotationManager();
    
    // Initial zoom to selected governorate from step 1
    final draft = ref.read(tripDraftProvider);
    final gov = _StepBasicInfo.egyptGovernorates.firstWhere(
      (g) => g['name'] == draft.destination,
      orElse: () => _StepBasicInfo.egyptGovernorates[0],
    );
    _moveToLocation(gov['lat'], gov['lng']);
    
    _updateMarkers();
  }

  void _updateMarkers() async {
    if (_pointManager == null) return;
    final draft = ref.read(tripDraftProvider);
    final annotations = <mb.PointAnnotationOptions>[];

    for (int i = 0; i < draft.activities.length; i++) {
      final act = draft.activities[i];
      if (act.lat != null && act.lng != null) {
        annotations.add(mb.PointAnnotationOptions(
          geometry: mb.Point(coordinates: mb.Position(act.lng!, act.lat!)),
          textField: act.name,
          textOffset: [0.0, -2.5],
          textColor: Colors.black.value,
          textSize: 12.0,
          iconImage: "marker",
          iconSize: 1.5,
        ));
      }
    }
    _pointManager!.deleteAll();
    if (annotations.isNotEmpty) {
      _pointManager!.createMulti(annotations);
    }
  }

  void _onMapTap(mb.MapContentGestureContext context) {
    if (_selectedActivityIndex == null) return;
    
    final point = context.point;
    final draft = ref.read(tripDraftProvider);
    final notifier = ref.read(tripDraftProvider.notifier);
    
    final newActivities = List<DraftActivity>.from(draft.activities);
    newActivities[_selectedActivityIndex!] = DraftActivity(
      name: newActivities[_selectedActivityIndex!].name,
      lat: point.coordinates.lat.toDouble(),
      lng: point.coordinates.lng.toDouble(),
    );
    
    notifier.setActivities(newActivities);
    _updateMarkers();
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(tripDraftProvider);
    final notifier = ref.read(tripDraftProvider.notifier);

    return Column(
      children: [
        // Map Area
        SizedBox(
          height: 400,
          child: Stack(
            children: [
              mb.MapWidget(
                key: const ValueKey("create_trip_mapbox"),
                cameraOptions: mb.CameraOptions(
                  center: mb.Point(coordinates: mb.Position(31.2357, 30.0444)),
                  zoom: 10.0,
                ),
                styleUri: mb.MapboxStyles.OUTDOORS,
                onMapCreated: _onMapCreated,
                onTapListener: _onMapTap,
              ),
              Positioned(
                top: 15,
                right: 15,
                left: 15,
                child: Column(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 10, offset: const Offset(0, 4))],
                      ),
                      child: TextField(
                        controller: _searchController,
                        decoration: InputDecoration(
                          hintText: 'ابحث عن مكان داخل ${draft.destination.isNotEmpty ? draft.destination : "المحافظة"}...',
                          prefixIcon: const Icon(Icons.search, color: Colors.orange),
                          suffixIcon: _isSearching
                              ? const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.orange)))
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                        ),
                        onSubmitted: _searchPlace,
                        onChanged: (v) {
                          if (v.isEmpty) setState(() => _searchResults = []);
                        },
                      ),
                    ),
                    // Search Results Dropdown
                    if (_searchResults.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 8)],
                        ),
                        child: Column(
                          children: _searchResults.map((r) => ListTile(
                            dense: true,
                            leading: const Icon(Icons.location_on, color: Colors.orange, size: 18),
                            title: Text(r['name'].toString().split(',')[0], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                            subtitle: Text(r['name'].toString(), style: const TextStyle(fontSize: 10), maxLines: 1, overflow: TextOverflow.ellipsis),
                            onTap: () => _selectSearchResult(r),
                          )).toList(),
                        ),
                      ),
                    const SizedBox(height: 10),
                    if (_selectedActivityIndex != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'تحديد موقع: ${draft.activities[_selectedActivityIndex!].name}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                  ],
                ),
              ),
              Positioned(
                bottom: 20,
                right: 20,
                child: FloatingActionButton(
                  onPressed: _showManualLocationDialog,
                  backgroundColor: Colors.white,
                  child: const Icon(Icons.pin_drop, color: Colors.orange),
                ),
              ),
            ],
          ),
        ),
        // List of activities
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: draft.activities.length + 1,
            itemBuilder: (context, i) {
              if (i == draft.activities.length) {
                return Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: ElevatedButton.icon(
                    onPressed: () {
                      final newActivities = List<DraftActivity>.from(draft.activities)
                        ..add(DraftActivity(name: 'نشاط جديد ${draft.activities.length + 1}'));
                      notifier.setActivities(newActivities);
                      setState(() => _selectedActivityIndex = newActivities.length - 1);
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('إضافة نشاط جديد'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue[50],
                      foregroundColor: Colors.blue,
                      elevation: 0,
                    ),
                  ),
                );
              }

              final isSelected = _selectedActivityIndex == i;
              final activity = draft.activities[i];
              return Card(
                key: ValueKey('activity_$i'),
                margin: const EdgeInsets.only(bottom: 12),
                elevation: isSelected ? 4 : 1,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                  side: isSelected ? const BorderSide(color: Colors.orange, width: 2) : BorderSide.none,
                ),
                child: InkWell(
                  onTap: () => setState(() => _selectedActivityIndex = i),
                  borderRadius: BorderRadius.circular(15),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        // Activity image picker
                        GestureDetector(
                          onTap: () async {
                            final img = await picker.ImagePicker().pickImage(source: picker.ImageSource.gallery);
                            if (img != null) {
                              final items = List<DraftActivity>.from(draft.activities);
                              items[i] = DraftActivity(
                                name: items[i].name,
                                lat: items[i].lat,
                                lng: items[i].lng,
                                imagePath: img.path,
                              );
                              notifier.setActivities(items);
                            }
                          },
                          child: Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              color: Colors.grey[100],
                              image: activity.imagePath != null
                                  ? DecorationImage(image: FileImage(File(activity.imagePath!)), fit: BoxFit.cover)
                                  : null,
                            ),
                            child: activity.imagePath == null
                                ? const Icon(Icons.add_a_photo, color: Colors.grey, size: 22)
                                : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TextField(
                                controller: TextEditingController(text: activity.name)
                                  ..selection = TextSelection.collapsed(offset: activity.name.length),
                                onChanged: (v) {
                                  final items = List<DraftActivity>.from(draft.activities);
                                  items[i] = DraftActivity(
                                    name: v,
                                    lat: items[i].lat,
                                    lng: items[i].lng,
                                    imagePath: items[i].imagePath,
                                  );
                                  notifier.setActivities(items);
                                },
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                decoration: const InputDecoration(
                                  hintText: 'اسم النشاط / المعلم',
                                  border: InputBorder.none,
                                  isDense: true,
                                  contentPadding: EdgeInsets.zero,
                                ),
                              ),
                              const SizedBox(height: 4),
                              activity.lat != null
                                  ? Row(
                                      children: [
                                        const Icon(Icons.location_on, color: Colors.orange, size: 14),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${activity.lat!.toStringAsFixed(4)}, ${activity.lng!.toStringAsFixed(4)}',
                                          style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                        ),
                                      ],
                                    )
                                  : Text(
                                      isSelected ? '👆 اضغط على الخريطة لتحديد الموقع' : 'لم يُحدد موقع بعد',
                                      style: TextStyle(fontSize: 11, color: isSelected ? Colors.orange : Colors.grey),
                                    ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                          onPressed: () {
                            final items = List<DraftActivity>.from(draft.activities);
                            items.removeAt(i);
                            notifier.setActivities(items);
                            if (_selectedActivityIndex == i) setState(() => _selectedActivityIndex = null);
                            else if (_selectedActivityIndex != null && _selectedActivityIndex! > i) setState(() => _selectedActivityIndex = _selectedActivityIndex! - 1);
                            _updateMarkers();
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
class _StepOrganizeDays extends ConsumerStatefulWidget {
  const _StepOrganizeDays({super.key});

  @override
  ConsumerState<_StepOrganizeDays> createState() => _StepOrganizeDaysState();
}

class _StepOrganizeDaysState extends ConsumerState<_StepOrganizeDays> {
  int _selectedDayIndex = 0;

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(tripDraftProvider);
    final notifier = ref.read(tripDraftProvider.notifier);

    // Initialize days if empty
    if (draft.days.isEmpty) {
      final daysCount = int.tryParse(draft.duration.replaceAll(RegExp(r'[^0-9]'), '')) ?? 1;
      final initialDays = List.generate(daysCount, (i) => DraftDay(title: 'اليوم ${i + 1}', activityIndices: []));
      WidgetsBinding.instance.addPostFrameCallback((_) => notifier.setDays(initialDays));
      return const Center(child: CircularProgressIndicator(color: Colors.orange));
    }

    final selectedDay = draft.days[_selectedDayIndex];
    final assignedIndices = selectedDay.activityIndices;

    return Column(
      children: [
        // ── Day Selector ──────────────────────────────────────
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(draft.days.length, (i) {
                final isActive = i == _selectedDayIndex;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedDayIndex = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(
                        color: isActive ? Colors.orange : Colors.grey[100],
                        borderRadius: BorderRadius.circular(25),
                        boxShadow: isActive ? [BoxShadow(color: Colors.orange.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))] : null,
                      ),
                      child: Text(
                        draft.days[i].title,
                        style: TextStyle(
                          color: isActive ? Colors.white : Colors.grey[600],
                          fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
        // ── Activities assigned to this day ───────────────────
        if (assignedIndices.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('أنشطة ${selectedDay.title}:', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: assignedIndices.map((idx) {
                    if (idx >= draft.activities.length) return const SizedBox();
                    return Chip(
                      label: Text(draft.activities[idx].name, style: const TextStyle(fontSize: 12)),
                      deleteIcon: const Icon(Icons.close, size: 14),
                      onDeleted: () {
                        final newDays = List<DraftDay>.from(draft.days);
                        final newIndices = List<int>.from(newDays[_selectedDayIndex].activityIndices)..remove(idx);
                        newDays[_selectedDayIndex] = DraftDay(title: newDays[_selectedDayIndex].title, activityIndices: newIndices);
                        notifier.setDays(newDays);
                      },
                      backgroundColor: Colors.orange[50],
                      labelStyle: const TextStyle(color: Colors.orange),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        const Divider(height: 1),
        // ── All activities to pick from ───────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              const Icon(Icons.touch_app, size: 16, color: Colors.grey),
              const SizedBox(width: 6),
              Text('اضغط على نشاط لإضافته لـ ${selectedDay.title}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        ),
        Expanded(
          child: draft.activities.isEmpty
              ? const Center(child: Text('لا توجد أنشطة. أضف أنشطة في الخطوة السابقة.', style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: draft.activities.length,
                  itemBuilder: (context, i) {
                    final activity = draft.activities[i];
                    final isAssigned = assignedIndices.contains(i);
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: isAssigned ? const BorderSide(color: Colors.orange, width: 1.5) : BorderSide.none,
                      ),
                      child: ListTile(
                        onTap: () {
                          final newDays = List<DraftDay>.from(draft.days);
                          final newIndices = List<int>.from(newDays[_selectedDayIndex].activityIndices);
                          if (isAssigned) {
                            newIndices.remove(i);
                          } else {
                            newIndices.add(i);
                          }
                          newDays[_selectedDayIndex] = DraftDay(title: newDays[_selectedDayIndex].title, activityIndices: newIndices);
                          notifier.setDays(newDays);
                        },
                        leading: activity.imagePath != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.file(File(activity.imagePath!), width: 44, height: 44, fit: BoxFit.cover),
                              )
                            : CircleAvatar(
                                backgroundColor: isAssigned ? Colors.orange[100] : Colors.grey[100],
                                child: Icon(Icons.place, color: isAssigned ? Colors.orange : Colors.grey, size: 20),
                              ),
                        title: Text(activity.name, style: TextStyle(fontWeight: isAssigned ? FontWeight.bold : FontWeight.normal)),
                        subtitle: activity.lat != null
                            ? Text('${activity.lat!.toStringAsFixed(3)}, ${activity.lng!.toStringAsFixed(3)}', style: const TextStyle(fontSize: 10))
                            : null,
                        trailing: isAssigned
                            ? const Icon(Icons.check_circle, color: Colors.orange)
                            : const Icon(Icons.add_circle_outline, color: Colors.grey),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _StepFinalReview extends ConsumerWidget {
  const _StepFinalReview({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(tripDraftProvider);

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Text('المراجعة النهائية', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 24),
        _buildInfoRow('العنوان', draft.title),
        _buildInfoRow('الوجهة', draft.destination),
        _buildInfoRow('المدة', draft.duration),
        _buildInfoRow('الميزانية', draft.budget),
        const SizedBox(height: 16),
        const Text('الأنشطة المضافة:', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        for (var act in draft.activities)
          Padding(
            padding: const EdgeInsets.only(bottom: 4.0),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 14),
                const SizedBox(width: 8),
                Text(act.name),
              ],
            ),
          ),
        const SizedBox(height: 32),
        const Text(
          'بضغطك على "نشر الرحلة"، سيتم مشاركة تجربتك مع باقي المسافرين. هل أنت مستعد؟',
          style: TextStyle(color: Colors.grey, fontSize: 12),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

class _StepFoodPlaces extends ConsumerStatefulWidget {
  const _StepFoodPlaces();

  @override
  ConsumerState<_StepFoodPlaces> createState() => _StepFoodPlacesState();
}

class _StepFoodPlacesState extends ConsumerState<_StepFoodPlaces> {

  void _showAddFoodDialog() {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    File? selectedImage;
    String? base64Img;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('إضافة مطعم / وجبة'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'اسم المطعم')),
                const SizedBox(height: 8),
                TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'وصف التجربة')),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () async {
                    final img = await picker.ImagePicker().pickImage(source: picker.ImageSource.gallery);
                    if (img != null) {
                      final bytes = await img.readAsBytes();
                      final mime = img.path.endsWith('.png') ? 'image/png' : 'image/jpeg';
                      setDialogState(() {
                        selectedImage = File(img.path);
                        base64Img = 'data:$mime;base64,${base64Encode(bytes)}';
                      });
                    }
                  },
                  child: Container(
                    height: 120,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.orange[50],
                      borderRadius: BorderRadius.circular(12),
                      image: selectedImage != null ? DecorationImage(image: FileImage(selectedImage!), fit: BoxFit.cover) : null,
                    ),
                    child: selectedImage == null
                        ? const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(Icons.add_a_photo, color: Colors.orange, size: 30),
                            SizedBox(height: 4),
                            Text('أضف صورة المطعم', style: TextStyle(color: Colors.orange, fontSize: 12)),
                          ])
                        : null,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
            ElevatedButton(
              onPressed: () {
                ref.read(tripDraftProvider.notifier).addFoodPlace(
                  DraftFood(name: nameCtrl.text, description: descCtrl.text, image: base64Img),
                );
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
              child: const Text('إضافة', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(tripDraftProvider);

    return Column(
      children: [
        const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text('🍽️ المطاعم والأكلات المميزة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        Expanded(
          child: draft.foodPlaces.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.restaurant, size: 60, color: Colors.grey[300]),
                      const SizedBox(height: 12),
                      Text('لم تضف أي مطاعم بعد', style: TextStyle(color: Colors.grey[400])),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: draft.foodPlaces.length,
                  itemBuilder: (context, i) {
                    final food = draft.foodPlaces[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: ListTile(
                        leading: food.image != null
                            ? ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.file(File((food.image as String).split('base64,').length > 1 ? food.image : ''), width: 50, height: 50, fit: BoxFit.cover))
                            : const CircleAvatar(backgroundColor: Colors.orange, child: Icon(Icons.restaurant, color: Colors.white)),
                        title: Text(food.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(food.description),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () {
                            final list = List<DraftFood>.from(draft.foodPlaces)..removeAt(i);
                            ref.read(tripDraftProvider.notifier).state = draft.copyWith(foodPlaces: list);
                          },
                        ),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton.icon(
            onPressed: _showAddFoodDialog,
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text('إضافة مطعم جديد', style: TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, minimumSize: const Size(double.infinity, 50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
          ),
        ),
      ],
    );
  }
}

class _StepHotels extends ConsumerStatefulWidget {
  const _StepHotels();

  @override
  ConsumerState<_StepHotels> createState() => _StepHotelsState();
}

class _StepHotelsState extends ConsumerState<_StepHotels> {

  void _showAddHotelDialog() {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    File? selectedImage;
    String? base64Img;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('إضافة فندق / إقامة'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'اسم الفندق')),
                const SizedBox(height: 8),
                TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'وصف الفندق')),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () async {
                    final img = await picker.ImagePicker().pickImage(source: picker.ImageSource.gallery);
                    if (img != null) {
                      final bytes = await img.readAsBytes();
                      final mime = img.path.endsWith('.png') ? 'image/png' : 'image/jpeg';
                      setDialogState(() {
                        selectedImage = File(img.path);
                        base64Img = 'data:$mime;base64,${base64Encode(bytes)}';
                      });
                    }
                  },
                  child: Container(
                    height: 120,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(12),
                      image: selectedImage != null ? DecorationImage(image: FileImage(selectedImage!), fit: BoxFit.cover) : null,
                    ),
                    child: selectedImage == null
                        ? const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(Icons.add_a_photo, color: Colors.blue, size: 30),
                            SizedBox(height: 4),
                            Text('أضف صورة الفندق', style: TextStyle(color: Colors.blue, fontSize: 12)),
                          ])
                        : null,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
            ElevatedButton(
              onPressed: () {
                ref.read(tripDraftProvider.notifier).addHotel(
                  DraftHotel(name: nameCtrl.text, description: descCtrl.text, image: base64Img),
                );
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
              child: const Text('إضافة', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(tripDraftProvider);

    return Column(
      children: [
        const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text('🏨 أماكن الإقامة والفنادق', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        Expanded(
          child: draft.hotels.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.hotel, size: 60, color: Colors.grey[300]),
                      const SizedBox(height: 12),
                      Text('لم تضف أي فنادق بعد', style: TextStyle(color: Colors.grey[400])),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: draft.hotels.length,
                  itemBuilder: (context, i) {
                    final hotel = draft.hotels[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: ListTile(
                        leading: hotel.image != null
                            ? ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.file(File(''), width: 50, height: 50, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const CircleAvatar(backgroundColor: Colors.blue, child: Icon(Icons.hotel, color: Colors.white))))
                            : const CircleAvatar(backgroundColor: Colors.blue, child: Icon(Icons.hotel, color: Colors.white)),
                        title: Text(hotel.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(hotel.description),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () {
                            final list = List<DraftHotel>.from(draft.hotels)..removeAt(i);
                            ref.read(tripDraftProvider.notifier).state = draft.copyWith(hotels: list);
                          },
                        ),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton.icon(
            onPressed: _showAddHotelDialog,
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text('إضافة فندق جديد', style: TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, minimumSize: const Size(double.infinity, 50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
          ),
        ),
      ],
    );
  }
}

class _QuickPostForm extends StatefulWidget {
  final Function(Map<String, dynamic>) onPublish;
  final bool isPublishing;
  const _QuickPostForm({super.key, required this.onPublish, required this.isPublishing});

  @override
  State<_QuickPostForm> createState() => _QuickPostFormState();
}

class _QuickPostFormState extends State<_QuickPostForm> {
  String description = '';
  File? _selectedImage;
  String? _base64Image;

  Future<void> _pickImage() async {
    final pickerObj = picker.ImagePicker();
    final pickedFile = await pickerObj.pickImage(source: picker.ImageSource.gallery);
    if (pickedFile != null) {
      final bytes = await pickedFile.readAsBytes();
      final ext = pickedFile.path.split('.').last.toLowerCase();
      final mimeType = ext == 'png' ? 'image/png' : 'image/jpeg';
      setState(() {
        _selectedImage = File(pickedFile.path);
        _base64Image = 'data:$mimeType;base64,${base64Encode(bytes)}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('شارك لحظة سريعة', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          TextFormField(
            maxLines: 5,
            onChanged: (v) => setState(() => description = v),
            decoration: InputDecoration(
              hintText: 'بم تفكر؟ شارك تفاصيل سريعة...',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
            ),
          ),
          const SizedBox(height: 16),
          if (_selectedImage != null)
            Stack(
              children: [
                Container(
                  height: 150,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    image: DecorationImage(
                      image: FileImage(_selectedImage!),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => setState(() {
                      _selectedImage = null;
                      _base64Image = null;
                    }),
                    style: IconButton.styleFrom(backgroundColor: Colors.black54),
                  ),
                ),
              ],
            )
          else
            ElevatedButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.add_a_photo, color: Colors.orange),
              label: const Text('إضافة صورة', style: TextStyle(color: Colors.orange)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange[50],
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              ),
            ),
          const Spacer(),
          ElevatedButton(
            onPressed: widget.isPublishing || description.trim().isEmpty
                ? null
                : () => widget.onPublish({'description': description, 'image': _base64Image}),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            ),
            child: widget.isPublishing
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('نشر الان'),
          ),
        ],
      ),
    );
  }
}

class _AskPostForm extends StatefulWidget {
  final Function(Map<String, dynamic>) onPublish;
  final bool isPublishing;
  const _AskPostForm({super.key, required this.onPublish, required this.isPublishing});

  @override
  State<_AskPostForm> createState() => _AskPostFormState();
}

class _AskPostFormState extends State<_AskPostForm> {
  String description = '';
  String destination = '';

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('اسأل المجتمع', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          TextFormField(
            onChanged: (v) => setState(() => destination = v),
            decoration: InputDecoration(
              hintText: 'عن أي وجهة تسأل؟',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            maxLines: 5,
            onChanged: (v) => setState(() => description = v),
            decoration: InputDecoration(
              hintText: 'اكتب سؤالك هنا...',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
            ),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: widget.isPublishing || description.trim().isEmpty || destination.trim().isEmpty
                ? null
                : () => widget.onPublish({'description': description, 'destination': destination}),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.teal,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            ),
            child: widget.isPublishing
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('اطرح السؤال'),
          ),
        ],
      ),
    );
  }
}

class _PostTypeSelection extends StatelessWidget {
  final Function(TripPostType) onSelect;

  const _PostTypeSelection({required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
          const Text(
            'ماذا تريد أن تشارك؟',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'اختر نوع المنشور الذي تفضله لمشاركة تجربة سفرك',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 32),
          _SelectionCard(
            title: 'رحلة تفصيلية',
            description: 'خطة متكاملة مع الصور والمعالم والمواقع على الخريطة والميزانية.',
            icon: Icons.map,
            color: Colors.indigo,
            pointsText: '+50 نقطة',
            onTap: () => onSelect(TripPostType.detailed),
          ).animate().fadeIn(duration: 400.ms).slideX(begin: 0.1),
          const SizedBox(height: 16),
          _SelectionCard(
            title: 'منشور سريع',
            description: 'شارك لحظات سريعة من صور وفيديوهات مع وصف قصير.',
            icon: Icons.flash_on,
            color: Colors.orange,
            pointsText: '+20 نقطة',
            onTap: () => onSelect(TripPostType.quick),
          ).animate().fadeIn(duration: 400.ms, delay: 100.ms).slideX(begin: 0.1),
          const SizedBox(height: 16),
          _SelectionCard(
            title: 'سؤال/استفسار',
            description: 'هل تبحث عن نصيحة أو تسأل عن وجهة معينة؟ المجتمع سيساعدك.',
            icon: Icons.help_outline,
            color: Colors.teal,
            pointsText: '+10 نقاط',
            onTap: () => onSelect(TripPostType.ask),
          ).animate().fadeIn(duration: 400.ms, delay: 200.ms).slideX(begin: 0.1),
        ],
        ),
      ),
    );
  }
}

class _SelectionCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final String pointsText;
  final VoidCallback onTap;

  const _SelectionCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    required this.pointsText,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey[200]!),
          boxShadow: [
            BoxShadow(color: color.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(15)),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: Colors.green[50], borderRadius: BorderRadius.circular(8)),
                        child: Text(pointsText, style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(description, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}


