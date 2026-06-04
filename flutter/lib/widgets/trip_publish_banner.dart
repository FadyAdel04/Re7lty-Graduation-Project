import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/trip_publish_provider.dart';
import '../theme/app_colors.dart';

class TripPublishBanner extends ConsumerWidget {
  const TripPublishBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final publish = ref.watch(tripPublishProvider);

    return AnimatedSize(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      alignment: Alignment.topCenter,
      child: publish == null
          ? const SizedBox(width: double.infinity, height: 0)
          : _PublishCard(
              publish: publish,
              onDismiss: () => ref.read(tripPublishProvider.notifier).dismiss(),
            ),
    );
  }
}

class _PublishCard extends StatelessWidget {
  final TripPublishState publish;
  final VoidCallback onDismiss;

  const _PublishCard({required this.publish, required this.onDismiss});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isError = publish.phase == TripPublishPhase.error;
    final isDone = publish.phase == TripPublishPhase.done;
    final isUploading = !isError && !isDone;
    final percent = (publish.progress * 100).round().clamp(0, 100);

    final accent = isError
        ? const Color(0xFFEF4444)
        : isDone
            ? const Color(0xFF22C55E)
            : AppColors.primaryOrange;

    final bg = isDark ? const Color(0xFF161B22) : Colors.white;
    final borderColor = isError
        ? accent.withValues(alpha: 0.35)
        : isDone
            ? accent.withValues(alpha: 0.35)
            : AppColors.primaryOrange.withValues(alpha: 0.25);

    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
        child: Material(
          color: Colors.transparent,
          child: Container(
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: borderColor, width: 1.2),
              boxShadow: [
                BoxShadow(
                  color: accent.withValues(alpha: isDark ? 0.18 : 0.12),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 10, 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      _StatusIcon(
                        isError: isError,
                        isDone: isDone,
                        progress: publish.progress,
                        accent: accent,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isError
                                  ? 'فشل نشر الرحلة'
                                  : isDone
                                      ? 'تم النشر بنجاح!'
                                      : 'جاري نشر رحلتك',
                              style: GoogleFonts.cairo(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                height: 1.2,
                                color: isDark ? Colors.white : const Color(0xFF111827),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isError
                                  ? (publish.errorMessage ?? 'حاول مرة أخرى')
                                  : isDone
                                      ? 'ظهرت في الصفحة الرئيسية'
                                      : (publish.status.isNotEmpty ? publish.status : 'جاري رفع الملفات...'),
                              style: GoogleFonts.cairo(
                                fontSize: 11,
                                height: 1.3,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white60 : Colors.grey.shade600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (isUploading)
                        _PercentBadge(percent: percent, accent: accent)
                      else if (isError)
                        _IconAction(
                          icon: Icons.close_rounded,
                          color: Colors.white,
                          bg: accent,
                          onTap: onDismiss,
                        )
                      else
                        _IconAction(
                          icon: Icons.check_rounded,
                          color: Colors.white,
                          bg: accent,
                          onTap: onDismiss,
                        ),
                    ],
                  ),
                ),
                if (isUploading)
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: publish.progress.clamp(0.0, 1.0)),
                    duration: const Duration(milliseconds: 350),
                    curve: Curves.easeOut,
                    builder: (context, value, _) {
                      return _GradientProgressBar(value: value, accent: accent);
                    },
                  )
                else
                  Container(
                    height: 3,
                    color: accent,
                  ),
              ],
            ),
          ),
        ),
      ),
    )
        .animate(key: ValueKey(publish.phase))
        .fadeIn(duration: 280.ms, curve: Curves.easeOut)
        .slideY(begin: -0.15, end: 0, duration: 320.ms, curve: Curves.easeOutCubic);
  }
}

class _StatusIcon extends StatelessWidget {
  final bool isError;
  final bool isDone;
  final double progress;
  final Color accent;

  const _StatusIcon({
    required this.isError,
    required this.isDone,
    required this.progress,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    if (isError) {
      return Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: accent.withValues(alpha: 0.15),
          shape: BoxShape.circle,
        ),
        child: Icon(Icons.cloud_off_rounded, color: accent, size: 22),
      );
    }

    if (isDone) {
      return Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [accent, accent.withValues(alpha: 0.75)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.check_rounded, color: Colors.white, size: 22),
      );
    }

    return SizedBox(
      width: 40,
      height: 40,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              value: progress > 0 ? progress.clamp(0.05, 1.0) : null,
              backgroundColor: accent.withValues(alpha: 0.15),
              color: accent,
              strokeCap: StrokeCap.round,
            ),
          ),
          Icon(Icons.flight_takeoff_rounded, color: accent, size: 18),
        ],
      ),
    );
  }
}

class _PercentBadge extends StatelessWidget {
  final int percent;
  final Color accent;

  const _PercentBadge({required this.percent, required this.accent});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [accent, accent.withValues(alpha: 0.85)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        '$percent%',
        style: GoogleFonts.cairo(
          color: Colors.white,
          fontWeight: FontWeight.w900,
          fontSize: 12,
          height: 1,
        ),
      ),
    );
  }
}

class _IconAction extends StatelessWidget {
  final IconData icon;
  final Color color;
  final Color bg;
  final VoidCallback onTap;

  const _IconAction({
    required this.icon,
    required this.color,
    required this.bg,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: bg,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Padding(
          padding: const EdgeInsets.all(6),
          child: Icon(icon, color: color, size: 18),
        ),
      ),
    );
  }
}

class _GradientProgressBar extends StatelessWidget {
  final double value;
  final Color accent;

  const _GradientProgressBar({required this.value, required this.accent});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth * value.clamp(0.0, 1.0);
        return SizedBox(
          height: 4,
          child: Stack(
            children: [
              Container(color: accent.withValues(alpha: 0.12)),
              AnimatedContainer(
                duration: const Duration(milliseconds: 350),
                curve: Curves.easeOut,
                width: width,
                height: 4,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      accent.withValues(alpha: 0.7),
                      accent,
                      const Color(0xFFFFA726),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: accent.withValues(alpha: 0.45),
                      blurRadius: 6,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
