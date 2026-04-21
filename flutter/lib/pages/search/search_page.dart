import 'package:re7lty_app/theme/app_colors.dart';
import 'package:re7lty_app/providers/api_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/trip_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/trip_post_card.dart';
import '../../widgets/user_search_card.dart';
import '../../services/api_service.dart';
import '../../services/user_service.dart';
import '../../models/user.dart';
import '../../models/corporate_trip.dart';
import '../../widgets/corporate_trip_card.dart';
import 'package:flutter_animate/flutter_animate.dart';


class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _query = '';
  String _sort = 'recent'; // 'recent', 'trending'
  String? _selectedCity;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
        titleSpacing: 0,
        title: _buildSearchField(isDark),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_outlined, size: 20),
            onPressed: () => _showFilterDialog(context),
          ),
          const SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: AppColors.primaryOrange,
          labelColor: AppColors.primaryOrange,
          unselectedLabelColor: Colors.grey,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'من أجلك'),
            Tab(text: 'الحسابات'),
            Tab(text: 'رحلات الشركات'),
            Tab(text: 'رحلات المسافرين'),
            Tab(text: 'الوسوم'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildTripsList(ref, type: null, sort: 'trending'),
          _buildUsersList(ref),
          _buildCorporateTripsList(ref),
          _buildTripsList(ref, type: 'traveler', sort: _sort),
          _buildTagsList(),
        ],
      ),
    );
  }

  Widget _buildSearchField(bool isDark) {
    return Container(
      height: 40,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextField(
        controller: _searchController,
        decoration: const InputDecoration(
          hintText: 'ابحث عن مكان، شخص، شركة...',
          hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
          border: InputBorder.none,
          icon: Icon(Icons.search, size: 18, color: Colors.grey),
        ),
        onSubmitted: (val) => setState(() => _query = val),
      ),
    );
  }

  Widget _buildTripsList(WidgetRef ref, {String? type, required String sort}) {
    final tripsAsync = ref.watch(tripsProvider(TripFilter(
      query: _query.isNotEmpty ? _query : null,
      type: type,
      sort: sort,
      city: _selectedCity,
    )));

    return tripsAsync.when(
      data: (trips) => trips.isEmpty 
          ? _buildEmptyState() 
          : ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: trips.length,
              itemBuilder: (context, index) => TripPostCard(trip: trips[index]),
            ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Center(child: Text('حدث خطأ أثناء البحث')),
    );
  }

  Widget _buildCorporateTripsList(WidgetRef ref) {
    final tripsAsync = ref.watch(corporateTripsProvider(_query.isNotEmpty ? _query : null));

    return tripsAsync.when(
      data: (trips) => trips.isEmpty
          ? _buildEmptyState(msg: 'لا توجد رحلات شركات حالياً')
          : ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: trips.length,
              itemBuilder: (context, index) => CorporateTripCard(trip: trips[index]),
            ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Center(child: Text('حدث خطأ أثناء تحميل رحلات الشركات')),
    );
  }

  Widget _buildUsersList(WidgetRef ref) {
    if (_query.isEmpty) return _buildEmptyState(msg: 'ابدأ البحث عن حسابات');
    
    return FutureBuilder<List<User>>(
      future: ref.read(userServiceProvider).searchUsers(_query),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final users = snapshot.data ?? [];
        if (users.isEmpty) return _buildEmptyState();
        return ListView.builder(
          itemCount: users.length,
          itemBuilder: (context, index) => UserSearchCard(user: users[index]),
        );
      },
    );
  }

  Widget _buildTagsList() {
    final tags = ['#بحر', '#جبال', '#سياحة_دينية', '#شتاء_مصر', '#دهب_الآن', '#أكل_شعبي'];
    return ListView.builder(
      itemCount: tags.length,
      itemBuilder: (context, index) => ListTile(
        leading: const CircleAvatar(child: Icon(Icons.tag)),
        title: Text(tags[index], style: const TextStyle(fontWeight: FontWeight.bold)),
        onTap: () => setState(() {
          _query = tags[index].substring(1);
          _searchController.text = _query;
          _tabController.animateTo(0);
        }),
      ),
    );
  }

  Widget _buildEmptyState({String msg = 'لا توجد نتائج للبحث'}) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 64, color: Colors.grey.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text(msg, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  void _showFilterDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('ترتيب حسب', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 16),
            ListTile(
              title: const Text('الأحدث'),
              onTap: () { setState(() => _sort = 'recent'); Navigator.pop(context); },
              trailing: _sort == 'recent' ? const Icon(Icons.check, color: AppColors.primaryOrange) : null,
            ),
            ListTile(
              title: const Text('الأكثر رواجاً'),
              onTap: () { setState(() => _sort = 'trending'); Navigator.pop(context); },
              trailing: _sort == 'trending' ? const Icon(Icons.check, color: AppColors.primaryOrange) : null,
            ),
          ],
        ),
      ),
    );
  }
}



