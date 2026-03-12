import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/trip.dart';

class TripDraft {
  String title;
  String destination;
  String city;
  String duration;
  String budget;
  String season;
  String description;
  double rating;
  dynamic coverImage; // File or String
  String coverImageUrl;
  List<DraftActivity> activities;
  List<DraftDay> days;
  List<DraftFood> foodPlaces;
  List<DraftHotel> hotels;
  List<Map<String, String>> taggedUsers;

  TripDraft({
    this.title = '',
    this.destination = '',
    this.city = '',
    this.duration = '',
    this.budget = '',
    this.season = 'winter',
    this.description = '',
    this.rating = 4.5,
    this.coverImage,
    this.coverImageUrl = '',
    this.activities = const [],
    this.days = const [],
    this.foodPlaces = const [],
    this.hotels = const [],
    this.taggedUsers = const [],
  });

  TripDraft copyWith({
    String? title,
    String? destination,
    String? city,
    String? duration,
    String? budget,
    String? season,
    String? description,
    double? rating,
    dynamic coverImage,
    String? coverImageUrl,
    List<DraftActivity>? activities,
    List<DraftDay>? days,
    List<DraftFood>? foodPlaces,
    List<DraftHotel>? hotels,
    List<Map<String, String>>? taggedUsers,
  }) {
    return TripDraft(
      title: title ?? this.title,
      destination: destination ?? this.destination,
      city: city ?? this.city,
      duration: duration ?? this.duration,
      budget: budget ?? this.budget,
      season: season ?? this.season,
      description: description ?? this.description,
      rating: rating ?? this.rating,
      coverImage: coverImage ?? this.coverImage,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      activities: activities ?? this.activities,
      days: days ?? this.days,
      foodPlaces: foodPlaces ?? this.foodPlaces,
      hotels: hotels ?? this.hotels,
      taggedUsers: taggedUsers ?? this.taggedUsers,
    );
  }
}

class DraftActivity {
  String name;
  String description;
  double lat;
  double lng;
  List<dynamic> images; // File or String
  List<dynamic> videos; // File or String

  DraftActivity({
    this.name = '',
    this.description = '',
    this.lat = 0.0,
    this.lng = 0.0,
    this.images = const [],
    this.videos = const [],
  });
}

class DraftDay {
  String title;
  List<int> activityIndices;

  DraftDay({this.title = '', this.activityIndices = const []});
}

class DraftFood {
  String name;
  String description;
  String location;
  String type;
  dynamic image;

  DraftFood({
    this.name = '',
    this.description = '',
    this.location = '',
    this.type = 'restaurant',
    this.image,
  });
}

class DraftHotel {
  String name;
  String description;
  String location;
  String bookingUrl;
  dynamic image;

  DraftHotel({
    this.name = '',
    this.description = '',
    this.location = '',
    this.bookingUrl = '',
    this.image,
  });
}

class TripDraftNotifier extends StateNotifier<TripDraft> {
  TripDraftNotifier() : super(TripDraft());

  void updateBasicInfo({
    String? title,
    String? destination,
    String? city,
    String? duration,
    String? budget,
    String? season,
    String? description,
    dynamic coverImage,
    String? coverImageUrl,
  }) {
    state = state.copyWith(
      title: title,
      destination: destination,
      city: city,
      duration: duration,
      budget: budget,
      season: season,
      description: description,
      coverImage: coverImage,
      coverImageUrl: coverImageUrl,
    );
  }

  void setActivities(List<DraftActivity> activities) {
    state = state.copyWith(activities: activities);
  }

  void setDays(List<DraftDay> days) {
    state = state.copyWith(days: days);
  }

  void addFoodPlace(DraftFood food) {
    state = state.copyWith(foodPlaces: [...state.foodPlaces, food]);
  }

  void addHotel(DraftHotel hotel) {
    state = state.copyWith(hotels: [...state.hotels, hotel]);
  }

  void reset() {
    state = TripDraft();
  }
}

final tripDraftProvider = StateNotifierProvider<TripDraftNotifier, TripDraft>((ref) => TripDraftNotifier());

final tripCreationTypeProvider = StateProvider<dynamic>((ref) => null);
