import '../models/user.dart';
import '../models/trip.dart';
import 'api_service.dart';

class UserService {
  final ApiService _apiService;

  UserService(this._apiService);

  Future<User> getUserById(String id) async {
    // If id is 'me', we can either use a token or for now use a default ID for demo
    final path = id == 'me' ? '/users/me' : '/users/$id';
    final response = await _apiService.get(path);
    return User.fromJson(response.data);
  }

  Future<void> toggleFollow(String userId) async {
    await _apiService.post('/users/$userId/follow', data: {});
  }

  Future<List<Trip>> getUserTrips(String userId) async {
    final path = userId == 'me' ? '/users/me/trips' : '/users/$userId/trips';
    final response = await _apiService.get(path);
    final List items = response.data is List ? response.data : (response.data['items'] ?? []);
    return items.map((e) => Trip.fromJson(e)).toList();
  }

  Future<List<Trip>> getUserSavedTrips() async {
    final response = await _apiService.get('/users/me/saves');
    final List items = response.data is List ? response.data : (response.data['items'] ?? []);
    return items.map((e) => Trip.fromJson(e)).toList();
  }

  Future<User> updateProfile(Map<String, dynamic> data) async {
    final response = await _apiService.patch('/users/me', data: data);
    return User.fromJson(response.data);
  }

  Future<List<User>> searchUsers(String query, {String? type}) async {
    final response = await _apiService.get('/users/search', queryParameters: {
      'q': query,
      if (type != null) 'type': type,
    });
    final List items = response.data is List ? response.data : (response.data['items'] ?? []);
    return items.map((e) => User.fromJson(e)).toList();
  }
  Future<bool> completeOnboarding(String role) async {
    try {
      final response = await _apiService.post('/users/onboarding', data: {'role': role});
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> submitCompanySubmission(Map<String, dynamic> data) async {
    try {
      final response = await _apiService.post('/submissions', data: data);
      return response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }
}


