import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/user.dart';
import '../services/trip_service.dart';
import '../services/user_service.dart';
import 'api_provider.dart';
import 'trip_provider.dart';

/// Suggested travelers when search query is empty (from recent trip authors).
final suggestedUsersProvider = FutureProvider<List<User>>((ref) async {
  final tripService = ref.read(tripServiceProvider);
  final userService = ref.read(userServiceProvider);

  final trips = await tripService.getTrips(sort: 'recent', limit: 20);
  final ownerIds = trips
      .map((t) => t.ownerId)
      .whereType<String>()
      .where((id) => id.isNotEmpty)
      .toSet()
      .take(12)
      .toList();

  final users = <User>[];
  for (final id in ownerIds) {
    try {
      users.add(await userService.getUserById(id));
    } catch (_) {}
  }
  return users;
});
