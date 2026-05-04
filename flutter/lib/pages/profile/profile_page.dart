import 'dart:io';
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

import '../../theme/app_colors.dart';
import '../../models/user.dart';
import '../../models/trip.dart';
import '../../services/user_service.dart';
import '../../services/api_service.dart';
import '../../providers/api_provider.dart';
import '../../providers/trip_provider.dart';
import 'memory_create_dialog.dart';
import 'stories_archive_page.dart';

final userProfileProvider = FutureProvider.family<User, String>((ref, id) {
  return ref.watch(userServiceProvider).getUserById(id);
});

final userMemoriesProvider = FutureProvider.family<List<dynamic>, String>((ref, id) async {
  final api = ref.watch(apiServiceProvider);
  final response = await api.get('/memories/$id');
  return response.data as List<dynamic>;
});

class UserProfilePage extends ConsumerStatefulWidget {
  final String userId;
  const UserProfilePage({super.key, required this.userId});

  @override
  ConsumerState<UserProfilePage> createState() => _UserProfilePageState();
}

class _UserProfilePageState extends ConsumerState<UserProfilePage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ImagePicker _picker = ImagePicker();

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

  Future<void> _uploadImage(File file, bool isCover) async {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('جاري تحديث الصورة...')));
    try {
      final userService = ref.read(userServiceProvider);
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final dummyUrl = isCover 
        ? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?t=$timestamp"
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?t=$timestamp";
      
      await userService.updateProfile({
        isCover ? 'coverImage' : 'imageUrl': dummyUrl,
      });
      
      ref.invalidate(userProfileProvider(widget.userId));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم التحديث بنجاح')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('فشل التحديث: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(userProfileProvider(widget.userId));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      body: userAsync.when(
        data: (user) => _buildProfileBody(context, user, isDark),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('خطأ في تحميل البيانات: $e')),
      ),
    );
  }

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
          _buildBookingsList(user),
          _buildSavedTrips(user),
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
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
             _buildStat('تسجيلات الإعجاب', user.totalLikes),
            _buildStat('متابعين', user.followers),
            _buildStat('أتابعه', user.following),
          ],
        ),
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
    final memoriesAsync = ref.watch(userMemoriesProvider(user.clerkId));

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
                'ذكرياتك المسجلة (3 بحد أقصى)',
                style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 110,
          child: memoriesAsync.when(
            data: (memories) {
              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: memories.length + (widget.userId == 'me' && memories.length < 3 ? 1 : 0),
                itemBuilder: (context, index) {
                  if (widget.userId == 'me' && memories.length < 3 && index == memories.length) {
                    return _buildAddMemoryButton();
                  }
                  final memory = memories[index];
                  return Container(
                    width: 80,
                    margin: const EdgeInsets.only(right: 12),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 35,
                          backgroundImage: CachedNetworkImageProvider(memory['items'][0]['url']),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          memory['monthLabel'],
                          style: GoogleFonts.cairo(fontSize: 10),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, s) => const SizedBox.shrink(),
          ),
        ),
        const Divider(),
      ],
    );
  }

  Widget _buildAddMemoryButton() {
    return GestureDetector(
      onTap: _showCreateMemory,
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

  Widget _buildStat(String label, int value) {
    return Column(
      children: [
        Text(
          value.toString(),
          style: GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.bold),
        ),
        Text(
          label,
          style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildTripsGrid(User user, bool onlyAI) {
    final tripsAsync = ref.watch(tripsProvider(TripFilter(authorId: user.clerkId)));

    return tripsAsync.when(
      data: (trips) {
        final filteredTrips = onlyAI ? trips.where((t) => t.isAIGenerated).toList() : trips.where((t) => !t.isAIGenerated).toList();
        if (filteredTrips.isEmpty) return _buildEmptyState(onlyAI ? 'لا توجد رحلات ذكية بعد' : 'لا توجد رحلات عامة بعد');

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
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Center(child: Text('Error: $e')),
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
            final b = bookings[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              child: ListTile(
                leading: const Icon(Icons.confirmation_number_outlined, color: AppColors.primaryOrange),
                title: Text(b['tripTitle'] ?? 'رحلة بدون عنوان', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                subtitle: Text('المرجع: ${b['bookingReference']}', style: const TextStyle(fontSize: 10)),
                trailing: Text(b['status'] == 'accepted' ? 'مقبول' : 'قيد الانتظار', style: TextStyle(color: b['status'] == 'accepted' ? Colors.green : Colors.orange, fontSize: 10)),
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

  void _showCreateMemory() async {
    final result = await showDialog(
      context: context,
      builder: (context) => const CreateMemoryDialog(),
    );
    if (result == true) {
      ref.invalidate(userMemoriesProvider(widget.userId));
    }
  }

  void _showSettingsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
           Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10))),
          const SizedBox(height: 20),
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
               // Add logic to show likes
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
