import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:image_picker/image_picker.dart' as picker;
import 'package:file_picker/file_picker.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mb hide ImageSource;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:dio/dio.dart';
import '../../providers/trip_draft_provider.dart';
import '../../providers/trip_publish_provider.dart';
import '../../providers/api_provider.dart';
import '../../models/user.dart';
import '../../constants/egypt_data.dart';
import '../../services/trip_draft_storage.dart';
import '../../widgets/trip/video_preview_dialog.dart';
import '../../theme/app_colors.dart';

/// Indigo marker — matches web Mapbox `color: '#indigo'`.
const int _kMapMarkerIndigo = 0xFF4F46E5;

Widget _draftImageLeading(dynamic image, IconData icon, Color color) {
  if (image == null) {
    return CircleAvatar(backgroundColor: color, child: Icon(icon, color: Colors.white, size: 22));
  }
  final path = image.toString();
  if (path.startsWith('http')) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Image.network(path, width: 50, height: 50, fit: BoxFit.cover),
    );
  }
  if (path.startsWith('data:')) {
    try {
      final bytes = base64Decode(path.split(',').last);
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.memory(bytes, width: 50, height: 50, fit: BoxFit.cover),
      );
    } catch (_) {}
  }
  final file = File(path);
  if (file.existsSync()) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Image.file(file, width: 50, height: 50, fit: BoxFit.cover),
    );
  }
  return CircleAvatar(backgroundColor: color, child: Icon(icon, color: Colors.white, size: 22));
}

bool _isVideoPath(String path) {
  final ext = path.split('.').last.toLowerCase();
  return {'mp4', 'mov', 'webm', 'mkv', 'avi', '3gp'}.contains(ext);
}

class CreateTripPage extends ConsumerStatefulWidget {
  CreateTripPage({super.key});

  @override
  ConsumerState<CreateTripPage> createState() => _CreateTripPageState();
}

class _CreateTripPageState extends ConsumerState<CreateTripPage> {
  int _currentStep = 1;
  bool _termsAccepted = false;
  Timer? _draftSaveDebounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.listen<TripDraft>(tripDraftProvider, (_, next) {
        if (ref.read(tripCreationTypeProvider) == TripPostType.detailed) {
          _scheduleDraftSave(next);
        }
      });
    });
  }

  @override
  void dispose() {
    _draftSaveDebounce?.cancel();
    super.dispose();
  }

  void _scheduleDraftSave(TripDraft draft) {
    _draftSaveDebounce?.cancel();
    _draftSaveDebounce = Timer(const Duration(milliseconds: 900), () {
      TripDraftStorage.save(draft);
    });
  }

  Future<void> _onSelectDetailedTrip() async {
    final saved = await TripDraftStorage.load();
    if (saved != null && mounted) {
      final restore = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('مسودة محفوظة'),
          content: const Text('هل تريد استكمال الرحلة التي بدأتها سابقاً؟'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('بدء جديد')),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
              child: const Text('استكمال', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
      if (restore == true) {
        ref.read(tripDraftProvider.notifier).loadDraft(saved);
      } else {
        await TripDraftStorage.clear();
        ref.read(tripDraftProvider.notifier).reset();
      }
    }
    ref.read(tripCreationTypeProvider.notifier).state = TripPostType.detailed;
  }

  bool _validateDetailedDraft(TripDraft draft, {required bool earlyShare}) {
    if (draft.title.trim().isEmpty) {
      _showValidation('العنوان مطلوب');
      return false;
    }
    if (draft.destination.trim().isEmpty) {
      _showValidation('الوجهة مطلوبة');
      return false;
    }
    if (draft.duration.trim().isEmpty) {
      _showValidation('المدة مطلوبة');
      return false;
    }
    if (draft.budget.trim().isEmpty) {
      _showValidation('الميزانية مطلوبة');
      return false;
    }
    if (draft.description.trim().isEmpty) {
      _showValidation('الوصف مطلوب');
      return false;
    }
    if (!earlyShare && !draft.activities.any((a) => a.lat != null && a.lng != null)) {
      _showValidation('أضف موقعاً واحداً على الأقل في خطوة الأنشطة');
      return false;
    }
    return true;
  }

  void _showValidation(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red),
    );
  }

  Future<void> _publishTrip(TripPostType type, [Map<String, dynamic>? extraData]) async {
    if (!_termsAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('يجب الموافقة على الشروط وسياسة الخصوصية لمشاركة رحلتك'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (type == TripPostType.detailed) {
      final draft = ref.read(tripDraftProvider);
      final earlyShare = extraData?['earlyShare'] == true;
      if (!_validateDetailedDraft(draft, earlyShare: earlyShare)) return;
    }

    TripDraft? draftSnapshot;
    if (type == TripPostType.detailed) {
      final d = ref.read(tripDraftProvider);
      draftSnapshot = TripDraft(
        title: d.title,
        destination: d.destination,
        city: d.city,
        duration: d.duration,
        budget: d.budget,
        season: d.season,
        description: d.description,
        rating: d.rating,
        coverImage: d.coverImage,
        coverImageUrl: d.coverImageUrl,
        activities: List.from(d.activities),
        days: List.from(d.days),
        foodPlaces: List.from(d.foodPlaces),
        hotels: List.from(d.hotels),
        taggedUsers: List.from(d.taggedUsers),
        route: List.from(d.route),
      );
    }

    final extraSnapshot = extraData != null ? Map<String, dynamic>.from(extraData) : null;
    final early = extraData?['earlyShare'] == true;

    ref.read(tripCreationTypeProvider.notifier).state = null;
    ref.read(tripDraftProvider.notifier).reset();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(early
              ? 'جاري النشر في الخلفية... يمكنك متابعة التصفح'
              : 'جاري نشر رحلتك...'),
          backgroundColor: AppColors.primaryOrange,
          duration: const Duration(seconds: 2),
        ),
      );
      context.pop();
    }

    ref.read(tripPublishProvider.notifier).publish(
      type: type,
      draft: draftSnapshot,
      extraData: extraSnapshot,
    );
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
      body: Stack(
        children: [
          postType == null
          ? _PostTypeSelection(onSelect: (type) {
              if (type == TripPostType.detailed) {
                _onSelectDetailedTrip();
              } else {
                ref.read(tripCreationTypeProvider.notifier).state = type;
              }
            })
              : _buildWorkflow(postType),
        ],
      ),
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
          isPublishing: false,
          termsAccepted: _termsAccepted,
          onTermsChanged: (v) => setState(() => _termsAccepted = v),
          onEarlyPublish: _termsAccepted
              ? () => _publishTrip(TripPostType.detailed, const {'earlyShare': true})
              : null,
          onNext: () {
            if (_currentStep == 1 && !_termsAccepted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('يجب الموافقة على الشروط وسياسة الخصوصية'),
                  backgroundColor: Colors.red,
                ),
              );
              return;
            }
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
          isPublishing: false,
          termsAccepted: _termsAccepted,
          onTermsChanged: (v) => setState(() => _termsAccepted = v),
          onPublish: (data) => _publishTrip(TripPostType.quick, data),
        );
      case TripPostType.ask:
        return _AskPostForm(
          isPublishing: false,
          termsAccepted: _termsAccepted,
          onTermsChanged: (v) => setState(() => _termsAccepted = v),
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
  final bool termsAccepted;
  final ValueChanged<bool> onTermsChanged;
  final VoidCallback? onEarlyPublish;

  const _DetailedTripWorkflow({
    required this.step,
    required this.onNext,
    required this.onPrev,
    required this.isPublishing,
    required this.termsAccepted,
    required this.onTermsChanged,
    this.onEarlyPublish,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
          onEarlyPublish: step == 1 ? onEarlyPublish : null,
        ),
      ],
    );
  }

  Widget _buildStepContent(int step, WidgetRef ref) {
    switch (step) {
      case 1:
        return _StepBasicInfo(
          termsAccepted: termsAccepted,
          onTermsChanged: onTermsChanged,
        );
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

class _StepBasicInfo extends ConsumerStatefulWidget {
  final bool termsAccepted;
  final ValueChanged<bool> onTermsChanged;

  const _StepBasicInfo({
    required this.termsAccepted,
    required this.onTermsChanged,
  });

  @override
  ConsumerState<_StepBasicInfo> createState() => _StepBasicInfoState();
}

class _StepBasicInfoState extends ConsumerState<_StepBasicInfo> {
  final TextEditingController _userSearchController = TextEditingController();
  List<User> _userSearchResults = [];
  bool _isSearchingUsers = false;

  static List<Map<String, dynamic>> get egyptGovernorates => egyptGovernoratesList;

  @override
  void dispose() {
    _userSearchController.dispose();
    super.dispose();
  }

  Future<void> _searchUsers(String query) async {
    if (query.trim().length < 2) {
      setState(() => _userSearchResults = []);
      return;
    }
    setState(() => _isSearchingUsers = true);
    try {
      final results = await ref.read(userServiceProvider).searchUsers(query);
      if (mounted) setState(() => _userSearchResults = results);
    } catch (_) {
      if (mounted) setState(() => _userSearchResults = []);
    } finally {
      if (mounted) setState(() => _isSearchingUsers = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
        const SizedBox(height: 24),
        const Text('إشارة أصدقاء (اختياري)', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        TextField(
          controller: _userSearchController,
          decoration: InputDecoration(
            hintText: 'ابحث باسم المستخدم...',
            prefixIcon: const Icon(Icons.person_search, color: Colors.indigo),
            suffixIcon: _isSearchingUsers
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                  )
                : null,
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
          ),
          onChanged: _searchUsers,
        ),
        if (_userSearchResults.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Column(
              children: _userSearchResults.take(5).map((u) {
                final tagged = draft.taggedUsers.any((t) => t['userId'] == u.clerkId);
                return ListTile(
                  dense: true,
                  leading: CircleAvatar(
                    backgroundImage: u.imageUrl != null ? NetworkImage(u.imageUrl!) : null,
                    child: u.imageUrl == null ? const Icon(Icons.person, size: 18) : null,
                  ),
                  title: Text(u.fullName ?? u.username ?? 'مستخدم', style: const TextStyle(fontSize: 13)),
                  trailing: tagged
                      ? const Icon(Icons.check, color: Colors.green, size: 18)
                      : const Icon(Icons.add, color: Colors.indigo, size: 18),
                  onTap: tagged
                      ? null
                      : () {
                          notifier.addTaggedUser({
                            'userId': u.clerkId,
                            'fullName': u.fullName ?? u.username ?? 'مستخدم',
                            'imageUrl': u.imageUrl ?? '',
                          });
                          setState(() => _userSearchResults = []);
                          _userSearchController.clear();
                        },
                );
              }).toList(),
            ),
          ),
        if (draft.taggedUsers.isNotEmpty) ...[
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: draft.taggedUsers.map((u) {
              return Chip(
                avatar: u['imageUrl'] != null && (u['imageUrl'] ?? '').isNotEmpty
                    ? CircleAvatar(backgroundImage: NetworkImage(u['imageUrl']!))
                    : null,
                label: Text(u['fullName'] ?? '', style: const TextStyle(fontSize: 12)),
                onDeleted: () => notifier.removeTaggedUser(u['userId']!),
                deleteIconColor: Colors.red,
              );
            }).toList(),
          ),
        ],
        const SizedBox(height: 24),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: widget.termsAccepted,
              onChanged: (v) => widget.onTermsChanged(v ?? false),
              activeColor: Colors.indigo,
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  'أوافق على شروط الاستخدام وسياسة الخصوصية لمشاركة رحلتي',
                  style: TextStyle(fontSize: 13, color: Colors.grey[700], height: 1.4),
                ),
              ),
            ),
          ],
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
  final VoidCallback? onEarlyPublish;

  const _WorkflowNavigation({
    required this.step,
    required this.onNext,
    required this.onPrev,
    this.isPublishing = false,
    this.onEarlyPublish,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -2))],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (onEarlyPublish != null) ...[
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: isPublishing ? null : onEarlyPublish,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  foregroundColor: Colors.green[700],
                  side: BorderSide(color: Colors.green[300]!),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                ),
                child: const Text('نشر سريع (بدون مواقع على الخريطة)'),
              ),
            ),
            const SizedBox(height: 10),
          ],
          Row(
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
  mb.PolylineAnnotationManager? _polylineManager;
  int? _selectedActivityIndex;
  bool _isAddingMode = true;
  bool _isDrawingRoute = false;
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _latController = TextEditingController();
  final TextEditingController _lngController = TextEditingController();
  final Map<int, TextEditingController> _nameControllers = {};
  final Map<int, TextEditingController> _descControllers = {};
  bool _isSearching = false;
  List<Map<String, dynamic>> _searchResults = [];

  void _syncActivityControllers(List<DraftActivity> activities) {
    final keys = _nameControllers.keys.toList();
    for (final k in keys) {
      if (k >= activities.length) {
        _nameControllers.remove(k)?.dispose();
        _descControllers.remove(k)?.dispose();
      }
    }
    for (var i = 0; i < activities.length; i++) {
      final nameCtrl = _nameControllers.putIfAbsent(i, () => TextEditingController());
      final descCtrl = _descControllers.putIfAbsent(i, () => TextEditingController());
      if (nameCtrl.text != activities[i].name) nameCtrl.text = activities[i].name;
      if (descCtrl.text != activities[i].description) descCtrl.text = activities[i].description;
    }
  }

  Future<void> _openFullscreenMap() async {
    final draft = ref.read(tripDraftProvider);
    final gov = governorateByName(draft.destination.isNotEmpty ? draft.destination : null);
    await Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (ctx) => Scaffold(
          appBar: AppBar(
            title: const Text('الخريطة — اضغط لإضافة موقع'),
            backgroundColor: Colors.orange,
            foregroundColor: Colors.white,
          ),
          body: mb.MapWidget(
            cameraOptions: mb.CameraOptions(
              center: mb.Point(coordinates: mb.Position(gov['lng'] as double, gov['lat'] as double)),
              zoom: 11.0,
            ),
            styleUri: mb.MapboxStyles.OUTDOORS,
            onMapCreated: (controller) async {
              _mapController = controller;
              await _refreshMapOverlays();
            },
            onTapListener: (gestureContext) {
              _onMapTap(gestureContext);
              if (ctx.mounted) Navigator.pop(ctx);
            },
          ),
        ),
      ),
    );
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _searchController.dispose();
    _latController.dispose();
    _lngController.dispose();
    for (final c in _nameControllers.values) {
      c.dispose();
    }
    for (final c in _descControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  void _setMapMode({bool? addingMode, bool? drawingRoute}) {
    setState(() {
      if (addingMode != null) {
        _isAddingMode = addingMode;
        if (addingMode) _isDrawingRoute = false;
      }
      if (drawingRoute != null) {
        _isDrawingRoute = drawingRoute;
        if (drawingRoute) _isAddingMode = false;
      }
    });
  }

  DraftActivity _newActivityAt(double lat, double lng, {String? name}) {
    final draft = ref.read(tripDraftProvider);
    return DraftActivity(
      name: name ?? 'موقع ${draft.activities.length + 1}',
      lat: lat,
      lng: lng,
    );
  }

  void _addActivity(DraftActivity activity, {bool select = true}) {
    final draft = ref.read(tripDraftProvider);
    final notifier = ref.read(tripDraftProvider.notifier);
    final newActivities = List<DraftActivity>.from(draft.activities)..add(activity);
    notifier.setActivities(newActivities);
    if (select) {
      setState(() => _selectedActivityIndex = newActivities.length - 1);
    }
    if (activity.lat != null && activity.lng != null) {
      notifier.addRoutePoint(activity.lat!, activity.lng!);
    }
    _refreshMapOverlays();
  }

  // ── Mapbox Geocoding Search ───────────────────────────────────────────────
  Future<void> _searchPlace(String query) async {
    if (query.trim().isEmpty) return;
    setState(() { _isSearching = true; _searchResults = []; });

    try {
      final token = dotenv.env['MAPBOX_ACCESS_TOKEN'] ?? '';
      final draft = ref.read(tripDraftProvider);
      final prox = governorateByName(draft.destination.isNotEmpty ? draft.destination : null);
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
    final placeName = result['name'].toString().split(',')[0];
    _moveToLocation(lat, lng);

    if (_selectedActivityIndex != null && !_isAddingMode) {
      final draft = ref.read(tripDraftProvider);
      final notifier = ref.read(tripDraftProvider.notifier);
      final items = List<DraftActivity>.from(draft.activities);
      items[_selectedActivityIndex!] = items[_selectedActivityIndex!].copyWith(
        lat: lat,
        lng: lng,
        name: items[_selectedActivityIndex!].name.isEmpty ? placeName : items[_selectedActivityIndex!].name,
      );
      notifier.setActivities(items);
      _refreshMapOverlays();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تم تحديد موقع "$placeName" للنشاط المختار ✅')),
      );
    } else {
      _addActivity(_newActivityAt(lat, lng, name: placeName));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تمت إضافة "$placeName" على الخريطة ✅')),
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

    if (_selectedActivityIndex != null && !_isAddingMode) {
      newActivities[_selectedActivityIndex!] =
          newActivities[_selectedActivityIndex!].copyWith(lat: lat, lng: lng);
    } else {
      newActivities.add(_newActivityAt(lat, lng));
      setState(() => _selectedActivityIndex = newActivities.length - 1);
    }

    notifier.setActivities(newActivities);
    if (newActivities.length > draft.activities.length) {
      notifier.addRoutePoint(lat, lng);
    }
    _refreshMapOverlays();
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
    _polylineManager = await controller.annotations.createPolylineAnnotationManager();

    final draft = ref.read(tripDraftProvider);
    final gov = governorateByName(draft.destination.isNotEmpty ? draft.destination : null);
    _moveToLocation(gov['lat'], gov['lng']);

    _refreshMapOverlays();
  }

  List<mb.Position> _routePositions(TripDraft draft) {
    if (draft.route.isNotEmpty) {
      return draft.route
          .where((p) => p.length >= 2)
          .map((p) => mb.Position(p[1], p[0]))
          .toList();
    }
    return draft.activities
        .where((a) => a.lat != null && a.lng != null)
        .map((a) => mb.Position(a.lng!, a.lat!))
        .toList();
  }

  Future<void> _updateRouteLine() async {
    if (_polylineManager == null) return;
    final draft = ref.read(tripDraftProvider);
    final positions = _routePositions(draft);
    await _polylineManager!.deleteAll();
    if (positions.length >= 2) {
      await _polylineManager!.create(mb.PolylineAnnotationOptions(
        geometry: mb.LineString(coordinates: positions),
        lineColor: AppColors.primaryOrange.value,
        lineWidth: 4.0,
        lineJoin: mb.LineJoin.ROUND,
        lineOpacity: 0.75,
      ));
    }
  }

  Future<void> _updateMarkers() async {
    if (_pointManager == null) return;
    final draft = ref.read(tripDraftProvider);
    final annotations = <mb.PointAnnotationOptions>[];

    for (int i = 0; i < draft.activities.length; i++) {
      final act = draft.activities[i];
      if (act.lat != null && act.lng != null) {
        final isSelected = _selectedActivityIndex == i;
        final markerColor = isSelected ? _kMapMarkerIndigo : AppColors.primaryOrange.value;
        final label = act.name.trim().isNotEmpty ? '${i + 1}' : '${i + 1}';
        annotations.add(mb.PointAnnotationOptions(
          geometry: mb.Point(coordinates: mb.Position(act.lng!, act.lat!)),
          iconImage: 'marker',
          iconSize: isSelected ? 1.85 : 1.45,
          iconColor: markerColor,
          textField: label,
          textOffset: [0.0, -2.4],
          textSize: isSelected ? 14.0 : 12.0,
          textColor: Colors.white.value,
          textHaloColor: markerColor,
          textHaloWidth: 1.8,
        ));
      }
    }
    await _pointManager!.deleteAll();
    if (annotations.isNotEmpty) {
      await _pointManager!.createMulti(annotations);
    }
    if (mounted) setState(() {});
  }

  Future<void> _refreshMapOverlays() async {
    await _updateMarkers();
    await _updateRouteLine();
  }

  void _onMapTap(mb.MapContentGestureContext context) {
    final lat = context.point.coordinates.lat.toDouble();
    final lng = context.point.coordinates.lng.toDouble();
    final draft = ref.read(tripDraftProvider);
    final notifier = ref.read(tripDraftProvider.notifier);

    if (_isDrawingRoute) {
      notifier.addRoutePoint(lat, lng);
      _refreshMapOverlays();
      return;
    }

    if (_isAddingMode) {
      _addActivity(_newActivityAt(lat, lng));
      return;
    }

    if (_selectedActivityIndex == null) return;

    final newActivities = List<DraftActivity>.from(draft.activities);
    newActivities[_selectedActivityIndex!] = newActivities[_selectedActivityIndex!].copyWith(
      lat: lat,
      lng: lng,
    );

    notifier.setActivities(newActivities);
    _refreshMapOverlays();
  }

  Future<void> _pickActivityMedia(int activityIndex) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm'],
      allowMultiple: true,
    );
    if (result == null || result.files.isEmpty) return;

    const maxVideoBytes = 45 * 1024 * 1024;
    final draft = ref.read(tripDraftProvider);
    final activity = draft.activities[activityIndex];
    final images = List<dynamic>.from(activity.images);
    final videos = List<dynamic>.from(activity.videos);
    String? coverPath = activity.imagePath;

    for (final file in result.files) {
      final path = file.path;
      if (path == null) continue;
      if (_isVideoPath(path)) {
        final size = file.size > 0 ? file.size : await File(path).length();
        if (size > maxVideoBytes) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('حجم الفيديو يجب أن لا يتجاوز 45 ميجابايت'),
                backgroundColor: Colors.red,
              ),
            );
          }
          continue;
        }
        videos.add(path);
      } else {
        images.add(path);
        coverPath ??= path;
      }
    }

    final items = List<DraftActivity>.from(draft.activities);
    items[activityIndex] = items[activityIndex].copyWith(
      images: images,
      videos: videos,
      imagePath: coverPath,
    );
    ref.read(tripDraftProvider.notifier).setActivities(items);
    if (mounted) setState(() {});
  }

  void _removeActivityMedia(int activityIndex, String path, {required bool isVideo}) {
    final draft = ref.read(tripDraftProvider);
    final activity = draft.activities[activityIndex];
    final items = List<DraftActivity>.from(draft.activities);
    if (isVideo) {
      items[activityIndex] = activity.copyWith(
        videos: activity.videos.where((v) => v != path).toList(),
      );
    } else {
      final newImages = activity.images.where((img) => img != path).toList();
      final newCover = activity.imagePath == path
          ? (newImages.isNotEmpty ? newImages.first as String : null)
          : activity.imagePath;
      items[activityIndex] = activity.copyWith(
        images: newImages,
        imagePath: newCover,
      );
    }
    ref.read(tripDraftProvider.notifier).setActivities(items);
    setState(() {});
  }

  Widget _buildMapModeChip({
    required String label,
    required IconData icon,
    required bool active,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: active ? activeColor : Colors.white,
      borderRadius: BorderRadius.circular(20),
      elevation: active ? 2 : 1,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: active ? Colors.white : activeColor),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: active ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActivityMediaStrip(DraftActivity activity, int index) {
    final mediaItems = <({String path, bool isVideo})>[];
    for (final img in activity.images) {
      if (img is String) mediaItems.add((path: img, isVideo: false));
    }
    for (final vid in activity.videos) {
      if (vid is String) mediaItems.add((path: vid, isVideo: true));
    }
    if (activity.imagePath != null &&
        activity.imagePath!.isNotEmpty &&
        !mediaItems.any((m) => m.path == activity.imagePath)) {
      mediaItems.insert(0, (path: activity.imagePath!, isVideo: _isVideoPath(activity.imagePath!)));
    }

    return SizedBox(
      height: 72,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          GestureDetector(
            onTap: () => _pickActivityMedia(index),
            child: Container(
              width: 64,
              height: 64,
              margin: const EdgeInsets.only(left: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.indigo.withOpacity(0.4), width: 1.5),
                color: Colors.indigo.withOpacity(0.05),
              ),
              child: const Icon(Icons.add, color: Colors.indigo),
            ),
          ),
          ...mediaItems.map((item) {
            return Stack(
              children: [
                GestureDetector(
                  onTap: item.isVideo ? () => VideoPreviewDialog.show(context, item.path) : null,
                  child: Container(
                    width: 64,
                    height: 64,
                    margin: const EdgeInsets.only(left: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: Colors.grey[200],
                      image: !item.isVideo
                          ? DecorationImage(
                              image: item.path.startsWith('data:')
                                  ? MemoryImage(base64Decode(item.path.split(',').last))
                                  : FileImage(File(item.path)) as ImageProvider,
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: item.isVideo
                        ? const Center(child: Icon(Icons.play_circle_fill, color: Colors.indigo, size: 28))
                        : null,
                  ),
                ),
                Positioned(
                  top: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: () => _removeActivityMedia(index, item.path, isVideo: item.isVideo),
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                      child: const Icon(Icons.close, size: 12, color: Colors.white),
                    ),
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(tripDraftProvider);
    final notifier = ref.read(tripDraftProvider.notifier);
    _syncActivityControllers(draft.activities);

    ref.listen<TripDraft>(tripDraftProvider, (previous, next) {
      if (previous?.activities != next.activities || previous?.route != next.route) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _refreshMapOverlays());
      }
    });

    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    final mapHeight = keyboardOpen ? 200.0 : 280.0;

    return Column(
      children: [
        SizedBox(
          height: mapHeight,
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
                left: 10,
                child: FloatingActionButton.small(
                  heroTag: 'expand_map',
                  backgroundColor: Colors.white,
                  onPressed: _openFullscreenMap,
                  child: const Icon(Icons.fullscreen, color: Colors.orange),
                ),
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
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildMapModeChip(
                            label: _isAddingMode ? 'إيقاف الإضافة' : 'إضافة موقع',
                            icon: Icons.add_location_alt,
                            active: _isAddingMode,
                            activeColor: Colors.green,
                            onTap: () => _setMapMode(addingMode: !_isAddingMode),
                          ),
                          const SizedBox(width: 8),
                          _buildMapModeChip(
                            label: _isDrawingRoute ? 'إيقاف الرسم' : 'رسم المسار',
                            icon: Icons.route,
                            active: _isDrawingRoute,
                            activeColor: Colors.indigo,
                            onTap: () => _setMapMode(drawingRoute: !_isDrawingRoute),
                          ),
                          if (draft.route.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            _buildMapModeChip(
                              label: 'مسح المسار',
                              icon: Icons.delete_outline,
                              active: false,
                              activeColor: Colors.red,
                              onTap: () {
                                notifier.clearRoute();
                                _refreshMapOverlays();
                              },
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.55),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        _isDrawingRoute
                            ? '✏️ اضغط على الخريطة لرسم نقاط المسار'
                            : _isAddingMode
                                ? '📍 اضغط على الخريطة أو ابحث لإضافة موقع'
                                : _selectedActivityIndex != null
                                    ? '🎯 حدّد موقع: ${draft.activities[_selectedActivityIndex!].name}'
                                    : 'اختر نشاطاً من القائمة أو فعّل وضع الإضافة',
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
              Positioned(
                bottom: 16,
                left: 16,
                right: 16,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    FloatingActionButton.small(
                      heroTag: 'manual_coords',
                      onPressed: _showManualLocationDialog,
                      backgroundColor: Colors.white,
                      child: const Icon(Icons.pin_drop, color: Colors.orange),
                    ),
                    if (draft.activities.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
                        ),
                        child: Text(
                          '${draft.activities.length} موقع',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(
            children: [
              Text(
                'المواقع (${draft.activities.length})',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const Spacer(),
              Text(
                'صور + فيديو لكل موقع',
                style: TextStyle(fontSize: 11, color: Colors.grey[500]),
              ),
            ],
          ),
        ),
        // List of activities
        Expanded(
          child: draft.activities.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.map_outlined, size: 56, color: Colors.grey[300]),
                      const SizedBox(height: 12),
                      Text('لا توجد مواقع بعد', style: TextStyle(color: Colors.grey[500], fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Text(
                        'فعّل "إضافة موقع" واضغط على الخريطة',
                        style: TextStyle(color: Colors.grey[400], fontSize: 12),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + MediaQuery.viewInsetsOf(context).bottom),
                  itemCount: draft.activities.length + 1,
                  itemBuilder: (context, i) {
                    if (i == draft.activities.length) {
                      return Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: OutlinedButton.icon(
                          onPressed: () {
                            _setMapMode(addingMode: true);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('اضغط على الخريطة لإضافة موقع جديد')),
                            );
                          },
                          icon: const Icon(Icons.add),
                          label: const Text('إضافة موقع من الخريطة'),
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
                        side: isSelected
                            ? const BorderSide(color: Color(0xFF4F46E5), width: 2)
                            : BorderSide.none,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 14,
                                  backgroundColor: isSelected ? const Color(0xFF4F46E5) : Colors.orange,
                                  child: Text('${i + 1}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: TextField(
                                    controller: _nameControllers[i],
                                    onTap: () {
                                      setState(() {
                                        _selectedActivityIndex = i;
                                        _setMapMode(addingMode: false, drawingRoute: false);
                                      });
                                      _refreshMapOverlays();
                                    },
                                    onChanged: (v) {
                                      final items = List<DraftActivity>.from(draft.activities);
                                      items[i] = items[i].copyWith(name: v);
                                      notifier.setActivities(items);
                                    },
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    decoration: const InputDecoration(
                                      hintText: 'اسم الموقع / المعلم',
                                      border: InputBorder.none,
                                      isDense: true,
                                      contentPadding: EdgeInsets.zero,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                  onPressed: () {
                                    final items = List<DraftActivity>.from(draft.activities);
                                    items.removeAt(i);
                                    notifier.setActivities(items);
                                    if (_selectedActivityIndex == i) {
                                      setState(() => _selectedActivityIndex = null);
                                    } else if (_selectedActivityIndex != null && _selectedActivityIndex! > i) {
                                      setState(() => _selectedActivityIndex = _selectedActivityIndex! - 1);
                                    }
                                    _refreshMapOverlays();
                                  },
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            activity.lat != null
                                ? Row(
                                    children: [
                                      const Icon(Icons.location_on, color: Colors.orange, size: 14),
                                      const SizedBox(width: 4),
                                      Text(
                                        '${activity.lat!.toStringAsFixed(4)}, ${activity.lng!.toStringAsFixed(4)}',
                                        style: TextStyle(fontSize: 11, color: Colors.grey[600], fontFamily: 'monospace'),
                                      ),
                                      const Spacer(),
                                      TextButton.icon(
                                        onPressed: () {
                                          setState(() {
                                            _selectedActivityIndex = i;
                                            _setMapMode(addingMode: false, drawingRoute: false);
                                          });
                                          if (activity.lat != null && activity.lng != null) {
                                            _moveToLocation(activity.lat!, activity.lng!);
                                          }
                                          _refreshMapOverlays();
                                        },
                                        icon: const Icon(Icons.edit_location_alt, size: 14),
                                        label: const Text('تحريك', style: TextStyle(fontSize: 11)),
                                      ),
                                    ],
                                  )
                                : Text(
                                    'لم يُحدد موقع — اضغط "تحريك" ثم اختر على الخريطة',
                                    style: TextStyle(fontSize: 11, color: Colors.orange[700]),
                                  ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _descControllers[i],
                              onChanged: (v) {
                                final items = List<DraftActivity>.from(draft.activities);
                                items[i] = items[i].copyWith(description: v);
                                notifier.setActivities(items);
                              },
                              maxLines: 3,
                              style: const TextStyle(fontSize: 12),
                              decoration: InputDecoration(
                                hintText: 'وصف المكان (اختياري)',
                                filled: true,
                                fillColor: Colors.grey[50],
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              ),
                            ),
                            const SizedBox(height: 10),
                            _buildActivityMediaStrip(activity, i),
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
class _StepOrganizeDays extends ConsumerStatefulWidget {
  const _StepOrganizeDays({super.key});

  @override
  ConsumerState<_StepOrganizeDays> createState() => _StepOrganizeDaysState();
}

class _StepOrganizeDaysState extends ConsumerState<_StepOrganizeDays> {
  int _selectedDayIndex = 0;

  String _activityDayLabels(TripDraft draft, int activityIndex) {
    final labels = <String>[];
    for (var d = 0; d < draft.days.length; d++) {
      if (draft.days[d].activityIndices.contains(activityIndex)) {
        labels.add(draft.days[d].title);
      }
    }
    return labels.isEmpty ? '' : labels.join('، ');
  }

  void _copyFromPreviousDay(TripDraft draft, TripDraftNotifier notifier) {
    if (_selectedDayIndex == 0) return;
    final newDays = List<DraftDay>.from(draft.days);
    final prev = newDays[_selectedDayIndex - 1].activityIndices;
    newDays[_selectedDayIndex] = DraftDay(
      title: newDays[_selectedDayIndex].title,
      activityIndices: List<int>.from(prev),
    );
    notifier.setDays(newDays);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('تم نسخ أنشطة ${newDays[_selectedDayIndex - 1].title}')),
    );
  }

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
              Expanded(
                child: Text(
                  'اضغط على نشاط لإضافته لـ ${selectedDay.title}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ),
              if (_selectedDayIndex > 0)
                TextButton.icon(
                  onPressed: () => _copyFromPreviousDay(draft, notifier),
                  icon: const Icon(Icons.copy, size: 14),
                  label: const Text('نسخ من اليوم السابق', style: TextStyle(fontSize: 11)),
                ),
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
                    final otherDays = _activityDayLabels(draft, i);
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
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (activity.lat != null)
                              Text('${activity.lat!.toStringAsFixed(3)}, ${activity.lng!.toStringAsFixed(3)}', style: const TextStyle(fontSize: 10)),
                            if (otherDays.isNotEmpty && !isAssigned)
                              Text('مُضاف في: $otherDays', style: TextStyle(fontSize: 10, color: Colors.blue[700])),
                          ],
                        ),
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
    final cover = draft.coverImageUrl.isNotEmpty
        ? (draft.coverImageUrl.startsWith('http')
            ? NetworkImage(draft.coverImageUrl)
            : FileImage(File(draft.coverImageUrl)) as ImageProvider)
        : null;

    return ListView(
      padding: const EdgeInsets.all(0),
      children: [
        if (cover != null)
          Stack(
            children: [
              SizedBox(
                height: 220,
                width: double.infinity,
                child: Image(image: cover, fit: BoxFit.cover),
              ),
              Container(
                height: 220,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black.withValues(alpha: 0.75)],
                  ),
                ),
              ),
              Positioned(
                bottom: 16,
                right: 16,
                left: 16,
                child: Text(
                  draft.title.isNotEmpty ? draft.title : 'رحلتك الجديدة',
                  style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (cover == null)
                Text(
                  draft.title.isNotEmpty ? draft.title : 'رحلتك الجديدة',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (draft.destination.isNotEmpty) _chip('📍 ${draft.destination}'),
                  if (draft.duration.isNotEmpty) _chip('⏱ ${draft.duration}'),
                  if (draft.budget.isNotEmpty) _chip('💰 ${draft.budget}'),
                ],
              ),
              if (draft.description.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text('نظرة عامة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(draft.description, style: const TextStyle(height: 1.7, fontSize: 15)),
                ),
              ],
              const SizedBox(height: 24),
              const Text('الأنشطة والمواقع', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              ...draft.activities.asMap().entries.map((e) {
                final act = e.value;
                final dayNum = draft.days.indexWhere((d) => d.activityIndices.contains(e.key));
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.orange.shade100,
                      child: Text('${e.key + 1}', style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold)),
                    ),
                    title: Text(act.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(
                      [
                        if (dayNum >= 0) draft.days[dayNum].title,
                        if (act.description.isNotEmpty) act.description,
                      ].join(' • '),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                );
              }),
              if (draft.hotels.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text('الإقامة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...draft.hotels.map((h) => ListTile(
                      leading: const Icon(Icons.hotel, color: Colors.blue),
                      title: Text(h.name),
                      subtitle: Text(h.stayDays > 1 ? '${h.description} (${h.stayDays} ليالي)' : h.description),
                    )),
              ],
              const SizedBox(height: 24),
              const Text(
                'بضغطك على "نشر الرحلة"، سيتم مشاركة تجربتك مع باقي المسافرين.',
                style: TextStyle(color: Colors.grey, fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _chip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
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
                      setDialogState(() {
                        selectedImage = File(img.path);
                        base64Img = img.path;
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
                        leading: _draftImageLeading(food.image, Icons.restaurant, Colors.orange),
                        title: Text(food.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(food.description),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => ref.read(tripDraftProvider.notifier).removeFoodPlace(i),
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
    int stayDays = 1;

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
                Row(
                  children: [
                    const Text('مدة الإقامة:', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(width: 12),
                    DropdownButton<int>(
                      value: stayDays,
                      items: List.generate(14, (i) => i + 1)
                          .map((d) => DropdownMenuItem(value: d, child: Text('$d ${d == 1 ? 'ليلة' : 'ليالي'}')))
                          .toList(),
                      onChanged: (v) => setDialogState(() => stayDays = v ?? 1),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () async {
                    final img = await picker.ImagePicker().pickImage(source: picker.ImageSource.gallery);
                    if (img != null) {
                      setDialogState(() {
                        selectedImage = File(img.path);
                        base64Img = img.path;
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
                  DraftHotel(name: nameCtrl.text, description: descCtrl.text, image: base64Img, stayDays: stayDays),
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
                        leading: _draftImageLeading(hotel.image, Icons.hotel, Colors.blue),
                        title: Text(hotel.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(
                          hotel.stayDays > 1
                              ? '${hotel.description}\n🛏️ ${hotel.stayDays} ليالي'
                              : hotel.description,
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => ref.read(tripDraftProvider.notifier).removeHotel(i),
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
  final bool termsAccepted;
  final ValueChanged<bool> onTermsChanged;

  const _QuickPostForm({
    super.key,
    required this.onPublish,
    required this.isPublishing,
    required this.termsAccepted,
    required this.onTermsChanged,
  });

  @override
  State<_QuickPostForm> createState() => _QuickPostFormState();
}

class _QuickPostFormState extends State<_QuickPostForm> {
  String _title = '';
  String _destination = '';
  String _description = '';
  String? _coverPath;
  final List<String> _mediaPaths = [];

  Future<void> _pickCover() async {
    final picked = await picker.ImagePicker().pickImage(source: picker.ImageSource.gallery);
    if (picked != null) setState(() => _coverPath = picked.path);
  }

  Future<void> _pickMedia() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov'],
      allowMultiple: true,
    );
    if (result == null) return;
    setState(() {
      for (final f in result.files) {
        if (f.path != null) _mediaPaths.add(f.path!);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('شارك لحظة سريعة', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          TextFormField(
            onChanged: (v) => setState(() => _title = v),
            decoration: _fieldDecoration('عنوان البوست'),
          ),
          const SizedBox(height: 12),
          TextFormField(
            onChanged: (v) => setState(() => _destination = v),
            decoration: _fieldDecoration('الوجهة (مثال: الأقصر)'),
          ),
          const SizedBox(height: 12),
          TextFormField(
            maxLines: 4,
            onChanged: (v) => setState(() => _description = v),
            decoration: _fieldDecoration('بم تفكر؟ شارك تفاصيل سريعة...'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickCover,
                  icon: const Icon(Icons.image, size: 18),
                  label: Text(_coverPath != null ? 'تغيير الغلاف' : 'صورة غلاف'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickMedia,
                  icon: const Icon(Icons.perm_media, size: 18),
                  label: Text('وسائط (${_mediaPaths.length})'),
                ),
              ),
            ],
          ),
          if (_coverPath != null) ...[
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(File(_coverPath!), height: 100, width: double.infinity, fit: BoxFit.cover),
            ),
          ],
          if (_mediaPaths.isNotEmpty) ...[
            const SizedBox(height: 8),
            SizedBox(
              height: 72,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _mediaPaths.length,
                itemBuilder: (_, i) => Stack(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      margin: const EdgeInsets.only(left: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        color: Colors.grey[200],
                        image: !_isVideoPath(_mediaPaths[i])
                            ? DecorationImage(image: FileImage(File(_mediaPaths[i])), fit: BoxFit.cover)
                            : null,
                      ),
                      child: _isVideoPath(_mediaPaths[i]) ? const Icon(Icons.videocam) : null,
                    ),
                    Positioned(
                      top: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: () => setState(() => _mediaPaths.removeAt(i)),
                        child: const CircleAvatar(radius: 10, backgroundColor: Colors.red, child: Icon(Icons.close, size: 12, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(value: widget.termsAccepted, onChanged: (v) => widget.onTermsChanged(v ?? false), activeColor: Colors.indigo),
              const Expanded(child: Text('أوافق على الشروط وسياسة الخصوصية', style: TextStyle(fontSize: 12))),
            ],
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: widget.isPublishing ||
                    !widget.termsAccepted ||
                    _title.trim().isEmpty ||
                    _destination.trim().isEmpty ||
                    _description.trim().isEmpty
                ? null
                : () => widget.onPublish({
                      'title': _title,
                      'destination': _destination,
                      'description': _description,
                      'coverPath': _coverPath,
                      'mediaPaths': List<String>.from(_mediaPaths),
                    }),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            ),
            child: widget.isPublishing
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('نشر الآن'),
          ),
        ],
      ),
    );
  }

  InputDecoration _fieldDecoration(String hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
      );
}

class _AskPostForm extends StatefulWidget {
  final Function(Map<String, dynamic>) onPublish;
  final bool isPublishing;
  final bool termsAccepted;
  final ValueChanged<bool> onTermsChanged;

  const _AskPostForm({
    super.key,
    required this.onPublish,
    required this.isPublishing,
    required this.termsAccepted,
    required this.onTermsChanged,
  });

  @override
  State<_AskPostForm> createState() => _AskPostFormState();
}

class _AskPostFormState extends State<_AskPostForm> {
  String _description = '';
  String? _imagePath;

  Future<void> _pickImage() async {
    final picked = await picker.ImagePicker().pickImage(source: picker.ImageSource.gallery);
    if (picked != null) setState(() => _imagePath = picked.path);
  }

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
            maxLines: 6,
            onChanged: (v) => setState(() => _description = v),
            decoration: InputDecoration(
              hintText: 'اكتب سؤالك أو استفسارك...',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.grey[200]!)),
            ),
          ),
          const SizedBox(height: 12),
          if (_imagePath != null)
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(File(_imagePath!), height: 120, width: double.infinity, fit: BoxFit.cover),
                ),
                Positioned(
                  top: 4,
                  right: 4,
                  child: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => setState(() => _imagePath = null),
                    style: IconButton.styleFrom(backgroundColor: Colors.black54),
                  ),
                ),
              ],
            )
          else
            OutlinedButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.add_a_photo),
              label: const Text('إضافة صورة (اختياري)'),
            ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(value: widget.termsAccepted, onChanged: (v) => widget.onTermsChanged(v ?? false), activeColor: Colors.teal),
              const Expanded(child: Text('أوافق على الشروط وسياسة الخصوصية', style: TextStyle(fontSize: 12))),
            ],
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: widget.isPublishing || !widget.termsAccepted || _description.trim().isEmpty
                ? null
                : () => widget.onPublish({
                      'description': _description,
                      if (_imagePath != null) 'imagePath': _imagePath,
                    }),
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


