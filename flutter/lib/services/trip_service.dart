import 'package:dio/dio.dart';
import '../models/trip.dart';
import 'api_service.dart';

class TripService {
  final ApiService _apiService = ApiService();

  Future<List<Trip>> getTrips({
    String? query,
    String? city,
    String? season,
    String sort = 'recent',
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get('/trips', queryParameters: {
        'q': query,
        'city': city,
        'season': season,
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
      throw Exception('Error fetching trips: $e');
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
}
