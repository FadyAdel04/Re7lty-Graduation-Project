import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/trip.dart';
import '../../models/user.dart';
import '../../theme/app_colors.dart';

class DiscoverTripCard extends StatelessWidget {
  final Trip trip;
  final User? author;

  const DiscoverTripCard({super.key, required this.trip, this.author});

  bool get _isAsk => trip.postType == 'ask';
  bool get _hasImage => trip.image != null && trip.image!.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.cardDark : Colors.white;
    final borderColor = isDark ? Colors.white12 : Colors.grey.shade200;
    final muted = isDark ? Colors.white60 : Colors.grey.shade600;

    return Material(
      color: cardColor,
      borderRadius: BorderRadius.circular(32),
      elevation: 0,
      child: InkWell(
        onTap: _isAsk ? null : () => context.push('/trip/${trip.id}'),
        borderRadius: BorderRadius.circular(32),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: borderColor),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.2 : 0.06),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (!_isAsk || _hasImage) _buildImageSection(context) else _buildAskHeader(),
              Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      trip.title,
                      style: GoogleFonts.cairo(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.right,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      trip.description ?? '',
                      style: GoogleFonts.cairo(color: muted, fontSize: 13, height: 1.5, fontWeight: FontWeight.w600),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.right,
                    ),
                    const SizedBox(height: 18),
                    Divider(color: borderColor, height: 1),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        if (!_isAsk)
                          TextButton.icon(
                            onPressed: () => context.push('/trip/${trip.id}'),
                            icon: const Icon(Icons.open_in_new, size: 16),
                            label: Text('التفاصيل', style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 12)),
                            style: TextButton.styleFrom(foregroundColor: AppColors.primaryOrange),
                          ),
                        const Spacer(),
                        _AuthorChip(trip: trip, author: author, muted: muted),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAskHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 22, 22, 0),
      child: Align(
        alignment: Alignment.centerRight,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.12),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: Colors.green.withOpacity(0.25)),
          ),
          child: Text(
            'سؤال واستفسار ❓',
            style: GoogleFonts.cairo(color: Colors.green.shade700, fontWeight: FontWeight.w900, fontSize: 11),
          ),
        ),
      ),
    );
  }

  Widget _buildImageSection(BuildContext context) {
    final location = trip.destination ?? trip.city ?? 'وجهة مميزة';
    final days = trip.days.isNotEmpty ? trip.days.length : 1;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      child: SizedBox(
        height: 220,
        child: Stack(
          fit: StackFit.expand,
          children: [
            CachedNetworkImage(
              imageUrl: trip.image ?? '',
              fit: BoxFit.cover,
              errorWidget: (_, __, ___) => Container(
                color: Colors.grey.shade300,
                child: const Icon(Icons.landscape, size: 48, color: Colors.white54),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Colors.black.withOpacity(0.75), Colors.transparent],
                ),
              ),
            ),
            if (_isAsk)
              Positioned(
                top: 16,
                right: 16,
                child: _Badge(
                  label: 'سؤال واستفسار ❓',
                  color: Colors.green,
                ),
              )
            else ...[
              Positioned(
                top: 16,
                right: 16,
                child: _Badge(
                  label: location,
                  color: Colors.white,
                  foreground: Colors.black87,
                  icon: Icons.location_on,
                ),
              ),
              Positioned(
                top: 16,
                left: 16,
                child: _Badge(
                  label: '$days أيام',
                  color: AppColors.primaryOrange,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? foreground;
  final IconData? icon;

  const _Badge({
    required this.label,
    required this.color,
    this.foreground,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final fg = foreground ?? Colors.white;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(color == Colors.white ? 0.92 : 1),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 8)],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 14, color: AppColors.primaryOrange), const SizedBox(width: 4)],
          Text(label, style: GoogleFonts.cairo(color: fg, fontSize: 10, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class _AuthorChip extends StatelessWidget {
  final Trip trip;
  final User? author;
  final Color muted;

  const _AuthorChip({required this.trip, this.author, required this.muted});

  @override
  Widget build(BuildContext context) {
    final name = author?.fullName ?? trip.author ?? 'مستكشف';
    final avatar = author?.imageUrl ?? trip.authorImage;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(name, style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 13), overflow: TextOverflow.ellipsis),
            Text('مستكشف', style: GoogleFonts.cairo(color: muted, fontSize: 10, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(width: 8),
        CircleAvatar(
          radius: 20,
          backgroundImage: avatar != null && avatar.isNotEmpty ? NetworkImage(avatar) : null,
          child: avatar == null || avatar.isEmpty ? Text(name.isNotEmpty ? name[0] : '?') : null,
        ),
      ],
    );
  }
}
