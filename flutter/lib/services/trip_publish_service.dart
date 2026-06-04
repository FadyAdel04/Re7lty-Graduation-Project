import 'dart:convert';
import 'dart:io';

import '../constants/egypt_data.dart';
import '../models/trip.dart';
import '../providers/trip_draft_provider.dart';
import '../services/media_upload_service.dart';
import '../services/trip_service.dart';

typedef PublishProgressCallback = void Function(double progress, String status);

bool isVideoPath(String path) {
  final ext = path.split('.').last.toLowerCase();
  return {'mp4', 'mov', 'webm', 'mkv', 'avi', '3gp'}.contains(ext);
}

Future<File?> dataUrlToTempFile(String dataUrl) async {
  try {
    final match = RegExp(r'^data:[^;]+;base64,(.+)$').firstMatch(dataUrl);
    if (match == null) return null;
    final bytes = base64Decode(match.group(1)!);
    final isVideo = dataUrl.startsWith('data:video/');
    final ext = isVideo ? 'mp4' : 'jpg';
    final file = File('${Directory.systemTemp.path}/trip_upload_${DateTime.now().millisecondsSinceEpoch}.$ext');
    await file.writeAsBytes(bytes);
    return file;
  } catch (_) {
    return null;
  }
}

Future<String?> uploadPath(
  MediaUploadService media,
  String? path, {
  required void Function(String label) onLabel,
}) async {
  if (path == null || path.isEmpty) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  if (path.startsWith('data:')) {
    onLabel('جاري رفع ملف...');
    final file = await dataUrlToTempFile(path);
    if (file == null) return null;
    return media.uploadMediaFile(file);
  }

  final file = File(path);
  if (!await file.exists()) return null;
  onLabel('جاري رفع: ${path.split(Platform.pathSeparator).last}');
  return media.uploadMediaFile(file);
}

Future<List<String>> uploadMediaList(
  MediaUploadService media,
  List<dynamic> paths, {
  required void Function(String label) onLabel,
  required bool videosOnly,
}) async {
  final urls = <String>[];
  for (final item in paths) {
    if (item is! String) continue;
    final isVideo = isVideoPath(item) || item.startsWith('data:video/');
    if (videosOnly != isVideo) continue;
    final url = await uploadPath(media, item, onLabel: onLabel);
    if (url != null) urls.add(url);
  }
  return urls;
}

int dayForActivity(TripDraft draft, int activityIndex) {
  for (var d = 0; d < draft.days.length; d++) {
    if (draft.days[d].activityIndices.contains(activityIndex)) return d + 1;
  }
  return 1;
}

class TripPublishService {
  TripPublishService(this._tripService, this._media);

  final TripService _tripService;
  final MediaUploadService _media;

  Future<Trip> publish({
    required TripPostType type,
    TripDraft? draft,
    Map<String, dynamic>? extraData,
    required PublishProgressCallback onProgress,
  }) async {
    onProgress(0, 'جاري التحضير...');
    final payload = await _buildPayload(type, draft, extraData, onProgress);
    onProgress(0.95, 'جاري إرسال البيانات...');
    return _tripService.createTrip(payload);
  }

  Future<Map<String, dynamic>> _buildPayload(
    TripPostType type,
    TripDraft? draft,
    Map<String, dynamic>? extraData,
    PublishProgressCallback onProgress,
  ) async {
    if (type == TripPostType.detailed && draft != null) {
      return _buildDetailedPayload(draft, extraData, onProgress);
    }
    if (type == TripPostType.quick) {
      return _buildQuickPayload(extraData, onProgress);
    }
    return _buildAskPayload(extraData, onProgress);
  }

  Future<Map<String, dynamic>> _buildDetailedPayload(
    TripDraft draft,
    Map<String, dynamic>? extraData,
    PublishProgressCallback onProgress,
  ) async {
    int totalItems = 0;
    if (draft.coverImageUrl.isNotEmpty && !draft.coverImageUrl.startsWith('http')) totalItems++;
    for (final a in draft.activities) {
      totalItems += a.images.length + a.videos.length;
      if (a.imagePath != null && !a.imagePath!.startsWith('http')) totalItems++;
    }
    for (final f in draft.foodPlaces) {
      if (f.image != null && f.image is String && !(f.image as String).startsWith('http')) totalItems++;
    }
    for (final h in draft.hotels) {
      if (h.image != null && h.image is String && !(h.image as String).startsWith('http')) totalItems++;
    }

    var completed = 0;
    void tick(String label) {
      completed++;
      onProgress(totalItems > 0 ? completed / totalItems : 0.5, label);
    }

    String coverImage = 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=500';
    if (draft.coverImageUrl.isNotEmpty) {
      final uploaded = await uploadPath(_media, draft.coverImageUrl, onLabel: tick);
      if (uploaded != null) coverImage = uploaded;
    }

    final activitiesPayload = <Map<String, dynamic>>[];
    for (var i = 0; i < draft.activities.length; i++) {
      final a = draft.activities[i];
      if (a.lat == null || a.lng == null) continue;

      final imagePaths = <String>[
        if (a.imagePath != null) a.imagePath!,
        ...a.images.whereType<String>(),
      ];
      final images = <String>[];
      for (final p in imagePaths) {
        if (isVideoPath(p)) continue;
        final url = await uploadPath(_media, p, onLabel: tick);
        if (url != null && !images.contains(url)) images.add(url);
      }

      final videos = await uploadMediaList(_media, a.videos, onLabel: tick, videosOnly: true);

      activitiesPayload.add({
        'name': a.name.isNotEmpty ? a.name : 'موقع',
        if (a.description.isNotEmpty) 'note': a.description,
        'coordinates': {'lat': a.lat, 'lng': a.lng},
        'day': dayForActivity(draft, i),
        if (images.isNotEmpty) 'images': images,
        if (videos.isNotEmpty) 'videos': videos,
      });
    }

    final foodPayload = <Map<String, dynamic>>[];
    for (final f in draft.foodPlaces.where((f) => f.name.isNotEmpty)) {
      String? imageUrl;
      if (f.image != null) {
        imageUrl = await uploadPath(_media, f.image as String, onLabel: tick);
      }
      foodPayload.add({
        'name': f.name,
        'description': f.description,
        'location': f.location,
        'type': f.type,
        if (imageUrl != null && imageUrl.isNotEmpty) 'image': imageUrl,
      });
    }

    final hotelsPayload = <Map<String, dynamic>>[];
    for (final h in draft.hotels.where((h) => h.name.isNotEmpty)) {
      String? imageUrl;
      if (h.image != null) {
        imageUrl = await uploadPath(_media, h.image as String, onLabel: tick);
      }
      hotelsPayload.add({
        'name': h.name,
        'description': h.stayDays > 1
            ? '${h.description.isNotEmpty ? h.description : h.name} (إقامة ${h.stayDays} ليالي)'
            : h.description,
        'location': h.location,
        'bookingUrl': h.bookingUrl,
        if (imageUrl != null && imageUrl.isNotEmpty) 'image': imageUrl,
        if (h.stayDays > 1) 'priceRange': '${h.stayDays} ليالي',
      });
    }

    return {
      'title': draft.title.isNotEmpty ? draft.title : 'رحلة مفصلة',
      'destination': draft.destination,
      'city': draft.city.isNotEmpty ? draft.city : draft.destination,
      'duration': draft.duration,
      'budget': draft.budget,
      'season': draft.season,
      'description': draft.description,
      'postType': 'detailed',
      'activities': activitiesPayload,
      'days': draft.days.map((d) => {
        'title': d.title,
        'activities': d.activityIndices,
      }).toList(),
      'foodAndRestaurants': foodPayload,
      'hotels': hotelsPayload,
      'image': coverImage,
      if (draft.taggedUsers.isNotEmpty) 'taggedUsers': draft.taggedUsers,
    };
  }

  Future<Map<String, dynamic>> _buildQuickPayload(
    Map<String, dynamic>? extraData,
    PublishProgressCallback onProgress,
  ) async {
    final mediaPaths = (extraData?['mediaPaths'] as List<String>?) ?? [];
    final coverPath = extraData?['coverPath'] as String?;
    var completed = 0;
    final total = mediaPaths.length + (coverPath != null ? 1 : 0);
    void tick(String label) {
      completed++;
      onProgress(total > 0 ? completed / total : 0.5, label);
    }

    String coverImage = 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=500';
    if (coverPath != null && coverPath.isNotEmpty) {
      final u = await uploadPath(_media, coverPath, onLabel: tick);
      if (u != null) coverImage = u;
    }

    final mediaImages = <String>[];
    final mediaVideos = <String>[];
    for (final p in mediaPaths) {
      final url = await uploadPath(_media, p, onLabel: tick);
      if (url == null) continue;
      if (isVideoPath(p)) {
        mediaVideos.add(url);
      } else {
        mediaImages.add(url);
      }
    }

    final dest = extraData?['destination']?.toString() ?? '';
    final gov = governorateByName(dest.isNotEmpty ? dest : null);

    return {
      'title': extraData?['title'] ?? 'لحظات سريعة',
      'description': extraData?['description'] ?? '',
      'destination': dest,
      'city': dest,
      'postType': 'quick',
      'image': coverImage,
      if (mediaImages.isNotEmpty || mediaVideos.isNotEmpty)
        'activities': [
          {
            'name': dest.isNotEmpty ? dest : 'رحلة سريعة',
            'images': mediaImages,
            'videos': mediaVideos,
            'coordinates': {'lat': gov['lat'], 'lng': gov['lng']},
            'day': 1,
          },
        ],
      if ((extraData?['taggedUsers'] as List?)?.isNotEmpty == true)
        'taggedUsers': extraData!['taggedUsers'],
    };
  }

  Future<Map<String, dynamic>> _buildAskPayload(
    Map<String, dynamic>? extraData,
    PublishProgressCallback onProgress,
  ) async {
    onProgress(0.3, 'جاري رفع الصورة...');
    String? imageUrl;
    final imagePath = extraData?['imagePath'] as String?;
    if (imagePath != null && imagePath.isNotEmpty) {
      imageUrl = await uploadPath(_media, imagePath, onLabel: (_) {});
    }
    final content = extraData?['description']?.toString() ?? '';
    return {
      'title': content.trim().isNotEmpty
          ? (content.trim().length > 80 ? '${content.trim().substring(0, 80)}...' : content.trim())
          : 'سؤال عن السفر',
      'description': content,
      'destination': 'عام',
      'city': 'عام',
      'duration': '',
      'budget': '',
      'rating': 4.5,
      'postType': 'ask',
      'activities': [],
      'days': [],
      'foodAndRestaurants': [],
      'hotels': [],
      if (imageUrl != null) 'image': imageUrl,
    };
  }
}
