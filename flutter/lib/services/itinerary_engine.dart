import 'dart:math';
import '../models/trip_wizard_state.dart';
import '../constants/egypt_data.dart';

class ItineraryEngine {
  static const List<String> dayColors = [
    '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#e11d48', '#14b8a6',
  ];

  static const Map<String, int> dailyBudget = {
    'low': 600,
    'medium': 1400,
    'high': 3500,
  };

  static double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
    const double R = 6371;
    final dLat = (lat2 - lat1) * pi / 180;
    final dLng = (lng2 - lng1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180) * cos(lat2 * pi / 180) *
            sin(dLng / 2) * sin(dLng / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return (R * c * 100).round() / 100;
  }

  static String inferCostLevel(TripPlace item, String? budget) {
    final priceLevel = item.price ?? '';
    if (priceLevel.contains('\$\$\$') || priceLevel.contains('فاخر')) return 'high';
    if (priceLevel.contains('\$\$') || priceLevel.contains('متوسط')) return 'medium';
    if (priceLevel.contains('\$') || priceLevel.contains('رخيص')) return 'low';

    final name = (item.name).toLowerCase();
    if (name.contains('حديقة') || name.contains('شاطئ') || name.contains('سوق') || name.contains('ممشى')) return 'free';
    if (name.contains('متحف') || name.contains('معبد') || name.contains('قلعة')) return 'low';

    return 'medium';
  }

  static int inferDuration(TripPlace item) {
    final name = item.name.toLowerCase();
    if (item.type == 'restaurant') return 75;
    if (name.contains('متحف') || name.contains('معبد')) return 120;
    if (name.contains('شاطئ')) return 180;
    if (name.contains('حديقة') || name.contains('سوق')) return 90;
    return 120;
  }

  static List<TripPlace> filterByBudget(List<TripPlace> places, String? budget) {
    if (budget == null) return places;
    
    final scored = places.map((p) {
      double score = (p.rating ?? 4.0) * 10;
      final costLevel = inferCostLevel(p, budget);
      
      if (budget == 'low') {
        if (costLevel == 'free') score += 50;
        else if (costLevel == 'low') score += 30;
        else if (costLevel == 'medium') score += 10;
        else score -= 20;
      } else if (budget == 'high') {
        if (costLevel == 'high') score += 40;
        else if (costLevel == 'medium') score += 20;
        else score += 10;
      } else {
        if (costLevel == 'medium') score += 20;
        else score += 10;
      }
      return {'place': p, 'score': score};
    }).toList();

    scored.sort((a, b) => (b['score'] as double).compareTo(a['score'] as double));
    return scored.map((s) => s['place'] as TripPlace).toList();
  }

  static List<List<TripPlace>> kMeansCluster(List<TripPlace> places, int k) {
    if (places.length <= k) {
      return places.map((p) => [p]).toList();
    }

    List<LatLng> centroids = [];
    Set<int> used = {};

    double avgLat = places.fold(0.0, (s, p) => s + (p.lat ?? 0)) / places.length;
    double avgLng = places.fold(0.0, (s, p) => s + (p.lng ?? 0)) / places.length;

    int bestFirst = 0;
    double bestFirstDist = double.infinity;
    for (int i = 0; i < places.length; i++) {
      if (places[i].lat == null || places[i].lng == null) continue;
      double d = haversineDistance(places[i].lat!, places[i].lng!, avgLat, avgLng);
      if (d < bestFirstDist) { bestFirstDist = d; bestFirst = i; }
    }
    centroids.push(LatLng(places[bestFirst].lat!, places[bestFirst].lng!));
    used.add(bestFirst);

    for (int c = 1; c < k; c++) {
      int bestIdx = 0;
      double bestMinDist = -1;
      for (int i = 0; i < places.length; i++) {
        if (used.contains(i) || places[i].lat == null || places[i].lng == null) continue;
        double minDist = centroids.map((cent) => haversineDistance(places[i].lat!, places[i].lng!, cent.lat, cent.lng)).reduce(min);
        if (minDist > bestMinDist) { bestMinDist = minDist; bestIdx = i; }
      }
      centroids.push(LatLng(places[bestIdx].lat!, places[bestIdx].lng!));
      used.add(bestIdx);
    }

    List<List<TripPlace>> clusters = List.generate(k, (_) => []);

    for (int iter = 0; iter < 20; iter++) {
      clusters = List.generate(k, (_) => []);
      for (var p in places) {
        if (p.lat == null || p.lng == null) {
          clusters[0].add(p);
          continue;
        }
        int bestCluster = 0;
        double bestDist = double.infinity;
        for (int ci = 0; ci < centroids.length; ci++) {
          double d = haversineDistance(p.lat!, p.lng!, centroids[ci].lat, centroids[ci].lng);
          if (d < bestDist) { bestDist = d; bestCluster = ci; }
        }
        clusters[bestCluster].add(p);
      }

      bool converged = true;
      for (int ci = 0; ci < centroids.length; ci++) {
        if (clusters[ci].isEmpty) continue;
        double newLat = clusters[ci].fold(0.0, (s, p) => s + (p.lat ?? 0)) / clusters[ci].length;
        double newLng = clusters[ci].fold(0.0, (s, p) => s + (p.lng ?? 0)) / clusters[ci].length;
        if ((newLat - centroids[ci].lat).abs() > 0.001 || (newLng - centroids[ci].lng).abs() > 0.001) converged = false;
        centroids[ci] = LatLng(newLat, newLng);
      }

      if (converged) break;
    }

    return clusters.where((c) => c.isNotEmpty).toList();
  }

  static List<TripPlace> sortByProximity(List<TripPlace> places) {
    if (places.length <= 1) return places;

    List<TripPlace> sorted = [];
    List<TripPlace> remaining = List.from(places);

    remaining.sort((a, b) {
      if (a.type == 'attraction' && b.type == 'restaurant') return -1;
      if (a.type == 'restaurant' && b.type == 'attraction') return 1;
      return (b.rating ?? 4.0).compareTo(a.rating ?? 4.0);
    });

    sorted.add(remaining.removeAt(0));

    while (remaining.isNotEmpty) {
      var last = sorted.last;
      int nearestIdx = 0;
      double nearestDist = double.infinity;
      for (int i = 0; i < remaining.length; i++) {
        if (last.lat == null || last.lng == null || remaining[i].lat == null || remaining[i].lng == null) continue;
        double d = haversineDistance(last.lat!, last.lng!, remaining[i].lat!, remaining[i].lng!);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      }
      sorted.add(remaining.removeAt(nearestIdx));
    }

    return sorted;
  }

  static List<TripPlace> sortByTimeSlot(List<TripPlace> places) {
    final attractions = sortByProximity(places.where((p) => p.type == 'attraction').toList());
    final restaurants = sortByProximity(places.where((p) => p.type == 'restaurant').toList());

    List<TripPlace> result = [];
    int aIdx = 0, rIdx = 0;

    if (aIdx < attractions.length) result.add(attractions[aIdx++]);
    if (aIdx < attractions.length) result.add(attractions[aIdx++]);
    if (rIdx < restaurants.length) result.add(restaurants[rIdx++]);
    if (aIdx < attractions.length) result.add(attractions[aIdx++]);
    if (rIdx < restaurants.length) result.add(restaurants[rIdx++]);

    while (aIdx < attractions.length) result.add(attractions[aIdx++]);
    while (rIdx < restaurants.length) result.add(restaurants[rIdx++]);

    return result;
  }

  static String formatTime(int hour, int minute) {
    final period = hour >= 12 ? 'PM' : 'AM';
    final h12 = hour > 12 ? hour - 12 : hour == 0 ? 12 : hour;
    final m = minute.toString().padLeft(2, '0');
    return '$h12:$m $period';
  }

  static GeneratedItinerary buildSmartItinerary({
    required List<TripPlace> selectedItems,
    required int daysCount,
    required String? budget,
    required String destination,
  }) {
    final filtered = filterByBudget(selectedItems, budget);
    final attractions = filtered.where((p) => p.type == 'attraction').toList();
    final restaurants = filtered.where((p) => p.type == 'restaurant').toList();

    List<TripPlace> selected = [
      ...attractions.take(daysCount * 3),
      ...restaurants.take(daysCount * 2)
    ];

    List<List<TripPlace>> clusters = kMeansCluster(selected, daysCount);

    final dayThemes = [
      'استكشاف المعالم التاريخية',
      'يوم الترفيه والاستجمام والأنشطة',
      'جولة ثقافية وتجربة الأطعمة الشعبية',
      'يوم المغامرة واستكشاف الطبيعة',
      'التسوق وشراء الهدايا التذكارية',
      'يوم حر للاسترخاء والاستمتاع بالأجواء',
    ];

    List<ItineraryDay> generatedDays = [];
    for (int i = 0; i < clusters.length; i++) {
      final cluster = clusters[i].take(5).toList();
      final sortedCluster = sortByTimeSlot(cluster);

      int currentHour = 9;
      int currentMinute = 0;
      
      List<ItineraryActivity> activities = [];
      for (int pIdx = 0; pIdx < sortedCluster.length; pIdx++) {
        final place = sortedCluster[pIdx];
        
        if (pIdx > 0 && currentHour >= 13 && currentHour < 14 && place.type != 'restaurant') {
           int totalMin = currentHour * 60 + currentMinute + 45;
           currentHour = totalMin ~/ 60;
           currentMinute = totalMin % 60;
        }

        final startTime = formatTime(currentHour, currentMinute);
        final duration = inferDuration(place);
        int totalMin = currentHour * 60 + currentMinute + duration;
        currentHour = totalMin ~/ 60;
        currentMinute = totalMin % 60;
        final endTime = formatTime(currentHour, currentMinute);

        activities.add(ItineraryActivity(
          name: place.name,
          time: startTime,
          endTime: endTime,
          duration: duration,
          note: 'استمتع بوقتك في هذا المكان المميز.',
          type: place.type,
          lat: place.lat,
          lng: place.lng,
        ));
        
        // Travel time
        int tMin = currentHour * 60 + currentMinute + 20;
        currentHour = tMin ~/ 60;
        currentMinute = tMin % 60;
      }

      generatedDays.add(ItineraryDay(
        dayNum: i + 1,
        title: 'اليوم ${i + 1} — ${dayThemes[i % dayThemes.length]}',
        area: dayThemes[i % dayThemes.length],
        color: dayColors[i % dayColors.length],
        activities: activities,
      ));
    }

    while (generatedDays.length < daysCount) {
      generatedDays.add(ItineraryDay(
        dayNum: generatedDays.length + 1,
        title: 'اليوم ${generatedDays.length + 1} — يوم مفتوح للاستكشاف',
        area: 'حر / استجمام',
        color: dayColors[generatedDays.length % dayColors.length],
        activities: [],
      ));
    }

    return GeneratedItinerary(
      title: 'رحلة $destination المخططة',
      description: 'خطة رحلة متكاملة لـ $daysCount أيام تشمل أهم المعالم والمطاعم المختارة.',
      days: generatedDays,
    );
  }
}

extension ListExtensions<T> on List<T> {
  void push(T element) => add(element);
}
