import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:io';
import 'dart:convert';
import 'package:image_picker/image_picker.dart' as picker;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mb hide ImageSource;
import 'package:flutter_dotenv/flutter_dotenv.dart';
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
            if (_currentStep == 4) {
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
    final steps = ['معلومات', 'أنشطة', 'أيام', 'مراجعة'];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(steps.length, (index) {
          final stepNum = index + 1;
          final isActive = currentStep == stepNum;
          final isCompleted = currentStep > stepNum;

          return Column(
            children: [
              CircleAvatar(
                radius: 12,
                backgroundColor: isActive ? Colors.orange : (isCompleted ? Colors.green : Colors.grey[300]),
                child: isCompleted
                    ? const Icon(Icons.check, size: 14, color: Colors.white)
                    : Text(stepNum.toString(), style: const TextStyle(fontSize: 10, color: Colors.white)),
              ),
              const SizedBox(height: 4),
              Text(steps[index], style: TextStyle(fontSize: 10, color: isActive ? Colors.black : Colors.grey)),
            ],
          );
        }),
      ),
    );
  }
}

class _StepBasicInfo extends ConsumerWidget {
  const _StepBasicInfo();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(tripDraftProvider);
    final notifier = ref.read(tripDraftProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Text('المعلومات الأساسية', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
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
          label: 'المدينة / الوجهة',
          initialValue: draft.destination,
          onChanged: (v) => notifier.updateBasicInfo(destination: v),
          hint: 'مثال: الأقصر، الإسكندرية...',
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
                  : Text(step == 4 ? 'نشر الرحلة' : 'التالي'),
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

  void _onMapCreated(mb.MapboxMap controller) async {
    _mapController = controller;
    _pointManager = await controller.annotations.createPointAnnotationManager();
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
          textField: "${i + 1}",
          textColor: Colors.white.value,
          iconImage: "rocket-15",
          iconColor: Colors.blue.value,
          textSize: 14.0,
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
          height: 300,
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
                top: 10,
                right: 10,
                left: 10,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9), 
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)],
                  ),
                  child: Text(
                    _selectedActivityIndex == null 
                        ? 'اختر نشاطاً من القائمة ثم اضغط على الخريطة لتحديد موقعه' 
                        : 'جاري تحديد موقع: ${draft.activities[_selectedActivityIndex!].name}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue),
                    textAlign: TextAlign.center,
                  ),
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
              return Card(
                key: ValueKey('activity_$i'),
                margin: const EdgeInsets.only(bottom: 12),
                elevation: isSelected ? 4 : 1,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                  side: isSelected ? const BorderSide(color: Colors.blue, width: 2) : BorderSide.none,
                ),
                child: ListTile(
                  onTap: () => setState(() => _selectedActivityIndex = i),
                  leading: CircleAvatar(
                    backgroundColor: draft.activities[i].lat != null ? Colors.blue[100] : Colors.grey[200],
                    child: Text('${i + 1}', style: TextStyle(color: draft.activities[i].lat != null ? Colors.blue : Colors.grey)),
                  ),
                  title: TextFormField(
                    initialValue: draft.activities[i].name,
                    onChanged: (v) {
                      final items = List<DraftActivity>.from(draft.activities);
                      items[i].name = v;
                      notifier.setActivities(items);
                    },
                    decoration: const InputDecoration(hintText: 'اسم المعلم / النشاط', border: InputBorder.none),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (draft.activities[i].lat != null)
                        const Icon(Icons.location_on, color: Colors.blue, size: 20),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                        onPressed: () {
                          final items = List<DraftActivity>.from(draft.activities);
                          items.removeAt(i);
                          notifier.setActivities(items);
                          if (_selectedActivityIndex == i) _selectedActivityIndex = null;
                          _updateMarkers();
                        },
                      ),
                    ],
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
class _StepOrganizeDays extends ConsumerWidget {
  const _StepOrganizeDays({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(tripDraftProvider);
    final notifier = ref.read(tripDraftProvider.notifier);

    // If days are not initialized, initialize them based on duration
    if (draft.days.isEmpty) {
      final daysCount = int.tryParse(draft.duration.replaceAll(RegExp(r'[^0-9]'), '')) ?? 1;
      final initialDays = List.generate(daysCount, (index) => DraftDay(title: 'اليوم ${index + 1}', activityIndices: []));
      // Distribute activities evenly as a starting point
      for (int i = 0; i < draft.activities.length; i++) {
        final dayIdx = i % (daysCount > 0 ? daysCount : 1);
        initialDays[dayIdx].activityIndices.add(i);
      }
      WidgetsBinding.instance.addPostFrameCallback((_) => notifier.setDays(initialDays));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: draft.days.length,
      itemBuilder: (context, dayIdx) {
        final day = draft.days[dayIdx];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: ExpansionTile(
            initiallyExpanded: true,
            title: Text(day.title, style: const TextStyle(fontWeight: FontWeight.bold)),
            children: [
              if (day.activityIndices.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text('لا توجد أنشطة لهذا اليوم', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ),
              for (int actIdx in day.activityIndices)
                ListTile(
                  leading: const Icon(Icons.location_on, color: Colors.orange, size: 16),
                  title: Text(draft.activities[actIdx].name, style: const TextStyle(fontSize: 14)),
                  trailing: IconButton(
                    icon: const Icon(Icons.remove_circle_outline, color: Colors.red, size: 18),
                    onPressed: () {
                      final newDays = List<DraftDay>.from(draft.days);
                      newDays[dayIdx].activityIndices.remove(actIdx);
                      notifier.setDays(newDays);
                    },
                  ),
                ),
            ],
          ),
        );
      },
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


