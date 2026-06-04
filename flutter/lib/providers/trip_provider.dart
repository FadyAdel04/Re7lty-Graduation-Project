import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/trip.dart';
import '../models/corporate_trip.dart';
import '../services/trip_service.dart';
import '../services/api_service.dart';

@immutable
class TripFilter {
  final String? query;
  final String? city;
  final String? season;
  final String? authorId;
  final String? type; // 'company', 'traveler', or null for all
  final String sort;
  final String? postType; // 'detailed', 'quick', 'ask'
  final bool followingOnly;
  final bool suggestedOnly;
  final bool myTripsOnly;
  final int page;
  final int limit;

  const TripFilter({
    this.query,
    this.city,
    this.season,
    this.authorId,
    this.type,
    this.sort = 'recent',
    this.postType,
    this.followingOnly = false,
    this.suggestedOnly = false,
    this.myTripsOnly = false,
    this.page = 1,
    this.limit = 20,
  });

  TripFilter copyWith({
    String? query,
    String? city,
    String? season,
    String? authorId,
    String? type,
    String? sort,
    String? postType,
    bool? followingOnly,
    bool? suggestedOnly,
    bool? myTripsOnly,
    int? page,
    int? limit,
    bool clearPostType = false,
    bool clearType = false,
  }) {
    return TripFilter(
      query: query ?? this.query,
      city: city ?? this.city,
      season: season ?? this.season,
      authorId: authorId ?? this.authorId,
      type: clearType ? null : (type ?? this.type),
      sort: sort ?? this.sort,
      postType: clearPostType ? null : (postType ?? this.postType),
      followingOnly: followingOnly ?? this.followingOnly,
      suggestedOnly: suggestedOnly ?? this.suggestedOnly,
      myTripsOnly: myTripsOnly ?? this.myTripsOnly,
      page: page ?? this.page,
      limit: limit ?? this.limit,
    );
  }

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
          postType == other.postType &&
          followingOnly == other.followingOnly &&
          suggestedOnly == other.suggestedOnly &&
          myTripsOnly == other.myTripsOnly &&
          page == other.page &&
          limit == other.limit;

  @override
  int get hashCode => Object.hash(
        query,
        city,
        season,
        authorId,
        type,
        sort,
        postType,
        followingOnly,
        suggestedOnly,
        myTripsOnly,
        page,
        limit,
      );
}

class FeedState {
  final List<Trip> trips;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final int page;
  final String? errorMessage;

  FeedState({
    this.trips = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.page = 1,
    this.errorMessage,
  });

  FeedState copyWith({
    List<Trip>? trips,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    int? page,
    String? errorMessage,
  }) {
    return FeedState(
      trips: trips ?? this.trips,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      page: page ?? this.page,
      errorMessage: errorMessage,
    );
  }
}

class FeedNotifier extends FamilyNotifier<FeedState, TripFilter> {
  static const int limit = 10;

  @override
  FeedState build(TripFilter arg) {
    // Initial fetch
    Future.microtask(() => refresh());
    return FeedState(isLoading: true);
  }

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, errorMessage: null, page: 1, hasMore: true);
    try {
      final tripService = ref.read(tripServiceProvider);
      
      final trips = await tripService.getTrips(
        query: arg.query,
        city: arg.city,
        season: arg.season,
        authorId: arg.authorId,
        type: arg.type,
        sort: arg.suggestedOnly ? 'likes' : arg.sort,
        page: 1,
        limit: limit,
      );

      // Local filtering if backend doesn't support
      var filteredTrips = trips;
      if (arg.postType != null) {
        filteredTrips = filteredTrips.where((t) => t.postType == arg.postType).toList();
      }
      if (arg.followingOnly) {
        filteredTrips = filteredTrips.where((t) => t.viewerFollowsAuthor).toList();
      }

      state = state.copyWith(
        trips: filteredTrips,
        isLoading: false,
        hasMore: trips.length >= limit,
        page: 1,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  void prependTrip(Trip trip) {
    if (state.trips.any((t) => t.id == trip.id)) return;
    state = state.copyWith(trips: [trip, ...state.trips]);
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);
    final nextPage = state.page + 1;

    try {
      final tripService = ref.read(tripServiceProvider);
      final trips = await tripService.getTrips(
        query: arg.query,
        city: arg.city,
        season: arg.season,
        authorId: arg.authorId,
        type: arg.type,
        sort: arg.suggestedOnly ? 'likes' : arg.sort,
        page: nextPage,
        limit: limit,
      );

      var filteredTrips = trips;
      if (arg.postType != null) {
        filteredTrips = filteredTrips.where((t) => t.postType == arg.postType).toList();
      }
      if (arg.followingOnly) {
        filteredTrips = filteredTrips.where((t) => t.viewerFollowsAuthor).toList();
      }

      state = state.copyWith(
        trips: [...state.trips, ...filteredTrips],
        isLoadingMore: false,
        hasMore: trips.length >= limit,
        page: nextPage,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }
}

final feedProvider = NotifierProvider.family<FeedNotifier, FeedState, TripFilter>(() {
  return FeedNotifier();
});

final tripServiceProvider = Provider((ref) => TripService(ref.watch(apiServiceProvider)));

// Restore tripsProvider for backward compatibility in other pages
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

// Restore corporateTripsProvider
final corporateTripsProvider = FutureProvider.family<List<CorporateTrip>, String?>((ref, destination) {
  return ref.read(tripServiceProvider).getCorporateTrips(destination: destination);
});

final tripDetailProvider = FutureProvider.family<Trip, String>((ref, id) async {
  final tripService = ref.watch(tripServiceProvider);
  return tripService.getTripById(id);
});
