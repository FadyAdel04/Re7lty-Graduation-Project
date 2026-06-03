// ─────────────────────────────────────────────────────────────────────────────
// ai_chat_page.dart  –  AI Trip Planner Wizard (8 steps, mirrors web exactly)
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../constants/egypt_data.dart';
import '../../models/trip_wizard_state.dart';
import '../../providers/trip_wizard_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

class AIChatPage extends ConsumerStatefulWidget {
  const AIChatPage({super.key});

  @override
  ConsumerState<AIChatPage> createState() => _AIChatPageState();
}

class _AIChatPageState extends ConsumerState<AIChatPage>
    with TickerProviderStateMixin {
  late AnimationController _bgController;
  final PageController _pageController = PageController();

  @override
  void initState() {
    super.initState();
    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _bgController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _animateToStep(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(tripWizardProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Sync PageView when step changes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final targetIndex = WizardStep.values.indexOf(wizard.currentStep);
      if (_pageController.hasClients) {
        final currentPage = _pageController.page?.round() ?? 0;
        if (currentPage != targetIndex) {
          _animateToStep(targetIndex);
        }
      }
    });

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0F1A) : const Color(0xFFF5F7FF),
      body: Stack(
        children: [
          // ── Animated background blobs ──────────────────────────────────
          _buildBackground(isDark),

          // ── Main content ───────────────────────────────────────────────
          SafeArea(
            child: Column(
              children: [
                _buildHeader(wizard, isDark),
                _buildStepIndicator(wizard, isDark),
                Expanded(
                  child: wizard.mode == WizardMode.idle
                      ? _buildModeSelectionView(wizard, isDark)
                      : (wizard.smartSearchAttempted
                          ? _buildPlatformTripsResultsView(wizard, isDark)
                          : (wizard.tripPlan != null &&
                                  wizard.currentStep == WizardStep.review &&
                                  !wizard.isGeneratingPlan
                              ? _buildResultsView(wizard, isDark)
                              : PageView(
                                  controller: _pageController,
                                  physics: const NeverScrollableScrollPhysics(),
                                  children: [
                                    _buildStep1Destination(wizard, isDark),
                                    _buildStep2Origin(wizard, isDark),
                                    _buildStep3Transport(wizard, isDark),
                                    _buildStep4Days(wizard, isDark),
                                    _buildStep5Budget(wizard, isDark),
                                    _buildStep6Hotel(wizard, isDark),
                                    _buildStep7HotelDates(wizard, isDark),
                                    _buildStep8Review(wizard, isDark),
                                  ],
                                ))),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  BACKGROUND
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildBackground(bool isDark) {
    return AnimatedBuilder(
      animation: _bgController,
      builder: (_, __) => Stack(children: [
        Positioned(
          top: -100,
          right: -100,
          child: Container(
            width: 400,
            height: 400,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: (isDark
                      ? const Color(0xFF4F46E5)
                      : const Color(0xFF818CF8))
                  .withOpacity(0.08 + _bgController.value * 0.04),
            ),
          ),
        ),
        Positioned(
          bottom: -80,
          left: -80,
          child: Container(
            width: 350,
            height: 350,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: (isDark
                      ? const Color(0xFF7C3AED)
                      : const Color(0xFFA78BFA))
                  .withOpacity(0.06 + _bgController.value * 0.04),
            ),
          ),
        ),
      ]),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  MODE SELECTION VIEW
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildModeSelectionView(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildModeCard(
            title: 'رحلة مخصصة',
            subtitle: 'اصنع برنامجاً سياحياً فريداً من الصفر باستخدام أقوى محرك ذكاء اصطناعي.',
            icon: Icons.auto_awesome,
            iconColor: const Color(0xFF7C3AED),
            iconBg: const Color(0xFFF3E8FF),
            badgeText: 'الأكثر تطوراً',
            buttonText: 'ابدأ التصميم',
            isDark: isDark,
            onTap: () => notifier.setMode(WizardMode.custom),
          ),
          const SizedBox(height: 24),
          _buildModeCard(
            title: 'بحث ذكي بالمنصة',
            subtitle: 'أدخل وجهتك وميزانيتك وسيقوم الذكاء الاصطناعي باقتراح أفضل رحلة متاحة بالمنصة.',
            icon: Icons.search,
            iconColor: const Color(0xFF3B82F6),
            iconBg: const Color(0xFFDBEAFE),
            buttonText: 'ابحث الآن',
            isDark: isDark,
            onTap: () => notifier.setMode(WizardMode.smart),
          ),
        ],
      ),
    );
  }

  Widget _buildModeCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    String? badgeText,
    required String buttonText,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFE5E7EB),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark ? Colors.black26 : Colors.black.withOpacity(0.04),
              blurRadius: 20,
              offset: const Offset(0, 10),
            )
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (badgeText != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7C3AED),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        badgeText,
                        style: GoogleFonts.cairo(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  Text(
                    title,
                    style: GoogleFonts.cairo(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF1E1B4B),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: GoogleFonts.cairo(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white54 : const Color(0xFF6B7280),
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.arrow_back, size: 16, color: iconColor),
                      const SizedBox(width: 6),
                      Text(
                        buttonText,
                        style: GoogleFonts.cairo(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: iconColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: isDark ? iconColor.withOpacity(0.15) : iconBg,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Icon(icon, size: 36, color: iconColor),
              ),
            ),
          ],
        ),
      ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  HEADER
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildHeader(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          // Icon
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4F46E5).withOpacity(0.35),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(Icons.auto_awesome_rounded,
                color: Colors.white, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'مخطط الرحلات الذكي',
                  style: GoogleFonts.cairo(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF1E1B4B),
                  ),
                ),
                Text(
                  wizard.tripPlan != null
                      ? '✅ جاهز! راجع نتائج رحلتك'
                      : 'خطوة ${WizardStep.values.indexOf(wizard.currentStep) + 1} من ${wizard.totalSteps}',
                  style: GoogleFonts.cairo(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? Colors.white54
                        : const Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          // Reset button
          if (wizard.currentStep != WizardStep.destination ||
              wizard.destination.isNotEmpty)
            GestureDetector(
              onTap: () => notifier.reset(),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark
                      ? Colors.white.withOpacity(0.08)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark
                        ? Colors.white12
                        : const Color(0xFFE5E7EB),
                  ),
                ),
                child: Text(
                  'بداية جديدة',
                  style: GoogleFonts.cairo(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF4F46E5),
                  ),
                ),
              ),
            ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  STEP INDICATOR
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildStepIndicator(TripWizardState wizard, bool isDark) {
    const steps = [
      ('📍', 'الوجهة'),
      ('🚌', 'الانطلاق'),
      ('🚗', 'المواصلات'),
      ('📅', 'المدة'),
      ('💰', 'الميزانية'),
      ('🏨', 'الفندق'),
      ('🗓️', 'التواريخ'),
      ('✅', 'مراجعة'),
    ];

    final currentIdx = wizard.mode == WizardMode.smart ? wizard.stepIndex : WizardStep.values.indexOf(wizard.currentStep);
    
    List<(String, String)> visibleSteps;
    int adjustedIdx;

    if (wizard.mode == WizardMode.smart) {
      visibleSteps = [
        ('📍', 'الوجهة'),
        ('💰', 'الميزانية'),
        ('✅', 'المراجعة'),
      ];
      adjustedIdx = currentIdx;
    } else {
      visibleSteps = wizard.hotelNeeded == false
          ? [for (int i = 0; i < steps.length; i++) if (i != 6) steps[i]]
          : steps.toList();
      adjustedIdx = wizard.hotelNeeded == false && currentIdx >= 6 ? currentIdx - 1 : currentIdx;
    }

    if (wizard.mode == WizardMode.idle) return const SizedBox.shrink();

    return Container(
      height: 72,
      margin: const EdgeInsets.only(top: 16),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: visibleSteps.asMap().entries.map((entry) {
            final i = entry.key;
            final step = entry.value;
            final isDone = i < adjustedIdx;
            final isActive = i == adjustedIdx;

            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: isActive ? 44 : 36,
                    height: isActive ? 44 : 36,
                    decoration: BoxDecoration(
                      gradient: isActive
                          ? const LinearGradient(
                              colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                            )
                          : null,
                      color: isDone
                          ? const Color(0xFF10B981)
                          : (!isActive
                              ? (isDark
                                  ? Colors.white10
                                  : const Color(0xFFE5E7EB))
                              : null),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: isActive
                          ? [
                              BoxShadow(
                                color:
                                    const Color(0xFF4F46E5).withOpacity(0.4),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              )
                            ]
                          : null,
                    ),
                    child: Center(
                      child: Text(
                        isDone ? '✓' : step.$1,
                        style: TextStyle(
                          fontSize: isActive ? 18 : 14,
                          color: (isDone || isActive)
                              ? Colors.white
                              : (isDark ? Colors.white38 : Colors.black38),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    step.$2,
                    style: GoogleFonts.cairo(
                      fontSize: 9,
                      fontWeight:
                          isActive ? FontWeight.w800 : FontWeight.w500,
                      color: isActive
                          ? const Color(0xFF4F46E5)
                          : (isDark ? Colors.white38 : Colors.black38),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    ).animate().fadeIn(delay: 100.ms);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  STEP 1: DESTINATION
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildStep1Destination(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);
    final controller = TextEditingController(text: '');
    final searchNotifier = ValueNotifier<String>('');
    final showListNotifier = ValueNotifier<bool>(false);

    return _stepWrapper(
      isDark: isDark,
      child: Column(
        children: [
          _stepIcon('📍', const [Color(0xFF4F46E5), Color(0xFF7C3AED)]),
          const SizedBox(height: 16),
          Text('عايز تسافر فين؟',
              style: GoogleFonts.cairo(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1E1B4B))),
          const SizedBox(height: 6),
          Text('ابحث أو اختر من قائمة المدن المصرية',
              style: GoogleFonts.cairo(
                  fontSize: 13,
                  color: isDark ? Colors.white54 : Colors.black54)),
          const SizedBox(height: 20),

          // Popular destinations chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: popularDestinations.map((city) {
              final isSelected = wizard.destination == city.name;
              return GestureDetector(
                onTap: () {
                  notifier.setDestination(city.name);
                  searchNotifier.value = '';
                  showListNotifier.value = false;
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? const LinearGradient(
                            colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)])
                        : null,
                    color: isSelected
                        ? null
                        : (isDark ? Colors.white10 : Colors.white),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? Colors.transparent
                          : (isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
                    ),
                    boxShadow: isSelected
                        ? [BoxShadow(
                            color: const Color(0xFF4F46E5).withOpacity(0.3),
                            blurRadius: 8, offset: const Offset(0, 3))]
                        : null,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(city.emoji, style: const TextStyle(fontSize: 14)),
                      const SizedBox(width: 6),
                      Text(city.name,
                          style: GoogleFonts.cairo(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: isSelected
                                ? Colors.white
                                : (isDark ? Colors.white70 : Colors.black87),
                          )),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 16),

          // Search field
          ValueListenableBuilder<String>(
            valueListenable: searchNotifier,
            builder: (_, search, __) {
              final filtered = egyptCitiesList.where((c) {
                if (search.isEmpty) return true;
                return c.name.contains(search) || c.nameEn.toLowerCase().contains(search.toLowerCase());
              }).toList();

              return ValueListenableBuilder<bool>(
                valueListenable: showListNotifier,
                builder: (_, showList, __) => Column(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white10 : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: showList
                              ? const Color(0xFF4F46E5)
                              : (isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
                          width: showList ? 2 : 1,
                        ),
                      ),
                      child: TextField(
                        controller: controller,
                        textDirection: TextDirection.rtl,
                        onChanged: (v) {
                          searchNotifier.value = v;
                          showListNotifier.value = true;
                        },
                        onTap: () => showListNotifier.value = true,
                        decoration: InputDecoration(
                          hintText: 'ابحث عن أي مدينة...',
                          hintStyle: GoogleFonts.cairo(
                            color: isDark ? Colors.white38 : Colors.black38,
                          ),
                          prefixIcon: const Icon(Icons.search_rounded,
                              color: Color(0xFF4F46E5)),
                          suffixIcon: wizard.destination.isNotEmpty
                              ? const Icon(Icons.check_circle_rounded,
                                  color: Color(0xFF10B981))
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                        ),
                        style: GoogleFonts.cairo(
                          color: isDark ? Colors.white : Colors.black87,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    if (showList)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        constraints: const BoxConstraints(maxHeight: 220),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1E1B4B)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF4F46E5).withOpacity(0.15),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                          border: Border.all(
                            color: isDark
                                ? Colors.white12
                                : const Color(0xFFE5E7EB),
                          ),
                        ),
                        child: filtered.isEmpty
                            ? Padding(
                                padding: const EdgeInsets.all(16),
                                child: Text('لا توجد نتائج',
                                    style: GoogleFonts.cairo(
                                        color: isDark
                                            ? Colors.white54
                                            : Colors.black54)),
                              )
                            : ListView.builder(
                                shrinkWrap: true,
                                itemCount: filtered.length,
                                itemBuilder: (_, i) {
                                  final city = filtered[i];
                                  final isSelected =
                                      wizard.destination == city.name;
                                  return ListTile(
                                    dense: true,
                                    leading: Text(city.emoji,
                                        style: const TextStyle(fontSize: 18)),
                                    title: Text(city.name,
                                        style: GoogleFonts.cairo(
                                          fontWeight: FontWeight.w700,
                                          color: isSelected
                                              ? const Color(0xFF4F46E5)
                                              : (isDark
                                                  ? Colors.white
                                                  : Colors.black87),
                                        )),
                                    trailing: _categoryBadge(city.category),
                                    onTap: () {
                                      notifier.setDestination(city.name);
                                      controller.text = city.name;
                                      searchNotifier.value = city.name;
                                      showListNotifier.value = false;
                                    },
                                  );
                                },
                              ),
                      ),
                  ],
                ),
              );
            },
          ),

          const SizedBox(height: 24),
          _nextButton(
            label: 'التالي',
            enabled: wizard.destination.isNotEmpty,
            gradient: const [Color(0xFF4F46E5), Color(0xFF7C3AED)],
            onTap: () {
              showListNotifier.value = false;
              notifier.goNext();
            },
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  STEP 2: ORIGIN CITY
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildStep2Origin(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);

    return _stepWrapper(
      isDark: isDark,
      child: Column(
        children: [
          _stepIcon('🚌', const [Color(0xFF059669), Color(0xFF0D9488)]),
          const SizedBox(height: 16),
          Text('هتتحرك منين؟',
              style: GoogleFonts.cairo(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1E1B4B))),
          const SizedBox(height: 6),
          Text('اختر مدينة الانطلاق لحساب المواصلات',
              style: GoogleFonts.cairo(
                  fontSize: 13,
                  color: isDark ? Colors.white54 : Colors.black54)),
          const SizedBox(height: 20),

          // Popular origins
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: popularOrigins.map((city) {
              final isSelected = wizard.startCity == city.name;
              return GestureDetector(
                onTap: () => notifier.setOriginCity(city.name),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? const LinearGradient(
                            colors: [Color(0xFF059669), Color(0xFF0D9488)])
                        : null,
                    color: isSelected ? null : (isDark ? Colors.white10 : Colors.white),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? Colors.transparent
                          : (isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(city.emoji, style: const TextStyle(fontSize: 14)),
                      const SizedBox(width: 6),
                      Text(city.name,
                          style: GoogleFonts.cairo(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                          )),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 16),

          // Search all cities
          _searchableCityField(
            isDark: isDark,
            hint: 'ابحث عن محافظتك...',
            icon: Icons.location_on_rounded,
            selectedValue: wizard.startCity,
            onSelect: (city) => notifier.setOriginCity(city.name),
          ),

          const SizedBox(height: 24),
          Row(
            children: [
              _backButton(isDark, onTap: notifier.goBack),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _nextButton(
                  label: 'التالي',
                  enabled: wizard.startCity.isNotEmpty,
                  gradient: const [Color(0xFF059669), Color(0xFF0D9488)],
                  onTap: notifier.goNext,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  STEP 3: TRANSPORT
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildStep3Transport(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);

    return _stepWrapper(
      isDark: isDark,
      child: Column(
        children: [
          _stepIcon('🚗', const [Color(0xFFD97706), Color(0xFFB45309)]),
          const SizedBox(height: 16),
          Text('اختر وسيلة النقل',
              style: GoogleFonts.cairo(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1E1B4B))),
          const SizedBox(height: 6),
          Text('من ${wizard.startCity} إلى ${wizard.destination}',
              style: GoogleFonts.cairo(
                  fontSize: 13,
                  color: isDark ? Colors.white54 : Colors.black54)),
          const SizedBox(height: 24),

          if (wizard.transportOptions.isEmpty)
            _emptyTransportMessage(isDark)
          else
            ...wizard.transportOptions.map((opt) {
              final isSelected = wizard.selectedTransport?.type == opt.type;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GestureDetector(
                  onTap: () => notifier.selectTransport(opt),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: isSelected
                          ? const LinearGradient(
                              colors: [Color(0xFFD97706), Color(0xFFB45309)])
                          : null,
                      color: isSelected
                          ? null
                          : (isDark ? Colors.white10 : Colors.white),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected
                            ? Colors.transparent
                            : (isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
                      ),
                      boxShadow: isSelected
                          ? [BoxShadow(
                              color: const Color(0xFFD97706).withOpacity(0.3),
                              blurRadius: 12, offset: const Offset(0, 4))]
                          : null,
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? Colors.white.withOpacity(0.2)
                                : (isDark ? Colors.white10 : const Color(0xFFF5F5F5)),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Center(
                            child: Text(opt.icon, style: const TextStyle(fontSize: 24)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(opt.label,
                                  style: GoogleFonts.cairo(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: isSelected ? Colors.white : (isDark ? Colors.white : Colors.black87),
                                  )),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  Icon(Icons.access_time_rounded,
                                      size: 12,
                                      color: isSelected ? Colors.white70 : Colors.grey),
                                  const SizedBox(width: 4),
                                  Text(opt.duration,
                                      style: GoogleFonts.cairo(
                                        fontSize: 11,
                                        color: isSelected ? Colors.white70 : Colors.grey,
                                      )),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${opt.price}',
                              style: GoogleFonts.cairo(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: isSelected ? Colors.white : const Color(0xFFD97706),
                              ),
                            ),
                            Text('ج.م',
                                style: GoogleFonts.cairo(
                                  fontSize: 10,
                                  color: isSelected ? Colors.white70 : Colors.grey,
                                )),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ).animate().fadeIn(delay: (wizard.transportOptions.indexOf(opt) * 80).ms).slideX(begin: 0.05);
            }),

          const SizedBox(height: 24),
          Row(
            children: [
              _backButton(isDark, onTap: notifier.goBack),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _nextButton(
                  label: 'التالي',
                  enabled: wizard.transportOptions.isEmpty || wizard.selectedTransport != null,
                  gradient: const [Color(0xFFD97706), Color(0xFFB45309)],
                  onTap: notifier.goNext,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  STEP 4: DAYS
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildStep4Days(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);
    final customController = TextEditingController(
      text: wizard.days != null && ![3, 5, 10].contains(wizard.days)
          ? wizard.days.toString()
          : '',
    );

    const presets = [
      (label: '١-٣ أيام', value: 3, desc: 'رحلة سريعة'),
      (label: '٤-٧ أيام', value: 5, desc: 'عطلة مريحة'),
      (label: '+٧ أيام', value: 10, desc: 'إجازة طويلة'),
    ];

    return _stepWrapper(
      isDark: isDark,
      child: Column(
        children: [
          _stepIcon('📅', const [Color(0xFF0284C7), Color(0xFF1D4ED8)]),
          const SizedBox(height: 16),
          Text('كام يوم رحلتك؟',
              style: GoogleFonts.cairo(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1E1B4B))),
          const SizedBox(height: 6),
          Text('اختر مدة الرحلة بالأيام',
              style: GoogleFonts.cairo(
                  fontSize: 13,
                  color: isDark ? Colors.white54 : Colors.black54)),
          const SizedBox(height: 24),

          Row(
            children: presets.map((d) {
              final isSelected = wizard.days == d.value;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: GestureDetector(
                    onTap: () {
                      notifier.setDays(d.value);
                      customController.clear();
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      height: 90,
                      decoration: BoxDecoration(
                        gradient: isSelected
                            ? const LinearGradient(
                                colors: [Color(0xFF0284C7), Color(0xFF1D4ED8)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight)
                            : null,
                        color: isSelected
                            ? null
                            : (isDark ? Colors.white10 : Colors.white),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected
                              ? Colors.transparent
                              : (isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
                        ),
                        boxShadow: isSelected
                            ? [BoxShadow(
                                color: const Color(0xFF0284C7).withOpacity(0.4),
                                blurRadius: 12, offset: const Offset(0, 4))]
                            : null,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '${d.value}',
                            style: GoogleFonts.cairo(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: isSelected
                                  ? Colors.white
                                  : const Color(0xFF0284C7),
                            ),
                          ),
                          Text(d.desc,
                              style: GoogleFonts.cairo(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: isSelected ? Colors.white70 : Colors.grey,
                              )),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 16),
          Row(
            children: [
              Text('عدد مخصص:',
                  style: GoogleFonts.cairo(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white54 : Colors.black54,
                  )),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: customController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.cairo(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                  onChanged: (v) {
                    final n = int.tryParse(v);
                    if (n != null && n > 0) notifier.setDays(n);
                  },
                  decoration: InputDecoration(
                    hintText: '...',
                    hintStyle: GoogleFonts.cairo(color: Colors.grey),
                    filled: true,
                    fillColor: isDark ? Colors.white10 : Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(
                        color: isDark ? Colors.white12 : const Color(0xFFE5E7EB),
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(
                        color: isDark ? Colors.white12 : const Color(0xFFE5E7EB),
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFF0284C7), width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),
          Row(
            children: [
              _backButton(isDark, onTap: notifier.goBack),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _nextButton(
                  label: 'التالي',
                  enabled: wizard.days != null && wizard.days! > 0,
                  gradient: const [Color(0xFF0284C7), Color(0xFF1D4ED8)],
                  onTap: notifier.goNext,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  STEP 5: BUDGET
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildStep5Budget(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);
    final customController = TextEditingController(
      text: wizard.customBudget != null ? wizard.customBudget.toString() : '',
    );

    const budgets = [BudgetLevel.low, BudgetLevel.medium, BudgetLevel.high];
    const gradients = [
      [Color(0xFF059669), Color(0xFF0D9488)],
      [Color(0xFF1D4ED8), Color(0xFF4338CA)],
      [Color(0xFF7C3AED), Color(0xFF9333EA)],
    ];

    return _stepWrapper(
      isDark: isDark,
      child: Column(
        children: [
          _stepIcon('💰', const [Color(0xFF059669), Color(0xFF0D9488)]),
          const SizedBox(height: 16),
          Text('ميزانيتك اليومية؟',
              style: GoogleFonts.cairo(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1E1B4B))),
          const SizedBox(height: 6),
          Text('اختر مستوى الإنفاق اليومي',
              style: GoogleFonts.cairo(
                  fontSize: 13,
                  color: isDark ? Colors.white54 : Colors.black54)),
          const SizedBox(height: 24),

          ...budgets.asMap().entries.map((e) {
            final b = e.value;
            final isSelected = wizard.budget == b;
            final grad = gradients[e.key];

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: GestureDetector(
                onTap: () {
                  notifier.setBudget(b);
                  customController.clear();
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? LinearGradient(colors: grad.cast<Color>())
                        : null,
                    color: isSelected ? null : (isDark ? Colors.white10 : Colors.white),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected
                          ? Colors.transparent
                          : (isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
                    ),
                    boxShadow: isSelected
                        ? [BoxShadow(
                            color: grad[0].withOpacity(0.35),
                            blurRadius: 12, offset: const Offset(0, 4))]
                        : null,
                  ),
                  child: Row(
                    children: [
                      Text(b.emoji, style: const TextStyle(fontSize: 26)),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(b.label,
                                style: GoogleFonts.cairo(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: isSelected ? Colors.white : (isDark ? Colors.white : Colors.black87),
                                )),
                            Text(b.desc,
                                style: GoogleFonts.cairo(
                                  fontSize: 12,
                                  color: isSelected ? Colors.white70 : Colors.grey,
                                )),
                          ],
                        ),
                      ),
                      if (isSelected)
                        const Icon(Icons.check_circle_rounded,
                            color: Colors.white, size: 22),
                    ],
                  ),
                ),
              ),
            );
          }),

          // Custom budget
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? Colors.white10 : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? Colors.white12 : const Color(0xFFE5E7EB),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('أو أدخل ميزانية يومية مخصصة',
                    style: GoogleFonts.cairo(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white38 : Colors.black38,
                    )),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: customController,
                        keyboardType: TextInputType.number,
                        style: GoogleFonts.cairo(
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                        onChanged: (v) {
                          final n = int.tryParse(v);
                          notifier.setCustomBudget(n);
                        },
                        decoration: InputDecoration(
                          hintText: 'مثلاً: ٢٠٠٠',
                          hintStyle: GoogleFonts.cairo(color: Colors.grey),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                    Text('ج.م',
                        style: GoogleFonts.cairo(
                          fontWeight: FontWeight.w700,
                          color: Colors.grey,
                        )),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          Row(
            children: [
              _backButton(isDark, onTap: notifier.goBack),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _nextButton(
                  label: 'التالي',
                  enabled: wizard.budget != null || wizard.customBudget != null,
                  gradient: const [Color(0xFF059669), Color(0xFF0D9488)],
                  onTap: notifier.goNext,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  STEP 6: HOTEL NEEDED
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildStep6Hotel(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);

    return _stepWrapper(
      isDark: isDark,
      child: Column(
        children: [
          _stepIcon('🏨', const [Color(0xFF7C3AED), Color(0xFF9333EA)]),
          const SizedBox(height: 16),
          Text('محتاج فندق؟',
              style: GoogleFonts.cairo(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1E1B4B))),
          const SizedBox(height: 6),
          Text('هل تريد البحث عن إقامة في ${wizard.destination}؟',
              style: GoogleFonts.cairo(
                  fontSize: 13,
                  color: isDark ? Colors.white54 : Colors.black54)),
          const SizedBox(height: 32),

          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => notifier.setHotelNeeded(true),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    height: 130,
                    decoration: BoxDecoration(
                      gradient: wizard.hotelNeeded == true
                          ? const LinearGradient(
                              colors: [Color(0xFF7C3AED), Color(0xFF9333EA)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight)
                          : null,
                      color: wizard.hotelNeeded == true
                          ? null
                          : (isDark ? Colors.white10 : Colors.white),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: wizard.hotelNeeded == true
                            ? Colors.transparent
                            : (isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
                      ),
                      boxShadow: wizard.hotelNeeded == true
                          ? [BoxShadow(
                              color: const Color(0xFF7C3AED).withOpacity(0.4),
                              blurRadius: 16, offset: const Offset(0, 6))]
                          : null,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('👍', style: TextStyle(fontSize: 36)),
                        const SizedBox(height: 8),
                        Text('نعم',
                            style: GoogleFonts.cairo(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: wizard.hotelNeeded == true
                                  ? Colors.white
                                  : (isDark ? Colors.white : Colors.black87),
                            )),
                        Text('أدور لك على فنادق',
                            style: GoogleFonts.cairo(
                              fontSize: 11,
                              color: wizard.hotelNeeded == true ? Colors.white70 : Colors.grey,
                            )),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () => notifier.setHotelNeeded(false),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    height: 130,
                    decoration: BoxDecoration(
                      gradient: wizard.hotelNeeded == false
                          ? const LinearGradient(
                              colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight)
                          : null,
                      color: wizard.hotelNeeded == false
                          ? null
                          : (isDark ? Colors.white10 : Colors.white),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: wizard.hotelNeeded == false
                            ? Colors.transparent
                            : (isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
                      ),
                      boxShadow: wizard.hotelNeeded == false
                          ? [BoxShadow(
                              color: const Color(0xFFE11D48).withOpacity(0.4),
                              blurRadius: 16, offset: const Offset(0, 6))]
                          : null,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('👎', style: TextStyle(fontSize: 36)),
                        const SizedBox(height: 8),
                        Text('لا شكراً',
                            style: GoogleFonts.cairo(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: wizard.hotelNeeded == false
                                  ? Colors.white
                                  : (isDark ? Colors.white : Colors.black87),
                            )),
                        Text('مش محتاج فنادق',
                            style: GoogleFonts.cairo(
                              fontSize: 11,
                              color: wizard.hotelNeeded == false ? Colors.white70 : Colors.grey,
                            )),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 32),
          Row(
            children: [
              _backButton(isDark, onTap: notifier.goBack),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _nextButton(
                  label: wizard.hotelNeeded == false ? 'المراجعة النهائية' : 'التالي',
                  enabled: wizard.hotelNeeded != null,
                  gradient: const [Color(0xFF7C3AED), Color(0xFF9333EA)],
                  onTap: notifier.goNext,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  STEP 7: HOTEL DATES
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildStep7HotelDates(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);

    return _stepWrapper(
      isDark: isDark,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: _stepIcon('🗓️', const [Color(0xFFDB2777), Color(0xFFBE185D)])),
          const SizedBox(height: 16),
          Center(
            child: Text('متى ستبدأ رحلتك؟',
                style: GoogleFonts.cairo(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF1E1B4B))),
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              'حدد تاريخ الوصول وسنحسب المغادرة تلقائياً (${wizard.days ?? 0} أيام)',
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                  fontSize: 13,
                  color: isDark ? Colors.white54 : Colors.black54),
            ),
          ),
          const SizedBox(height: 24),

          // Check-in
          _dateCard(
            isDark: isDark,
            label: 'تاريخ الوصول',
            icon: Icons.calendar_today_rounded,
            color: const Color(0xFFDB2777),
            value: wizard.checkIn ?? '',
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime.now().add(const Duration(days: 1)),
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 365)),
                builder: (ctx, child) => Theme(
                  data: Theme.of(ctx).copyWith(
                    colorScheme: const ColorScheme.light(
                      primary: Color(0xFFDB2777),
                    ),
                  ),
                  child: child!,
                ),
              );
              if (picked != null) {
                final dateStr =
                    '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
                notifier.setCheckIn(dateStr);
              }
            },
          ),

          const SizedBox(height: 12),

          // Check-out (read-only)
          _dateCard(
            isDark: isDark,
            label: 'تاريخ المغادرة (تلقائي)',
            icon: Icons.flight_takeoff_rounded,
            color: Colors.grey,
            value: wizard.checkOut ?? 'يتم الحساب تلقائياً',
            isReadOnly: true,
            onTap: null,
          ),

          const SizedBox(height: 32),
          Row(
            children: [
              _backButton(isDark, onTap: notifier.goBack),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _nextButton(
                  label: 'المراجعة النهائية',
                  enabled: wizard.checkIn != null && wizard.checkOut != null,
                  gradient: const [Color(0xFFDB2777), Color(0xFFBE185D)],
                  onTap: notifier.goNext,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  STEP 8: REVIEW
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildStep8Review(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);

    return _stepWrapper(
      isDark: isDark,
      child: Column(
        children: [
          _stepIcon('✅', const [Color(0xFF4F46E5), Color(0xFF7C3AED)]),
          const SizedBox(height: 16),
          Text('مراجعة نهائية',
              style: GoogleFonts.cairo(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1E1B4B))),
          const SizedBox(height: 6),
          Text('راجع التفاصيل وأكّد رحلتك',
              style: GoogleFonts.cairo(
                  fontSize: 13,
                  color: isDark ? Colors.white54 : Colors.black54)),
          const SizedBox(height: 24),

          // Summary card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF4F46E5).withOpacity(0.1),
                  const Color(0xFF7C3AED).withOpacity(0.08),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: const Color(0xFF4F46E5).withOpacity(0.2),
              ),
            ),
            child: Column(
              children: [
                _reviewRow('📍', 'الوجهة', wizard.destination, isDark),
                _reviewRow('🚌', 'الانطلاق من', wizard.startCity, isDark),
                if (wizard.selectedTransport != null)
                  _reviewRow(
                    wizard.selectedTransport!.icon,
                    'المواصلات',
                    '${wizard.selectedTransport!.label} — ${wizard.selectedTransport!.price} ج.م',
                    isDark,
                  ),
                _reviewRow('📅', 'المدة', '${wizard.days} أيام', isDark),
                _reviewRow(
                    '💰', 'الميزانية', wizard.budget?.label ?? 'مخصصة', isDark),
                _reviewRow('🏨', 'فندق',
                    wizard.hotelNeeded == true ? 'نعم' : 'لا', isDark),
                if (wizard.hotelNeeded == true && wizard.checkIn != null)
                  _reviewRow('🗓️', 'التواريخ',
                      '${wizard.checkIn} → ${wizard.checkOut ?? ''}', isDark),
                const SizedBox(height: 12),
                Divider(color: const Color(0xFF4F46E5).withOpacity(0.25)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('التكلفة التقديرية',
                            style: GoogleFonts.cairo(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                              color: const Color(0xFF4F46E5),
                            )),
                        Text('مواصلات + أنشطة يومية',
                            style: GoogleFonts.cairo(
                              fontSize: 9,
                              color: const Color(0xFF6B7280),
                            )),
                      ],
                    ),
                    Text(
                      '${wizard.estimatedTotal.toStringAsFixed(0)} ج.م',
                      style: GoogleFonts.cairo(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF10B981),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          Row(
            children: [
              _backButton(isDark, onTap: notifier.goBack),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: wizard.isGeneratingPlan || wizard.isSearchingPlatform
                    ? _loadingButton(isDark)
                    : _nextButton(
                        label: wizard.mode == WizardMode.smart ? 'ابحث الآن 🔍' : 'ابدأ تخطيط الرحلة 🚀',
                        enabled: true,
                        gradient: wizard.mode == WizardMode.smart 
                            ? const [Color(0xFF3B82F6), Color(0xFF2563EB)] 
                            : const [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                        onTap: () async {
                          if (wizard.mode == WizardMode.smart) {
                            await notifier.searchPlatformTrips();
                          } else {
                            await notifier.generateTripPlan();
                          }
                        },
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  RESULTS VIEW
  // ══════════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════════
  //  RESULTS VIEW
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildResultsView(TripWizardState wizard, bool isDark) {
    final plan = wizard.tripPlan!;
    final notifier = ref.read(tripWizardProvider.notifier);

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Success banner
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF4F46E5).withOpacity(0.4),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Text('🎉', style: TextStyle(fontSize: 32)),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              wizard.generatedItinerary != null 
                                ? 'خطة رحلتك الذكية جاهزة!' 
                                : 'اختر الأماكن المفضلة لك',
                                style: GoogleFonts.cairo(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                )),
                            Text(
                              wizard.generatedItinerary != null
                                ? 'تم ترتيب الأماكن في جدول زمني مريح لك.'
                                : '${plan.attractions.length} معلم • ${plan.restaurants.length} مطعم • ${plan.hotels.length} فندق',
                              style: GoogleFonts.cairo(
                                fontSize: 12,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn().slideY(begin: 0.1),

                const SizedBox(height: 24),

                if (wizard.generatedItinerary != null) ...[
                  // ── Smart Itinerary View ──
                  ...wizard.generatedItinerary!.days.map((day) {
                    return _buildDayTimeline(day, isDark);
                  }).toList(),

                  // Re-organize button
                  GestureDetector(
                    onTap: () => notifier.clearItinerary(),
                    child: Container(
                      width: double.infinity,
                      height: 56,
                      margin: const EdgeInsets.only(top: 16),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white10 : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.pink.withOpacity(0.5),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'إعادة اختيار الأماكن',
                          style: GoogleFonts.cairo(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Colors.pink,
                          ),
                        ),
                      ),
                    ),
                  ),
                ] else ...[
                  // ── Selection View ──
                  if (plan.attractions.isNotEmpty) ...[
                    _sectionTitle('⭐ أبرز المعالم السياحية', isDark, count: wizard.selectedAttractions.length),
                    const SizedBox(height: 12),
                    GridView.builder(
                      physics: const NeverScrollableScrollPhysics(),
                      shrinkWrap: true,
                      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 400,
                        mainAxisExtent: 140,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: plan.attractions.length,
                      itemBuilder: (_, i) => _placeCard(
                        place: plan.attractions[i],
                        isDark: isDark,
                        isSelected: wizard.selectedAttractions.contains(plan.attractions[i].id),
                        onTap: () => notifier.toggleAttraction(plan.attractions[i].id),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  if (plan.restaurants.isNotEmpty) ...[
                    _sectionTitle('🍽️ أفضل المطاعم', isDark, count: wizard.selectedRestaurants.length),
                    const SizedBox(height: 12),
                    GridView.builder(
                      physics: const NeverScrollableScrollPhysics(),
                      shrinkWrap: true,
                      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 400,
                        mainAxisExtent: 140,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: plan.restaurants.length,
                      itemBuilder: (_, i) => _placeCard(
                        place: plan.restaurants[i],
                        isDark: isDark,
                        isSelected: wizard.selectedRestaurants.contains(plan.restaurants[i].id),
                        onTap: () => notifier.toggleRestaurant(plan.restaurants[i].id),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  if (plan.hotels.isNotEmpty) ...[
                    _sectionTitle('🏨 فنادق مقترحة', isDark, count: wizard.selectedHotels.length),
                    const SizedBox(height: 12),
                    GridView.builder(
                      physics: const NeverScrollableScrollPhysics(),
                      shrinkWrap: true,
                      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 400,
                        mainAxisExtent: 140,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: plan.hotels.length,
                      itemBuilder: (_, i) => _placeCard(
                        place: plan.hotels[i],
                        isDark: isDark,
                        isSelected: wizard.selectedHotels.contains(plan.hotels[i].id),
                        onTap: () => notifier.toggleHotel(plan.hotels[i].id),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ],
                const SizedBox(height: 60), // padding for bottom bar
              ],
            ),
          ),
        ),

        // ── Sticky Bottom Bar ──
        Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1B4B) : Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 20,
                offset: const Offset(0, -10),
              )
            ],
          ),
          child: Row(
            children: [
              if (wizard.generatedItinerary == null)
                Expanded(
                  child: wizard.isGeneratingItinerary
                      ? _loadingButton(isDark)
                      : _nextButton(
                          label: 'تنظيم ذكي ⚡',
                          enabled: wizard.selectedAttractions.isNotEmpty || wizard.selectedRestaurants.isNotEmpty,
                          gradient: const [Color(0xFF0284C7), Color(0xFF1D4ED8)],
                          onTap: () => notifier.generateSmartItinerary(),
                        ),
                )
              else
                Expanded(
                  child: wizard.isSavingTrip
                      ? _loadingButton(isDark)
                      : _nextButton(
                          label: 'حفظ الرحلة ✅',
                          enabled: true,
                          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
                          onTap: () async {
                            final tripId = await notifier.saveTrip();
                            if (!mounted) return;
                            if (tripId != null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('تم الحفظ بنجاح!', style: GoogleFonts.cairo())),
                              );
                              context.push('/trip/$tripId');
                            } else if (wizard.errorMessage != null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(wizard.errorMessage!, style: GoogleFonts.cairo()),
                                  backgroundColor: Colors.redAccent,
                                ),
                              );
                            }
                          },
                        ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDayTimeline(ItineraryDay day, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'اليوم ${day.dayNum} — ${day.title}',
                style: GoogleFonts.cairo(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1E1B4B),
                ),
              ),
              const SizedBox(width: 8),
              if (day.area.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0EA5E9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    day.area,
                    style: GoogleFonts.cairo(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          ...day.activities.map((act) => Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1B4B) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? Colors.white12 : const Color(0xFFE5E7EB),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Image Section
                    ClipRRect(
                      borderRadius: const BorderRadius.only(
                        topRight: Radius.circular(16),
                        bottomRight: Radius.circular(16),
                      ),
                      child: Stack(
                        children: [
                          Container(
                            width: 120,
                            height: double.infinity,
                            color: Colors.grey.shade300,
                            // Replace with real image if available
                            child: const Icon(Icons.image, color: Colors.grey),
                          ),
                          Positioned(
                            top: 8,
                            left: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.6),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                act.time,
                                style: GoogleFonts.cairo(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Details Section
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              act.name,
                              style: GoogleFonts.cairo(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Expanded(
                              child: Text(
                                act.note,
                                style: GoogleFonts.cairo(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isDark ? Colors.white70 : Colors.black54,
                                  height: 1.4,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(Icons.location_on, size: 14, color: Color(0xFF4F46E5)),
                                const SizedBox(width: 4),
                                Text(
                                  day.area,
                                  style: GoogleFonts.cairo(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF4F46E5),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn().slideX()),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  SHARED HELPERS
  // ══════════════════════════════════════════════════════════════════════

  Widget _stepWrapper({required Widget child, required bool isDark}) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
      child: child,
    );
  }

  Widget _stepIcon(String emoji, List<Color> colors) {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: colors),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: colors[0].withOpacity(0.4),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Center(child: Text(emoji, style: const TextStyle(fontSize: 32))),
    ).animate().scale(begin: const Offset(0.8, 0.8), duration: 300.ms, curve: Curves.elasticOut);
  }

  Widget _nextButton({
    required String label,
    required bool enabled,
    required List<Color> gradient,
    required VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 56,
        decoration: BoxDecoration(
          gradient: enabled ? LinearGradient(colors: gradient) : null,
          color: enabled ? null : Colors.grey.shade300,
          borderRadius: BorderRadius.circular(16),
          boxShadow: enabled
              ? [BoxShadow(
                  color: gradient[0].withOpacity(0.35),
                  blurRadius: 14, offset: const Offset(0, 5))]
              : null,
        ),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(label,
                  style: GoogleFonts.cairo(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: enabled ? Colors.white : Colors.grey.shade500,
                  )),
              if (enabled) ...[
                const SizedBox(width: 8),
                Icon(Icons.arrow_back_rounded,
                    color: Colors.white, size: 18),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _backButton(bool isDark, {required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: isDark ? Colors.white10 : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? Colors.white12 : const Color(0xFFE5E7EB),
          ),
        ),
        child: Icon(
          Icons.arrow_forward_rounded,
          color: isDark ? Colors.white54 : Colors.black54,
        ),
      ),
    );
  }

  Widget _loadingButton(bool isDark) {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 12),
            Text('جاري التخطيط...',
                style: GoogleFonts.cairo(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                )),
          ],
        ),
      ),
    ).animate().shimmer(duration: 1200.ms, color: Colors.white24);
  }

  Widget _reviewRow(String icon, String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Text(label,
              style: GoogleFonts.cairo(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF4F46E5),
              )),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: GoogleFonts.cairo(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : Colors.black87,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title, bool isDark, {int count = 0}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: GoogleFonts.cairo(
            fontSize: 17,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : const Color(0xFF1E1B4B),
          ),
        ),
        if (count > 0)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFF4F46E5).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '$count محدد',
              style: GoogleFonts.cairo(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF4F46E5),
              ),
            ),
          ),
      ],
    );
  }

  Widget _placeCard({
    required TripPlace place,
    required bool isDark,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final typeColors = {
      'attraction': const Color(0xFF4F46E5),
      'restaurant': const Color(0xFF10B981),
      'hotel': const Color(0xFF7C3AED),
    };
    final color = typeColors[place.type] ?? const Color(0xFF4F46E5);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.08) : (isDark ? const Color(0xFF1E1B4B) : Colors.white),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? color : (isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? []
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image Section
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topRight: Radius.circular(15),
                bottomRight: Radius.circular(15),
              ),
              child: Stack(
                children: [
                  place.imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: place.imageUrl!,
                          width: 120,
                          height: double.infinity,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                            width: 120,
                            color: color.withOpacity(0.1),
                            child: Center(child: CircularProgressIndicator(color: color, strokeWidth: 2)),
                          ),
                          errorWidget: (_, __, ___) => Container(
                            width: 120,
                            color: color.withOpacity(0.1),
                            child: Icon(Icons.image_rounded, color: color, size: 32),
                          ),
                        )
                      : Container(
                          width: 120,
                          color: color.withOpacity(0.1),
                          child: Icon(Icons.image_rounded, color: color, size: 32),
                        ),
                  if (isSelected)
                    Positioned(
                      top: 8,
                      right: 8, // since RTL, right is left visually? No right is right. 
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFF4F46E5),
                        ),
                        child: const Icon(Icons.check, color: Colors.white, size: 16),
                      ),
                    ),
                  if (!isSelected)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          border: Border.all(color: Colors.grey.shade400, width: 1.5),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Details Section
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, size: 14, color: Color(0xFFF59E0B)),
                        const SizedBox(width: 4),
                        Text(
                          place.rating?.toStringAsFixed(1) ?? '4.5',
                          style: GoogleFonts.cairo(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      place.name,
                      style: GoogleFonts.cairo(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      place.description ?? '',
                      style: GoogleFonts.cairo(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white54 : Colors.grey.shade600,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ).animate().fadeIn(delay: 50.ms).slideX(begin: 0.08),
    );
  }

  Widget _categoryBadge(String category) {
    final map = {
      'beach': ('شواطئ', const Color(0xFF0EA5E9)),
      'historical': ('تاريخية', const Color(0xFFD97706)),
      'desert': ('صحراء', const Color(0xFFF59E0B)),
      'tourist': ('سياحية', const Color(0xFF059669)),
      'governorate': ('محافظة', const Color(0xFF6B7280)),
    };
    final info = map[category] ?? ('أخرى', const Color(0xFF6B7280));
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: info.$2.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(info.$1,
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w700,
            color: info.$2,
          )),
    );
  }

  Widget _emptyTransportMessage(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? Colors.white10 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white12 : const Color(0xFFE5E7EB),
        ),
      ),
      child: Column(
        children: [
          const Text('🚌', style: TextStyle(fontSize: 40)),
          const SizedBox(height: 12),
          Text(
            'لا يمكن حساب المواصلات لهذا المسار',
            textAlign: TextAlign.center,
            style: GoogleFonts.cairo(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white54 : Colors.black54,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'يمكنك المتابعة بدون اختيار مواصلات',
            textAlign: TextAlign.center,
            style: GoogleFonts.cairo(
              fontSize: 11,
              color: isDark ? Colors.white38 : Colors.black38,
            ),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  PLATFORM TRIPS RESULTS VIEW (SMART SEARCH)
  // ══════════════════════════════════════════════════════════════════════
  Widget _buildPlatformTripsResultsView(TripWizardState wizard, bool isDark) {
    final notifier = ref.read(tripWizardProvider.notifier);
    final query = wizard.smartSearchQuery ?? wizard.destination;
    final isEmpty = wizard.platformTrips.isEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isEmpty ? 'نتائج البحث' : 'نتائج البحث 🔍 (${wizard.platformTrips.length})',
                style: GoogleFonts.cairo(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1E1B4B),
                ),
              ),
              GestureDetector(
                onTap: () => notifier.clearSmartSearch(),
                child: Text(
                  'بحث جديد',
                  style: GoogleFonts.cairo(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF3B82F6),
                  ),
                ),
              )
            ],
          ),
        ),
        Expanded(
          child: isEmpty
              ? _buildSmartSearchEmptyState(wizard, isDark, query, notifier)
              : ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            itemCount: wizard.platformTrips.length,
            itemBuilder: (context, index) {
              final trip = wizard.platformTrips[index];
              return GestureDetector(
                onTap: () => _openCorporateTripFromSearch(trip),
                child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? Colors.white10 : const Color(0xFFE5E7EB),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                      child: CachedNetworkImage(
                        imageUrl: trip['image'],
                        height: 160,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  trip['title'],
                                  style: GoogleFonts.cairo(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: isDark ? Colors.white : Colors.black87,
                                  ),
                                ),
                              ),
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 18),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${trip['rating']}',
                                    style: GoogleFonts.cairo(
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? Colors.white70 : Colors.black87,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              _infoBadge(Icons.calendar_today, '${trip['days']} أيام', isDark),
                              const SizedBox(width: 8),
                              _infoBadge(Icons.account_balance_wallet, trip['budget'], isDark),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ).animate().fadeIn(delay: Duration(milliseconds: index * 100)).slideY(begin: 0.1);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSmartSearchEmptyState(
    TripWizardState wizard,
    bool isDark,
    String query,
    TripWizardNotifier notifier,
  ) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.travel_explore_outlined, size: 72, color: isDark ? Colors.white24 : Colors.grey.shade400),
            const SizedBox(height: 20),
            Text(
              'لم نجد رحلات',
              style: GoogleFonts.cairo(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF1E1B4B),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              wizard.errorMessage ?? 'لم نجد رحلات شركات لـ «$query» في الوقت الحالي.',
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                fontSize: 14,
                height: 1.6,
                color: isDark ? Colors.white60 : Colors.black54,
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  notifier.clearSmartSearch();
                  notifier.setMode(WizardMode.custom);
                },
                icon: const Icon(Icons.auto_awesome),
                label: Text('التخطيط المخصص بالذكاء الاصطناعي', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => notifier.clearSmartSearch(),
              child: Text('تغيير الوجهة والبحث مرة أخرى', style: GoogleFonts.cairo(color: const Color(0xFF3B82F6))),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openCorporateTripFromSearch(Map<String, dynamic> trip) async {
    final slug = trip['slug']?.toString() ?? trip['id']?.toString();
    if (slug == null || slug.isEmpty) return;

    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/corporate/trips/$slug');
      if (!mounted) return;
      final data = response.data;
      final Map<String, dynamic> full =
          data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
      context.push('/corporate-trip/${trip['id']}', extra: full);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر فتح تفاصيل الرحلة', style: GoogleFonts.cairo())),
      );
    }
  }

  Widget _infoBadge(IconData icon, String text, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? Colors.white10 : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: isDark ? Colors.white70 : Colors.black54),
          const SizedBox(width: 6),
          Text(
            text,
            style: GoogleFonts.cairo(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white70 : Colors.black54,
            ),
          ),
        ],
      ),
    );
  }

  Widget _dateCard({
    required bool isDark,
    required String label,
    required IconData icon,
    required Color color,
    required String value,
    required VoidCallback? onTap,
    bool isReadOnly = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? Colors.white10 : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isReadOnly
                ? (isDark ? Colors.white12 : const Color(0xFFE5E7EB))
                : color.withOpacity(0.3),
            width: isReadOnly ? 1 : 1.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isReadOnly
                    ? (isDark ? Colors.white10 : const Color(0xFFF5F5F5))
                    : color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: isReadOnly ? Colors.grey : color, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: GoogleFonts.cairo(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white38 : Colors.black38,
                      )),
                  const SizedBox(height: 2),
                  Text(
                    value.isEmpty ? 'اضغط لتحديد التاريخ' : value,
                    style: GoogleFonts.cairo(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: value.isEmpty
                          ? Colors.grey
                          : (isDark ? Colors.white : Colors.black87),
                    ),
                  ),
                ],
              ),
            ),
            if (!isReadOnly)
              Icon(Icons.chevron_right_rounded, color: color),
          ],
        ),
      ),
    );
  }

  Widget _searchableCityField({
    required bool isDark,
    required String hint,
    required IconData icon,
    required String selectedValue,
    required Function(EgyptCity) onSelect,
  }) {
    final searchNotifier = ValueNotifier<String>('');
    final showListNotifier = ValueNotifier<bool>(false);

    return ValueListenableBuilder<String>(
      valueListenable: searchNotifier,
      builder: (_, search, __) {
        final filtered = egyptCitiesList.where((c) {
          if (search.isEmpty) return true;
          return c.name.contains(search) || c.nameEn.toLowerCase().contains(search.toLowerCase());
        }).toList();

        return ValueListenableBuilder<bool>(
          valueListenable: showListNotifier,
          builder: (_, showList, __) => Column(
            children: [
              Container(
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: showList
                        ? const Color(0xFF059669)
                        : (isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
                    width: showList ? 2 : 1,
                  ),
                ),
                child: TextField(
                  textDirection: TextDirection.rtl,
                  onChanged: (v) {
                    searchNotifier.value = v;
                    showListNotifier.value = true;
                  },
                  onTap: () => showListNotifier.value = true,
                  decoration: InputDecoration(
                    hintText: hint,
                    hintStyle: GoogleFonts.cairo(
                      color: isDark ? Colors.white38 : Colors.black38,
                    ),
                    prefixIcon: Icon(icon, color: const Color(0xFF059669)),
                    suffixIcon: selectedValue.isNotEmpty
                        ? const Icon(Icons.check_circle_rounded,
                            color: Color(0xFF10B981))
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                  ),
                  style: GoogleFonts.cairo(
                    color: isDark ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              if (showList)
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  constraints: const BoxConstraints(maxHeight: 220),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E1B4B) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                    border: Border.all(
                      color: isDark ? Colors.white12 : const Color(0xFFE5E7EB),
                    ),
                  ),
                  child: filtered.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text('لا توجد نتائج',
                              style: GoogleFonts.cairo(
                                  color: isDark ? Colors.white54 : Colors.black54)),
                        )
                      : ListView.builder(
                          shrinkWrap: true,
                          itemCount: filtered.length,
                          itemBuilder: (_, i) {
                            final city = filtered[i];
                            final isSel = selectedValue == city.name;
                            return ListTile(
                              dense: true,
                              leading: Text(city.emoji, style: const TextStyle(fontSize: 18)),
                              title: Text(city.name,
                                  style: GoogleFonts.cairo(
                                    fontWeight: FontWeight.w700,
                                    color: isSel
                                        ? const Color(0xFF059669)
                                        : (isDark ? Colors.white : Colors.black87),
                                  )),
                              onTap: () {
                                onSelect(city);
                                showListNotifier.value = false;
                              },
                            );
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
