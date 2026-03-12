import 'package:dio/dio.dart';
import '../models/trip_plan_data.dart';

import 'package:flutter_dotenv/flutter_dotenv.dart';

class TravelAdvisorService {
  final String _apiKey = dotenv.get('RAPID_API_KEY', fallback: '');
  final String _apiHost = dotenv.get('RAPID_API_HOST', fallback: 'travel-advisor.p.rapidapi.com');
  final String _baseUrl = dotenv.get('RAPID_API_BASE_URL', fallback: 'https://travel-advisor.p.rapidapi.com');
  final Dio _dio = Dio();

  final Map<String, String> _cityNameMap = {
    'القاهرة': 'Cairo, Egypt',
    'الإسكندرية': 'Alexandria, Egypt',
    'الأقصر': 'Luxor, Egypt',
    'أسوان': 'Aswan, Egypt',
    'شرم الشيخ': 'Sharm El Sheikh, Egypt',
    'دهب': 'Dahab, Egypt',
    'الجونة': 'El Gouna, Egypt',
    'الغردقة': 'Hurghada, Egypt',
  };

  String _getEnglishCityName(String arabicCity) {
    return _cityNameMap[arabicCity] ?? arabicCity;
  }

  Future<TravelAdvisorLocation?> searchLocation(String query) async {
    try {
      final englishCity = _getEnglishCityName(query);
      final response = await _dio.get(
        '$_baseUrl/locations/search',
        queryParameters: {
          'query': englishCity,
          'limit': 1,
          'offset': 0,
          'units': 'km',
          'currency': 'USD',
          'sort': 'relevance',
          'lang': 'en_US',
        },
        options: Options(headers: {
          'X-RapidAPI-Key': _apiKey,
          'X-RapidAPI-Host': _apiHost,
        }),
      );

      if (response.data['data'] != null && response.data['data'].length > 0) {
        final result = response.data['data'][0]['result_object'];
        return TravelAdvisorLocation.fromJson(result);
      }
      return null;
    } catch (e) {
      print('Search Location Error: $e');
      rethrow;
    }
  }

  Future<List<TravelAdvisorAttraction>> getAttractions(String locationId, int limit) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/attractions/list',
        queryParameters: {
          'location_id': locationId,
          'currency': 'USD',
          'lang': 'en_US',
          'lunit': 'km',
          'limit': limit,
          'sort': 'recommended',
        },
        options: Options(headers: {
          'X-RapidAPI-Key': _apiKey,
          'X-RapidAPI-Host': _apiHost,
        }),
      );

      final List data = response.data['data'] ?? [];
      return data.map((e) => TravelAdvisorAttraction.fromJson(e)).toList();
    } catch (e) {
      print('Get Attractions Error: $e');
      return [];
    }
  }

  Future<List<TravelAdvisorRestaurant>> getRestaurants(String locationId, int limit) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/restaurants/list',
        queryParameters: {
          'location_id': locationId,
          'currency': 'USD',
          'lang': 'en_US',
          'lunit': 'km',
          'limit': limit,
          'sort': 'recommended',
        },
        options: Options(headers: {
          'X-RapidAPI-Key': _apiKey,
          'X-RapidAPI-Host': _apiHost,
        }),
      );

      final List data = response.data['data'] ?? [];
      return data.map((e) => TravelAdvisorRestaurant.fromJson(e)).toList();
    } catch (e) {
      print('Get Restaurants Error: $e');
      return [];
    }
  }

  Future<List<TravelAdvisorHotel>> getHotels(String locationId, int limit) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/hotels/list',
        queryParameters: {
          'location_id': locationId,
          'currency': 'USD',
          'lang': 'en_US',
          'lunit': 'km',
          'limit': limit,
          'sort': 'recommended',
        },
        options: Options(headers: {
          'X-RapidAPI-Key': _apiKey,
          'X-RapidAPI-Host': _apiHost,
        }),
      );

      final List data = response.data['data'] ?? [];
      return data.map((e) => TravelAdvisorHotel.fromJson(e)).toList();
    } catch (e) {
      print('Get Hotels Error: $e');
      return [];
    }
  }

  Future<TripPlanData?> getTripPlan(String city, int days) async {
    final location = await searchLocation(city);
    if (location == null) return null;

    final attractions = await getAttractions(location.locationId, days * 3);
    final restaurants = await getRestaurants(location.locationId, days * 2);
    final hotels = await getHotels(location.locationId, 5);

    return TripPlanData(
      location: location,
      attractions: attractions,
      restaurants: restaurants,
      hotels: hotels,
    );
  }
}
