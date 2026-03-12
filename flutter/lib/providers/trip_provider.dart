import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/trip.dart';
import '../services/trip_service.dart';

final tripServiceProvider = Provider((ref) => TripService());

final tripsProvider = FutureProvider.family<List<Trip>, Map<String, dynamic>>((ref, params) async {
  final tripService = ref.watch(tripServiceProvider);
  return tripService.getTrips(
    query: params['q'],
    city: params['city'],
    season: params['season'],
    sort: params['sort'] ?? 'recent',
    page: params['page'] ?? 1,
    limit: params['limit'] ?? 20,
  );
});

final tripDetailProvider = FutureProvider.family<Trip, String>((ref, id) async {
  final tripService = ref.watch(tripServiceProvider);
  return tripService.getTripById(id);
});
