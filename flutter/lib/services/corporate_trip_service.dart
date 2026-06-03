import 'dart:io';

import '../providers/corporate_trip_draft_provider.dart';
import 'api_service.dart';
import 'media_upload_service.dart';

class CorporateTripService {
  final ApiService _api;
  final MediaUploadService _media;

  CorporateTripService(this._api, this._media);

  static String difficultyToArabic(String difficulty) {
    switch (difficulty) {
      case 'easy':
        return 'سهل';
      case 'hard':
        return 'صعب';
      default:
        return 'متوسط';
    }
  }

  static String computeDuration(DateTime? start, DateTime? end) {
    if (start != null && end != null) {
      final days = end.difference(start).inDays + 1;
      return '$days أيام';
    }
    if (start != null) return 'يوم واحد';
    return '3 أيام';
  }

  static List<Map<String, dynamic>> calculateTransportations(int totalSeats) {
    var remaining = totalSeats > 0 ? totalSeats : 10;
    final units = <Map<String, dynamic>>[];

    final bigBuses = remaining ~/ 48;
    if (bigBuses > 0) {
      units.add({'type': 'bus-48', 'capacity': 48, 'count': bigBuses});
      remaining %= 48;
    }
    final minibuses = remaining ~/ 28;
    if (minibuses > 0) {
      units.add({'type': 'minibus-28', 'capacity': 28, 'count': minibuses});
      remaining %= 28;
    }
    if (remaining > 0) {
      units.add({'type': 'van-14', 'capacity': 14, 'count': (remaining / 14).ceil()});
    }
    if (units.isEmpty) {
      units.add({'type': 'bus-48', 'capacity': 48, 'count': 1});
    }
    return units;
  }

  Future<List<String>> _uploadFiles(List<File> files) async {
    final urls = <String>[];
    for (final file in files) {
      urls.add(await _media.uploadImageFile(file));
    }
    return urls;
  }

  Future<Map<String, dynamic>> buildPayload(
    CorporateTripDraft draft, {
    String? existingSlug,
  }) async {
    final generalUrls = [...draft.existingGeneralImageUrls];
    generalUrls.addAll(await _uploadFiles(draft.generalImages));

    final transportUrls = [...draft.existingTransportImageUrls];
    transportUrls.addAll(await _uploadFiles(draft.transportImages));

    final stayDetails = <Map<String, dynamic>>[];
    for (final hotel in draft.hotels) {
      if (hotel.name.trim().isEmpty) continue;
      final imgs = <String>[];
      if (hotel.imageUrl != null && hotel.imageUrl!.trim().isNotEmpty) {
        imgs.add(hotel.imageUrl!.trim());
      }
      if (hotel.image != null) {
        imgs.add(await _media.uploadImageFile(hotel.image!));
      }
      stayDetails.add({
        'name': hotel.name.trim(),
        'details': hotel.details.trim(),
        if (imgs.isNotEmpty) 'images': imgs,
      });
    }

    var itinerary = draft.days.asMap().entries.map((entry) {
      return {
        'day': entry.key + 1,
        'title': entry.value.title.trim(),
        'description': entry.value.details.trim(),
      };
    }).where((item) {
      final title = item['title'] as String;
      final desc = item['description'] as String;
      return title.isNotEmpty || desc.isNotEmpty;
    }).toList();

    if (itinerary.isEmpty && draft.description.trim().isNotEmpty) {
      itinerary = [
        {
          'day': 1,
          'title': 'اليوم الأول',
          'description': draft.description.trim().length > 300
              ? draft.description.trim().substring(0, 300)
              : draft.description.trim(),
        },
      ];
    }

    final seats = draft.maxPassengers > 0 ? draft.maxPassengers : 10;
    final transportations = calculateTransportations(seats);
    final slugBase = draft.title.trim().toLowerCase().replaceAll(RegExp(r'\s+'), '-');
    final slug = existingSlug ?? '$slugBase-${DateTime.now().millisecondsSinceEpoch}';

    final desc = draft.description.trim();
    final price = draft.price.trim().isEmpty ? '0' : draft.price.trim();
    final meeting = draft.meetingLocation.trim().isEmpty
        ? draft.destination.trim()
        : draft.meetingLocation.trim();

    return {
      'title': draft.title.trim(),
      'destination': draft.destination.trim(),
      'meetingLocation': meeting,
      'slug': slug,
      'duration': computeDuration(draft.startDate, draft.endDate),
      'price': price,
      'shortDescription':
          desc.length > 100 ? desc.substring(0, 100) : (desc.isEmpty ? draft.title.trim() : desc),
      'fullDescription': desc.isEmpty ? draft.title.trim() : desc,
      'includedServices': draft.included.where((s) => s.trim().isNotEmpty).toList(),
      'excludedServices': draft.notIncluded.where((s) => s.trim().isNotEmpty).toList(),
      'maxGroupSize': seats,
      'availableSeats': seats,
      'rating': draft.defaultRating,
      'season': draft.season,
      'difficulty': difficultyToArabic(draft.difficulty),
      if (draft.startDate != null) 'startDate': draft.startDate!.toIso8601String(),
      if (draft.endDate != null) 'endDate': draft.endDate!.toIso8601String(),
      'images': generalUrls,
      'transportationImages': transportUrls,
      if (itinerary.isNotEmpty) 'itinerary': itinerary,
      if (stayDetails.isNotEmpty) 'stayDetails': stayDetails,
      'bookingMethod': {
        'whatsapp': draft.bookingWhatsapp.isNotEmpty,
        'phone': draft.bookingPhone.isNotEmpty,
        'website': draft.bookingWebsite.trim().isNotEmpty,
      },
      'isActive': draft.isPublished,
      'transportationType': transportations.first['type'],
      'transportations': transportations,
    };
  }

  Future<Map<String, dynamic>> createTrip(CorporateTripDraft draft) async {
    final body = await buildPayload(draft);
    final response = await _api.post('/corporate/trips/me/create', data: body);
    if (response.statusCode != 201 && response.statusCode != 200) {
      final data = response.data;
      final msg = data is Map
          ? (data['error'] ?? data['details'] ?? 'فشل إنشاء الرحلة')
          : 'فشل إنشاء الرحلة';
      throw Exception(msg.toString());
    }
    return response.data is Map ? Map<String, dynamic>.from(response.data as Map) : {};
  }

  Future<Map<String, dynamic>> updateTrip(
    String tripId,
    CorporateTripDraft draft, {
    required String slug,
  }) async {
    final body = await buildPayload(draft, existingSlug: slug);
    final response = await _api.put('/corporate/trips/me/$tripId', data: body);
    if (response.statusCode != 200) {
      final data = response.data;
      final msg = data is Map
          ? (data['error'] ?? data['details'] ?? 'فشل تحديث الرحلة')
          : 'فشل تحديث الرحلة';
      throw Exception(msg.toString());
    }
    return response.data is Map ? Map<String, dynamic>.from(response.data as Map) : {};
  }

  static String? extractErrorMessage(Object error) {
    if (error is Exception) {
      return error.toString().replaceFirst('Exception: ', '');
    }
    return error.toString();
  }
}
