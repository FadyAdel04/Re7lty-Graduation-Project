import 'package:dio/dio.dart';
import '../models/trip.dart';
import '../models/corporate_trip.dart';
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
    try {
      final response = await _apiService.get('/trips/$id');

      if (response.statusCode == 200) {
        return Trip.fromJson(response.data);
      } else {
        throw Exception('Trip not found');
      }
    } catch (e) {
      throw Exception('Error fetching trip details: $e');
    }
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

  Future<bool> toggleLike(String tripId) async {
    try {
      final response = await _apiService.post('/trips/$tripId/love');
      if (response.statusCode == 200) {
        return response.data['loved'];
      }
      return false;
    } catch (e) {
      return false;
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

  Future<List<CorporateTrip>> getCorporateTrips({String? destination}) async {
    try {
      final response = await _apiService.get('/corporate/trips', queryParameters: {
        if (destination != null) 'destination': destination,
      });
      final List items = response.data['trips'] ?? [];
      return items.map((e) => CorporateTrip.fromJson(e)).toList();
    } catch (e) {
      print('⚠️ TripService.getCorporateTrips error: $e');
      return [];
    }
  }
}


