import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
class DiscoverHero extends StatelessWidget {
  final VoidCallback? onBrowseTrips;
  final VoidCallback? onFindTravelers;

  const DiscoverHero({
    super.key,
    this.onBrowseTrips,
    this.onFindTravelers,
  });

  static const _heroImage =
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1400&q=80';

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: SizedBox(
        height: 300,
        width: double.infinity,
        child: Stack(
          fit: StackFit.expand,
          children: [
            CachedNetworkImage(
              imageUrl: _heroImage,
              fit: BoxFit.cover,
            ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerRight,
                  end: Alignment.centerLeft,
                  colors: [
                    Colors.black.withOpacity(0.85),
                    Colors.black.withOpacity(0.45),
                    Colors.black.withOpacity(0.15),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.auto_awesome, color: Colors.orangeAccent, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'اكتشف وجهات جديدة',
                          style: GoogleFonts.cairo(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'شارك رحلاتك،',
                    style: GoogleFonts.cairo(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      height: 1.2,
                    ),
                    textAlign: TextAlign.right,
                  ),
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [Color(0xFFFF8A50), Color(0xFFFFE082)],
                    ).createShader(bounds),
                    child: Text(
                      'وألهم الآخرين',
                      style: GoogleFonts.cairo(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        height: 1.2,
                      ),
                      textAlign: TextAlign.right,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'انضم إلى مجتمع المسافرين. تصفح آلاف القصص المصورة، اكتشف أماكن خفية، وخطط لمغامرتك التالية.',
                    style: GoogleFonts.cairo(color: Colors.white70, fontSize: 13, height: 1.5),
                    textAlign: TextAlign.right,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    alignment: WrapAlignment.end,
                    children: [
                      _HeroButton(
                        label: 'تصفح الرحلات',
                        icon: Icons.explore,
                        filled: true,
                        onTap: onBrowseTrips,
                      ),
                      _HeroButton(
                        label: 'ابحث عن مسافرين',
                        icon: Icons.people_outline,
                        filled: false,
                        onTap: onFindTravelers,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool filled;
  final VoidCallback? onTap;

  const _HeroButton({
    required this.label,
    required this.icon,
    required this.filled,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? const Color(0xFFEA580C) : Colors.white.withOpacity(0.12),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Text(label, style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}
