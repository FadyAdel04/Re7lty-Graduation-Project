import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';

class CorporateTripDraft {
  final String title;
  final String destination;
  final String meetingLocation;
  final String price;
  final DateTime? startDate;
  final DateTime? endDate;
  final String season;
  final String difficulty;
  final int maxPassengers;
  final double defaultRating;
  final List<String> transportOptions;

  final String description;
  final List<String> included;
  final List<String> notIncluded;

  final List<CorporateDraftActivity> activities;
  final List<CorporateDraftHotel> hotels;
  final List<CorporateDraftDay> days;

  final List<File> generalImages;
  final List<File> transportImages;
  final List<String> existingGeneralImageUrls;
  final List<String> existingTransportImageUrls;

  final String bookingWhatsapp;
  final String bookingPhone;
  final String bookingWebsite;
  final bool isPublished;

  const CorporateTripDraft({
    this.title = '',
    this.destination = '',
    this.meetingLocation = '',
    this.price = '',
    this.startDate,
    this.endDate,
    this.season = 'winter',
    this.difficulty = 'medium',
    this.maxPassengers = 10,
    this.defaultRating = 4.5,
    this.transportOptions = const [],
    this.description = '',
    this.included = const [],
    this.notIncluded = const [],
    this.activities = const [],
    this.hotels = const [],
    this.days = const [],
    this.generalImages = const [],
    this.transportImages = const [],
    this.existingGeneralImageUrls = const [],
    this.existingTransportImageUrls = const [],
    this.bookingWhatsapp = '',
    this.bookingPhone = '',
    this.bookingWebsite = '',
    this.isPublished = true,
  });

  CorporateTripDraft copyWith({
    String? title,
    String? destination,
    String? meetingLocation,
    String? price,
    DateTime? startDate,
    DateTime? endDate,
    String? season,
    String? difficulty,
    int? maxPassengers,
    double? defaultRating,
    List<String>? transportOptions,
    String? description,
    List<String>? included,
    List<String>? notIncluded,
    List<CorporateDraftActivity>? activities,
    List<CorporateDraftHotel>? hotels,
    List<CorporateDraftDay>? days,
    List<File>? generalImages,
    List<File>? transportImages,
    List<String>? existingGeneralImageUrls,
    List<String>? existingTransportImageUrls,
    String? bookingWhatsapp,
    String? bookingPhone,
    String? bookingWebsite,
    bool? isPublished,
  }) {
    return CorporateTripDraft(
      title: title ?? this.title,
      destination: destination ?? this.destination,
      meetingLocation: meetingLocation ?? this.meetingLocation,
      price: price ?? this.price,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      season: season ?? this.season,
      difficulty: difficulty ?? this.difficulty,
      maxPassengers: maxPassengers ?? this.maxPassengers,
      defaultRating: defaultRating ?? this.defaultRating,
      transportOptions: transportOptions ?? this.transportOptions,
      description: description ?? this.description,
      included: included ?? this.included,
      notIncluded: notIncluded ?? this.notIncluded,
      activities: activities ?? this.activities,
      hotels: hotels ?? this.hotels,
      days: days ?? this.days,
      generalImages: generalImages ?? this.generalImages,
      transportImages: transportImages ?? this.transportImages,
      existingGeneralImageUrls: existingGeneralImageUrls ?? this.existingGeneralImageUrls,
      existingTransportImageUrls: existingTransportImageUrls ?? this.existingTransportImageUrls,
      bookingWhatsapp: bookingWhatsapp ?? this.bookingWhatsapp,
      bookingPhone: bookingPhone ?? this.bookingPhone,
      bookingWebsite: bookingWebsite ?? this.bookingWebsite,
      isPublished: isPublished ?? this.isPublished,
    );
  }
}

class CorporateDraftActivity {
  final String name;
  final double? lat;
  final double? lng;

  CorporateDraftActivity({required this.name, this.lat, this.lng});
}

class CorporateDraftHotel {
  final String name;
  final String details;
  final File? image;
  final String? imageUrl;

  CorporateDraftHotel({
    required this.name,
    required this.details,
    this.image,
    this.imageUrl,
  });
}

class CorporateDraftDay {
  final String title;
  final String details;

  CorporateDraftDay({required this.title, required this.details});
}

class CorporateTripDraftNotifier extends StateNotifier<CorporateTripDraft> {
  CorporateTripDraftNotifier() : super(const CorporateTripDraft());

  void updateBasicInfo({
    String? title,
    String? destination,
    String? meetingLocation,
    String? price,
    DateTime? startDate,
    DateTime? endDate,
    String? season,
    String? difficulty,
    int? maxPassengers,
    double? defaultRating,
    List<String>? transportOptions,
  }) {
    state = state.copyWith(
      title: title,
      destination: destination,
      meetingLocation: meetingLocation,
      price: price,
      startDate: startDate,
      endDate: endDate,
      season: season,
      difficulty: difficulty,
      maxPassengers: maxPassengers,
      defaultRating: defaultRating,
      transportOptions: transportOptions,
    );
  }

  void updateDetails({
    String? description,
    List<String>? included,
    List<String>? notIncluded,
  }) {
    state = state.copyWith(
      description: description,
      included: included,
      notIncluded: notIncluded,
    );
  }

  void updateActivities(List<CorporateDraftActivity> activities) {
    state = state.copyWith(activities: activities);
  }

  void updateHotels(List<CorporateDraftHotel> hotels) {
    state = state.copyWith(hotels: hotels);
  }

  void updateDays(List<CorporateDraftDay> days) {
    state = state.copyWith(days: days);
  }

  void updateMedia({
    List<File>? generalImages,
    List<File>? transportImages,
    List<String>? existingGeneralImageUrls,
    List<String>? existingTransportImageUrls,
  }) {
    state = state.copyWith(
      generalImages: generalImages,
      transportImages: transportImages,
      existingGeneralImageUrls: existingGeneralImageUrls,
      existingTransportImageUrls: existingTransportImageUrls,
    );
  }

  void updateSettings({
    String? bookingWhatsapp,
    String? bookingPhone,
    String? bookingWebsite,
    bool? isPublished,
  }) {
    state = state.copyWith(
      bookingWhatsapp: bookingWhatsapp,
      bookingPhone: bookingPhone,
      bookingWebsite: bookingWebsite,
      isPublished: isPublished,
    );
  }

  void loadFromMap(Map<String, dynamic> trip) {
    String mapDifficulty(String? diff) {
      switch (diff) {
        case 'سهل':
          return 'easy';
        case 'متوسط':
          return 'medium';
        case 'صعب':
          return 'hard';
        case 'easy':
        case 'medium':
        case 'hard':
          return diff!;
        default:
          return 'medium';
      }
    }

    String mapSeason(String? season) {
      switch (season) {
        case 'شتاء':
          return 'winter';
        case 'صيف':
          return 'summer';
        case 'ربيع':
          return 'spring';
        case 'خريف':
          return 'fall';
        default:
          return season ?? 'winter';
      }
    }

    List<String> parseStringList(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) {
        return raw.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
      }
      return [];
    }

    updateBasicInfo(
      title: trip['title']?.toString() ?? '',
      destination: trip['destination']?.toString() ?? '',
      meetingLocation: trip['meetingLocation']?.toString() ?? '',
      price: trip['price']?.toString() ?? '',
      startDate: trip['startDate'] != null ? DateTime.tryParse(trip['startDate'].toString()) : null,
      endDate: trip['endDate'] != null ? DateTime.tryParse(trip['endDate'].toString()) : null,
      season: mapSeason(trip['season'] as String?),
      difficulty: mapDifficulty(trip['difficulty'] as String?),
      maxPassengers: (trip['maxGroupSize'] ?? trip['availableSeats'] ?? 10) is int
          ? (trip['maxGroupSize'] ?? trip['availableSeats'] ?? 10) as int
          : int.tryParse((trip['maxGroupSize'] ?? trip['availableSeats'] ?? '10').toString()) ?? 10,
      defaultRating: double.tryParse(trip['rating']?.toString() ?? '4.5') ?? 4.5,
    );

    updateDetails(
      description: trip['fullDescription']?.toString() ?? trip['shortDescription']?.toString() ?? '',
      included: parseStringList(trip['includedServices']),
      notIncluded: parseStringList(trip['excludedServices']),
    );

    final bookingMethod = trip['bookingMethod'];
    if (bookingMethod is Map) {
      updateSettings(
        bookingWhatsapp: bookingMethod['whatsapp'] == true ? 'enabled' : '',
        bookingPhone: bookingMethod['phone'] == true ? 'enabled' : '',
        bookingWebsite: trip['bookingWebsite']?.toString() ?? '',
        isPublished: trip['isActive'] != false,
      );
    } else {
      updateSettings(isPublished: trip['isActive'] != false);
    }

    final itineraryRaw = trip['itinerary'];
    if (itineraryRaw is List && itineraryRaw.isNotEmpty) {
      final days = <CorporateDraftDay>[];
      for (final item in itineraryRaw) {
        if (item is! Map) continue;
        days.add(CorporateDraftDay(
          title: item['title']?.toString() ?? '',
          details: item['description']?.toString() ?? '',
        ));
      }
      if (days.isNotEmpty) updateDays(days);
    }

    final stayRaw = trip['stayDetails'];
    if (stayRaw is List && stayRaw.isNotEmpty) {
      final hotels = <CorporateDraftHotel>[];
      for (final item in stayRaw) {
        if (item is! Map) continue;
        final images = parseStringList(item['images']);
        hotels.add(CorporateDraftHotel(
          name: item['name']?.toString() ?? '',
          details: item['details']?.toString() ?? '',
          imageUrl: images.isNotEmpty ? images.first : null,
        ));
      }
      if (hotels.isNotEmpty) updateHotels(hotels);
    }

    updateMedia(
      existingGeneralImageUrls: parseStringList(trip['images']),
      existingTransportImageUrls: parseStringList(trip['transportationImages']),
      generalImages: const [],
      transportImages: const [],
    );
  }

  void reset() {
    state = const CorporateTripDraft();
  }
}

final corporateTripDraftProvider =
    StateNotifierProvider<CorporateTripDraftNotifier, CorporateTripDraft>((ref) {
  return CorporateTripDraftNotifier();
});
