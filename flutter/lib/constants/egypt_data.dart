// ─────────────────────────────────────────────────────────────────────────────
// egypt_data.dart  –  Egypt cities, coordinates & transport prices
// Ported from frontend/src/lib/egypt-data.ts to match web app exactly
// ─────────────────────────────────────────────────────────────────────────────

class LatLng {
  final double lat;
  final double lng;
  const LatLng(this.lat, this.lng);
}

/// Egyptian city/governorate → GPS coordinates
const Map<String, LatLng> governoratesCoordinates = {
  // ─── القاهرة الكبرى ───
  'القاهرة': LatLng(30.0444, 31.2357),
  'الجيزة': LatLng(30.0131, 31.2089),

  // ─── الدلتا ───
  'الإسكندرية': LatLng(31.2001, 29.9187),
  'الاسكندرية': LatLng(31.2001, 29.9187),
  'المنصورة': LatLng(31.0364, 31.3807),
  'الشرقية': LatLng(30.5877, 31.5020),
  'الغربية': LatLng(30.8754, 31.0335),
  'طنطا': LatLng(30.7865, 31.0004),
  'المنوفية': LatLng(30.5972, 30.9876),
  'البحيرة': LatLng(30.8481, 30.3436),
  'كفر الشيخ': LatLng(31.1117, 30.9399),
  'دمياط': LatLng(31.4165, 31.8133),
  'الدقهلية': LatLng(31.0364, 31.3807),

  // ─── قناة السويس ───
  'بورسعيد': LatLng(31.2653, 32.3019),
  'الإسماعيلية': LatLng(30.5965, 32.2715),
  'الاسماعيلية': LatLng(30.5965, 32.2715),
  'السويس': LatLng(29.9668, 32.5498),

  // ─── وسط وجنوب مصر ───
  'الفيوم': LatLng(29.3084, 30.8428),
  'بني سويف': LatLng(29.0661, 31.0994),
  'المنيا': LatLng(28.1099, 30.7503),
  'أسيوط': LatLng(27.1783, 31.1859),
  'سوهاج': LatLng(26.5591, 31.6957),
  'قنا': LatLng(26.1551, 32.7160),
  'الأقصر': LatLng(25.6872, 32.6396),
  'الاقصر': LatLng(25.6872, 32.6396),
  'أسوان': LatLng(24.0908, 32.8994),
  'اسوان': LatLng(24.0908, 32.8994),

  // ─── البحر الأحمر ───
  'الغردقة': LatLng(27.2579, 33.8116),
  'الجونة': LatLng(27.3869, 33.6773),
  'سهل حشيش': LatLng(27.1330, 33.9085),
  'مرسى علم': LatLng(25.0689, 34.8859),
  'مرسى مطروح': LatLng(31.3543, 27.2373),
  'مطروح': LatLng(31.3543, 27.2373),

  // ─── سيناء ───
  'شرم الشيخ': LatLng(27.9158, 34.3300),
  'دهب': LatLng(28.4931, 34.5150),
  'نويبع': LatLng(29.0619, 34.6619),
  'طابا': LatLng(29.4972, 34.8980),
  'رأس سدر': LatLng(29.5884, 32.6680),

  // ─── الواحات ───
  'سيوة': LatLng(29.2033, 25.5195),
  'الوادي الجديد': LatLng(25.4319, 30.5460),
  'الساحل الشمالي': LatLng(30.9215, 28.5451),
};

class EgyptCity {
  final String name;
  final String nameEn;
  final String emoji;
  final String? locationId;
  final String category; // 'governorate' | 'beach' | 'historical' | 'desert' | 'tourist'

  const EgyptCity({
    required this.name,
    required this.nameEn,
    required this.emoji,
    this.locationId,
    required this.category,
  });
}

/// Full list of Egyptian cities for the wizard dropdowns
const List<EgyptCity> egyptCitiesList = [
  // المحافظات الرئيسية
  EgyptCity(name: 'القاهرة', nameEn: 'Cairo', emoji: '🏛️', locationId: '294201', category: 'governorate'),
  EgyptCity(name: 'الجيزة', nameEn: 'Giza', emoji: '🔺', locationId: '294202', category: 'governorate'),
  EgyptCity(name: 'الإسكندرية', nameEn: 'Alexandria', emoji: '🌊', locationId: '295398', category: 'governorate'),
  EgyptCity(name: 'الأقصر', nameEn: 'Luxor', emoji: '🏺', locationId: '294205', category: 'historical'),
  EgyptCity(name: 'أسوان', nameEn: 'Aswan', emoji: '⛵', locationId: '294204', category: 'historical'),
  EgyptCity(name: 'قنا', nameEn: 'Qena', emoji: '🏛️', locationId: '1598532', category: 'historical'),
  EgyptCity(name: 'سوهاج', nameEn: 'Sohag', emoji: '🏛️', locationId: '1051491', category: 'historical'),
  EgyptCity(name: 'أسيوط', nameEn: 'Assiut', emoji: '🏙️', locationId: '668836', category: 'governorate'),
  EgyptCity(name: 'المنيا', nameEn: 'Minya', emoji: '🏙️', locationId: '424908', category: 'governorate'),
  EgyptCity(name: 'بني سويف', nameEn: 'Beni Suef', emoji: '🏙️', locationId: '297566', category: 'governorate'),
  EgyptCity(name: 'الفيوم', nameEn: 'Fayoum', emoji: '🌿', locationId: '424907', category: 'tourist'),
  EgyptCity(name: 'بورسعيد', nameEn: 'Port Said', emoji: '⚓', locationId: '297543', category: 'governorate'),
  EgyptCity(name: 'الإسماعيلية', nameEn: 'Ismailia', emoji: '🛤️', locationId: '297542', category: 'governorate'),
  EgyptCity(name: 'السويس', nameEn: 'Suez', emoji: '⚓', locationId: '317058', category: 'governorate'),
  EgyptCity(name: 'المنصورة', nameEn: 'Mansoura', emoji: '🌾', locationId: '668835', category: 'governorate'),
  EgyptCity(name: 'طنطا', nameEn: 'Tanta', emoji: '🏙️', locationId: '297570', category: 'governorate'),
  EgyptCity(name: 'دمياط', nameEn: 'Damietta', emoji: '🌊', locationId: '297571', category: 'governorate'),
  EgyptCity(name: 'المنوفية', nameEn: 'Monufia', emoji: '🌾', locationId: '297572', category: 'governorate'),
  EgyptCity(name: 'البحيرة', nameEn: 'Beheira', emoji: '🌾', locationId: '297573', category: 'governorate'),
  EgyptCity(name: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', emoji: '🌊', locationId: '297574', category: 'governorate'),
  EgyptCity(name: 'الشرقية', nameEn: 'Sharqia', emoji: '🌿', locationId: '297575', category: 'governorate'),
  EgyptCity(name: 'الغربية', nameEn: 'Gharbia', emoji: '🌾', locationId: '297576', category: 'governorate'),
  EgyptCity(name: 'الدقهلية', nameEn: 'Dakahlia', emoji: '🌾', locationId: '297577', category: 'governorate'),
  EgyptCity(name: 'الوادي الجديد', nameEn: 'New Valley', emoji: '🏜️', locationId: '297578', category: 'desert'),
  EgyptCity(name: 'شمال سيناء', nameEn: 'North Sinai', emoji: '🏜️', locationId: '297579', category: 'governorate'),

  // المدن السياحية
  EgyptCity(name: 'الغردقة', nameEn: 'Hurghada', emoji: '☀️', locationId: '297549', category: 'beach'),
  EgyptCity(name: 'شرم الشيخ', nameEn: 'Sharm El Sheikh', emoji: '🏖️', locationId: '297555', category: 'beach'),
  EgyptCity(name: 'دهب', nameEn: 'Dahab', emoji: '🤿', locationId: '297547', category: 'beach'),
  EgyptCity(name: 'الجونة', nameEn: 'El Gouna', emoji: '⛵', locationId: '297548', category: 'beach'),
  EgyptCity(name: 'نويبع', nameEn: 'Nuweiba', emoji: '🏝️', locationId: '297551', category: 'beach'),
  EgyptCity(name: 'مرسى علم', nameEn: 'Marsa Alam', emoji: '🐠', locationId: '311425', category: 'beach'),
  EgyptCity(name: 'سيوة', nameEn: 'Siwa', emoji: '🌴', locationId: '303857', category: 'desert'),
  EgyptCity(name: 'مرسى مطروح', nameEn: 'Marsa Matrouh', emoji: '🐚', locationId: '424910', category: 'beach'),
  EgyptCity(name: 'طابا', nameEn: 'Taba', emoji: '🏔️', locationId: '297557', category: 'beach'),
  EgyptCity(name: 'رأس سدر', nameEn: 'Ras Sidr', emoji: '🌅', locationId: '297544', category: 'beach'),
  EgyptCity(name: 'سهل حشيش', nameEn: 'Sahl Hasheesh', emoji: '🏖️', locationId: '15516847', category: 'beach'),
  EgyptCity(name: 'الساحل الشمالي', nameEn: 'North Coast', emoji: '🌊', locationId: '24052275', category: 'beach'),
];

/// Popular destinations for quick-select chips (matches web exactly)
const List<EgyptCity> popularDestinations = [
  EgyptCity(name: 'شرم الشيخ', nameEn: 'Sharm El Sheikh', emoji: '🌴', locationId: '297555', category: 'beach'),
  EgyptCity(name: 'الإسكندرية', nameEn: 'Alexandria', emoji: '🌊', locationId: '295398', category: 'governorate'),
  EgyptCity(name: 'دهب', nameEn: 'Dahab', emoji: '🐠', locationId: '297547', category: 'beach'),
  EgyptCity(name: 'الغردقة', nameEn: 'Hurghada', emoji: '🏖️', locationId: '297549', category: 'beach'),
  EgyptCity(name: 'القاهرة', nameEn: 'Cairo', emoji: '🕌', locationId: '294201', category: 'governorate'),
  EgyptCity(name: 'أسوان', nameEn: 'Aswan', emoji: '⛵', locationId: '294204', category: 'historical'),
  EgyptCity(name: 'الأقصر', nameEn: 'Luxor', emoji: '🏛️', locationId: '294205', category: 'historical'),
  EgyptCity(name: 'مرسى مطروح', nameEn: 'Marsa Matrouh', emoji: '🏖', locationId: '424910', category: 'beach'),
];

/// Popular origin cities for quick-select chips
const List<EgyptCity> popularOrigins = [
  EgyptCity(name: 'القاهرة', nameEn: 'Cairo', emoji: '🏙️', locationId: '294201', category: 'governorate'),
  EgyptCity(name: 'الإسكندرية', nameEn: 'Alexandria', emoji: '🌊', locationId: '295398', category: 'governorate'),
  EgyptCity(name: 'الجيزة', nameEn: 'Giza', emoji: '🔺', locationId: '294202', category: 'governorate'),
  EgyptCity(name: 'المنصورة', nameEn: 'Mansoura', emoji: '🌳', locationId: '668835', category: 'governorate'),
  EgyptCity(name: 'الشرقية', nameEn: 'Sharqia', emoji: '🌾', locationId: '297575', category: 'governorate'),
  EgyptCity(name: 'الغربية', nameEn: 'Gharbia', emoji: '🏭', locationId: '297576', category: 'governorate'),
];

/// Transport prices — mirrors web TRANSPORT_PRICES constant
const double fuelPrice = 12.5;

class TransportPricePerKm {
  static const double microbus = 0.8;
  static const double bus = 1.0;
  static const double vip = 2.0;
}

/// Haversine distance in km between two city names (with 1.25x road factor)
double? calcHaversineDistance(String city1, String city2) {
  final c1 = governoratesCoordinates[city1];
  final c2 = governoratesCoordinates[city2];
  if (c1 == null || c2 == null) return null;

  const r = 6371.0;
  final dLat = (c2.lat - c1.lat) * 3.141592653589793 / 180.0;
  final dLon = (c2.lng - c1.lng) * 3.141592653589793 / 180.0;
  final a = _sin2(dLat / 2) +
      _cos(c1.lat) * _cos(c2.lat) * _sin2(dLon / 2);
  final c = 2.0 * _atan2(_sqrt(a), _sqrt(1 - a));
  return (r * c * 1.25).roundToDouble();
}

// Pure-Dart math helpers (avoid dart:math import issues)
double _sin2(double x) {
  final s = _sin(x);
  return s * s;
}

double _sin(double x) {
  // Taylor series sin(x) ≈ x - x³/6 + x⁵/120  (good enough for our distances)
  return x - (x * x * x) / 6.0 + (x * x * x * x * x) / 120.0;
}

double _cos(double degAngle) {
  final x = degAngle * 3.141592653589793 / 180.0;
  return 1.0 - (x * x) / 2.0 + (x * x * x * x) / 24.0;
}

double _sqrt(double x) {
  if (x <= 0) return 0;
  double r = x;
  for (int i = 0; i < 40; i++) r = (r + x / r) / 2;
  return r;
}

double _atan2(double y, double x) {
  if (x > 0) return _atan(y / x);
  if (x < 0 && y >= 0) return _atan(y / x) + 3.141592653589793;
  if (x < 0 && y < 0) return _atan(y / x) - 3.141592653589793;
  if (x == 0 && y > 0) return 3.141592653589793 / 2;
  if (x == 0 && y < 0) return -3.141592653589793 / 2;
  return 0;
}

double _atan(double x) {
  // atan series — accurate enough for our use
  return x - (x * x * x) / 3 + (x * x * x * x * x) / 5;
}

class TransportOption {
  final String type; // 'bus' | 'microbus' | 'vip'
  final int price;
  final String duration;
  final String label;
  final String icon;

  const TransportOption({
    required this.type,
    required this.price,
    required this.duration,
    required this.label,
    required this.icon,
  });
}

String _formatDuration(double distanceKm, double speedKmh) {
  final hours = (distanceKm / speedKmh).floor();
  final minutes = (((distanceKm / speedKmh) - hours) * 60).round();
  if (hours > 0) {
    return '$hours ساعة${minutes > 0 ? ' و $minutes دقيقة' : ''}';
  }
  return '$minutes دقيقة';
}

List<TransportOption> buildTransportOptions(String origin, String dest) {
  final distance = calcHaversineDistance(origin, dest);
  if (distance == null || distance <= 0) return [];

  final fuelFactor = fuelPrice / 15.0;
  final busPrice = (distance * TransportPricePerKm.bus * fuelFactor).round();
  final microbusPrice = (distance * TransportPricePerKm.microbus * fuelFactor).round();
  final vipPrice = (distance * TransportPricePerKm.vip * fuelFactor).round();

  return [
    TransportOption(
      type: 'bus',
      price: busPrice,
      duration: _formatDuration(distance, 60),
      label: 'أتوبيس',
      icon: '🚌',
    ),
    TransportOption(
      type: 'microbus',
      price: microbusPrice,
      duration: _formatDuration(distance, 70),
      label: 'ميكروباص',
      icon: '🚐',
    ),
    TransportOption(
      type: 'vip',
      price: vipPrice,
      duration: _formatDuration(distance, 90),
      label: 'VIP / ليموزين',
      icon: '🚗',
    ),
  ];
}

int calcEstimatedTotal({
  required int days,
  required String? budget,
  int? customBudget,
  int? transportPrice,
}) {
  final dailyRate = customBudget ??
      (budget == 'low' ? 600 : budget == 'high' ? 3500 : 1400);
  return days * dailyRate + (transportPrice ?? 0);
}

/// Sorted governorates for map/search proximity (explicit [Map<String, dynamic>]).
List<Map<String, dynamic>> get egyptGovernoratesList {
  final list = governoratesCoordinates.entries
      .map((e) => <String, dynamic>{'name': e.key, 'lat': e.value.lat, 'lng': e.value.lng})
      .toList();
  list.sort((a, b) => (a['name'] as String).compareTo(b['name'] as String));
  return list;
}

Map<String, dynamic> governorateByName(String? name) {
  final list = egyptGovernoratesList;
  if (name != null && name.isNotEmpty) {
    for (final g in list) {
      if (g['name'] == name) return g;
    }
  }
  return list.first;
}

/// Diverse stock images when API photos are missing or duplicated.
const placeFallbackImages = [
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&q=80',
  'https://images.unsplash.com/photo-1544013589-447e9eba48b1?w=800&q=80',
  'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80',
  'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80',
  'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80',
  'https://images.unsplash.com/photo-1564937220492-6e0ef1e34dab?w=800&q=80',
  'https://images.unsplash.com/photo-1535530992830-e25d07cfa780?w=800&q=80',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
  'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'https://images.unsplash.com/photo-1590059232387-a2267bca9c80?w=800&q=80',
];

String fallbackPlaceImage(String seed) {
  final idx = seed.hashCode.abs() % placeFallbackImages.length;
  return placeFallbackImages[idx];
}
