import 'dart:math';
import '../models/trip.dart';

class EgyptCityData {
  final String key;
  final String areaAr;
  final double centerLng;
  final double centerLat;
  final double radius;

  const EgyptCityData({
    required this.key,
    required this.areaAr,
    required this.centerLng,
    required this.centerLat,
    required this.radius,
  });
}

class TripMapPlacement {
  final Trip trip;
  final double lng;
  final double lat;
  final String cityKey;
  final String cityLabelAr;

  const TripMapPlacement({
    required this.trip,
    required this.lng,
    required this.lat,
    required this.cityKey,
    required this.cityLabelAr,
  });
}

/// Egypt map data + trip placement (ported from web LivePulseMap).
class LivePulseMapLogic {
  LivePulseMapLogic._();

  static const egyptCenterLng = 30.8025;
  static const egyptCenterLat = 26.8206;

  static const cities = <String, EgyptCityData>{
    'Cairo': EgyptCityData(key: 'Cairo', areaAr: 'القاهرة', centerLng: 31.2357, centerLat: 30.0444, radius: 0.15),
    'Alexandria': EgyptCityData(key: 'Alexandria', areaAr: 'الإسكندرية', centerLng: 29.9187, centerLat: 31.2001, radius: 0.12),
    'Giza': EgyptCityData(key: 'Giza', areaAr: 'الجيزة', centerLng: 31.1313, centerLat: 29.987, radius: 0.1),
    'Luxor': EgyptCityData(key: 'Luxor', areaAr: 'الأقصر', centerLng: 32.6421, centerLat: 25.6872, radius: 0.2),
    'Aswan': EgyptCityData(key: 'Aswan', areaAr: 'أسوان', centerLng: 32.8998, centerLat: 24.0889, radius: 0.15),
    'Hurghada': EgyptCityData(key: 'Hurghada', areaAr: 'الغردقة', centerLng: 33.8116, centerLat: 27.2579, radius: 0.25),
    'Sharm El Sheikh': EgyptCityData(key: 'Sharm El Sheikh', areaAr: 'شرم الشيخ', centerLng: 34.33, centerLat: 27.9158, radius: 0.2),
    'Dahab': EgyptCityData(key: 'Dahab', areaAr: 'دهب', centerLng: 34.5197, centerLat: 28.5021, radius: 0.15),
    'Marsa Matrouh': EgyptCityData(key: 'Marsa Matrouh', areaAr: 'مرسى مطروح', centerLng: 27.2373, centerLat: 31.3543, radius: 0.2),
    'Siwa': EgyptCityData(key: 'Siwa', areaAr: 'سيوة', centerLng: 25.5196, centerLat: 29.2031, radius: 0.3),
    'Fayoum': EgyptCityData(key: 'Fayoum', areaAr: 'الفيوم', centerLng: 30.8472, centerLat: 29.3573, radius: 0.15),
  };

  static final _patterns = <({RegExp pattern, String city})>[
    (pattern: RegExp(r'matrouh|مطروح|marsa|مرسى', caseSensitive: false), city: 'Marsa Matrouh'),
    (pattern: RegExp(r'luxor|الأقصر', caseSensitive: false), city: 'Luxor'),
    (pattern: RegExp(r'aswan|أسوان', caseSensitive: false), city: 'Aswan'),
    (pattern: RegExp(r'cairo|القاهرة', caseSensitive: false), city: 'Cairo'),
    (pattern: RegExp(r'giza|الجيزة', caseSensitive: false), city: 'Giza'),
    (pattern: RegExp(r'alexandria|alex|الإسكندرية', caseSensitive: false), city: 'Alexandria'),
    (pattern: RegExp(r'hurghada|الغردقة', caseSensitive: false), city: 'Hurghada'),
    (pattern: RegExp(r'sharm|شرم', caseSensitive: false), city: 'Sharm El Sheikh'),
    (pattern: RegExp(r'dahab|دهب', caseSensitive: false), city: 'Dahab'),
    (pattern: RegExp(r'siwa|سيوة', caseSensitive: false), city: 'Siwa'),
    (pattern: RegExp(r'fayoum|فيوم', caseSensitive: false), city: 'Fayoum'),
  ];

  static final _landmarks = <String, List<List<double>>>{
    'Cairo': [
      [31.2357, 30.0444],
      [31.2248, 30.0499],
      [31.3436, 30.0993],
    ],
    'Hurghada': [
      [33.8116, 27.2579],
      [33.8321, 27.2321],
    ],
    'Sharm El Sheikh': [
      [34.33, 27.9158],
      [34.3621, 27.8609],
    ],
    'Luxor': [
      [32.6421, 25.6872],
      [32.6125, 25.7083],
    ],
    'Marsa Matrouh': [
      [27.2373, 31.3543],
      [27.2105, 31.3421],
    ],
  };

  static final _rng = Random();

  static String mapTripToCity(Trip trip) {
    var cityName = trip.city ?? trip.destination ?? '';
    if (cityName.isEmpty) cityName = 'Cairo';
    for (final p in _patterns) {
      if (p.pattern.hasMatch(cityName)) return p.city;
    }
    return 'Cairo';
  }

  static List<double> generatePoint(String cityName, int index, int totalInCity) {
    final city = cities[cityName] ?? cities['Cairo']!;
    final landmarks = _landmarks[cityName];
    if (landmarks != null && landmarks.isNotEmpty && _rng.nextDouble() > 0.3) {
      final landmark = landmarks[index % landmarks.length];
      return [
        landmark[0] + (_rng.nextDouble() - 0.5) * 0.02,
        landmark[1] + (_rng.nextDouble() - 0.5) * 0.02,
      ];
    }
    final spiralAngle = index * 0.5;
    final randomAngle = _rng.nextDouble() * pi * 2;
    final distance = _rng.nextDouble() * city.radius;
    final angle = randomAngle + spiralAngle;
    return [
      city.centerLng + cos(angle) * distance,
      city.centerLat + sin(angle) * distance,
    ];
  }

  static List<TripMapPlacement> buildPlacements(List<Trip> trips) {
    final groups = <String, List<Trip>>{};
    for (final trip in trips) {
      final city = mapTripToCity(trip);
      groups.putIfAbsent(city, () => []).add(trip);
    }

    final placements = <TripMapPlacement>[];
    groups.forEach((cityKey, cityTrips) {
      final city = cities[cityKey] ?? cities['Cairo']!;
      for (var i = 0; i < cityTrips.length; i++) {
        final coords = generatePoint(cityKey, i, cityTrips.length);
        placements.add(TripMapPlacement(
          trip: cityTrips[i],
          lng: coords[0],
          lat: coords[1],
          cityKey: cityKey,
          cityLabelAr: city.areaAr,
        ));
      }
    });
    return placements;
  }

  static int countHotspots(List<Trip> trips) {
    final counts = <String, int>{};
    for (final t in trips) {
      final c = mapTripToCity(t);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts.values.where((c) => c >= 3).length;
  }

  static List<EgyptCityData> quickCities({int limit = 8}) {
    return cities.values.take(limit).toList();
  }
}
