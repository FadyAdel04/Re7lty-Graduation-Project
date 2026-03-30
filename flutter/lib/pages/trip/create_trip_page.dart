import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../providers/trip_draft_provider.dart';

enum TripPostType { detailed, quick, ask }
class CreateTripPage extends ConsumerStatefulWidget {
  const CreateTripPage({super.key});

  @override
  ConsumerState<CreateTripPage> createState() => _CreateTripPageState();
}

class _CreateTripPageState extends ConsumerState<CreateTripPage> {
  int _currentStep = 1; // 1-indexed

  @override
  Widget build(BuildContext context) {
    final postType = ref.watch(tripCreationTypeProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50], // Premium light background
      appBar: AppBar(
        title: Text(postType == null ? 'شارك رحلتك' : _getStepTitle(postType)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
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
          onNext: () => setState(() => _currentStep++),
          onPrev: () => setState(() => _currentStep--),
        );
      case TripPostType.quick:
        return const _QuickPostForm();
      case TripPostType.ask:
        return const _AskPostForm();
    }
  }
}

// ... _PostTypeSelection and _SelectionCard remain similar ...

class _DetailedTripWorkflow extends ConsumerWidget {
  final int step;
  final VoidCallback onNext;
  final VoidCallback onPrev;

  const _DetailedTripWorkflow({
    required this.step,
    required this.onNext,
    required this.onPrev,
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
            final picker = ImagePicker();
            final image = await picker.pickImage(source: ImageSource.gallery);
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

  const _WorkflowNavigation({
    required this.step,
    required this.onNext,
    required this.onPrev,
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
                onPressed: onPrev,
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
              onPressed: onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              ),
              child: Text(step == 4 ? 'نشر الرحلة' : 'التالي'),
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
  GoogleMapController? _mapController;
  final Set<Marker> _markers = {};

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
              GoogleMap(
                initialCameraPosition: const CameraPosition(target: LatLng(30.0444, 31.2357), zoom: 10),
                onMapCreated: (controller) => _mapController = controller,
                markers: _markers,
                onTap: (latLng) {
                  setState(() {
                    _markers.add(Marker(
                      markerId: MarkerId(latLng.toString()),
                      position: latLng,
                    ));
                  });
                  // Add to draft
                  final newActivities = List<DraftActivity>.from(draft.activities)
                    ..add(DraftActivity(name: 'موقع جديد', lat: latLng.latitude, lng: latLng.longitude));
                  notifier.setActivities(newActivities);
                },
              ),
              Positioned(
                top: 10,
                right: 10,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                  child: const Text('اضغط على الخريطة لإضافة معلم', style: TextStyle(fontSize: 10)),
                ),
              ),
            ],
          ),
        ),
        // List of activities
        Expanded(
          child: ReorderableListView(
            padding: const EdgeInsets.all(16),
            onReorder: (oldIndex, newIndex) {
              if (newIndex > oldIndex) newIndex -= 1;
              final items = List<DraftActivity>.from(draft.activities);
              final item = items.removeAt(oldIndex);
              items.insert(newIndex, item);
              notifier.setActivities(items);
            },
            header: const Padding(
              padding: EdgeInsets.only(bottom: 16),
              child: Text('الأنشطة المحددة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
            children: [
              for (int i = 0; i < draft.activities.length; i++)
                Card(
                  key: ValueKey('activity_$i'),
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  child: ListTile(
                    leading: CircleAvatar(backgroundColor: Colors.orange[100], child: Text('${i + 1}', style: const TextStyle(color: Colors.orange))),
                    title: TextFormField(
                      initialValue: draft.activities[i].name,
                      onChanged: (v) {
                        final items = List<DraftActivity>.from(draft.activities);
                        items[i].name = v;
                        notifier.setActivities(items);
                      },
                      decoration: const InputDecoration(hintText: 'اسم المعلم / النشاط', border: InputBorder.none),
                    ),
                    trailing: const Icon(Icons.drag_handle),
                  ),
                ),
            ],
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

class _QuickPostForm extends StatelessWidget {
  const _QuickPostForm();
  @override
  Widget build(BuildContext context) => const Center(child: Text('المنشور السريع قريباً'));
}

class _AskPostForm extends StatelessWidget {
  const _AskPostForm();
  @override
  Widget build(BuildContext context) => const Center(child: Text('السؤال والاستفسار قريباً'));
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
