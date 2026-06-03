import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:dio/dio.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../core/env_config.dart';

import '../../theme/app_colors.dart';
import '../../models/user.dart';
import '../../models/trip.dart';
import '../../models/memory.dart';
import '../../core/exceptions.dart';
import '../../services/user_service.dart';
import '../../services/api_service.dart';
import 'package:dio/dio.dart';
import '../../providers/api_provider.dart';
import '../../providers/trip_provider.dart';
import '../../providers/user_provider.dart';
import 'memory_create_dialog.dart';
import 'memory_viewer_page.dart';
import 'profile_edit_sheet.dart';
import 'profile_network_page.dart';
import 'stories_archive_page.dart';
import '../company/company_dashboard_page.dart';

final userProfileProvider = FutureProvider.family<User, String>((ref, id) {
  return ref.watch(userServiceProvider).getUserById(id);
});

final userMemoriesProvider = FutureProvider.family<List<TravelMemory>, String>((ref, clerkId) {
  return ref.read(memoryServiceProvider).getMemories(clerkId);
});

class UserProfilePage extends ConsumerStatefulWidget {
  final String userId;
  const UserProfilePage({super.key, required this.userId});

  @override
  ConsumerState<UserProfilePage> createState() => _UserProfilePageState();
}

class _UserProfilePageState extends ConsumerState<UserProfilePage> with TickerProviderStateMixin {
  late TabController _tabController;
  final ImagePicker _picker = ImagePicker();
  bool? _followOverride;
  int? _followersOverride;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _pickAndCropImage(bool isCover) async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;

    final croppedFile = await ImageCropper().cropImage(
      sourcePath: image.path,
      aspectRatio: isCover ? const CropAspectRatio(ratioX: 16, ratioY: 9) : const CropAspectRatio(ratioX: 1, ratioY: 1),
      uiSettings: [
        AndroidUiSettings(
          toolbarTitle: isCover ? 'قص صورة الغلاف' : 'قص صورة الملف الشخصي',
          toolbarColor: AppColors.primaryOrange,
          toolbarWidgetColor: Colors.white,
          initAspectRatio: isCover ? CropAspectRatioPreset.ratio16x9 : CropAspectRatioPreset.square,
          lockAspectRatio: true,
        ),
        IOSUiSettings(
          title: isCover ? 'قص صورة الغلاف' : 'قص صورة الملف الشخصي',
          aspectRatioLockEnabled: true,
        ),
      ],
    );

    if (croppedFile != null) {
      _uploadImage(File(croppedFile.path), isCover);
    }
  }

  bool _isOwnProfile(User user) => widget.userId == 'me';

  String _clerkId(User user) => _isOwnProfile(user) ? user.clerkId : widget.userId;

  bool _isFollowing(User user) => _followOverride ?? user.viewerFollows;

  int _followersCount(User user) => _followersOverride ?? user.followers;

  Future<void> _uploadImage(File file, bool isCover) async {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('جاري رفع الصورة...')));
    try {
      final url = await ref.read(mediaUploadServiceProvider).uploadImageFile(file);
      await ref.read(userServiceProvider).updateProfile({
        isCover ? 'coverImage' : 'imageUrl': url,
      });
      ref.invalidate(userProfileProvider(widget.userId));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم التحديث بنجاح')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('فشل التحديث: $e')));
    }
  }

  Future<void> _toggleFollow(User user) async {
    try {
      final result = await ref.read(userServiceProvider).toggleFollow(user.clerkId);
      setState(() {
        _followOverride = result.following;
        _followersOverride = result.followers;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('فشل المتابعة: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(userProfileProvider(widget.userId));
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeRole = ref.watch(userRoleProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      body: userAsync.when(
        data: (user) {
          // Dynamic Adaptive Layout: Render Company Profile if company role is active
          final isCompany = (widget.userId == 'me' && activeRole == 'company') || user.profileType == 'company';
          if (isCompany) {
            return _buildCompanyProfileBody(context, user, isDark);
          }
          return _buildProfileBody(context, user, isDark);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('خطأ في تحميل البيانات: $e')),
      ),
    );
  }

  // ================= COMPANY PROFILE ADAPTIVE BODY =================
  Widget _buildCompanyProfileBody(BuildContext context, User user, bool isDark) {
    return DefaultTabController(
      length: 3,
      child: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverToBoxAdapter(
            child: _buildCompanyHeader(user, isDark),
          ),
          SliverPersistentHeader(
            pinned: true,
            delegate: _SliverTabBarDelegate(
              TabBar(
                indicatorColor: AppColors.primaryOrange,
                labelColor: AppColors.primaryOrange,
                unselectedLabelColor: Colors.grey,
                labelStyle: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 12),
                tabs: const [
                  Tab(icon: Icon(Icons.map_outlined, size: 20), text: 'رحلاتنا'),
                  Tab(icon: Icon(Icons.dashboard_outlined, size: 20), text: 'لوحة التحكم'),
                  Tab(icon: Icon(Icons.local_offer_outlined, size: 20), text: 'الكوبونات'),
                ],
              ),
              isDark,
            ),
          ),
        ],
        body: TabBarView(
          children: [
            _buildCompanyTripsGrid(user, isDark),
            const CompanyDashboardPage(), // Directly embeds the real-time company dashboard!
            _buildCompanyCouponsView(user, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildCompanyHeader(User user, bool isDark) {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            // 1. Cover Image
            GestureDetector(
              onTap: () => widget.userId == 'me' ? _pickAndCropImage(true) : null,
              child: Stack(
                children: [
                  Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.indigo.shade600, Colors.purple.shade600],
                      ),
                    ),
                    child: user.coverImage != null
                        ? CachedNetworkImage(
                            imageUrl: user.coverImage!,
                            fit: BoxFit.cover,
                            errorWidget: (context, url, error) => const SizedBox.shrink(),
                          )
                        : const SizedBox.shrink(),
                  ),
                  if (widget.userId == 'me')
                    Positioned(
                      top: 40,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 18),
                      ),
                    ),
                ],
              ),
            ),
            // Menu Button
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.menu, color: Colors.white, size: 28),
                onPressed: () => _showSettingsMenu(context),
              ),
            ),
            // 2. Profile Logo
            Positioned(
              bottom: -40,
              child: GestureDetector(
                onTap: () => widget.userId == 'me' ? _pickAndCropImage(false) : null,
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: isDark ? AppColors.darkBackground : Colors.white, width: 4),
                    boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: const Offset(0, 4))],
                  ),
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.grey[200],
                    backgroundImage: CachedNetworkImageProvider(user.imageUrl ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 50),
        
        // Company Name + Blue Verified Checkmark
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              user.fullName ?? 'شركة سياحة',
              style: GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 6),
            const Icon(Icons.verified_rounded, color: Colors.blueAccent, size: 20),
          ],
        ),
        Text(
          '@${user.username ?? 'company'} • شركة سياحية معتمدة',
          style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey),
        ),
        const SizedBox(height: 8),
        if (user.bio != null && user.bio!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              user.bio!,
              style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ),
        const SizedBox(height: 16),
        
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
             _buildStat('الرحلات المنشورة', user.tripsCount),
             _buildStat('التقييم العام', 5), // Premium default rating
             _buildStat('المتابعين', user.followers),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildCompanyTripsGrid(User user, bool isDark) {
    final companyId = user.companyId;
    if (companyId == null) {
      return _buildEmptyState('لم يتم ربط هذا الحساب بملف شركة نشط بعد');
    }

    return FutureBuilder<Response>(
      future: ref.read(apiServiceProvider).get('/corporate/trips?companyId=$companyId'),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange));
        }
        if (snapshot.hasError || !snapshot.hasData) {
          return _buildEmptyState('لا توجد رحلات شركات منشورة حالياً');
        }

        final data = snapshot.data!.data;
        final trips = data is Map ? (data['trips'] ?? []) : (data is List ? data : []);

        if (trips.isEmpty) {
          return _buildEmptyState('لم تقم بنشر أي رحلة شركة بعد');
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: trips.length,
          itemBuilder: (context, index) {
            final trip = trips[index];
            final images = trip['images'] as List?;
            final imageUrl = (images != null && images.isNotEmpty) ? images[0] : '';
            final price = trip['price'] ?? '0';
            
            return Card(
              color: isDark ? AppColors.cardDark : Colors.white,
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              child: ListTile(
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: imageUrl.isNotEmpty
                      ? CachedNetworkImage(imageUrl: imageUrl, width: 60, height: 60, fit: BoxFit.cover)
                      : Container(width: 60, height: 60, color: Colors.grey[200]),
                ),
                title: Text(trip['title'] ?? '', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: Text('📍 ${trip['destination'] ?? ''} • $price ج.م', style: GoogleFonts.cairo(fontSize: 12)),
                trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                onTap: () => context.push('/corporate-trip/${trip['_id'] ?? trip['id']}', extra: trip),
              ),
            );
          },
        );
      },
    );
  }

  // --- Dynamic Company Coupon Manager ---
  Widget _buildCompanyCouponsView(User user, bool isDark) {
    final api = ref.read(apiServiceProvider);
    
    return StatefulBuilder(
      builder: (context, setCouponState) {
        return FutureBuilder<Response>(
          future: api.get('/coupons/my-coupons'),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange));
            }
            
            final coupons = snapshot.hasData ? (snapshot.data!.data as List? ?? []) : [];

            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('كوبونات الخصم الفعالة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15)),
                      ElevatedButton.icon(
                        onPressed: () => _showCreateCouponDialog(context, () => setCouponState(() {})),
                        icon: const Icon(Icons.add, size: 16, color: Colors.white),
                        label: Text('كوبون جديد', style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryOrange,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: coupons.isEmpty
                      ? _buildEmptyState('لا توجد كوبونات خصم مضافة بعد')
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: coupons.length,
                          itemBuilder: (context, index) {
                            final coupon = coupons[index];
                            final isPercentage = coupon['discountType'] == 'percentage';
                            final discVal = isPercentage ? '${coupon['discountValue']}%' : '${coupon['discountValue']} ج.م';
                            final exp = DateTime.tryParse(coupon['expiryDate'] ?? '') ?? DateTime.now();
                            final expiryStr = DateFormat('yyyy/MM/dd').format(exp);
                            
                            return Card(
                              color: isDark ? AppColors.cardDark : Colors.white,
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                              child: ListTile(
                                leading: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(color: Colors.amber.withOpacity(0.1), shape: BoxShape.circle),
                                  child: const Icon(Icons.local_offer, color: Colors.amber),
                                ),
                                title: Text(coupon['code'] ?? '', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                                subtitle: Text('خصم: $discVal • ينتهي: $expiryStr', style: GoogleFonts.cairo(fontSize: 12)),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                                  onPressed: () async {
                                    final res = await api.delete('/coupons/${coupon['_id']}');
                                    if (res.statusCode == 200) {
                                      _uploadSuccessNotification('تم حذف الكوبون بنجاح');
                                      setCouponState(() {});
                                    }
                                  },
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showCreateCouponDialog(BuildContext context, VoidCallback onCreated) {
    final codeCtrl = TextEditingController();
    final valCtrl = TextEditingController();
    final limitCtrl = TextEditingController();
    String discountType = 'percentage';
    DateTime selectedDate = DateTime.now().add(const Duration(days: 30));

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text('إنشاء كوبون خصم جديد', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: codeCtrl,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(
                        labelText: 'كود الخصم (مثل: SPRING30)',
                        labelStyle: GoogleFonts.cairo(fontSize: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButton<String>(
                      value: discountType,
                      isExpanded: true,
                      items: const [
                        DropdownMenuItem(value: 'percentage', child: Text('نسبة مئوية (%)')),
                        DropdownMenuItem(value: 'fixed', child: Text('قيمة ثابتة (ج.م)')),
                      ],
                      onChanged: (val) {
                        if (val != null) setDialogState(() => discountType = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: valCtrl,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'قيمة الخصم',
                        labelStyle: GoogleFonts.cairo(fontSize: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: limitCtrl,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'الحد الأقصى للاستخدام (اختياري)',
                        labelStyle: GoogleFonts.cairo(fontSize: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('تاريخ الانتهاء:', style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey)),
                        TextButton(
                          onPressed: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: selectedDate,
                              firstDate: DateTime.now(),
                              lastDate: DateTime.now().add(const Duration(days: 365)),
                            );
                            if (picked != null) {
                              setDialogState(() => selectedDate = picked);
                            }
                          },
                          child: Text(DateFormat('yyyy/MM/dd').format(selectedDate), style: const TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('إلغاء', style: GoogleFonts.cairo(color: Colors.grey)),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (codeCtrl.text.isEmpty || valCtrl.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('برجاء ملء جميع الحقول')));
                      return;
                    }
                    try {
                      final api = ref.read(apiServiceProvider);
                      final response = await api.post('/coupons', data: {
                        'code': codeCtrl.text.toUpperCase().trim(),
                        'discountType': discountType,
                        'discountValue': double.tryParse(valCtrl.text) ?? 0.0,
                        'expiryDate': selectedDate.toIso8601String(),
                        'usageLimit': int.tryParse(limitCtrl.text),
                        'applicableTrips': [],
                      });
                      
                      if (response.statusCode == 201 || response.statusCode == 200) {
                        Navigator.pop(context);
                        _uploadSuccessNotification('تم إنشاء الكوبون بنجاح 🎫');
                        onCreated();
                      }
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('فشل الإنشاء: $e')));
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryOrange),
                  child: Text('إنشاء الكوبون', style: GoogleFonts.cairo(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _uploadSuccessNotification(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.green,
      ),
    );
  }

  // ================= STANDARD TRAVELER PROFILE BODY =================
  Widget _buildProfileBody(BuildContext context, User user, bool isDark) {
    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        SliverToBoxAdapter(
          child: _buildUnifiedHeader(user, isDark),
        ),
        SliverToBoxAdapter(
          child: _buildMemoriesSection(user, isDark),
        ),
        SliverPersistentHeader(
          pinned: true,
          delegate: _SliverTabBarDelegate(
            TabBar(
              controller: _tabController,
              isScrollable: false,
              indicatorColor: AppColors.primaryOrange,
              labelColor: AppColors.primaryOrange,
              unselectedLabelColor: Colors.grey,
              labelStyle: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 11),
              tabs: const [
                Tab(icon: Icon(Icons.grid_view_rounded, size: 20), text: 'الرحلات العامة'),
                Tab(icon: Icon(Icons.smart_toy_outlined, size: 20), text: 'مساعد ذكي'),
                Tab(icon: Icon(Icons.confirmation_number_outlined, size: 20), text: 'حجوزاتي'),
                Tab(icon: Icon(Icons.bookmark_outline_rounded, size: 20), text: 'المحفوظات'),
              ],
            ),
            isDark,
          ),
        ),
      ],
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildTripsGrid(user, false),
          _buildTripsGrid(user, true),
          _isOwnProfile(user) ? _buildBookingsList(user) : _buildPrivateTab(),
          _isOwnProfile(user) ? _buildSavedTrips(user) : _buildPrivateTab(),
        ],
      ),
    );
  }

  Widget _buildUnifiedHeader(User user, bool isDark) {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            // 1. Cover Image
            GestureDetector(
              onTap: () => widget.userId == 'me' ? _pickAndCropImage(true) : null,
              child: Stack(
                children: [
                  Container(
                    height: 220,
                    width: double.infinity,
                    decoration: BoxDecoration(color: Colors.grey[300]),
                    child: CachedNetworkImage(
                      imageUrl: user.coverImage ?? 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) => const Icon(Icons.image_not_supported),
                    ),
                  ),
                  // Camera Icon for Cover
                  if (widget.userId == 'me')
                    Positioned(
                      top: 40,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                      ),
                    ),
                ],
              ),
            ),
            // Dark Gradient Overlay
            Container(
              height: 220,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black.withOpacity(0.3), Colors.transparent, Colors.black.withOpacity(0.1)],
                ),
              ),
            ),
            // Menu Button
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.menu, color: Colors.white, size: 28),
                onPressed: () => _showSettingsMenu(context),
              ),
            ),
            // 2. Profile Image
            Positioned(
              bottom: -50,
              child: GestureDetector(
                onTap: () => widget.userId == 'me' ? _pickAndCropImage(false) : null,
                onLongPress: () => _showProfilePreview(user),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: isDark ? AppColors.darkBackground : Colors.white, width: 4),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 12, offset: const Offset(0, 4))],
                  ),
                  child: CircleAvatar(
                    radius: 60,
                    backgroundColor: Colors.grey[200],
                    backgroundImage: CachedNetworkImageProvider(user.imageUrl ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 60),
        
        Text(
          user.fullName ?? 'مستخدم',
          style: GoogleFonts.cairo(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
             _buildBadge(user),
             const SizedBox(width: 8),
            Text(
              '@${user.username ?? 'user'}',
              style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_isOwnProfile(user))
                IconButton(
                  onPressed: () => _showEditProfile(user),
                  icon: const Icon(Icons.edit_outlined, size: 20, color: AppColors.primaryOrange),
                  tooltip: 'تعديل النبذة والموقع',
                ),
              Expanded(
                child: Text(
                  user.bio?.trim().isNotEmpty == true
                      ? '"${user.bio!}"'
                      : (_isOwnProfile(user)
                          ? 'اضغط القلم لإضافة نبذة عنك'
                          : 'لا يوجد وصف بعد'),
                  style: GoogleFonts.cairo(
                    fontSize: 14,
                    color: Colors.grey.shade700,
                    height: 1.4,
                    fontStyle: user.bio?.trim().isNotEmpty == true ? FontStyle.italic : FontStyle.normal,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
        if (user.location != null && user.location!.trim().isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.location_on_outlined, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text(user.location!, style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey)),
              ],
            ),
          ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildStat('تسجيلات الإعجاب', user.totalLikes, onTap: () => _showLovedTrips(user)),
            _buildStat(
              'متابعين',
              _followersCount(user),
              onTap: () => _openNetwork(user, ProfileNetworkType.followers),
            ),
            _buildStat(
              'أتابعه',
              user.following,
              onTap: () => _openNetwork(user, ProfileNetworkType.following),
            ),
          ],
        ),
        if (!_isOwnProfile(user)) ...[
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: () => _toggleFollow(user),
                    style: FilledButton.styleFrom(
                      backgroundColor: _isFollowing(user) ? Colors.grey.shade200 : AppColors.primaryOrange,
                      foregroundColor: _isFollowing(user) ? Colors.black87 : Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      _isFollowing(user) ? 'تمت المتابعة' : 'متابعة',
                      style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _startMessage(user),
                    icon: const Icon(Icons.chat_bubble_outline, size: 18),
                    label: Text('مراسلة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primaryOrange,
                      side: const BorderSide(color: AppColors.primaryOrange),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 20),
      ],
    );
  }

  void _showProfilePreview(User user) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.black,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height,
        width: double.infinity,
        child: Column(
          children: [
            const SizedBox(height: 50),
            Align(
              alignment: Alignment.topRight,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            const Spacer(),
            // Large Circular Profile Pic
            Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 4),
                boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.2), blurRadius: 40)],
              ),
              child: CircleAvatar(
                radius: 150,
                backgroundImage: CachedNetworkImageProvider(user.imageUrl ?? ''),
              ),
            ),
            const SizedBox(height: 60),
            // Change Photo Button
            if (widget.userId == 'me')
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _pickAndCropImage(false);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white24,
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Text('تغيير الصورة', style: GoogleFonts.cairo(color: Colors.white, fontSize: 18)),
              ),
            const Spacer(),
            // Share Section
            Text('مشاركة الملف الشخصي', style: GoogleFonts.cairo(color: Colors.white70, fontSize: 14)),
            const SizedBox(height: 20),
            Container(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  _shareItem('واتساب', Icons.message, Colors.green, () => _shareProfile(user)),
                  _shareItem('فيسبوك', Icons.facebook, Colors.blue, () => _shareProfile(user)),
                  _shareItem('ماسنجر', Icons.chat_bubble, Colors.purple, () => _shareProfile(user)),
                  _shareItem('نسخ الرابط', Icons.link, Colors.blueGrey, () {
                    Clipboard.setData(ClipboardData(text: 'https://re7lty.app/profile/${user.clerkId}'));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم نسخ الرابط!')));
                  }),
                  _shareItem('أصدقاء TikTok', Icons.send, Colors.pink, () => _shareProfile(user)),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _shareItem(String label, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 80,
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              child: Icon(icon, color: Colors.white, size: 28),
            ),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 10), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  void _shareProfile(User user) {
    Share.share('شاهد ملفي الشخصي على رحلتي: https://re7lty.app/profile/${user.clerkId}');
  }

  Widget _buildBadge(User user) {
    String label = 'مستكشف برونزي';
    Color color = Colors.brown;
    if (user.activityScore >= 2000) { label = 'أسطورة الرحلات'; color = Colors.purple; }
    else if (user.activityScore >= 800) { label = 'مستكشف ألماسي'; color = Colors.blue; }
    else if (user.activityScore >= 350) { label = 'مستكشف ذهبي'; color = Colors.amber; }
    else if (user.activityScore >= 100) { label = 'مستكشف فضي'; color = Colors.blueGrey; }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: color, width: 1),
      ),
      child: Text(
        label,
        style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  Widget _buildMemoriesSection(User user, bool isDark) {
    final clerkId = _clerkId(user);
    final memoriesAsync = ref.watch(userMemoriesProvider(clerkId));
    final isOwner = _isOwnProfile(user);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const Icon(Icons.play_arrow, color: Colors.blue, size: 16),
              const SizedBox(width: 8),
              Text(
                isOwner ? 'ذكرياتك المسجلة (3 بحد أقصى)' : 'ذكريات المسافر',
                style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 118,
          child: memoriesAsync.when(
            data: (memories) {
              if (memories.isEmpty && !isOwner) {
                return Center(
                  child: Text('لا توجد ذكريات بعد', style: GoogleFonts.cairo(color: Colors.grey)),
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: memories.length + (isOwner && memories.length < 3 ? 1 : 0),
                itemBuilder: (context, index) {
                  if (isOwner && memories.length < 3 && index == memories.length) {
                    return _buildAddMemoryButton(clerkId);
                  }
                  final memory = memories[index];
                  final cover = memory.coverUrl;
                  return GestureDetector(
                    onTap: () => _openMemoryViewer(memory, isOwner, clerkId),
                    onLongPress: isOwner ? () => _confirmDeleteMemory(memory, clerkId) : null,
                    child: Container(
                      width: 84,
                      margin: const EdgeInsets.only(right: 12),
                      child: Column(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.primaryOrange, width: 2),
                            ),
                            child: CircleAvatar(
                              radius: 34,
                              backgroundColor: Colors.grey.shade300,
                              backgroundImage: cover != null && cover.isNotEmpty
                                  ? CachedNetworkImageProvider(cover)
                                  : null,
                              child: cover == null || cover.isEmpty
                                  ? const Icon(Icons.photo, color: Colors.white54)
                                  : null,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            memory.monthLabel,
                            style: GoogleFonts.cairo(fontSize: 10, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
            error: (e, s) => Padding(
              padding: const EdgeInsets.all(16),
              child: Text('تعذر تحميل الذكريات', style: GoogleFonts.cairo(color: Colors.grey, fontSize: 12)),
            ),
          ),
        ),
        const Divider(),
      ],
    );
  }

  void _openMemoryViewer(TravelMemory memory, bool isOwner, String clerkId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MemoryViewerPage(
          memory: memory,
          canDelete: isOwner,
          onDelete: isOwner
              ? () => ref.read(memoryServiceProvider).deleteMemory(memory.id)
              : null,
        ),
      ),
    ).then((deleted) {
      if (deleted == true) ref.invalidate(userMemoriesProvider(clerkId));
    });
  }

  Future<void> _confirmDeleteMemory(TravelMemory memory, String clerkId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('حذف الذكرى؟', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('حذف', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (ok == true) {
      try {
        await ref.read(memoryServiceProvider).deleteMemory(memory.id);
        ref.invalidate(userMemoriesProvider(clerkId));
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('فشل الحذف: $e')));
      }
    }
  }

  Widget _buildAddMemoryButton(String clerkId) {
    return GestureDetector(
      onTap: () => _showCreateMemory(clerkId),
      child: Container(
        width: 80,
        margin: const EdgeInsets.only(right: 12),
        child: Column(
          children: [
            Container(
              height: 70,
              width: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.grey.withOpacity(0.5), width: 1, style: BorderStyle.solid),
              ),
              child: const Icon(Icons.add, color: Colors.grey, size: 30),
            ),
            const SizedBox(height: 4),
            Text('إنشاء ذكرى', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  void _openNetwork(User user, ProfileNetworkType type) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProfileNetworkPage(clerkId: _clerkId(user), type: type),
      ),
    );
  }

  Future<void> _showEditProfile(User user) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => ProfileEditSheet(user: user),
    );
    if (saved == true) {
      ref.invalidate(userProfileProvider(widget.userId));
    }
  }

  Future<void> _startMessage(User user) async {
    try {
      final conv = await ref.read(userServiceProvider).startDirectChat(user.clerkId);
      final convId = conv['_id']?.toString() ?? conv['id']?.toString();
      if (convId != null && mounted) {
        context.push('/chat/direct/$convId');
      }
    } catch (e) {
      if (mounted) {
        final msg = e is DioException ? handleDioError(e).message : e.toString();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    }
  }

  Widget _buildStat(String label, int value, {VoidCallback? onTap}) {
    final content = Column(
      children: [
        Text(value.toString(), style: GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.bold)),
        Text(label, style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey)),
      ],
    );
    if (onTap == null) return content;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(padding: const EdgeInsets.all(8), child: content),
    );
  }

  Widget _buildPrivateTab() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.lock_outline, size: 48, color: Colors.grey.withOpacity(0.4)),
          const SizedBox(height: 12),
          Text('هذا القسم خاص بالمالك', style: GoogleFonts.cairo(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildTripsGrid(User user, bool onlyAI) {
    final tripFuture = onlyAI && _isOwnProfile(user)
        ? ref.read(userServiceProvider).getUserAiTrips()
        : ref.read(userServiceProvider).getUserTrips(_isOwnProfile(user) ? 'me' : _clerkId(user));

    return FutureBuilder<List<Trip>>(
      future: tripFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('خطأ في تحميل الرحلات', style: GoogleFonts.cairo()));
        }
        final trips = snapshot.data ?? [];
        final filteredTrips = onlyAI
            ? trips.where((t) => t.isAIGenerated).toList()
            : trips.where((t) => !t.isAIGenerated).toList();
        if (filteredTrips.isEmpty) {
          return _buildEmptyState(onlyAI ? 'لا توجد رحلات ذكية بعد' : 'لا توجد رحلات عامة بعد');
        }

        return GridView.builder(
          padding: const EdgeInsets.all(2),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 2,
            mainAxisSpacing: 2,
            childAspectRatio: 0.8,
          ),
          itemCount: filteredTrips.length,
          itemBuilder: (context, index) {
            final trip = filteredTrips[index];
            return GestureDetector(
              onTap: () => context.push('/trip/${trip.id}'),
              child: CachedNetworkImage(
                imageUrl: trip.image ?? 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
                fit: BoxFit.cover,
              ),
            );
          },
        );
      },
    );
  }

  String _bookingQrPayload(String reference) {
    final ref = reference.trim();
    if (ref.isEmpty) return ref;
    final webBase = EnvConfig.webAppUrl;
    if (webBase.isNotEmpty) {
      final base = webBase.endsWith('/') ? webBase.substring(0, webBase.length - 1) : webBase;
      return '$base/verify-booking/$ref';
    }
    return ref;
  }

  void _showBookingTicketSheet(Map<String, dynamic> booking) {
    final reference = booking['bookingReference']?.toString() ?? '';
    final status = booking['status']?.toString() ?? '';
    final isAccepted = status == 'accepted';
    final qrData = _bookingQrPayload(reference);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 20, 24, MediaQuery.of(ctx).padding.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 20),
              Text(booking['tripTitle']?.toString() ?? 'تذكرة الحجز', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text('المرجع: $reference', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 6),
              Text(
                isAccepted ? 'مقبول — اعرض هذا الرمز عند الصعود' : 'قيد المراجعة — سيظهر الرمز بعد قبول الشركة',
                style: GoogleFonts.cairo(fontSize: 12, color: isAccepted ? Colors.green : Colors.orange),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              if (isAccepted && qrData.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.grey.shade200),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 6))],
                  ),
                  child: QrImageView(
                    data: qrData,
                    version: QrVersions.auto,
                    size: 200,
                    backgroundColor: Colors.white,
                  ),
                )
              else
                Container(
                  width: 200,
                  height: 200,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(Icons.qr_code_2, size: 80, color: Colors.grey.shade400),
                ),
              const SizedBox(height: 16),
              if (booking['passengers'] != null)
                Text('عدد المسافرين: ${booking['passengers']}', style: GoogleFonts.cairo(fontSize: 13)),
              if (booking['paymentStatus'] != null)
                Text('حالة الدفع: ${booking['paymentStatus']}', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBookingsList(User user) {
    return FutureBuilder<Response>(
      future: ref.read(apiServiceProvider).get('/bookings/my-bookings'),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
        if (!snapshot.hasData || (snapshot.data!.data as List).isEmpty) return _buildEmptyState('لا توجد حجوزات حالية');
        
        final bookings = snapshot.data!.data as List;
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: bookings.length,
          itemBuilder: (context, index) {
            final b = Map<String, dynamic>.from(bookings[index] as Map);
            final status = b['status']?.toString() ?? '';
            final isAccepted = status == 'accepted';
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              child: ListTile(
                onTap: () => _showBookingTicketSheet(b),
                leading: isAccepted
                    ? SizedBox(
                        width: 48,
                        height: 48,
                        child: QrImageView(
                          data: _bookingQrPayload(b['bookingReference']?.toString() ?? ''),
                          version: QrVersions.auto,
                          size: 48,
                          padding: const EdgeInsets.all(2),
                        ),
                      )
                    : const Icon(Icons.confirmation_number_outlined, color: AppColors.primaryOrange),
                title: Text(b['tripTitle']?.toString() ?? 'رحلة بدون عنوان', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                subtitle: Text('المرجع: ${b['bookingReference']}', style: const TextStyle(fontSize: 10)),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      isAccepted ? 'مقبول' : 'قيد الانتظار',
                      style: TextStyle(color: isAccepted ? Colors.green : Colors.orange, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                    if (isAccepted)
                      Text('اضغط للتذكرة', style: GoogleFonts.cairo(fontSize: 9, color: Colors.grey)),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSavedTrips(User user) {
    return FutureBuilder<List<Trip>>(
      future: ref.read(userServiceProvider).getUserSavedTrips(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
        if (!snapshot.hasData || snapshot.data!.isEmpty) return _buildEmptyState('لا توجد محفوظات');
        final trips = snapshot.data!;
        return GridView.builder(
          padding: const EdgeInsets.all(2),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 2, mainAxisSpacing: 2, childAspectRatio: 0.8),
          itemCount: trips.length,
          itemBuilder: (context, index) => GestureDetector(
            onTap: () => context.push('/trip/${trips[index].id}'),
            child: CachedNetworkImage(imageUrl: trips[index].image ?? '', fit: BoxFit.cover),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.folder_open_outlined, size: 50, color: Colors.grey.withOpacity(0.5)),
          const SizedBox(height: 12),
          Text(message, style: GoogleFonts.cairo(color: Colors.grey)),
        ],
      ),
    );
  }

  void _showCreateMemory(String clerkId) async {
    final result = await showDialog(
      context: context,
      builder: (context) => const CreateMemoryDialog(),
    );
    if (result == true) {
      ref.invalidate(userMemoriesProvider(clerkId));
    }
  }

  void _showLovedTrips(User user) {
    final clerkId = _clerkId(user);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        maxChildSize: 0.92,
        builder: (_, controller) => FutureBuilder<List<Trip>>(
          future: ref.read(userServiceProvider).getUserLovedTrips(clerkId),
          builder: (context, snapshot) {
            final trips = snapshot.data ?? [];
            return Column(
              children: [
                const SizedBox(height: 12),
                Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(8))),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('رحلات أعجبت بها', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
                ),
                Expanded(
                  child: snapshot.connectionState == ConnectionState.waiting
                      ? const Center(child: CircularProgressIndicator())
                      : trips.isEmpty
                          ? Center(child: Text('لا توجد إعجابات', style: GoogleFonts.cairo(color: Colors.grey)))
                          : GridView.builder(
                              controller: controller,
                              padding: const EdgeInsets.all(8),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 3,
                                crossAxisSpacing: 2,
                                mainAxisSpacing: 2,
                              ),
                              itemCount: trips.length,
                              itemBuilder: (_, i) => GestureDetector(
                                onTap: () {
                                  Navigator.pop(ctx);
                                  context.push('/trip/${trips[i].id}');
                                },
                                child: CachedNetworkImage(imageUrl: trips[i].image ?? '', fit: BoxFit.cover),
                              ),
                            ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  void _showSettingsMenu(BuildContext context) {
    final activeRole = ref.read(userRoleProvider);
    final isCompany = activeRole == 'company';
    
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10))),
          const SizedBox(height: 20),
          
          if (kDebugMode) ...[
            ListTile(
              leading: Icon(isCompany ? Icons.person_outline : Icons.business_outlined, color: AppColors.primaryOrange),
              title: Text(
                isCompany ? 'التحويل لحساب مسافر (Traveler)' : 'التحويل لحساب شركة سياحة (Company)',
                style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
              ),
              onTap: () {
                Navigator.pop(context);
                ref.read(debugRoleProvider.notifier).state = isCompany ? 'user' : 'company';
                ref.invalidate(currentUserProvider);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      isCompany ? 'تم التحويل لحساب مسافر بنجاح' : 'تم التحويل لحساب شركة بنجاح',
                      style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                    ),
                    backgroundColor: AppColors.primaryOrange,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
            ),
            const Divider(),
          ],
          
          ListTile(
            leading: const Icon(Icons.history_rounded),
            title: Text('أرشيف القصص', style: GoogleFonts.cairo()),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (context) => const StoriesArchivePage()));
            },
          ),
          ListTile(
            leading: const Icon(Icons.favorite_border_rounded),
            title: Text('تسجيلات الإعجاب', style: GoogleFonts.cairo()),
            onTap: () {
              Navigator.pop(context);
              ref.read(userProfileProvider(widget.userId).future).then((user) {
                if (mounted) _showLovedTrips(user);
              });
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: Text('الإعدادات وتعديل الملف', style: GoogleFonts.cairo()),
            onTap: () { Navigator.pop(context); context.push('/settings'); },
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }
}

class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final bool isDark;
  _SliverTabBarDelegate(this.tabBar, this.isDark);
  @override double get minExtent => tabBar.preferredSize.height;
  @override double get maxExtent => tabBar.preferredSize.height;
  @override Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(color: isDark ? AppColors.darkBackground : Colors.white, child: tabBar);
  }
  @override bool shouldRebuild(_SliverTabBarDelegate oldDelegate) => false;
}
