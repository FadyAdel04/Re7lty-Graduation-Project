import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/trip.dart';
import '../models/user.dart';
import '../services/trip_service.dart';
import '../services/user_service.dart';
import 'api_provider.dart';
import 'trip_provider.dart';

@immutable
class DiscoverParams {
  final String query;
  final String filter;

  const DiscoverParams({this.query = '', this.filter = 'all'});

  String get sort => filter == 'trending' ? 'likes' : 'recent';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DiscoverParams && query == other.query && filter == other.filter;

  @override
  int get hashCode => Object.hash(query, filter);
}

class DiscoverData {
  final List<Trip> trips;
  final List<User> users;

  const DiscoverData({required this.trips, required this.users});
}

final discoverDataProvider = FutureProvider.family<DiscoverData, DiscoverParams>((ref, params) async {
  final tripService = ref.read(tripServiceProvider);
  final userService = ref.read(userServiceProvider);

  if (params.query.trim().isNotEmpty) {
    final result = await userService.searchDiscover(
      params.query.trim(),
      sort: params.filter == 'trending' ? 'trending' : 'recent',
    );
    return DiscoverData(trips: result.trips, users: result.users);
  }

  final trips = await tripService.getTrips(sort: params.sort, limit: 20);
  final ownerIds = trips
      .map((t) => t.ownerId)
      .whereType<String>()
      .where((id) => id.isNotEmpty)
      .toSet()
      .take(5)
      .toList();

  final users = <User>[];
  for (final id in ownerIds) {
    try {
      users.add(await userService.getUserById(id));
    } catch (_) {}
  }

  return DiscoverData(trips: trips, users: users);
});

final discoverFollowingIdsProvider =
    StateNotifierProvider<DiscoverFollowingIdsNotifier, Set<String>>((ref) {
  return DiscoverFollowingIdsNotifier(ref);
});

class DiscoverFollowingIdsNotifier extends StateNotifier<Set<String>> {
  DiscoverFollowingIdsNotifier(this._ref) : super({});

  final Ref _ref;

  Future<void> load(String? clerkId) async {
    if (clerkId == null || clerkId.isEmpty) {
      state = {};
      return;
    }
    try {
      final users = await _ref.read(userServiceProvider).getFollowingUsers(clerkId);
      state = users.map((u) => u.clerkId.isNotEmpty ? u.clerkId : u.id).where((id) => id.isNotEmpty).toSet();
    } catch (_) {
      state = {};
    }
  }

  void setFollowing(String userId, bool following) {
    final next = Set<String>.from(state);
    if (following) {
      next.add(userId);
    } else {
      next.remove(userId);
    }
    state = next;
  }
}
