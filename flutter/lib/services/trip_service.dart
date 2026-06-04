import 'package:dio/dio.dart';
import '../models/trip.dart';
import '../models/corporate_trip.dart';
import '../core/exceptions.dart';
import 'api_service.dart';

class TripService {
  final ApiService _apiService;

  TripService(this._apiService);

  Future<List<Trip>> getTrips({
    String? query,
    String? city,
    String? season,
    String? authorId,
    String sort = 'recent',
    String? type,
    String? postType,
    bool followingOnly = false,
    bool suggestedOnly = false,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get('/trips', queryParameters: {
        if (query != null) 'q': query,
        if (city != null) 'city': city,
        if (season != null) 'season': season,
        if (authorId != null) 'authorId': authorId,
        if (type != null) 'type': type,
        if (postType != null) 'postType': postType,
        if (followingOnly) 'followingOnly': 'true',
        if (suggestedOnly) 'suggestedOnly': 'true',
        'sort': sort,
        'page': page,
        'limit': limit,
      });

      if (response.statusCode == 200) {
        final dynamic data = response.data;
        List items = [];
        if (data is Map && data.containsKey('items')) {
          items = data['items'];
        } else if (data is List) {
          items = data;
        }
        return items.map((json) => Trip.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load trips: ${response.statusCode}');
      }
    } catch (e) {
      // Return empty list so UI shows gracefully instead of error state
      print('⚠️ TripService.getTrips error: $e');
      return [];
    }
  }

  Future<Trip> getTripById(String id) async {
    const maxAttempts = 3;
    Object? lastError;

    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        _apiService.invalidateTokenCache();
        await Future.delayed(Duration(seconds: attempt));
      }
      try {
        final response = await _apiService.get('/trips/$id');

        if (response.statusCode == 200) {
          final data = response.data;
          if (data is Map) {
            return Trip.fromJson(Map<String, dynamic>.from(data));
          }
          throw ServerException('استجابة غير صالحة من السيرفر');
        }

        if (response.statusCode == 503 && attempt < maxAttempts - 1) continue;
        throw ServerException('تعذر تحميل الرحلة (${response.statusCode})');
      } on DioException catch (e) {
        lastError = e;
        final status = e.response?.statusCode;
        if ((status == 503 || status == 502 || status == 504) && attempt < maxAttempts - 1) {
          continue;
        }
        throw handleDioError(e);
      } catch (e) {
        lastError = e;
        if (e is AppException) rethrow;
        throw ServerException('تعذر تحميل تفاصيل الرحلة');
      }
    }

    if (lastError is DioException) throw handleDioError(lastError as DioException);
    throw ServerException('السيرفر مشغول حالياً. حاول مرة أخرى بعد قليل.');
  }

  Future<Trip> createTrip(Map<String, dynamic> tripData) async {
    try {
      final response = await _apiService.post('/trips', data: tripData);

      if (response.statusCode == 201) {
        return Trip.fromJson(response.data);
      } else {
        throw Exception('Failed to create trip');
      }
    } catch (e) {
      throw Exception('Error creating trip: $e');
    }
  }

  Future<Trip> updateTrip(String id, Map<String, dynamic> tripData) async {
    try {
      final response = await _apiService.put('/trips/$id', data: tripData);
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map && data['trip'] != null) {
          return Trip.fromJson(Map<String, dynamic>.from(data['trip'] as Map));
        }
        return Trip.fromJson(Map<String, dynamic>.from(data as Map));
      }
      throw Exception('Failed to update trip');
    } catch (e) {
      throw Exception('Error updating trip: $e');
    }
  }

  Future<bool> toggleLike(String tripId) async {
    try {
      final response = await _apiService.post('/trips/$tripId/love');
      if (response.statusCode == 200) {
        return response.data['loved'] == true;
      }
      throw Exception('Failed to toggle like');
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> toggleSave(String tripId) async {
    try {
      final response = await _apiService.post('/trips/$tripId/save');
      if (response.statusCode == 200) {
        return response.data['saved'] == true;
      }
      throw Exception('Failed to toggle save');
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> addComment(String tripId, String content) async {
    try {
      final response = await _apiService.post('/trips/$tripId/comments', data: {
        'content': content,
      });
      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      print('❌ TripService.addComment error: $e');
      if (e is DioException) {
        print('Response data: ${e.response?.data}');
      }
      return false;
    }
  }

  Future<bool> deleteTrip(String tripId) async {
    try {
      final response = await _apiService.delete('/trips/$tripId');
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('❌ TripService.deleteTrip error: $e');
      return false;
    }
  }

  Future<bool> deleteComment(String tripId, String commentId) async {
    try {
      final response = await _apiService.delete('/trips/$tripId/comments/$commentId');
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('❌ TripService.deleteComment error: $e');
      return false;
    }
  }

  static bool _isRetryableNetworkError(Object e) {
    if (e is! DioException) return false;
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError) {
      return true;
    }
    if (e.type == DioExceptionType.unknown) {
      final msg = '${e.message ?? ''} ${e.error ?? ''}'.toLowerCase();
      return msg.contains('connection closed') ||
          msg.contains('connection reset') ||
          msg.contains('broken pipe') ||
          msg.contains('socketexception');
    }
    return false;
  }

  Future<List<CorporateTrip>> _fetchCorporateTrips({String? destination}) async {
    final response = await _apiService.get('/corporate/trips', queryParameters: {
      if (destination != null) 'destination': destination,
    });
    print('🏗️ CorporateTrips raw response type: ${response.data.runtimeType}');
    // Handle both response formats: list directly or {trips: []}
    List items;
    if (response.data is List) {
      items = response.data as List;
    } else {
      items = response.data['trips'] ?? response.data['data'] ?? [];
    }
    print('🏗️ CorporateTrips items count: ${items.length}');
    final result = <CorporateTrip>[];
    for (final e in items) {
      try {
        result.add(CorporateTrip.fromJson(e as Map<String, dynamic>));
      } catch (parseErr) {
        print('⚠️ CorporateTrip parse error for item: $parseErr');
      }
    }
    print('🏗️ CorporateTrips parsed: ${result.length} trips');
    return result;
  }

  Future<List<CorporateTrip>> getCorporateTrips({String? destination}) async {
    const maxAttempts = 2;
    Object? lastError;

    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        print('🔄 TripService.getCorporateTrips: retrying after network error...');
        await Future.delayed(const Duration(seconds: 1));
        _apiService.invalidateTokenCache();
      }

      try {
        return await _fetchCorporateTrips(destination: destination);
      } catch (e) {
        lastError = e;
        print('⚠️ TripService.getCorporateTrips error (attempt ${attempt + 1}/$maxAttempts): $e');
        final canRetry = _isRetryableNetworkError(e) && attempt < maxAttempts - 1;
        if (!canRetry) rethrow;
      }
    }

    throw lastError ?? Exception('Failed to load corporate trips');
  }
}


