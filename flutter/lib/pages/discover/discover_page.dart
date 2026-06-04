import 'dart:async';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/trip.dart';
import '../../models/user.dart';
import '../../providers/discover_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/discover/discover_hero.dart';
import '../../widgets/discover/discover_sidebar.dart';
import '../../widgets/discover/discover_trip_card.dart';
import '../../widgets/user_search_card.dart';

class DiscoverPage extends ConsumerStatefulWidget {
  const DiscoverPage({super.key});

  @override
  ConsumerState<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends ConsumerState<DiscoverPage> {
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();
  final _feedKey = GlobalKey();
  String _query = '';
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadFollowing());
    _searchDebounce = Timer(Duration.zero, () {});
    _searchController.addListener(_onSearchChanged);
  }

  Timer? _searchDebounce;

  void _onSearchChanged() {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      if (mounted) _applySearch();
    });
  }

  void _loadFollowing() {
    final clerkId = ClerkAuth.of(context).user?.id;
    ref.read(discoverFollowingIdsProvider.notifier).load(clerkId);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  DiscoverParams get _params => DiscoverParams(query: _query, filter: _filter);

  bool get _isSearchMode => _query.trim().isNotEmpty;

  void _applySearch([String? value]) {
    setState(() => _query = (value ?? _searchController.text).trim());
  }

  void _scrollToFeed() {
  final ctx = _feedKey.currentContext;
    if (ctx != null) {
      Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 450), curve: Curves.easeOut);
    }
  }

  User? _authorForTrip(List<User> users, Trip trip) {
    if (trip.ownerId == null) return null;
    for (final u in users) {
      if (u.clerkId == trip.ownerId || u.id == trip.ownerId) return u;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final discoverAsync = ref.watch(discoverDataProvider(_params));

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      body: SafeArea(
        child: discoverAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
          error: (e, _) => _buildError(isDark, e.toString()),
          data: (data) => RefreshIndicator(
            color: AppColors.primaryOrange,
            onRefresh: () async {
              ref.invalidate(discoverDataProvider(_params));
              await ref.read(discoverDataProvider(_params).future);
            },
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth >= 900;
                return CustomScrollView(
                  controller: _scrollController,
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: [
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                      sliver: SliverList(
                        delegate: SliverChildListDelegate([
                          if (!_isSearchMode) ...[
                            DiscoverHero(
                              onBrowseTrips: _scrollToFeed,
                              onFindTravelers: _scrollToFeed,
                            ),
                            const SizedBox(height: 20),
                            DiscoverMapTeaser(trips: data.trips),
                            const SizedBox(height: 24),
                          ],
                          KeyedSubtree(
                            key: _feedKey,
                            child: _FilterBar(
                              filter: _filter,
                              searchController: _searchController,
                              onFilterChanged: (f) => setState(() => _filter = f),
                              onSearchSubmitted: () => _applySearch(),
                              onSearchCleared: () {
                                _searchController.clear();
                                _applySearch('');
                              },
                            ),
                          ),
                          const SizedBox(height: 16),
                        ]),
                      ),
                    ),
                    if (isWide)
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        sliver: SliverToBoxAdapter(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(flex: 8, child: _buildTripsGrid(data, isDark)),
                              const SizedBox(width: 16),
                              Expanded(flex: 4, child: _buildSidebar(data, isLoading: false)),
                            ],
                          ),
                        ),
                      )
                    else ...[
                      if (_isSearchMode && data.users.isNotEmpty)
                        SliverPadding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          sliver: SliverToBoxAdapter(child: _buildPeopleSection(data.users, isDark)),
                        ),
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        sliver: SliverToBoxAdapter(child: _buildTripsGrid(data, isDark)),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        sliver: SliverToBoxAdapter(child: _buildSidebar(data, isLoading: false)),
                      ),
                    ],
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTripsGrid(DiscoverData data, bool isDark) {
    if (data.trips.isEmpty) {
      if (_isSearchMode && data.users.isNotEmpty) {
        return const SizedBox.shrink();
      }
      return _buildEmptyState(isDark);
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth >= 600 ? 2 : 1;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: crossAxisCount == 1 ? 0.72 : 0.68,
          ),
          itemCount: data.trips.length,
          itemBuilder: (context, index) {
            final trip = data.trips[index];
            return DiscoverTripCard(
              trip: trip,
              author: _authorForTrip(data.users, trip),
            );
          },
        );
      },
    );
  }

  Widget _buildPeopleSection(List<User> users, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'مسافرون',
              style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 16),
            ),
          ),
          ...users.take(10).map((u) => UserSearchCard(user: u)),
        ],
      ),
    );
  }

  Widget _buildSidebar(DiscoverData data, {required bool isLoading}) {
    return Column(
      children: [
        DiscoverTravelersPanel(users: data.users, isLoading: isLoading),
        const SizedBox(height: 16),
        DiscoverTrendingDestinations(
          onDestinationTap: (tag) {
            _searchController.text = tag;
            _applySearch(tag);
            _scrollToFeed();
          },
        ),
      ],
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade300, style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          Icon(Icons.search_off, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          Text('لم نجد أي نتائج', style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 20)),
          const SizedBox(height: 6),
          Text(
            'جرب البحث بكلمات أخرى أو تغيير الفلاتر المحددة.',
            style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildError(bool isDark, String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off, color: Colors.red, size: 48),
            const SizedBox(height: 12),
            Text('حدث خطأ في التحميل', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => ref.invalidate(discoverDataProvider(_params)),
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterBar extends StatefulWidget {
  final String filter;
  final TextEditingController searchController;
  final ValueChanged<String> onFilterChanged;
  final VoidCallback onSearchSubmitted;
  final VoidCallback onSearchCleared;

  const _FilterBar({
    required this.filter,
    required this.searchController,
    required this.onFilterChanged,
    required this.onSearchSubmitted,
    required this.onSearchCleared,
  });

  @override
  State<_FilterBar> createState() => _FilterBarState();
}

class _FilterBarState extends State<_FilterBar> {
  @override
  void initState() {
    super.initState();
    widget.searchController.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    widget.searchController.removeListener(_onTextChanged);
    super.dispose();
  }

  void _onTextChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filter = widget.filter;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: (isDark ? AppColors.cardDark : Colors.white).withOpacity(0.9),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            reverse: true,
            child: Row(
              children: [
                _FilterChip(
                  id: 'new',
                  label: 'الأحدث',
                  icon: Icons.auto_awesome,
                  selected: filter == 'new',
                  onTap: () => widget.onFilterChanged('new'),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  id: 'trending',
                  label: 'الأكثر رواجاً',
                  icon: Icons.trending_up,
                  selected: filter == 'trending',
                  onTap: () => widget.onFilterChanged('trending'),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  id: 'all',
                  label: 'الكل',
                  icon: Icons.explore,
                  selected: filter == 'all',
                  onTap: () => widget.onFilterChanged('all'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: widget.searchController,
            textAlign: TextAlign.right,
            style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              hintText: 'ابحث عن رحلة أو شخص...',
              hintStyle: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.w600),
              filled: true,
              fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              prefixIcon: const Icon(Icons.search, color: Colors.grey),
              suffixIcon: widget.searchController.text.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.close), onPressed: widget.onSearchCleared)
                  : null,
            ),
            onSubmitted: (_) => widget.onSearchSubmitted(),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String id;
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.id,
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.primaryOrange : Colors.transparent,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: selected ? Colors.white : Colors.grey),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.cairo(
                  color: selected ? Colors.white : Colors.grey,
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
