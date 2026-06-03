import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/trip_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mb;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/trip.dart';
import '../../providers/api_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/report_trip_dialog.dart';

class TripDetailPage extends ConsumerStatefulWidget {
  final String tripId;

  const TripDetailPage({super.key, required this.tripId});

  @override
  ConsumerState<TripDetailPage> createState() => _TripDetailPageState();
}

class _TripDetailPageState extends ConsumerState<TripDetailPage> {
  final Set<int> _expandedDays = {0};
  
  bool _isFollowing = false;
  bool _isLoved = false;
  bool _isSaved = false;
  int _likesCount = 0;
  int _savesCount = 0;
  bool _initialized = false;

  void _initializeState(Trip trip) {
    if (_initialized) return;
    _isFollowing = trip.viewerFollowsAuthor;
    _isLoved = trip.isLoved;
    _isSaved = trip.isSaved;
    _likesCount = trip.likes;
    _savesCount = trip.saves;
    _initialized = true;
  }

  Future<void> _toggleLove(String tripId) async {
    final oldState = _isLoved;
    final oldCount = _likesCount;
    setState(() {
      _isLoved = !_isLoved;
      _likesCount += _isLoved ? 1 : -1;
    });
    try {
      await ref.read(tripServiceProvider).toggleLike(tripId);
    } catch (e) {
      setState(() {
        _isLoved = oldState;
        _likesCount = oldCount;
      });
    }
  }

  Future<void> _toggleSave(String tripId) async {
    final oldState = _isSaved;
    final oldCount = _savesCount;
    setState(() {
      _isSaved = !_isSaved;
      _savesCount += _isSaved ? 1 : -1;
    });
    try {
      await ref.read(tripServiceProvider).toggleSave(tripId);
    } catch (e) {
      setState(() {
        _isSaved = oldState;
        _savesCount = oldCount;
      });
    }
  }

  Future<void> _toggleFollow(String userId) async {
    final oldState = _isFollowing;
    setState(() {
      _isFollowing = !_isFollowing;
    });
    try {
      await ref.read(userServiceProvider).toggleFollow(userId);
    } catch (e) {
      setState(() {
        _isFollowing = oldState;
      });
    }
  }

  void _toggleDay(int index) {
    setState(() {
      if (_expandedDays.contains(index)) {
        _expandedDays.remove(index);
      } else {
        _expandedDays.add(index);
      }
    });
  }

  void _showImageDetails(String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            InteractiveViewer(
              child: Center(
                child: CachedNetworkImage(imageUrl: imageUrl, fit: BoxFit.contain),
              ),
            ),
            Positioned(
              top: 40,
              right: 20,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showFullScreenMap(Trip trip) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: Text(trip.title, style: const TextStyle(fontSize: 16)),
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            elevation: 0,
          ),
          body: _buildMapView(trip, isFullScreen: true),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tripAsync = ref.watch(tripDetailProvider(widget.tripId));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
      body: tripAsync.when(
        data: (trip) {
          _initializeState(trip);
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 320,
                pinned: true,
                backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                leading: const BackButton(color: Colors.white),
                actions: [
                  if (ClerkAuth.of(context).user?.id != trip.ownerId)
                    IconButton(
                      icon: const Icon(Icons.flag_outlined, color: Colors.white),
                      tooltip: 'إبلاغ',
                      onPressed: () => ReportTripDialog.show(
                        context,
                        tripId: trip.id,
                        tripTitle: trip.title,
                      ),
                    ),
                  if (ClerkAuth.of(context).user?.id == trip.ownerId)
                    IconButton(
                      icon: const Icon(Icons.edit_outlined, color: Colors.white),
                      onPressed: () => context.push('/trip/${trip.id}/edit'),
                    ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      GestureDetector(
                        onTap: () => _showImageDetails(trip.image ?? ''),
                        child: CachedNetworkImage(
                          imageUrl: trip.image ?? '',
                          fit: BoxFit.cover,
                          errorWidget: (context, url, error) => Container(color: Colors.grey),
                        ),
                      ),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black87],
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 20,
                        left: 12,
                        right: 12,
                        child: _buildFloatingActionBar(context, trip, isDark),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 10),
                      _buildSectionHeader('نظرة عامة على المغامرة'),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)],
                        ),
                        child: Text(
                          trip.description ?? 'لا يوجد وصف متاح.',
                          style: TextStyle(
                            fontSize: 16, 
                            height: 1.8, 
                            color: isDark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      _buildActivitiesHighlights(trip),
                      if (trip.activities.isNotEmpty) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildSectionHeader('الخريطة التفاعلية للمسار'),
                            IconButton(
                              icon: const Icon(Icons.fullscreen, color: Colors.blue),
                              onPressed: () => _showFullScreenMap(trip),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildMapView(trip),
                        const SizedBox(height: 40),
                      ],
                      if (trip.days.isNotEmpty) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('خط السير التفصيلي', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                              child: Text('${trip.duration}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.orange)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        _buildItinerary(trip),
                      ],
                      if (trip.foodAndRestaurants.isNotEmpty) ...[
                        const SizedBox(height: 40),
                        _buildSectionHeader('أفضل المطاعم والأكلات المحلية'),
                        const SizedBox(height: 16),
                        _buildFoodSection(trip),
                      ],
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Scaffold(body: Center(child: CircularProgressIndicator(color: Colors.orange))),
        error: (err, stack) => Scaffold(
          appBar: AppBar(backgroundColor: Colors.white, elevation: 0),
          body: Center(child: Text('Error: $err')),
        ),
      ),
    );
  }

  Widget _buildFloatingActionBar(BuildContext context, Trip trip, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B).withOpacity(0.9) : Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 20, offset: const Offset(0, 8))],
      ),
      child: Row(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              GestureDetector(
                onTap: () => context.push('/profile/${trip.ownerId}'),
                child: CircleAvatar(
                  radius: 24,
                  backgroundColor: Colors.orange,
                  backgroundImage: trip.authorImage != null && trip.authorImage!.isNotEmpty ? NetworkImage(trip.authorImage!) : null,
                  child: (trip.authorImage == null || trip.authorImage!.isEmpty) ? const Icon(Icons.person, color: Colors.white) : null,
                ),
              ),
              Positioned(
                bottom: -4,
                right: -4,
                child: GestureDetector(
                  onTap: () => _toggleFollow(trip.ownerId ?? ''),
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: CircleAvatar(
                      radius: 10,
                      backgroundColor: _isFollowing ? Colors.grey : Colors.red,
                      child: Icon(_isFollowing ? Icons.check : Icons.add, size: 14, color: Colors.white),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('رحلة بواسطة', style: TextStyle(color: Colors.grey[600], fontSize: 10)),
                Text(trip.author ?? 'مستخدم رحلتي', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              ],
            ),
          ),
          _actionWithCount(Icons.favorite, _likesCount.toString(), _isLoved ? Colors.red : (isDark ? Colors.white70 : Colors.black54), () => _toggleLove(trip.id)),
          const SizedBox(width: 20),
          _actionWithCount(Icons.bookmark, _savesCount.toString(), _isSaved ? Colors.orange : (isDark ? Colors.white70 : Colors.black54), () => _toggleSave(trip.id)),
          const SizedBox(width: 20),
          _actionWithCount(Icons.share, 'مشاركة', isDark ? Colors.white70 : Colors.black54, () {}),
        ],
      ),
    );
  }

  Widget _actionWithCount(IconData icon, String count, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 2),
          Text(count, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildActivitiesHighlights(Trip trip) {
    final activitiesWithImages = trip.activities.where((a) => a.images.isNotEmpty).toList();
    if (activitiesWithImages.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('أبرز المعالم والأنشطة'),
        const SizedBox(height: 12),
        SizedBox(
          height: 180,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: activitiesWithImages.length,
            itemBuilder: (context, idx) {
              final activity = activitiesWithImages[idx];
              return GestureDetector(
                onTap: () => _showImageDetails(activity.images.first),
                child: Container(
                  width: 200,
                  margin: const EdgeInsets.only(left: 16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        CachedNetworkImage(imageUrl: activity.images.first, fit: BoxFit.cover),
                        const DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black87]),
                          ),
                        ),
                        Positioned(bottom: 12, right: 12, left: 12, child: Text(activity.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold));
  }

  Widget _buildMapView(Trip trip, {bool isFullScreen = false}) {
    final points = trip.activities
        .where((a) => a.lat != null && a.lng != null)
        .map((a) => mb.Point(coordinates: mb.Position(a.lng!, a.lat!)))
        .toList();

    if (points.isEmpty) return const SizedBox.shrink();

    return Container(
      height: isFullScreen ? double.infinity : 250,
      decoration: BoxDecoration(
        borderRadius: isFullScreen ? BorderRadius.zero : BorderRadius.circular(24), 
        border: isFullScreen ? null : Border.all(color: Colors.grey[200]!)
      ),
      child: ClipRRect(
        borderRadius: isFullScreen ? BorderRadius.zero : BorderRadius.circular(24),
        child: mb.MapWidget(
          key: ValueKey("mapbox_${trip.id}_${isFullScreen ? 'full' : 'small'}"),
          cameraOptions: mb.CameraOptions(
            center: points.first,
            zoom: 12.0,
          ),
          styleUri: mb.MapboxStyles.OUTDOORS,
          onMapCreated: (controller) async {
            // 1. Add Circle Annotations (Blue dots)
            final circleManager = await controller.annotations.createCircleAnnotationManager();
            final circles = <mb.CircleAnnotationOptions>[];
            for (var p in points) {
              circles.add(mb.CircleAnnotationOptions(
                geometry: p,
                circleRadius: 18.0, // Increased size
                circleColor: Colors.blue.value,
                circleStrokeWidth: 3.0,
                circleStrokeColor: Colors.white.value,
              ));
            }
            circleManager.createMulti(circles);

            // 2. Add Point Annotations (White Numbers)
            final pointManager = await controller.annotations.createPointAnnotationManager();
            final labels = <mb.PointAnnotationOptions>[];
            for (var i = 0; i < points.length; i++) {
              labels.add(mb.PointAnnotationOptions(
                geometry: points[i],
                textField: "${i + 1}",
                textColor: Colors.white.value,
                textSize: 16.0, // Increased size
                textOffset: [0.0, 0.0],
                textAnchor: mb.TextAnchor.CENTER,
              ));
            }
            pointManager.createMulti(labels);

            // 3. Add Polyline (Connecting lines)
            final lineManager = await controller.annotations.createPolylineAnnotationManager();
            lineManager.create(mb.PolylineAnnotationOptions(
              geometry: mb.LineString(coordinates: points.map((e) => e.coordinates).toList()),
              lineColor: Colors.blue.withOpacity(0.8).value,
              lineWidth: 4.0, // Thicker line
              lineJoin: mb.LineJoin.ROUND,
            ));

            // 4. Auto-fit camera
            if (points.length > 1) {
              final camera = await controller.cameraForCoordinates(
                points,
                mb.MbxEdgeInsets(top: 50, left: 50, bottom: 50, right: 50),
                null,
                null,
              );
              controller.setCamera(camera);
            }
          },
        ),
      ),
    );
  }

  Widget _buildItinerary(Trip trip) {
    return Column(
      children: List.generate(trip.days.length, (dayIdx) {
        final day = trip.days[dayIdx];
        final isExpanded = _expandedDays.contains(dayIdx);
        return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: () => _toggleDay(dayIdx),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isExpanded ? Colors.orange.withOpacity(0.05) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isExpanded ? Colors.orange.withOpacity(0.3) : Colors.grey[200]!),
                  ),
                  child: Row(
                    children: [
                      Container(width: 40, height: 40, decoration: const BoxDecoration(color: Colors.orange, shape: BoxShape.circle), child: Center(child: Text('${dayIdx + 1}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)))),
                      const SizedBox(width: 12),
                      Expanded(child: Text('اليوم ${dayIdx + 1}: ${day.title}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
                      Icon(isExpanded ? Icons.expand_less : Icons.expand_more, color: Colors.orange),
                    ],
                  ),
                ),
              ),
              if (isExpanded) ...[
                const SizedBox(height: 16),
                ...List.generate(day.activities.length, (actIdx) {
                  final globalActIdx = day.activities[actIdx];
                  if (globalActIdx >= trip.activities.length) return const SizedBox.shrink();
                  final activity = trip.activities[globalActIdx];
                  return _buildActivityTimelineItem(activity, actIdx == day.activities.length - 1);
                }),
                if (dayIdx < trip.hotels.length) _buildAccommodationCard(trip.hotels[dayIdx]),
              ],
            ],
          ),
        );
      }),
    );
  }

  Widget _buildActivityTimelineItem(Activity activity, bool isLast) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.orange, width: 2),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1.5,
                      color: Colors.orange.withOpacity(0.2),
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8)],
                border: Border.all(color: Colors.grey[100]!),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          activity.name,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (activity.note != null && activity.note!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              activity.note!,
                              style: TextStyle(color: Colors.grey[600], fontSize: 12),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.orange.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.tips_and_updates, color: Colors.orange, size: 14),
                              const SizedBox(width: 6),
                              Text(
                                'نصيحة: ينصح بالزيارة مبكراً',
                                style: TextStyle(color: Colors.orange[900], fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (activity.images.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () => _showImageDetails(activity.images.first),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(15),
                          child: CachedNetworkImage(
                            imageUrl: activity.images.first,
                            width: 80,
                            height: 80,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccommodationCard(Hotel hotel) {
    return Container(
      margin: const EdgeInsets.only(right: 40, top: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.orange.withOpacity(0.2))),
      child: Row(
        children: [
          GestureDetector(onTap: () => _showImageDetails(hotel.image), child: ClipRRect(borderRadius: BorderRadius.circular(15), child: CachedNetworkImage(imageUrl: hotel.image, width: 70, height: 70, fit: BoxFit.cover))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('إقامة مقترحة', style: TextStyle(color: Colors.orange, fontSize: 10, fontWeight: FontWeight.bold)), Text(hotel.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis), Row(children: [const Icon(Icons.star, color: Colors.orange, size: 12), Text(' ${hotel.rating}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)), const Spacer(), Text(hotel.priceRange, style: const TextStyle(color: Colors.grey, fontSize: 11))])])),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'اقتراح إقامة: ${hotel.name} — للحجز الفعلي استخدم رحلات الشركات من التطبيق.',
                    style: GoogleFonts.cairo(),
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white, elevation: 0, minimumSize: const Size(60, 36), padding: const EdgeInsets.symmetric(horizontal: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: const Text('حجز', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildFoodSection(Trip trip) {
    return SizedBox(
      height: 200,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: trip.foodAndRestaurants.length,
        itemBuilder: (context, idx) {
          final food = trip.foodAndRestaurants[idx];
          return GestureDetector(
            onTap: () => _showImageDetails(food.image),
            child: Container(
              width: 160,
              margin: const EdgeInsets.only(left: 16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(borderRadius: BorderRadius.circular(20), child: CachedNetworkImage(imageUrl: food.image, height: 120, width: 160, fit: BoxFit.cover, errorWidget: (c, u, e) => Container(color: Colors.grey[200]))),
                  Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(food.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis), const SizedBox(height: 4), Row(children: [const Icon(Icons.restaurant_menu, color: Colors.orange, size: 12), const SizedBox(width: 4), Text('طبق مميز', style: TextStyle(color: Colors.grey[600], fontSize: 10))])])),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
