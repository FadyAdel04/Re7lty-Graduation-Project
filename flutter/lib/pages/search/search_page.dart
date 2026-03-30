import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/trip_provider.dart';
import '../../widgets/trip_card.dart';
import 'package:flutter_animate/flutter_animate.dart';

class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';
  String? _selectedCity;
  String? _selectedSeason;

  @override
  Widget build(BuildContext context) {
    final tripsAsync = ref.watch(tripsProvider(TripFilter(
      query: _query.isNotEmpty ? _query : null,
      city: _selectedCity,
      season: _selectedSeason,
    )));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
        title: Container(
          height: 45,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(25),
          ),
          child: TextField(
            controller: _searchController,
            decoration: const InputDecoration(
              hintText: 'ابحث عن رحلة، مدينة، أو مستخدم...',
              hintStyle: TextStyle(fontSize: 14, color: Colors.grey),
              border: InputBorder.none,
              icon: Icon(Icons.search, size: 20, color: Colors.grey),
            ),
            onChanged: (val) {
              // Real-time search might be heavy, but let's try it with a small debounce or just on submit
            },
            onSubmitted: (val) => setState(() => _query = val),
          ),
        ),
        actions: [
          IconButton(
            icon: CircleAvatar(
              backgroundColor: Colors.orange[50],
              child: const Icon(Icons.tune, color: Colors.orange, size: 20),
            ),
            onPressed: () => _showFilterDialog(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          _buildActiveFilters(),
          Expanded(
            child: tripsAsync.when(
              data: (trips) => trips.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: trips.length,
                      itemBuilder: (context, index) {
                        return TripCard(trip: trips[index], isLarge: true)
                            .animate()
                            .fadeIn(delay: (index * 50).ms)
                            .slideY(begin: 0.1);
                      },
                    ),
              loading: () => const Center(child: CircularProgressIndicator(color: Colors.orange)),
              error: (err, stack) => Center(child: Text('Error: $err')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveFilters() {
    if (_selectedCity == null && _selectedSeason == null && _query.isEmpty) {
      return const SizedBox.shrink();
    }
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          if (_query.isNotEmpty)
            _FilterChip(
              label: 'البحث: $_query',
              onDeleted: () {
                _searchController.clear();
                setState(() => _query = '');
              },
            ),
          if (_selectedCity != null)
            _FilterChip(
              label: _selectedCity!,
              onDeleted: () => setState(() => _selectedCity = null),
            ),
          if (_selectedSeason != null)
            _FilterChip(
              label: _translateSeason(_selectedSeason!),
              onDeleted: () => setState(() => _selectedSeason = null),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 80, color: Colors.grey[200]),
          const SizedBox(height: 16),
          const Text('لم نجد أي رحلة بهذا الوصف', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () {
              _searchController.clear();
              setState(() {
                _query = '';
                _selectedCity = null;
                _selectedSeason = null;
              });
            },
            child: const Text('مسح الفلاتر', style: TextStyle(color: Colors.orange)),
          ),
        ],
      ),
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

  void _showFilterDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('تصفية الرحلات', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                const Text('الوجهة أو المدينة', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['القاهرة', 'دهب', 'شرم الشيخ', 'الأقصر', 'أسوان', 'سيوة', 'الإسكندرية', 'الجونة'].map((city) {
                    final isSelected = _selectedCity == city;
                    return ChoiceChip(
                      label: Text(city),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() => _selectedCity = selected ? city : null);
                        setModalState(() {});
                      },
                      selectedColor: Colors.orange,
                      labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black87),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),
                const Text('الموسم المفضل', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: ['winter', 'summer', 'fall', 'spring'].map((s) {
                    final isSelected = _selectedSeason == s;
                    return ChoiceChip(
                      label: Text(_translateSeason(s)),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() => _selectedSeason = selected ? s : null);
                        setModalState(() {});
                      },
                      selectedColor: Colors.orange,
                      labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black87),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.all(18),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    ),
                    child: const Text('تطبيق التغييرات', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final VoidCallback onDeleted;

  const _FilterChip({required this.label, required this.onDeleted});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 8.0),
      child: Chip(
        label: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
        onDeleted: onDeleted,
        deleteIconColor: Colors.white,
        backgroundColor: Colors.orange,
        labelStyle: const TextStyle(color: Colors.white),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}
