import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../services/api_service.dart';

// Prizes configuration
const _prizes = [
  {
    'rank': 1,
    'title': 'المركز الأول',
    'prize': 'رحلة مجانية ',
    'iconBg': 0xFFFAC775,
    'iconColor': 0xFF854F0B,
    'subtitleColor': 0xFFBA7517,
  },
  {
    'rank': 2,
    'title': 'المركز الثاني',
    'prize': 'خصم 50% شامل',
    'iconBg': 0xFFD3D1C7,
    'iconColor': 0xFF5F5E5A,
    'subtitleColor': 0xFF5F5E5A,
  },
  {
    'rank': 3,
    'title': 'المركز الثالث',
    'prize': 'خصم 30% شامل',
    'iconBg': 0xFFF5C4B3,
    'iconColor': 0xFF993C1D,
    'subtitleColor': 0xFF993C1D,
  },
];

const _prizeIcons = [
  Icons.flight_takeoff_outlined,
  Icons.account_balance_wallet_outlined,
  Icons.card_giftcard_outlined,
];

class LeaderboardPage extends ConsumerStatefulWidget {
  const LeaderboardPage({super.key});
  @override
  ConsumerState<LeaderboardPage> createState() => _LeaderboardPageState();
}

class _LeaderboardPageState extends ConsumerState<LeaderboardPage> {
  List<dynamic> _leaders = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchLeaderboard();
  }

  Future<void> _fetchLeaderboard() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/leaderboard');
      if (res.statusCode == 200) {
        final data = res.data;
        setState(() {
          _leaders = data is List ? data : (data['leaderboard'] ?? data['users'] ?? []);
        });
      }
    } catch (_) {
      // Fallback to trips-based leaderboard
      try {
        final api = ref.read(apiServiceProvider);
        final res = await api.get('/trips?limit=50');
        if (res.statusCode == 200) {
          final trips = res.data is List ? res.data as List : (res.data['trips'] as List? ?? []);
          final Map<String, dynamic> authorMap = {};
          for (final trip in trips) {
            final author = trip['author'] ?? trip['userId'] ?? {};
            final authorId = author is Map ? author['_id'] ?? '' : author.toString();
            final authorName = author is Map ? (author['fullName'] ?? author['username'] ?? 'مسافر') : author.toString();
            final authorImg = author is Map ? author['imageUrl'] : null;
            final likes = (trip['likes'] as num?)?.toInt() ?? 0;
            final comments = (trip['comments'] as List?)?.length ?? 0;
            final saves = (trip['saves'] as num?)?.toInt() ?? 0;
            final score = likes * 1.0 + comments * 2.0 + saves * 1.5;
            if (!authorMap.containsKey(authorId)) {
              authorMap[authorId] = {
                'name': authorName,
                'imageUrl': authorImg,
                'score': 0.0,
                'trips': 0,
              };
            }
            authorMap[authorId]['score'] += score;
            authorMap[authorId]['trips'] += 1;
          }
          final list = authorMap.values.toList();
          list.sort((a, b) => (b['score'] as double).compareTo(a['score'] as double));
          setState(() => _leaders = list);
        }
      } catch (e) {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildPrizeCard(Map prize, IconData icon, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withOpacity(0.15)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: Color(prize['iconBg'] as int),
            child: Icon(icon, color: Color(prize['iconColor'] as int), size: 24),
          ),
          const SizedBox(height: 10),
          Text(
            prize['title'] as String,
            style: GoogleFonts.cairo(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            prize['prize'] as String,
            style: GoogleFonts.cairo(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Color(prize['subtitleColor'] as int),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0F1A) : const Color(0xFFF5F5FF),
      body: CustomScrollView(
        slivers: [
          // Header
          SliverAppBar(
            expandedHeight: 200,
            floating: false,
            pinned: true,
            backgroundColor: const Color(0xFF4F46E5),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh, color: Colors.white),
                onPressed: _fetchLeaderboard,
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      Text(
                        '🏆 لوحة المتصدرين',
                        style: GoogleFonts.cairo(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'أكثر المسافرين تفاعلاً هذا الشهر',
                        style: GoogleFonts.cairo(color: Colors.white70, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Prizes section - الشكل الجديد
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '🎁 الجوائز',
                    style: GoogleFonts.cairo(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: List.generate(_prizes.length, (i) => Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(
                          left: i < _prizes.length - 1 ? 6 : 0,
                          right: i > 0 ? 6 : 0,
                        ),
                        child: _buildPrizeCard(_prizes[i], _prizeIcons[i], isDark),
                      ),
                    )),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    '👑 المتصدرون',
                    style: GoogleFonts.cairo(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Body
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(
                child: CircularProgressIndicator(color: Color(0xFF4F46E5)),
              ),
            )
          else if (_error != null)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.wifi_off, size: 50, color: Colors.grey),
                    const SizedBox(height: 12),
                    Text('تعذر تحميل البيانات', style: GoogleFonts.cairo(color: Colors.grey)),
                    TextButton(
                      onPressed: _fetchLeaderboard,
                      child: const Text('إعادة المحاولة'),
                    ),
                  ],
                ),
              ),
            )
          else if (_leaders.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('🏜️', style: TextStyle(fontSize: 50)),
                    const SizedBox(height: 12),
                    Text('لا يوجد متصدرون بعد', style: GoogleFonts.cairo(color: Colors.grey)),
                    Text(
                      'كن أول من يتصدر القائمة!',
                      style: GoogleFonts.cairo(color: Colors.grey[400], fontSize: 12),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 30),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final leader = _leaders[index];
                    final name = leader['fullName'] ?? leader['name'] ?? leader['username'] ?? 'مسافر';
                    final imageUrl = leader['imageUrl'] as String?;
                    final score = (leader['score'] ?? leader['points'] ?? 0.0).toDouble();
                    final trips = (leader['trips'] ?? leader['tripCount'] ?? 0) as int;
                    final rank = index + 1;

                    Color rankColor = isDark ? Colors.white24 : Colors.grey.shade200;
                    Color rankText = isDark ? Colors.white54 : Colors.black54;
                    if (rank == 1) {
                      rankColor = const Color(0xFFFFD700);
                      rankText = Colors.white;
                    }
                    if (rank == 2) {
                      rankColor = const Color(0xFFC0C0C0);
                      rankText = Colors.white;
                    }
                    if (rank == 3) {
                      rankColor = const Color(0xFFCD7F32);
                      rankText = Colors.white;
                    }

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: rank <= 3
                            ? Border.all(color: rankColor.withOpacity(0.4), width: 1.5)
                            : null,
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8),
                        ],
                      ),
                      child: Row(
                        children: [
                          // Rank badge
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(color: rankColor, shape: BoxShape.circle),
                            child: Center(
                              child: rank <= 3
                                  ? Text(
                                      ['🥇', '🥈', '🥉'][rank - 1],
                                      style: const TextStyle(fontSize: 18),
                                    )
                                  : Text(
                                      '$rank',
                                      style: GoogleFonts.cairo(
                                        color: rankText,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Avatar
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: const Color(0xFF4F46E5).withOpacity(0.1),
                            backgroundImage: imageUrl != null && imageUrl.isNotEmpty
                                ? NetworkImage(imageUrl)
                                : null,
                            child: imageUrl == null || imageUrl.isEmpty
                                ? Text(
                                    name.isNotEmpty ? name[0] : 'م',
                                    style: GoogleFonts.cairo(
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF4F46E5),
                                    ),
                                  )
                                : null,
                          ),
                          const SizedBox(width: 12),
                          // Info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  name,
                                  style: GoogleFonts.cairo(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: isDark ? Colors.white : Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Icon(Icons.map_outlined, size: 12, color: Colors.grey[500]),
                                    const SizedBox(width: 4),
                                    Text(
                                      '$trips رحلة',
                                      style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey[500]),
                                    ),
                                    const SizedBox(width: 10),
                                    Icon(Icons.star, size: 12, color: Colors.orange[400]),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${score.toStringAsFixed(0)} نقطة',
                                      style: GoogleFonts.cairo(
                                        fontSize: 11,
                                        color: Colors.orange[400],
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          // Prize indicator
                          if (rank <= 3)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: rankColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                rank == 1
                                    ? 'رحلة مجانية'
                                    : rank == 2
                                        ? 'خصم 50%'
                                        : 'خصم 30%',
                                style: GoogleFonts.cairo(
                                  fontSize: 11,
                                  color: rankColor == const Color(0xFFC0C0C0)
                                      ? Colors.grey[600]
                                      : rankColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ).animate().fadeIn(duration: 400.ms, delay: (index * 60).ms).slideX(begin: 0.05, end: 0);
                  },
                  childCount: _leaders.length > 10 ? 10 : _leaders.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}