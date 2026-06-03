// ─────────────────────────────────────────────────────────────────────────────
// trip_wizard_state.dart  –  State model for the AI Trip Planner wizard
// ─────────────────────────────────────────────────────────────────────────────

import '../constants/egypt_data.dart';

enum WizardMode { idle, custom, smart }

enum WizardStep {
  destination, // Step 1
  origin,      // Step 2
  transport,   // Step 3
  days,        // Step 4
  budget,      // Step 5
  hotel,       // Step 6
  hotelDates,  // Step 7 (skipped when hotelNeeded == false)
  review,      // Step 8
}

enum BudgetLevel { low, medium, high }

extension BudgetLevelX on BudgetLevel {
  String get label {
    switch (this) {
      case BudgetLevel.low: return 'اقتصادية';
      case BudgetLevel.medium: return 'متوسطة';
      case BudgetLevel.high: return 'فاخرة';
    }
  }

  String get desc {
    switch (this) {
      case BudgetLevel.low: return '~٦٠٠ ج.م / يوم';
      case BudgetLevel.medium: return '~١٤٠٠ ج.م / يوم';
      case BudgetLevel.high: return '~٣٥٠٠ ج.م / يوم';
    }
  }

  String get emoji {
    switch (this) {
      case BudgetLevel.low: return '💵';
      case BudgetLevel.medium: return '💳';
      case BudgetLevel.high: return '💎';
    }
  }

  int get dailyRate {
    switch (this) {
      case BudgetLevel.low: return 600;
      case BudgetLevel.medium: return 1400;
      case BudgetLevel.high: return 3500;
    }
  }

  String get key {
    switch (this) {
      case BudgetLevel.low: return 'low';
      case BudgetLevel.medium: return 'medium';
      case BudgetLevel.high: return 'high';
    }
  }
}

class TripWizardState {
  final WizardMode mode;
  final WizardStep currentStep;
  final String destination;
  final String? destinationLocationId;
  final String startCity;
  final List<TransportOption> transportOptions;
  final TransportOption? selectedTransport;
  final int? days;
  final BudgetLevel? budget;
  final int? customBudget;
  final bool? hotelNeeded;
  final String? checkIn;
  final String? checkOut;
  final double? lat;
  final double? lng;
  final bool isGeneratingPlan;
  final bool isLoadingCityData;
  final String? errorMessage;

  // Results after confirming
  final TripPlanResult? tripPlan;
  final bool isGeneratingItinerary;

  // Selection
  final Set<String> selectedAttractions;
  final Set<String> selectedRestaurants;
  final Set<String> selectedHotels;

  // Final Generated Itinerary
  final GeneratedItinerary? generatedItinerary;
  final bool isSavingTrip;

  // Smart Search
  final bool isSearchingPlatform;
  final bool smartSearchAttempted;
  final String? smartSearchQuery;
  final List<dynamic> platformTrips;

  const TripWizardState({
    this.mode = WizardMode.idle,
    this.currentStep = WizardStep.destination,
    this.destination = '',
    this.destinationLocationId,
    this.startCity = '',
    this.transportOptions = const [],
    this.selectedTransport,
    this.days,
    this.budget,
    this.customBudget,
    this.hotelNeeded,
    this.checkIn,
    this.checkOut,
    this.lat,
    this.lng,
    this.isGeneratingPlan = false,
    this.isLoadingCityData = false,
    this.errorMessage,
    this.tripPlan,
    this.isGeneratingItinerary = false,
    this.selectedAttractions = const {},
    this.selectedRestaurants = const {},
    this.selectedHotels = const {},
    this.generatedItinerary,
    this.isSavingTrip = false,
    this.isSearchingPlatform = false,
    this.smartSearchAttempted = false,
    this.smartSearchQuery,
    this.platformTrips = const [],
  });

  int get estimatedTotal => calcEstimatedTotal(
        days: days ?? 3,
        budget: budget?.key,
        customBudget: customBudget,
        transportPrice: selectedTransport?.price,
      );

  WizardStep get nextStep {
    if (mode == WizardMode.smart) {
      if (currentStep == WizardStep.destination) return WizardStep.budget;
      if (currentStep == WizardStep.budget) return WizardStep.review;
      return WizardStep.review;
    }
    switch (currentStep) {
      case WizardStep.destination: return WizardStep.origin;
      case WizardStep.origin: return WizardStep.transport;
      case WizardStep.transport: return WizardStep.days;
      case WizardStep.days: return WizardStep.budget;
      case WizardStep.budget: return WizardStep.hotel;
      case WizardStep.hotel:
        return (hotelNeeded == false) ? WizardStep.review : WizardStep.hotelDates;
      case WizardStep.hotelDates: return WizardStep.review;
      case WizardStep.review: return WizardStep.review;
    }
  }

  WizardStep get prevStep {
    if (mode == WizardMode.smart) {
      if (currentStep == WizardStep.review) return WizardStep.budget;
      if (currentStep == WizardStep.budget) return WizardStep.destination;
      return WizardStep.destination;
    }
    switch (currentStep) {
      case WizardStep.destination: return WizardStep.destination;
      case WizardStep.origin: return WizardStep.destination;
      case WizardStep.transport: return WizardStep.origin;
      case WizardStep.days: return WizardStep.transport;
      case WizardStep.budget: return WizardStep.days;
      case WizardStep.hotel: return WizardStep.budget;
      case WizardStep.hotelDates: return WizardStep.hotel;
      case WizardStep.review:
        return (hotelNeeded == false) ? WizardStep.hotel : WizardStep.hotelDates;
    }
  }

  int get stepIndex {
    if (mode == WizardMode.smart) {
      if (currentStep == WizardStep.destination) return 0;
      if (currentStep == WizardStep.budget) return 1;
      if (currentStep == WizardStep.review) return 2;
    }
    return WizardStep.values.indexOf(currentStep);
  }

  // Total visible steps
  int get totalSteps => mode == WizardMode.smart ? 3 : (hotelNeeded == false ? 7 : 8);

  TripWizardState copyWith({
    WizardMode? mode,
    WizardStep? currentStep,
    String? destination,
    String? destinationLocationId,
    String? startCity,
    List<TransportOption>? transportOptions,
    TransportOption? selectedTransport,
    bool clearTransport = false,
    int? days,
    BudgetLevel? budget,
    int? customBudget,
    bool? hotelNeeded,
    String? checkIn,
    String? checkOut,
    double? lat,
    double? lng,
    bool? isGeneratingPlan,
    bool? isLoadingCityData,
    String? errorMessage,
    bool clearError = false,
    TripPlanResult? tripPlan,
    bool? isGeneratingItinerary,
    Set<String>? selectedAttractions,
    Set<String>? selectedRestaurants,
    Set<String>? selectedHotels,
    GeneratedItinerary? generatedItinerary,
    bool clearItinerary = false,
    bool? isSavingTrip,
    bool? isSearchingPlatform,
    bool? smartSearchAttempted,
    String? smartSearchQuery,
    List<dynamic>? platformTrips,
  }) {
    return TripWizardState(
      mode: mode ?? this.mode,
      currentStep: currentStep ?? this.currentStep,
      destination: destination ?? this.destination,
      destinationLocationId: destinationLocationId ?? this.destinationLocationId,
      startCity: startCity ?? this.startCity,
      transportOptions: transportOptions ?? this.transportOptions,
      selectedTransport: clearTransport ? null : (selectedTransport ?? this.selectedTransport),
      days: days ?? this.days,
      budget: budget ?? this.budget,
      customBudget: customBudget ?? this.customBudget,
      hotelNeeded: hotelNeeded ?? this.hotelNeeded,
      checkIn: checkIn ?? this.checkIn,
      checkOut: checkOut ?? this.checkOut,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      isGeneratingPlan: isGeneratingPlan ?? this.isGeneratingPlan,
      isLoadingCityData: isLoadingCityData ?? this.isLoadingCityData,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      tripPlan: tripPlan ?? this.tripPlan,
      isGeneratingItinerary: isGeneratingItinerary ?? this.isGeneratingItinerary,
      selectedAttractions: selectedAttractions ?? this.selectedAttractions,
      selectedRestaurants: selectedRestaurants ?? this.selectedRestaurants,
      selectedHotels: selectedHotels ?? this.selectedHotels,
      generatedItinerary: clearItinerary ? null : (generatedItinerary ?? this.generatedItinerary),
      isSavingTrip: isSavingTrip ?? this.isSavingTrip,
      isSearchingPlatform: isSearchingPlatform ?? this.isSearchingPlatform,
      smartSearchAttempted: smartSearchAttempted ?? this.smartSearchAttempted,
      smartSearchQuery: smartSearchQuery ?? this.smartSearchQuery,
      platformTrips: platformTrips ?? this.platformTrips,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Trip plan result model
// ─────────────────────────────────────────────────────────────────────────────

class TripPlace {
  final String id;
  final String name;
  final String? description;
  final String? imageUrl;
  final double? rating;
  final String? address;
  final double? lat;
  final double? lng;
  final String type; // 'attraction' | 'restaurant' | 'hotel'
  final String? price;
  final String? cuisine;

  const TripPlace({
    required this.id,
    required this.name,
    this.description,
    this.imageUrl,
    this.rating,
    this.address,
    this.lat,
    this.lng,
    required this.type,
    this.price,
    this.cuisine,
  });

  factory TripPlace.fromJson(Map<String, dynamic> json, String type) {
    final photo = json['photo'] as Map<String, dynamic>?;
    final images = photo?['images'] as Map<String, dynamic>?;
    final medium = images?['medium'] as Map<String, dynamic>?;
    final large = images?['large'] as Map<String, dynamic>?;
    final imageUrl = large?['url'] ?? medium?['url'];

    List<dynamic>? cuisineList = json['cuisine'] as List<dynamic>?;
    String? cuisineStr;
    if (cuisineList != null && cuisineList.isNotEmpty) {
      cuisineStr = cuisineList.first['name']?.toString();
    }

    return TripPlace(
      id: json['location_id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      imageUrl: imageUrl?.toString(),
      rating: double.tryParse(json['rating']?.toString() ?? ''),
      address: json['address']?.toString(),
      lat: double.tryParse(json['latitude']?.toString() ?? ''),
      lng: double.tryParse(json['longitude']?.toString() ?? ''),
      type: type,
      price: json['price']?.toString(),
      cuisine: cuisineStr,
    );
  }
}

class TripPlanResult {
  final String locationId;
  final String cityName;
  final List<TripPlace> attractions;
  final List<TripPlace> restaurants;
  final List<TripPlace> hotels;

  const TripPlanResult({
    required this.locationId,
    required this.cityName,
    required this.attractions,
    required this.restaurants,
    required this.hotels,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Generated Itinerary Models
// ─────────────────────────────────────────────────────────────────────────────

class ItineraryActivity {
  final String name;
  final String time;
  final String endTime;
  final int duration;
  final String note;
  final String type; // 'attraction' or 'restaurant'
  final double? lat;
  final double? lng;

  const ItineraryActivity({
    required this.name,
    required this.time,
    required this.endTime,
    required this.duration,
    required this.note,
    required this.type,
    this.lat,
    this.lng,
  });

  factory ItineraryActivity.fromJson(Map<String, dynamic> json) {
    return ItineraryActivity(
      name: json['name']?.toString() ?? '',
      time: json['time']?.toString() ?? '',
      endTime: json['endTime']?.toString() ?? '',
      duration: json['duration'] is int ? json['duration'] : int.tryParse(json['duration']?.toString() ?? '0') ?? 0,
      note: json['note']?.toString() ?? '',
      type: json['type']?.toString() ?? 'attraction',
      lat: json['coordinates']?['lat'] != null ? double.tryParse(json['coordinates']['lat'].toString()) : null,
      lng: json['coordinates']?['lng'] != null ? double.tryParse(json['coordinates']['lng'].toString()) : null,
    );
  }
}

class ItineraryDay {
  final int dayNum;
  final String title;
  final String area;
  final String color;
  final List<ItineraryActivity> activities;

  const ItineraryDay({
    required this.dayNum,
    required this.title,
    required this.area,
    required this.color,
    required this.activities,
  });

  factory ItineraryDay.fromJson(Map<String, dynamic> json) {
    return ItineraryDay(
      dayNum: json['dayNum'] is int ? json['dayNum'] : int.tryParse(json['dayNum']?.toString() ?? '1') ?? 1,
      title: json['title']?.toString() ?? '',
      area: json['area']?.toString() ?? '',
      color: json['color']?.toString() ?? '#6366f1',
      activities: (json['activities'] as List<dynamic>?)
              ?.map((e) => ItineraryActivity.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class GeneratedItinerary {
  final String title;
  final String description;
  final List<ItineraryDay> days;

  const GeneratedItinerary({
    required this.title,
    required this.description,
    required this.days,
  });

  factory GeneratedItinerary.fromJson(Map<String, dynamic> json) {
    return GeneratedItinerary(
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      days: (json['days'] as List<dynamic>?)
              ?.map((e) => ItineraryDay.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
