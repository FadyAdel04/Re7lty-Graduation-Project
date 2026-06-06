import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/trip.dart';
import '../../providers/trip_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/discover/live_pulse_map_widget.dart';

/// Full-screen interactive pulse map (opened from discover teaser).
class DiscoverPulseMapPage extends ConsumerWidget {
  final List<Trip>? initialTrips;

  const DiscoverPulseMapPage({super.key, this.initialTrips});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (initialTrips != null && initialTrips!.isNotEmpty) {
      return _buildScaffold(context, isDark, initialTrips!);
    }

    return FutureBuilder<List<Trip>>(
      future: ref.read(tripServiceProvider).getTrips(limit: 100),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
            appBar: _appBar(context),
            body: const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
          );
        }
        final trips = snapshot.data ?? [];
        return _buildScaffold(context, isDark, trips);
      },
    );
  }

  PreferredSizeWidget _appBar(BuildContext context) {
    return AppBar(
      title: Text('خريطة نبض الرحلات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
      centerTitle: true,
    );
  }

  Widget _buildScaffold(BuildContext context, bool isDark, List<Trip> trips) {
    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      appBar: _appBar(context),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'اضغط على أي نقطة لعرض تفاصيل الرحلة',
              style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.w600, fontSize: 12),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: LivePulseMapWidget(
                trips: trips,
                height: double.infinity,
                showOverlay: true,
                markersInteractive: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
