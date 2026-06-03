// ─────────────────────────────────────────────────────────────────────────────
// trip_wizard_provider.dart  –  Riverpod StateNotifier for the 8-step wizard
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/trip_wizard_state.dart';
import '../models/corporate_trip.dart';
import '../constants/egypt_data.dart';
import '../services/trip_plan_service.dart';
import '../services/trip_service.dart';
import '../services/itinerary_engine.dart';
import 'trip_provider.dart';

final tripPlanServiceProvider = Provider((ref) => TripPlanService());

final tripWizardProvider =
    StateNotifierProvider<TripWizardNotifier, TripWizardState>(
  (ref) => TripWizardNotifier(
    ref.read(tripPlanServiceProvider),
    ref.read(tripServiceProvider),
  ),
);

class TripWizardNotifier extends StateNotifier<TripWizardState> {
  final TripPlanService _service;
  final TripService _tripService;

  TripWizardNotifier(this._service, this._tripService) : super(const TripWizardState());

  void setMode(WizardMode mode) {
    state = state.copyWith(mode: mode, currentStep: WizardStep.destination);
  }

  List<CorporateTrip> _filterTripsByDestination(List<CorporateTrip> trips, String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return trips;

    return trips.where((t) {
      final dest = t.destination.toLowerCase();
      final title = t.title.toLowerCase();
      final desc = t.shortDescription.toLowerCase();
      if (dest.contains(q) || title.contains(q) || desc.contains(q)) return true;
      if (q.contains(dest) && dest.isNotEmpty) return true;

      final words = q.split(RegExp(r'\s+')).where((w) => w.length >= 2);
      return words.any((w) => dest.contains(w) || title.contains(w) || desc.contains(w));
    }).toList();
  }

  List<Map<String, dynamic>> _mapCorporateTrips(List<CorporateTrip> trips) {
    return trips.map((t) {
      final daysMatch = RegExp(r'(\d+)').firstMatch(t.duration);
      return {
        'title': t.title,
        'budget': '${t.price} ج.م',
        'days': daysMatch != null ? int.tryParse(daysMatch.group(1)!) ?? 3 : 3,
        'image': t.images.isNotEmpty
            ? t.images.first
            : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80',
        'rating': t.rating,
        'slug': t.slug,
        'id': t.id,
      };
    }).toList();
  }

  Future<void> searchPlatformTrips() async {
    final dest = state.destination.trim();
    if (dest.isEmpty) {
      state = state.copyWith(errorMessage: 'اختر الوجهة أولاً');
      return;
    }

    state = state.copyWith(
      isSearchingPlatform: true,
      clearError: true,
      platformTrips: [],
      smartSearchAttempted: false,
    );

    try {
      var trips = await _tripService.getCorporateTrips(destination: dest);

      if (trips.isEmpty) {
        final allTrips = await _tripService.getCorporateTrips();
        trips = _filterTripsByDestination(allTrips, dest);
      }

      final mapped = _mapCorporateTrips(trips);

      state = state.copyWith(
        isSearchingPlatform: false,
        smartSearchAttempted: true,
        smartSearchQuery: dest,
        platformTrips: mapped,
        errorMessage: mapped.isEmpty
            ? 'لم نجد رحلات شركات لـ «$dest». جرّب وجهة أخرى أو استخدم التخطيط المخصص.'
            : null,
        clearError: mapped.isNotEmpty,
      );
    } catch (e) {
      state = state.copyWith(
        isSearchingPlatform: false,
        smartSearchAttempted: true,
        smartSearchQuery: dest,
        platformTrips: [],
        errorMessage: 'تعذر البحث عن الرحلات. تحقق من الاتصال وحاول مرة أخرى.',
      );
    }
  }

  void clearSmartSearch() {
    state = state.copyWith(
      platformTrips: [],
      smartSearchAttempted: false,
      smartSearchQuery: null,
      clearError: true,
    );
  }

  void setDestination(String city) {
    final cityEntry = egyptCitiesList.firstWhere(
      (c) => c.name == city,
      orElse: () => EgyptCity(name: city, nameEn: city, emoji: '📍', category: 'tourist'),
    );
    final coords = governoratesCoordinates[city];

    state = state.copyWith(
      destination: city,
      destinationLocationId: cityEntry.locationId ?? '',
      lat: coords?.lat,
      lng: coords?.lng,
      clearError: true,
    );
  }

  void setOriginCity(String city) {
    state = state.copyWith(startCity: city, clearError: true);
    if (state.destination.isNotEmpty) {
      final options = buildTransportOptions(city, state.destination);
      state = state.copyWith(transportOptions: options, clearTransport: true);
    }
  }

  void selectTransport(TransportOption option) {
    state = state.copyWith(selectedTransport: option);
  }

  void setDays(int days) {
    state = state.copyWith(days: days);
  }

  void setBudget(BudgetLevel budget) {
    state = state.copyWith(budget: budget, customBudget: null);
  }

  void setCustomBudget(int? amount) {
    state = state.copyWith(customBudget: amount, budget: null);
  }

  void setHotelNeeded(bool needed) {
    state = state.copyWith(
      hotelNeeded: needed,
      checkIn: needed ? state.checkIn : null,
      checkOut: needed ? state.checkOut : null,
    );
  }

  void setCheckIn(String date) {
    String? checkOut;
    if (state.days != null && date.isNotEmpty) {
      try {
        final parts = date.split('-');
        final dt = DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]));
        final out = dt.add(Duration(days: (state.days! - 1).clamp(1, 90)));
        checkOut =
            '${out.year}-${out.month.toString().padLeft(2, '0')}-${out.day.toString().padLeft(2, '0')}';
      } catch (_) {}
    }
    state = state.copyWith(checkIn: date, checkOut: checkOut);
  }

  void goNext() {
    state = state.copyWith(currentStep: state.nextStep, clearError: true);
  }

  void goBack() {
    state = state.copyWith(currentStep: state.prevStep, clearError: true);
  }

  void goToStep(WizardStep step) {
    state = state.copyWith(currentStep: step);
  }

  Future<void> generateTripPlan() async {
    if (state.destination.isEmpty) return;

    state = state.copyWith(isGeneratingPlan: true, clearError: true);

    try {
      final plan = await _service.getTripPlan(
        state.destination,
        days: state.days ?? 3,
        budget: state.budget?.key,
        checkIn: state.hotelNeeded == true ? state.checkIn : null,
        checkOut: state.hotelNeeded == true ? state.checkOut : null,
        locationIdHint: state.destinationLocationId,
      );

      final preSelectedAttractions = plan.attractions.take(5).map((e) => e.id).toSet();
      final preSelectedRestaurants = plan.restaurants.take(3).map((e) => e.id).toSet();

      state = state.copyWith(
        tripPlan: plan,
        isGeneratingPlan: false,
        selectedAttractions: preSelectedAttractions,
        selectedRestaurants: preSelectedRestaurants,
        selectedHotels: plan.hotels.isNotEmpty ? {plan.hotels.first.id} : {},
      );
    } catch (e) {
      state = state.copyWith(
        isGeneratingPlan: false,
        errorMessage: 'حدث خطأ أثناء تحميل الأماكن. حاول مرة أخرى.',
      );
    }
  }

  void toggleAttraction(String id) {
    final set = Set<String>.from(state.selectedAttractions);
    if (set.contains(id)) {
      set.remove(id);
    } else {
      set.add(id);
    }
    state = state.copyWith(selectedAttractions: set);
  }

  void toggleRestaurant(String id) {
    final set = Set<String>.from(state.selectedRestaurants);
    if (set.contains(id)) {
      set.remove(id);
    } else {
      set.add(id);
    }
    state = state.copyWith(selectedRestaurants: set);
  }

  void toggleHotel(String id) {
    final set = Set<String>.from(state.selectedHotels);
    if (set.contains(id)) {
      set.remove(id);
    } else {
      set.add(id);
    }
    state = state.copyWith(selectedHotels: set);
  }

  Future<void> generateSmartItinerary() async {
    final plan = state.tripPlan;
    if (plan == null) return;

    state = state.copyWith(isGeneratingItinerary: true, clearError: true);

    final selectedItems = <TripPlace>[];
    selectedItems.addAll(plan.attractions.where((a) => state.selectedAttractions.contains(a.id)));
    selectedItems.addAll(plan.restaurants.where((r) => state.selectedRestaurants.contains(r.id)));

    if (selectedItems.isEmpty) {
      state = state.copyWith(
        isGeneratingItinerary: false,
        errorMessage: 'الرجاء اختيار بعض المعالم أو المطاعم أولاً.',
      );
      return;
    }

    try {
      final itinerary = ItineraryEngine.buildSmartItinerary(
        selectedItems: selectedItems,
        daysCount: state.days ?? 3,
        budget: state.budget?.key,
        destination: state.destination,
      );

      state = state.copyWith(
        generatedItinerary: itinerary,
        isGeneratingItinerary: false,
      );
    } catch (e) {
      state = state.copyWith(
        isGeneratingItinerary: false,
        errorMessage: 'حدث خطأ أثناء التنظيم الذكي.',
      );
    }
  }

  void clearItinerary() {
    state = state.copyWith(clearItinerary: true);
  }

  String _currentSeason() {
    final month = DateTime.now().month;
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }

  Future<String?> saveTrip() async {
    final itinerary = state.generatedItinerary;
    final plan = state.tripPlan;
    if (itinerary == null) {
      state = state.copyWith(errorMessage: 'أنشئ البرنامج الذكي أولاً قبل الحفظ.');
      return null;
    }

    state = state.copyWith(isSavingTrip: true, clearError: true);

    try {
      final numDays = state.days ?? itinerary.days.length;
      final budgetMap = {
        'low': 'اقتصادية',
        'medium': 'متوسطة',
        'high': 'فاخرة',
      };

      final selectedAttractions = plan?.attractions
              .where((a) => state.selectedAttractions.contains(a.id))
              .toList() ??
          [];
      final selectedRestaurants = plan?.restaurants
              .where((r) => state.selectedRestaurants.contains(r.id))
              .toList() ??
          [];
      final selectedHotels = plan?.hotels.where((h) => state.selectedHotels.contains(h.id)).toList() ?? [];

      final activities = selectedAttractions
          .map((a) => {
                'name': a.name,
                if (a.lat != null && a.lng != null)
                  'coordinates': {'lat': a.lat, 'lng': a.lng},
              })
          .toList();

      final days = itinerary.days
          .map((d) => {
                'title': d.title,
                'activities': d.activities
                    .map((a) => {
                          'name': a.name,
                          if (a.lat != null && a.lng != null)
                            'coordinates': {'lat': a.lat, 'lng': a.lng},
                        })
                    .toList(),
              })
          .toList();

      final coverImage = selectedAttractions.isNotEmpty
          ? (selectedAttractions.first.imageUrl ??
              'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800')
          : 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800';

      final payload = {
        'title': itinerary.title.isNotEmpty
            ? itinerary.title
            : 'رحلة ${state.destination} - $numDays أيام',
        'destination': state.destination,
        'city': state.destination,
        'duration': '$numDays أيام',
        'rating': 4.8,
        'description': itinerary.description.isNotEmpty
            ? itinerary.description
            : 'رحلة ممتعة إلى ${state.destination}',
        'image': coverImage,
        'budget': state.budget != null
            ? budgetMap[state.budget!.key] ?? 'متوسطة'
            : (state.customBudget != null ? '${state.customBudget} ج.م' : 'متوسطة'),
        'season': _currentSeason(),
        'activities': activities,
        'days': days,
        'foodAndRestaurants': selectedRestaurants
            .take(5)
            .map((r) => {
                  'name': r.name,
                  'image': r.imageUrl ?? '',
                  'rating': r.rating ?? 4.5,
                  'description': r.cuisine ?? 'مطعم رائع',
                })
            .toList(),
        'hotels': selectedHotels
            .take(3)
            .map((h) => {
                  'name': h.name,
                  'image': h.imageUrl ?? '',
                  'rating': h.rating ?? 4.5,
                  'description': h.description ?? h.address ?? 'فندق مميز',
                })
            .toList(),
        'isAIGenerated': true,
        'postType': 'detailed',
        if (state.startCity.isNotEmpty) 'startCity': state.startCity,
        if (state.selectedTransport != null) ...{
          'transportationPrice': state.selectedTransport!.price,
          'selectedTransportType': state.selectedTransport!.type,
        },
        'totalEstimatedPrice': state.estimatedTotal,
      };

      final created = await _tripService.createTrip(payload);
      state = state.copyWith(isSavingTrip: false);
      return created.id;
    } catch (e) {
      state = state.copyWith(
        isSavingTrip: false,
        errorMessage: 'فشل حفظ الرحلة. حاول مرة أخرى.',
      );
      return null;
    }
  }

  void reset() {
    state = const TripWizardState();
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}
