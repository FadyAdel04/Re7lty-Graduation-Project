import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/trip.dart';
import '../services/trip_service.dart';
import '../services/api_service.dart';
import '../models/corporate_trip.dart';

final corporateTripsProvider = FutureProvider.family<List<CorporateTrip>, String?>((ref, destination) {
  return ref.read(tripServiceProvider).getCorporateTrips(destination: destination);
});

@immutable
class TripFilter {
  final String? query;
  final String? city;
  final String? season;
  final String? authorId;
  final String? type; // 'company', 'traveler', or null for all
  final String sort;
  final int page;
  final int limit;

  const TripFilter({
    this.query,
    this.city,
    this.season,
    this.authorId,
    this.type,
    this.sort = 'recent',
    this.page = 1,
    this.limit = 20,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TripFilter &&
          runtimeType == other.runtimeType &&
          query == other.query &&
          city == other.city &&
          season == other.season &&
          authorId == other.authorId &&
          type == other.type &&
          sort == other.sort &&
          page == other.page &&
          limit == other.limit;

  @override
  int get hashCode => Object.hash(query, city, season, authorId, type, sort, page, limit);
}

final tripServiceProvider = Provider((ref) => TripService(ref.watch(apiServiceProvider)));

final tripsProvider = FutureProvider.family<List<Trip>, TripFilter>((ref, filter) async {
  final tripService = ref.watch(tripServiceProvider);
  return tripService.getTrips(
    query: filter.query,
    city: filter.city,
    season: filter.season,
    authorId: filter.authorId,
    type: filter.type,
    sort: filter.sort,
    page: filter.page,
    limit: filter.limit,
  );
});

final tripDetailProvider = FutureProvider.family<Trip, String>((ref, id) async {
  final tripService = ref.watch(tripServiceProvider);
  return tripService.getTripById(id);
});


