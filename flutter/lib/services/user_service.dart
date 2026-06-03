import 'package:dio/dio.dart';
import '../models/user.dart';
import '../models/trip.dart';
import '../models/notification.dart';
import 'api_service.dart';
import '../core/exceptions.dart';

class UserService {
  final ApiService _apiService;

  UserService(this._apiService);

  Future<User> getUserById(String id) async {
    try {
      final path = id == 'me' ? '/users/me' : '/users/$id';
      final response = await _apiService.get(path);
      return User.fromJson(response.data);
    } on DioException catch (e) {
      throw handleDioError(e);
    } catch (e) {
      throw ServerException('خطأ في تحميل بيانات المستخدم');
    }
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

  Future<List<Trip>> getUserLovedTrips(String clerkId) async {
    final response = await _apiService.get('/users/$clerkId/loves');
    final List items = response.data is List ? response.data : (response.data['items'] ?? []);
    return items.map((e) => Trip.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Trip>> getUserAiTrips() async {
    final response = await _apiService.get('/users/me/ai-trips');
    final List items = response.data is List ? response.data : (response.data['items'] ?? []);
    return items.map((e) => Trip.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<({bool following, int followers})> toggleFollow(String userId) async {
    final response = await _apiService.post('/users/$userId/follow', data: {});
    final data = response.data as Map<String, dynamic>;
    return (
      following: data['following'] == true,
      followers: (data['followers'] as num?)?.toInt() ?? 0,
    );
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

  /// Combined trips + users search (same as web /api/search).
  Future<({List<Trip> trips, List<User> users})> searchDiscover(
    String query, {
    int limit = 50,
    String sort = 'recent',
  }) async {
    final response = await _apiService.get('/search', queryParameters: {
      'q': query,
      'limit': limit,
      'sort': sort == 'trending' ? 'likes' : 'recent',
    });
    final data = response.data as Map<String, dynamic>;
    final tripItems = (data['trips'] as List?) ?? [];
    final userItems = (data['users'] as List?) ?? [];
    return (
      trips: tripItems.map((e) => Trip.fromJson(e as Map<String, dynamic>)).toList(),
      users: userItems.map((e) => User.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  Future<List<User>> getFollowingUsers(String clerkId) async {
    final response = await _apiService.get('/users/$clerkId/following');
    final dynamic data = response.data;
    final List items = data is List ? data : (data['users'] as List? ?? []);
    return items.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<User>> getFollowersUsers(String clerkId) async {
    final response = await _apiService.get('/users/$clerkId/followers');
    final dynamic data = response.data;
    final List items = data is List ? data : (data['users'] as List? ?? []);
    return items.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Returns direct conversation document; use `_id` for chat route.
  Future<Map<String, dynamic>> startDirectChat(String targetUserId) async {
    final response = await _apiService.post('/direct-chat/start', data: {
      'targetUserId': targetUserId,
    });
    return response.data as Map<String, dynamic>;
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
  Future<List<AppNotification>> getNotifications() async {
    final response = await _apiService.get('/notifications');
    final List items = response.data is List ? response.data : (response.data['items'] ?? []);
    return items.map((e) => AppNotification.fromJson(e)).toList();
  }

  Future<void> markNotificationAsRead(String id) async {
    await _apiService.post('/notifications/$id/read', data: {});
  }

  Future<void> markAllNotificationsAsRead() async {
    await _apiService.post('/notifications/read-all', data: {});
  }
}


