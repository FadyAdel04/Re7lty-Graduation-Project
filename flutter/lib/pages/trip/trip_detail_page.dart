import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/trip_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';

class TripDetailPage extends ConsumerWidget {
  final String tripId;

  const TripDetailPage({super.key, required this.tripId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripAsync = ref.watch(tripDetailProvider(tripId));

    return Scaffold(
      body: tripAsync.when(
        data: (trip) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 300,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                title: Text(
                  trip.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    shadows: [Shadow(color: Colors.black45, blurRadius: 10)],
                  ),
                ),
                background: Stack(
                  fit: StackFit.expand,
                  children: [
                    CachedNetworkImage(
                      imageUrl: trip.image ?? '',
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) => Container(color: Colors.grey),
                    ),
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, Colors.black54],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                IconButton(icon: const Icon(Icons.share, color: Colors.white), onPressed: () {}),
                IconButton(icon: const Icon(Icons.favorite_border, color: Colors.white), onPressed: () {}),
              ],
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildAuthorCell(context, trip),
                    const SizedBox(height: 24),
                    _buildStatsGrid(trip),
                    const SizedBox(height: 32),
                    _buildSectionHeader('عن الرحلة'),
                    const SizedBox(height: 8),
                    Text(trip.description ?? 'لا يوجد وصف متاح.', style: const TextStyle(fontSize: 15, height: 1.6)),
                    const SizedBox(height: 32),
                    if (trip.activities.isNotEmpty) ...[
                      _buildSectionHeader('المواقع على الخريطة'),
                      const SizedBox(height: 12),
                      _buildMapView(trip),
                      const SizedBox(height: 32),
                    ],
                    if (trip.days.isNotEmpty) ...[
                      _buildSectionHeader('برنامج الرحلة'),
                      const SizedBox(height: 12),
                      _buildItinerary(trip),
                      const SizedBox(height: 32),
                    ],
                    if (trip.foodAndRestaurants.isNotEmpty) ...[
                      _buildSectionHeader('أفضل المطاعم والأكلات'),
                      const SizedBox(height: 12),
                      _buildFoodSection(trip),
                      const SizedBox(height: 32),
                    ],
                    if (trip.hotels.isNotEmpty) ...[
                      _buildSectionHeader('أماكن الإقامة'),
                      const SizedBox(height: 12),
                      _buildHotelSection(trip),
                    ],
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ],
        ),
        loading: () => const Scaffold(body: Center(child: CircularProgressIndicator(color: Colors.orange))),
        error: (err, stack) => Scaffold(
          appBar: AppBar(backgroundColor: Colors.white, elevation: 0),
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.cloud_off_rounded, size: 72, color: Colors.orange),
                  const SizedBox(height: 20),
                  const Text('تعذّر تحميل الرحلة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  const Text('تحقق من اتصالك أو تشغيل السيرفر', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => ref.refresh(tripDetailProvider(tripId)),
                    icon: const Icon(Icons.refresh),
                    label: const Text('إعادة المحاولة'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: Colors.orange,
        label: const Text('خطط لرحلة مشابهة', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        icon: const Icon(Icons.explore, color: Colors.white),
      ),
    );
  }

  Widget _buildAuthorCell(BuildContext context, dynamic trip) {
    return InkWell(
      onTap: () => context.push('/user/${trip.ownerId}'),
      child: Row(
        children: [
          CircleAvatar(
            radius: 25,
            backgroundImage: trip.image != null ? NetworkImage(trip.image!) : null,
            child: trip.image == null ? const Icon(Icons.person) : null,
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(trip.author ?? 'مستخدم', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              Text('${trip.authorFollowers} متابع', style: const TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white, elevation: 0),
            child: const Text('متابعة'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(dynamic trip) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(25)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _statItem(Icons.calendar_today, 'المدة', trip.duration ?? '-'),
          _statItem(Icons.attach_money, 'الميزانية', trip.budget ?? '-'),
          _statItem(Icons.star, 'التقييم', trip.rating.toString()),
        ],
      ),
    );
  }

  Widget _statItem(IconData icon, String label, String value) {
    return Column(
      children: [
        Icon(icon, color: Colors.orange, size: 24),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold));
  }

  Widget _buildMapView(dynamic trip) {
    // Note: In mapbox_maps_flutter, markers are handled via AnnotationManagers.
    // For this static-styled description view, we'll initialize the MapWidget with the center.
    final firstPoint = trip.activities.isNotEmpty 
        ? [trip.activities.first.lng ?? 31.2357, trip.activities.first.lat ?? 30.0444]
        : [31.2357, 30.0444];

    return Container(
      height: 200,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20), 
        border: Border.all(color: Colors.grey[200]!)
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: MapWidget(
          key: const ValueKey("mapbox_view"),
          cameraOptions: CameraOptions(
            center: Point(coordinates: Position(firstPoint[0], firstPoint[1])),
            zoom: 12.0,
          ),
          styleUri: MapboxStyles.OUTDOORS,
        ),
      ),
    );
  }

  Widget _buildItinerary(dynamic trip) {
    return Column(
      children: List.generate(trip.days.length, (idx) {
        final day = trip.days[idx];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15), border: Border.all(color: Colors.grey[100]!)),
          child: ExpansionTile(
            title: Text('اليوم ${idx + 1}: ${day.title}', style: const TextStyle(fontWeight: FontWeight.bold)),
            leading: const Icon(Icons.event, color: Colors.orange),
            children: [
              for (var actIdx in day.activities)
                if (actIdx < trip.activities.length)
                  ListTile(
                    leading: const Icon(Icons.location_on, color: Colors.grey, size: 16),
                    title: Text(trip.activities[actIdx].name),
                  ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildFoodSection(dynamic trip) {
    return SizedBox(
      height: 150,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: trip.foodAndRestaurants.length,
        itemBuilder: (context, idx) {
          final food = trip.foodAndRestaurants[idx];
          return Container(
            width: 130,
            margin: const EdgeInsets.only(left: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(15),
                  child: CachedNetworkImage(imageUrl: food.image, height: 90, width: 130, fit: BoxFit.cover, errorWidget: (c, u, e) => Container(color: Colors.grey[200])),
                ),
                const SizedBox(height: 4),
                Text(food.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold), maxLines: 2),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHotelSection(dynamic trip) {
    return Column(
      children: [
        for (var hotel in trip.hotels)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.indigo[50], borderRadius: BorderRadius.circular(15)),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(imageUrl: hotel.image, width: 60, height: 60, fit: BoxFit.cover, errorWidget: (c, u, e) => Container(color: Colors.grey[200])),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(hotel.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text(hotel.priceRange, style: const TextStyle(fontSize: 12, color: Colors.indigo)),
                    ],
                  ),
                ),
                const Icon(Icons.star, color: Colors.orange, size: 16),
                Text(hotel.rating.toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ),
      ],
    );
  }
}


