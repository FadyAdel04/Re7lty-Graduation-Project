import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../models/trip_wizard_state.dart';

class TripOverviewPage extends ConsumerWidget {
  final TripWizardState wizardState;

  const TripOverviewPage({Key? key, required this.wizardState}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final itinerary = wizardState.generatedItinerary;

    // Get all valid locations to calculate bounds and markers
    List<Marker> markers = [];
    double sumLat = 0;
    double sumLng = 0;
    int validPoints = 0;
    
    if (itinerary != null) {
      for (var day in itinerary.days) {
        for (var act in day.activities) {
          if (act.lat != null && act.lng != null) {
            final color = Color(int.parse(day.color.replaceAll('#', '0xFF')));
            markers.add(Marker(
              point: LatLng(act.lat!, act.lng!),
              width: 40,
              height: 40,
              child: Icon(Icons.location_on, color: color, size: 30),
            ));
            sumLat += act.lat!;
            sumLng += act.lng!;
            validPoints++;
          }
        }
      }
    }

    final LatLng center = validPoints > 0 
      ? LatLng(sumLat / validPoints, sumLng / validPoints)
      : const LatLng(30.0444, 31.2357); // Default to Cairo

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(
          'نظرة عامة على الرحلة',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black),
      ),
      body: itinerary == null
          ? const Center(child: Text('لا يوجد تفاصيل للرحلة'))
          : Column(
              children: [
                // Interactive Map Area
                SizedBox(
                  height: 250,
                  width: double.infinity,
                  child: FlutterMap(
                    options: MapOptions(
                      initialCenter: center,
                      initialZoom: 11.0,
                    ),
                    children: [
                      TileLayer(
                        urlTemplate: isDark 
                            ? 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
                            : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.example.app',
                      ),
                      MarkerLayer(markers: markers),
                    ],
                  ),
                ),
                
                // Timeline
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: itinerary.days.length,
                    itemBuilder: (context, index) {
                      final day = itinerary.days[index];
                      return _buildDayTimeline(day, isDark);
                    },
                  ),
                ),
              ],
            ),
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
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFF4F46E5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    '\${day.dayNum}',
                    style: GoogleFonts.cairo(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      day.title,
                      style: GoogleFonts.cairo(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF1E1B4B),
                      ),
                    ),
                    if (day.area.isNotEmpty)
                      Text(
                        day.area,
                        style: GoogleFonts.cairo(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF4F46E5),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...day.activities.map((act) => Container(
                margin: const EdgeInsets.only(right: 18, bottom: 16),
                decoration: BoxDecoration(
                  border: Border(
                    right: BorderSide(
                      color: isDark ? Colors.white12 : const Color(0xFFE5E7EB),
                      width: 2,
                    ),
                  ),
                ),
                padding: const EdgeInsets.only(right: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white10 : Colors.black.withAlpha(13),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            act.time,
                            style: GoogleFonts.cairo(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white70 : Colors.black87,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            act.name,
                            style: GoogleFonts.cairo(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      act.note,
                      style: GoogleFonts.cairo(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white54 : Colors.black54,
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
