import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mb;
import '../../models/trip.dart';
import '../../theme/app_colors.dart';
import '../../utils/live_pulse_map_logic.dart';

/// Interactive Egypt pulse map (web LivePulseMap equivalent).
class LivePulseMapWidget extends StatefulWidget {
  final List<Trip> trips;
  final double height;
  final bool showOverlay;
  final bool markersInteractive;

  const LivePulseMapWidget({
    super.key,
    required this.trips,
    this.height = 400,
    this.showOverlay = true,
    this.markersInteractive = true,
  });

  @override
  State<LivePulseMapWidget> createState() => _LivePulseMapWidgetState();
}

class _LivePulseMapWidgetState extends State<LivePulseMapWidget> {
  mb.MapboxMap? _map;
  mb.PointAnnotationManager? _pointManager;
  mb.CircleAnnotationManager? _heatManager;
  final Map<String, Trip> _tripByAnnotationId = {};
  bool _showMarkers = true;
  bool _showHeat = true;
  bool _mapReady = false;
  String? _selectedCity;
  late List<TripMapPlacement> _placements;

  bool get _hasToken => dotenv.get('MAPBOX_ACCESS_TOKEN', fallback: '').isNotEmpty;

  @override
  void initState() {
    super.initState();
    _placements = LivePulseMapLogic.buildPlacements(widget.trips);
  }

  @override
  void didUpdateWidget(covariant LivePulseMapWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.trips != widget.trips) {
      _placements = LivePulseMapLogic.buildPlacements(widget.trips);
      _refreshAnnotations();
    }
  }

  @override
  void dispose() {
    _pointManager = null;
    _heatManager = null;
    _map = null;
    super.dispose();
  }

  Future<void> _onMapCreated(mb.MapboxMap map) async {
    _map = map;
    _pointManager = await map.annotations.createPointAnnotationManager();
    _heatManager = await map.annotations.createCircleAnnotationManager();

    _pointManager!.tapEvents(onTap: (annotation) {
      if (!widget.markersInteractive) return;
      final id = annotation.id;
      if (id == null) return;
      final trip = _tripByAnnotationId[id];
      if (trip != null && mounted) _showTripSheet(trip);
    });

    await _refreshAnnotations();
    if (mounted) setState(() => _mapReady = true);
  }

  Future<void> _refreshAnnotations() async {
    if (_map == null || _pointManager == null || _heatManager == null) return;

    _tripByAnnotationId.clear();
    await _pointManager!.deleteAll();
    await _heatManager!.deleteAll();

    if (_showHeat) {
      final heat = <mb.CircleAnnotationOptions>[];
      for (final p in _placements) {
        for (var i = 0; i < 3; i++) {
          final coords = LivePulseMapLogic.generatePoint(p.cityKey, i, 3);
          heat.add(mb.CircleAnnotationOptions(
            geometry: mb.Point(coordinates: mb.Position(coords[0], coords[1])),
            circleRadius: 28,
            circleColor: AppColors.primaryOrange.withOpacity(0.35).value,
            circleStrokeWidth: 0,
          ));
        }
      }
      if (heat.isNotEmpty) await _heatManager!.createMulti(heat);
    }

    if (_showMarkers) {
      final points = <mb.PointAnnotationOptions>[];
      for (final p in _placements) {
        points.add(mb.PointAnnotationOptions(
          geometry: mb.Point(coordinates: mb.Position(p.lng, p.lat)),
          iconImage: 'marker',
          iconSize: 1.2,
          iconColor: AppColors.primaryOrange.value,
          textField: p.trip.title.length > 18 ? '${p.trip.title.substring(0, 18)}…' : p.trip.title,
          textOffset: [0, -2.2],
          textSize: 11,
          textColor: Colors.white.value,
          textHaloColor: Colors.black87.value,
          textHaloWidth: 1.2,
        ));
      }
      if (points.isNotEmpty) {
        final created = await _pointManager!.createMulti(points);
        for (var i = 0; i < created.length && i < _placements.length; i++) {
          final id = created[i]?.id;
          if (id != null) _tripByAnnotationId[id] = _placements[i].trip;
        }
      }
    }
  }

  Future<void> _flyToCity(EgyptCityData city) async {
    if (_map == null) return;
    setState(() => _selectedCity = city.key);
    await _map!.flyTo(
      mb.CameraOptions(
        center: mb.Point(coordinates: mb.Position(city.centerLng, city.centerLat)),
        zoom: 8.2,
      ),
      mb.MapAnimationOptions(duration: 1400),
    );
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _selectedCity = null);
    });
  }

  void _showTripSheet(Trip trip) {
    final location = trip.destination ?? trip.city ?? 'مصر';
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(ctx).cardColor,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (trip.image != null && trip.image!.isNotEmpty)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: CachedNetworkImage(
                  imageUrl: trip.image!,
                  height: 160,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primaryOrange.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.location_on, size: 14, color: AppColors.primaryOrange),
                          const SizedBox(width: 4),
                          Text(location, style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    trip.title,
                    style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 20),
                    textAlign: TextAlign.right,
                  ),
                  if (trip.description != null && trip.description!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      trip.description!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.cairo(color: Colors.grey, fontSize: 13),
                      textAlign: TextAlign.right,
                    ),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () {
                        Navigator.pop(ctx);
                        context.push('/trip/${trip.id}');
                      },
                      icon: const Icon(Icons.open_in_new),
                      label: Text('عرض الرحلة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primaryOrange,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hotspots = LivePulseMapLogic.countHotspots(widget.trips);
    final quickCities = LivePulseMapLogic.quickCities();

    if (!_hasToken) {
      return _buildFallback(isDark, message: 'أضف MAPBOX_ACCESS_TOKEN في ملف .env لتفعيل الخريطة');
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final mapHeight = widget.height.isFinite ? widget.height : constraints.maxHeight;
          return SizedBox(
            height: mapHeight,
            child: Stack(
          children: [
            mb.MapWidget(
              key: ValueKey('pulse_map_${widget.trips.length}_$isDark'),
              styleUri: isDark ? mb.MapboxStyles.DARK : mb.MapboxStyles.OUTDOORS,
              cameraOptions: mb.CameraOptions(
                center: mb.Point(
                  coordinates: mb.Position(LivePulseMapLogic.egyptCenterLng, LivePulseMapLogic.egyptCenterLat),
                ),
                zoom: 5.6,
              ),
              onMapCreated: _onMapCreated,
            ),
            if (!_mapReady)
              Container(
                color: isDark ? AppColors.cardDark : Colors.grey.shade100,
                child: const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
              ),
            if (widget.showOverlay) ...[
              Positioned(
                top: 12,
                right: 12,
                child: _StatsCard(
                  hotspots: hotspots > 0 ? hotspots : quickCities.length,
                  tripCount: widget.trips.length,
                ),
              ),
              Positioned(
                top: 12,
                left: 12,
                child: Row(
                  children: [
                    _MapIconButton(
                      icon: _showMarkers ? Icons.visibility : Icons.visibility_off,
                      onTap: () async {
                        setState(() => _showMarkers = !_showMarkers);
                        await _refreshAnnotations();
                      },
                    ),
                    const SizedBox(width: 8),
                    _MapIconButton(
                      icon: Icons.local_fire_department,
                      active: _showHeat,
                      onTap: () async {
                        setState(() => _showHeat = !_showHeat);
                        await _refreshAnnotations();
                      },
                    ),
                  ],
                ),
              ),
              Positioned(
                left: 8,
                right: 8,
                bottom: 12,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  reverse: true,
                  child: Row(
                    children: quickCities.map((city) {
                      final selected = _selectedCity == city.key;
                      return Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: ActionChip(
                          label: Text(
                            city.areaAr,
                            style: GoogleFonts.cairo(
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                              color: selected ? AppColors.primaryOrange : null,
                            ),
                          ),
                          backgroundColor: selected
                              ? AppColors.primaryOrange.withOpacity(0.15)
                              : Colors.white.withOpacity(0.92),
                          onPressed: () => _flyToCity(city),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ],
          ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildFallback(bool isDark, {required String message}) {
    return Container(
      height: widget.height,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
        color: isDark ? AppColors.cardDark : Colors.grey.shade100,
      ),
      child: Text(message, style: GoogleFonts.cairo(), textAlign: TextAlign.center),
    );
  }
}

class _StatsCard extends StatelessWidget {
  final int hotspots;
  final int tripCount;

  const _StatsCard({required this.hotspots, required this.tripCount});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('مصر تشتعل!', style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 14)),
                  Text('$hotspots مناطق ساخنة', style: GoogleFonts.cairo(fontSize: 10, color: Colors.grey)),
                ],
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: AppColors.orangeGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.local_fire_department, color: Colors.white, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey.shade900,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              '$tripCount رحلة على الخريطة',
              style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool active;

  const _MapIconButton({required this.icon, required this.onTap, this.active = true});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withOpacity(0.95),
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, size: 20, color: active ? AppColors.primaryOrange : Colors.grey),
        ),
      ),
    );
  }
}
