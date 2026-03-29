import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/trip.dart';
import '../services/trip_service.dart';

@immutable
class TripFilter {
  final String? query;
  final String? city;
  final String? season;
  final String? authorId;
  final String sort;
  final int page;
  final int limit;

  const TripFilter({
    this.query,
    this.city,
    this.season,
    this.authorId,
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
          sort == other.sort &&
          page == other.page &&
          limit == other.limit;

  @override
  int get hashCode => Object.hash(query, city, season, authorId, sort, page, limit);
}

final tripServiceProvider = Provider((ref) => TripService());

final tripsProvider = FutureProvider.family<List<Trip>, TripFilter>((ref, filter) async {
  final tripService = ref.watch(tripServiceProvider);
  return tripService.getTrips(
    query: filter.query,
    city: filter.city,
    season: filter.season,
    authorId: filter.authorId,
    sort: filter.sort,
    page: filter.page,
    limit: filter.limit,
  );
});

final tripDetailProvider = FutureProvider.family<Trip, String>((ref, id) async {
  final tripService = ref.watch(tripServiceProvider);
  return tripService.getTripById(id);
});
