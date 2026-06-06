import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../providers/trip_draft_provider.dart';

/// Persists detailed-trip draft locally (like web `localStorage.tripDraft`).
class TripDraftStorage {
  static const _key = 're7lty_trip_draft_v1';

  static Map<String, dynamic> _draftToJson(TripDraft d) => {
        'title': d.title,
        'destination': d.destination,
        'city': d.city,
        'duration': d.duration,
        'budget': d.budget,
        'season': d.season,
        'description': d.description,
        'coverImageUrl': d.coverImageUrl,
        'activities': d.activities.map(_activityToJson).toList(),
        'days': d.days
            .map((day) => {
                  'title': day.title,
                  'activityIndices': day.activityIndices,
                })
            .toList(),
        'foodPlaces': d.foodPlaces
            .map((f) => {
                  'name': f.name,
                  'description': f.description,
                  'location': f.location,
                  'type': f.type,
                  'image': f.image,
                })
            .toList(),
        'hotels': d.hotels
            .map((h) => {
                  'name': h.name,
                  'description': h.description,
                  'location': h.location,
                  'bookingUrl': h.bookingUrl,
                  'image': h.image,
                })
            .toList(),
        'taggedUsers': d.taggedUsers,
        'route': d.route,
      };

  static Map<String, dynamic> _activityToJson(DraftActivity a) => {
        'name': a.name,
        'description': a.description,
        'lat': a.lat,
        'lng': a.lng,
        'imagePath': a.imagePath,
        'images': a.images.whereType<String>().toList(),
        'videos': a.videos.whereType<String>().toList(),
      };

  static TripDraft draftFromJson(Map<String, dynamic> j) {
    return TripDraft(
      title: j['title']?.toString() ?? '',
      destination: j['destination']?.toString() ?? '',
      city: j['city']?.toString() ?? '',
      duration: j['duration']?.toString() ?? '',
      budget: j['budget']?.toString() ?? '',
      season: j['season']?.toString() ?? 'winter',
      description: j['description']?.toString() ?? '',
      coverImageUrl: j['coverImageUrl']?.toString() ?? '',
      activities: (j['activities'] as List?)
              ?.map((e) => _activityFromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      days: (j['days'] as List?)
              ?.map((e) {
                final m = e as Map<String, dynamic>;
                return DraftDay(
                  title: m['title']?.toString() ?? '',
                  activityIndices: (m['activityIndices'] as List?)
                          ?.map((i) => i is int ? i : int.tryParse(i.toString()) ?? 0)
                          .toList() ??
                      [],
                );
              })
              .toList() ??
          [],
      foodPlaces: (j['foodPlaces'] as List?)
              ?.map((e) {
                final m = e as Map<String, dynamic>;
                return DraftFood(
                  name: m['name']?.toString() ?? '',
                  description: m['description']?.toString() ?? '',
                  location: m['location']?.toString() ?? '',
                  type: m['type']?.toString() ?? 'restaurant',
                  image: m['image'],
                );
              })
              .toList() ??
          [],
      hotels: (j['hotels'] as List?)
              ?.map((e) {
                final m = e as Map<String, dynamic>;
                return DraftHotel(
                  name: m['name']?.toString() ?? '',
                  description: m['description']?.toString() ?? '',
                  location: m['location']?.toString() ?? '',
                  bookingUrl: m['bookingUrl']?.toString() ?? '',
                  image: m['image'],
                );
              })
              .toList() ??
          [],
      taggedUsers: (j['taggedUsers'] as List?)
              ?.map((e) => Map<String, String>.from(e as Map))
              .toList() ??
          [],
      route: (j['route'] as List?)
              ?.map((p) => (p as List).map((n) => (n as num).toDouble()).toList())
              .toList() ??
          [],
    );
  }

  static DraftActivity _activityFromJson(Map<String, dynamic> j) => DraftActivity(
        name: j['name']?.toString() ?? '',
        description: j['description']?.toString() ?? '',
        lat: j['lat'] != null ? (j['lat'] as num).toDouble() : null,
        lng: j['lng'] != null ? (j['lng'] as num).toDouble() : null,
        imagePath: j['imagePath']?.toString(),
        images: (j['images'] as List?)?.map((e) => e.toString()).toList() ?? [],
        videos: (j['videos'] as List?)?.map((e) => e.toString()).toList() ?? [],
      );

  static Future<void> save(TripDraft draft) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(_draftToJson(draft)));
  }

  static Future<TripDraft?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return null;
    try {
      return draftFromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }

  static Future<bool> hasDraft() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(_key);
  }
}
