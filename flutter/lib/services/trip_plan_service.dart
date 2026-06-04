// ─────────────────────────────────────────────────────────────────────────────
// trip_plan_service.dart  –  Calls backend proxy (same endpoints as web)
// ─────────────────────────────────────────────────────────────────────────────

import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../core/env_config.dart';
import '../models/trip_wizard_state.dart';
import '../constants/egypt_data.dart';

class TripPlanService {
  late final Dio _dio;
  late final String _baseUrl;

  TripPlanService() {
    _baseUrl = EnvConfig.backendOrigin;

    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
    ));
  }

  // ─── Search location (same as web searchLocation()) ───────────────────────
  Future<Map<String, dynamic>?> searchLocation(String cityName) async {
    try {
      // Convert Arabic to English for search
      final englishName = _cityNameMap[cityName] ?? cityName;
      final query = englishName.contains('Egypt') ? englishName : '$englishName, Egypt';

      final res = await _dio.get('/api/proxy/search',
          queryParameters: {'query': query});

      if (res.statusCode == 200) {
        final data = res.data;
        final dataList = data['data'] as List<dynamic>?;
        if (dataList != null && dataList.isNotEmpty) {
          final result = dataList[0]['result_object'] as Map<String, dynamic>?;
          return result;
        }
      }
    } catch (e) {
      debugPrint('searchLocation error: $e');
    }
    return null;
  }

  // ─── Get attractions ────────────────────────────────────────────────────
  Future<List<TripPlace>> getAttractions(String locationId, {int limit = 15}) async {
    if (locationId.isEmpty || locationId == 'undefined') {
      return _fallbackAttractions(locationId);
    }
    try {
      final res = await _dio.get('/api/proxy/attractions',
          queryParameters: {'location_id': locationId, 'limit': limit});
      if (res.statusCode == 200) {
        final List<dynamic> data = res.data['data'] ?? [];
        if (data.isNotEmpty) {
          return data.map((e) => TripPlace.fromJson(e as Map<String, dynamic>, 'attraction')).toList();
        }
      }
    } catch (e) {
      debugPrint('getAttractions error: $e');
    }
    return _fallbackAttractions(locationId);
  }

  // ─── Get restaurants ───────────────────────────────────────────────────
  Future<List<TripPlace>> getRestaurants(String locationId, {int limit = 10}) async {
    if (locationId.isEmpty || locationId == 'undefined') {
      return _fallbackRestaurants(locationId);
    }
    try {
      final res = await _dio.get('/api/proxy/restaurants',
          queryParameters: {'location_id': locationId, 'limit': limit});
      if (res.statusCode == 200) {
        final List<dynamic> data = res.data['data'] ?? [];
        if (data.isNotEmpty) {
          return data.map((e) => TripPlace.fromJson(e as Map<String, dynamic>, 'restaurant')).toList();
        }
      }
    } catch (e) {
      debugPrint('getRestaurants error: $e');
    }
    return _fallbackRestaurants(locationId);
  }

  // ─── Get hotels (via Booking.com proxy) ───────────────────────────────
  Future<List<TripPlace>> getHotels(
    String city, {
    String? budget,
    String? checkIn,
    String? checkOut,
    double? lat,
    double? lon,
  }) async {
    try {
      final coords = governoratesCoordinates[city];
      final finalLat = lat ?? coords?.lat;
      final finalLon = lon ?? coords?.lng;

      final Map<String, dynamic> params = {'city': city};
      if (budget != null) params['budget'] = budget;
      if (checkIn != null) params['checkIn'] = checkIn;
      if (checkOut != null) params['checkOut'] = checkOut;
      if (finalLat != null) params['lat'] = finalLat;
      if (finalLon != null) params['lon'] = finalLon;

      final res = await _dio.get('/api/proxy/hotels', queryParameters: params);
      if (res.statusCode == 200) {
        final dynamic raw = res.data;
        final List<dynamic> hotelList = raw is List
            ? raw
            : (raw['data'] ?? raw['result'] ?? []) as List<dynamic>;
        if (hotelList.isNotEmpty) {
          return hotelList
              .where((h) => h['name'] != null)
              .map((h) => TripPlace.fromJson(h as Map<String, dynamic>, 'hotel'))
              .toList();
        }
      }
    } catch (e) {
      debugPrint('getHotels error: $e');
    }
    return _fallbackHotels(city);
  }

  // ─── Full trip plan (attractions + restaurants + hotels) ──────────────
  Future<TripPlanResult> getTripPlan(
    String city, {
    required int days,
    String? budget,
    String? checkIn,
    String? checkOut,
    String? locationIdHint,
  }) async {
    // 1. Find location ID
    final cityEntry = egyptCitiesList.firstWhere(
      (c) => c.name == city,
      orElse: () => EgyptCity(name: city, nameEn: city, emoji: '📍', category: 'tourist'),
    );
    String locationId = locationIdHint ?? cityEntry.locationId ?? '';

    if (locationId.isEmpty) {
      final loc = await searchLocation(city);
      locationId = loc?['location_id']?.toString() ?? '';
    }

    // 2. Fetch in parallel
    final attractionLimit = (days * 3).clamp(6, 15);
    final restaurantLimit = (days * 2).clamp(4, 10);

    final coords = governoratesCoordinates[city];

    final results = await Future.wait([
      getAttractions(locationId, limit: attractionLimit),
      getRestaurants(locationId, limit: restaurantLimit),
      getHotels(city, budget: budget, checkIn: checkIn, checkOut: checkOut,
          lat: coords?.lat, lon: coords?.lng),
    ]);

    return TripPlanResult(
      locationId: locationId,
      cityName: city,
      attractions: results[0] as List<TripPlace>,
      restaurants: results[1] as List<TripPlace>,
      hotels: results[2] as List<TripPlace>,
    );
  }

  // ─── Fallback data (real Egyptian places per city) ────────────────────
  List<TripPlace> _fallbackAttractions(String locationId) {
    final cityAttractions = <String, List<TripPlace>>{
      // Cairo (294201)
      '294201': [
        TripPlace(id: 'cairo_1', name: 'الأهرامات وأبو الهول', description: 'عجيبة العالم القديمة الخالدة في الجيزة.', imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&q=80', rating: 4.9, type: 'attraction', lat: 29.9792, lng: 31.1342),
        TripPlace(id: 'cairo_2', name: 'المتحف المصري', description: 'يضم أكبر مجموعة من الآثار الفرعونية في العالم.', imageUrl: 'https://images.unsplash.com/photo-1544013589-447e9eba48b1?w=800&q=80', rating: 4.8, type: 'attraction', lat: 30.0478, lng: 31.2336),
        TripPlace(id: 'cairo_3', name: 'خان الخليلي', description: 'أعرق أسواق القاهرة التاريخية والتسوق الشرقي.', imageUrl: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80', rating: 4.6, type: 'attraction', lat: 30.0477, lng: 31.2627),
        TripPlace(id: 'cairo_4', name: 'قلعة صلاح الدين', description: 'قلعة تاريخية تطل على القاهرة وتضم مسجد محمد علي.', imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80', rating: 4.7, type: 'attraction', lat: 30.0288, lng: 31.2600),
        TripPlace(id: 'cairo_5', name: 'متحف القاهرة الكبير', description: 'أحدث وأكبر متحف أثري في العالم قرب الأهرامات.', imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80', rating: 4.9, type: 'attraction', lat: 29.9870, lng: 31.1120),
        TripPlace(id: 'cairo_6', name: 'حديقة الحيوان بالجيزة', description: 'حديقة تاريخية تأسست عام 1891 وتضم مئات الأنواع.', imageUrl: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80', rating: 4.3, type: 'attraction', lat: 30.0026, lng: 31.2089),
        TripPlace(id: 'cairo_7', name: 'برج القاهرة', description: 'أعلى برج في مصر بإطلالة 360 درجة على القاهرة.', imageUrl: 'https://images.unsplash.com/photo-1564937220492-6e0ef1e34dab?w=800&q=80', rating: 4.5, type: 'attraction', lat: 30.0459, lng: 31.2243),
        TripPlace(id: 'cairo_8', name: 'الحي الإسلامي', description: 'قلب القاهرة الفاطمية التاريخي بمساجد ومآذن رائعة.', imageUrl: 'https://images.unsplash.com/photo-1535530992830-e25d07cfa780?w=800&q=80', rating: 4.7, type: 'attraction', lat: 30.0505, lng: 31.2626),
        TripPlace(id: 'cairo_9', name: 'متحف الفن الإسلامي', description: 'من أهم متاحف الفن الإسلامي في العالم.', imageUrl: 'https://images.unsplash.com/photo-1543794500-5b08bf534a4a?w=800&q=80', rating: 4.6, type: 'attraction', lat: 30.0479, lng: 31.2509),
        TripPlace(id: 'cairo_10', name: 'جزيرة الزمالك والأوبرا', description: 'جزيرة راقية في قلب النيل تضم دار الأوبرا ومتاحف.', imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', rating: 4.5, type: 'attraction', lat: 30.0610, lng: 31.2240),
        TripPlace(id: 'cairo_11', name: 'مسجد ابن طولون', description: 'من أقدم مساجد القاهرة وأكثرها أناقة وهدوءاً.', imageUrl: 'https://images.unsplash.com/photo-1566294580659-e4e9e78c0fcc?w=800&q=80', rating: 4.8, type: 'attraction', lat: 30.0282, lng: 31.2493),
        TripPlace(id: 'cairo_12', name: 'منطقة مصر الجديدة', description: 'حي راقي بكورنيش النيل وكافيهات وتجارب حديثة.', imageUrl: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=800&q=80', rating: 4.2, type: 'attraction', lat: 30.0831, lng: 31.3361),
        TripPlace(id: 'cairo_13', name: 'حديقة الأزهر', description: 'حديقة فاطمية رائعة بإطلالة على القاهرة التاريخية.', imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80', rating: 4.6, type: 'attraction', lat: 30.0425, lng: 31.2680),
        TripPlace(id: 'cairo_14', name: 'وكالة الغوري', description: 'من روائع العمارة المملوكية ومركز ثقافي تاريخي.', imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80', rating: 4.5, type: 'attraction', lat: 30.0475, lng: 31.2612),
        TripPlace(id: 'cairo_15', name: 'منطقة الزاوية الحمراء', description: 'حي شعبي أصيل بأسواق تقليدية وحياة يومية مصرية.', imageUrl: 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800&q=80', rating: 4.0, type: 'attraction', lat: 30.0936, lng: 31.2733),
      ],
      // Alexandria (295398)
      '295398': [
        TripPlace(id: 'alex_1', name: 'قلعة قايتباي', description: 'قلعة تاريخية مملوكية على شاطئ البحر المتوسط.', imageUrl: 'https://images.unsplash.com/photo-1590059232387-a2267bca9c80?w=800&q=80', rating: 4.8, type: 'attraction', lat: 31.2139, lng: 29.8851),
        TripPlace(id: 'alex_2', name: 'مكتبة الإسكندرية', description: 'أحدث مكتبات العالم وأجملها في مدينة العلم.', imageUrl: 'https://images.unsplash.com/photo-1568284501438-2e06f2369066?w=800&q=80', rating: 4.9, type: 'attraction', lat: 31.2085, lng: 29.9087),
        TripPlace(id: 'alex_3', name: 'حدائق المنتزه', description: 'حدائق ملكية رائعة على ساحل البحر المتوسط.', imageUrl: 'https://images.unsplash.com/photo-1628189675276-2f0464f1ce2b?w=800&q=80', rating: 4.6, type: 'attraction', lat: 31.2898, lng: 30.0168),
        TripPlace(id: 'alex_4', name: 'متحف الإسكندرية القومي', description: 'يحكي تاريخ المدينة عبر 6000 قطعة أثرية.', imageUrl: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80', rating: 4.7, type: 'attraction', lat: 31.1978, lng: 29.8947),
        TripPlace(id: 'alex_5', name: 'شاطئ الستانلي', description: 'أشهر شواطئ الإسكندرية بهوائه المنعش وجسره الشهير.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', rating: 4.5, type: 'attraction', lat: 31.2022, lng: 29.9447),
        TripPlace(id: 'alex_6', name: 'أبو العباس المرسي', description: 'مسجد عريق في قلب الإسكندرية بمعمار إسلامي رائع.', imageUrl: 'https://images.unsplash.com/photo-1566294580659-e4e9e78c0fcc?w=800&q=80', rating: 4.8, type: 'attraction', lat: 31.2062, lng: 29.8895),
        TripPlace(id: 'alex_7', name: 'متحف الآثار تحت الماء', description: 'استكشاف آثار الإسكندرية الغارقة من الإسكندر الأكبر.', imageUrl: 'https://images.unsplash.com/photo-1583267751297-f5a6af27cf38?w=800&q=80', rating: 4.7, type: 'attraction', lat: 31.2147, lng: 29.8851),
        TripPlace(id: 'alex_8', name: 'عمود السواري (بومبيوس)', description: 'من أطول الأعمدة الرومانية الحجرية في العالم.', imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80', rating: 4.5, type: 'attraction', lat: 31.1888, lng: 29.8960),
        TripPlace(id: 'alex_9', name: 'كورنيش الإسكندرية', description: 'ممشى بحري طويل يمتد من المينا الشرقية للمنتزه.', imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', rating: 4.6, type: 'attraction', lat: 31.1975, lng: 29.8938),
        TripPlace(id: 'alex_10', name: 'مقابر الكتاكومب', description: 'مقابر رومانية تحت الأرض تمتزج بها الثقافات.', imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80', rating: 4.6, type: 'attraction', lat: 31.1887, lng: 29.8962),
        TripPlace(id: 'alex_11', name: 'حديقة الشلالات', description: 'من أجمل حدائق الإسكندرية ومن الحدائق ذات التصميم الأوروبي.', imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80', rating: 4.3, type: 'attraction', lat: 31.2197, lng: 29.9492),
        TripPlace(id: 'alex_12', name: 'شاطئ الأنفوشي', description: 'أقدم أحياء الإسكندرية ذات الطابع الشعبي البحري.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', rating: 4.2, type: 'attraction', lat: 31.2140, lng: 29.8878),
        TripPlace(id: 'alex_13', name: 'متحف المجوهرات الملكية', description: 'قصر فاخر كان ملكاً للأسرة العلوية محول لمتحف للمجوهرات.', imageUrl: 'https://images.unsplash.com/photo-1543794500-5b08bf534a4a?w=800&q=80', rating: 4.7, type: 'attraction', lat: 31.2228, lng: 29.9469),
        TripPlace(id: 'alex_14', name: 'قرية بحرية المندرة', description: 'منطقة ساحلية هادئة مع شواطئ نقية بعيدة عن الازدحام.', imageUrl: 'https://images.unsplash.com/photo-1590059232387-a2267bca9c80?w=800&q=80', rating: 4.4, type: 'attraction', lat: 31.3118, lng: 30.0435),
        TripPlace(id: 'alex_15', name: 'حي بولكلي والرمل', description: 'أرقى أحياء الإسكندرية بكافيهات وطابع أوروبي عريق.', imageUrl: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=800&q=80', rating: 4.5, type: 'attraction', lat: 31.2260, lng: 29.9590),
      ],
      // Luxor (294205)
      '294205': [
        TripPlace(id: 'luxor_1', name: 'معبد الكرنك', description: 'أكبر مجمع ديني في التاريخ وتحفة معمارية فرعونية.', imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80', rating: 4.9, type: 'attraction', lat: 25.7188, lng: 32.6573),
        TripPlace(id: 'luxor_2', name: 'وادي الملوك', description: 'مقابر ملوك مصر الفرعونية بتوابيت ولوحات ملونة.', imageUrl: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?w=800&q=80', rating: 4.9, type: 'attraction', lat: 25.7400, lng: 32.6014),
        TripPlace(id: 'luxor_3', name: 'معبد الأقصر', description: 'معبد فرعوني مضاء ليلاً في قلب مدينة الأقصر.', imageUrl: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80', rating: 4.8, type: 'attraction', lat: 25.6990, lng: 32.6390),
        TripPlace(id: 'luxor_4', name: 'مقبرة توت عنخ آمون', description: 'مقبرة الملك الشاب وكنوزه في وادي الملوك.', imageUrl: 'https://images.unsplash.com/photo-1544013589-447e9eba48b1?w=800&q=80', rating: 4.9, type: 'attraction', lat: 25.7351, lng: 32.6011),
        TripPlace(id: 'luxor_5', name: 'معبد حتشبسوت', description: 'معبد المرأة الفرعون في الدير البحري بتصميم معماري استثنائي.', imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&q=80', rating: 4.8, type: 'attraction', lat: 25.7380, lng: 32.6072),
        TripPlace(id: 'luxor_6', name: 'متحف الأقصر', description: 'يعرض 400 قطعة أثرية نادرة من عصر الدولة الحديثة.', imageUrl: 'https://images.unsplash.com/photo-1543794500-5b08bf534a4a?w=800&q=80', rating: 4.7, type: 'attraction', lat: 25.7001, lng: 32.6429),
        TripPlace(id: 'luxor_7', name: 'البر الغربي - رحلة نيلية', description: 'رحلة فلوكة على النيل مع غروب الشمس في الأقصر.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.8, type: 'attraction', lat: 25.7200, lng: 32.6350),
        TripPlace(id: 'luxor_8', name: 'تماثيل ممنون', description: 'تمثالان ضخمان لأمنحتب الثالث يحرسان مدخل الدير.', imageUrl: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?w=800&q=80', rating: 4.7, type: 'attraction', lat: 25.7205, lng: 32.6102),
        TripPlace(id: 'luxor_9', name: 'سوق الأقصر', description: 'سوق شعبي تقليدي للتوابل والهدايا والمقتنيات الفرعونية.', imageUrl: 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800&q=80', rating: 4.4, type: 'attraction', lat: 25.6998, lng: 32.6373),
        TripPlace(id: 'luxor_10', name: 'رحلة البالون الطائر', description: 'مشاهدة المعابد الفرعونية من الجو فوق الأقصر الخيالية.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', rating: 5.0, type: 'attraction', lat: 25.7200, lng: 32.6100),
        TripPlace(id: 'luxor_11', name: 'وادي الملكات', description: 'مقابر زوجات الفراعنة بنقوش ملونة رائعة.', imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80', rating: 4.7, type: 'attraction', lat: 25.7270, lng: 32.5990),
        TripPlace(id: 'luxor_12', name: 'معبد أبيدوس (أوسير)', description: 'من أقدس المعابد في مصر القديمة على بعد ساعة.', imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&q=80', rating: 4.8, type: 'attraction', lat: 26.1865, lng: 31.9196),
        TripPlace(id: 'luxor_13', name: 'مقبرة نفرتاري', description: 'أجمل مقابر وادي الملكات بألوان طازجة لا تصدق.', imageUrl: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?w=800&q=80', rating: 4.9, type: 'attraction', lat: 25.7278, lng: 32.5995),
        TripPlace(id: 'luxor_14', name: 'كورنيش الأقصر ليلاً', description: 'المشي على كورنيش النيل مع إضاءة المعابد مذهلة.', imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', rating: 4.7, type: 'attraction', lat: 25.6980, lng: 32.6380),
        TripPlace(id: 'luxor_15', name: 'منطقة الدير المدينة', description: 'قرية العمال الفراعنة أصحاب الحرف الذين بنوا الأهرامات.', imageUrl: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80', rating: 4.6, type: 'attraction', lat: 25.7307, lng: 32.6062),
      ],
      // Aswan (294204)
      '294204': [
        TripPlace(id: 'aswan_1', name: 'معبد فيلة', description: 'جوهرة النيل في أسوان - معبد إيزيس الذي نُقل من الغمر.', imageUrl: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80', rating: 4.9, type: 'attraction', lat: 24.0218, lng: 32.8853),
        TripPlace(id: 'aswan_2', name: 'القرية النوبية', description: 'تجربة ثقافية ملونة وفريدة في قرية النوبيين.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.8, type: 'attraction', lat: 24.1100, lng: 32.8900),
        TripPlace(id: 'aswan_3', name: 'السد العالي', description: 'من أعظم مشاريع القرن العشرين ورمز القوة المصرية.', imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80', rating: 4.7, type: 'attraction', lat: 23.9692, lng: 32.8769),
        TripPlace(id: 'aswan_4', name: 'معبد أبو سمبل', description: 'روعة الهندسة الفرعونية على حافة بحيرة ناصر.', imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&q=80', rating: 5.0, type: 'attraction', lat: 22.3372, lng: 31.6258),
        TripPlace(id: 'aswan_5', name: 'جزيرة الفنتين', description: 'جزيرة تاريخية بآثار فرعونية في قلب النيل.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.8, type: 'attraction', lat: 24.0895, lng: 32.8916),
        TripPlace(id: 'aswan_6', name: 'متحف أسوان النوبي', description: 'يروي تاريخ النوبة وحضارتها العريقة.', imageUrl: 'https://images.unsplash.com/photo-1543794500-5b08bf534a4a?w=800&q=80', rating: 4.6, type: 'attraction', lat: 24.0893, lng: 32.8980),
        TripPlace(id: 'aswan_7', name: 'المسلة الناقصة', description: 'أكبر مسلة في تاريخ مصر القديم لا تزال في محجرها.', imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80', rating: 4.7, type: 'attraction', lat: 24.0802, lng: 32.8939),
        TripPlace(id: 'aswan_8', name: 'كورنيش النيل - أسوان', description: 'ممشى جميل بفلوكا وغروب شمس رائع بين النخيل.', imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', rating: 4.8, type: 'attraction', lat: 24.0871, lng: 32.8985),
        TripPlace(id: 'aswan_9', name: 'بحيرة ناصر', description: 'أكبر بحيرة صناعية في العالم خلفها السد العالي.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', rating: 4.6, type: 'attraction', lat: 23.0000, lng: 32.7000),
        TripPlace(id: 'aswan_10', name: 'رحلة الفلوكا النيلية', description: 'إبحار تقليدي بين جزر النيل بالفلوكا عند الغروب.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.9, type: 'attraction', lat: 24.0871, lng: 32.8900),
        TripPlace(id: 'aswan_11', name: 'دير القديس سمعان', description: 'دير مسيحي أثري قديم في الصحراء الغربية لأسوان.', imageUrl: 'https://images.unsplash.com/photo-1566294580659-e4e9e78c0fcc?w=800&q=80', rating: 4.5, type: 'attraction', lat: 24.0930, lng: 32.8735),
        TripPlace(id: 'aswan_12', name: 'مقبرة الأغا خان', description: 'مقبرة أمير مسلم مشرفة على النيل بصحراء أسوان.', imageUrl: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?w=800&q=80', rating: 4.4, type: 'attraction', lat: 24.0782, lng: 32.8743),
        TripPlace(id: 'aswan_13', name: 'سوق أسوان الشعبي', description: 'سوق نوبي بالتوابل والبهارات والمنسوجات الملونة.', imageUrl: 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800&q=80', rating: 4.5, type: 'attraction', lat: 24.0886, lng: 32.8993),
        TripPlace(id: 'aswan_14', name: 'جزيرة الزهور - أسوان', description: 'جزيرة صغيرة وهادئة في النيل بنباتات ونخيل.', imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80', rating: 4.5, type: 'attraction', lat: 24.0858, lng: 32.8902),
        TripPlace(id: 'aswan_15', name: 'معبد كالابشه', description: 'معبد نوبي نُقل وأُعيد بناؤه بجوار السد العالي.', imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&q=80', rating: 4.6, type: 'attraction', lat: 23.9640, lng: 32.8721),
      ],
      // Hurghada (297549)
      '297549': [
        TripPlace(id: 'hurghada_1', name: 'جزيرة الجفتون', description: 'جزيرة مرجانية خلابة للغوص وسط أسماك البحر الأحمر.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', rating: 4.8, type: 'attraction', lat: 27.2000, lng: 33.8700),
        TripPlace(id: 'hurghada_2', name: 'مارينا الغردقة', description: 'ميناء سياحي حديث بمطاعم وكافيهات ومحلات.', imageUrl: 'https://images.unsplash.com/photo-1540541338287-417002076369?w=800&q=80', rating: 4.6, type: 'attraction', lat: 27.1750, lng: 33.8120),
        TripPlace(id: 'hurghada_3', name: 'رحلة الغوص والسنوركل', description: 'استكشاف الشعاب المرجانية والأسماك الملونة.', imageUrl: 'https://images.unsplash.com/photo-1583267751297-f5a6af27cf38?w=800&q=80', rating: 4.9, type: 'attraction', lat: 27.2100, lng: 33.9000),
        TripPlace(id: 'hurghada_4', name: 'شاطئ ساكي هاشيش', description: 'أحد أجمل شواطئ مصر بمياه فيروزية صافية.', imageUrl: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80', rating: 4.7, type: 'attraction', lat: 27.3600, lng: 33.9300),
        TripPlace(id: 'hurghada_5', name: 'متحف الغردقة', description: 'يعرض آثار فريدة من البحر الأحمر وحضارة البحارة القدماء.', imageUrl: 'https://images.unsplash.com/photo-1543794500-5b08bf534a4a?w=800&q=80', rating: 4.5, type: 'attraction', lat: 27.2578, lng: 33.8116),
        TripPlace(id: 'hurghada_6', name: 'الجونة - الريف الشرقي', description: 'منتجع فاخر بقنوات مائية وأجواء فريدة جنوب الغردقة.', imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', rating: 4.8, type: 'attraction', lat: 27.3956, lng: 33.6760),
        TripPlace(id: 'hurghada_7', name: 'رياضة المياه والعوامات', description: 'رياضات مائية مثيرة من ركوب الأمواج والباراسيلينج.', imageUrl: 'https://images.unsplash.com/photo-1583267751297-f5a6af27cf38?w=800&q=80', rating: 4.6, type: 'attraction', lat: 27.2579, lng: 33.8130),
        TripPlace(id: 'hurghada_8', name: 'شاطئ ماكادي', description: 'شاطئ فاخر هادئ خارج زحام الغردقة بأجواء رائعة.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', rating: 4.7, type: 'attraction', lat: 27.0450, lng: 33.7850),
        TripPlace(id: 'hurghada_9', name: 'رحلة يخت البحر الأحمر', description: 'يوم كامل في البحر مع الأسماك والغداء والشمس الدافئة.', imageUrl: 'https://images.unsplash.com/photo-1540541338287-417002076369?w=800&q=80', rating: 4.9, type: 'attraction', lat: 27.2100, lng: 33.9500),
        TripPlace(id: 'hurghada_10', name: 'أكواريوم الغردقة', description: 'مجمع أحياء بحرية ضخم بأسماك البحر الأحمر.', imageUrl: 'https://images.unsplash.com/photo-1564937220492-6e0ef1e34dab?w=800&q=80', rating: 4.4, type: 'attraction', lat: 27.2580, lng: 33.8100),
        TripPlace(id: 'hurghada_11', name: 'الجونة شارع الغابة', description: 'كورنيش الجونة الفاخر بمطاعم راقية ومتاجر.', imageUrl: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=800&q=80', rating: 4.6, type: 'attraction', lat: 27.3970, lng: 33.6780),
        TripPlace(id: 'hurghada_12', name: 'منطقة الكورنيش القديم', description: 'أصالة الغردقة بمحلات وكافيهات شعبية وحياة يومية.', imageUrl: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80', rating: 4.3, type: 'attraction', lat: 27.2462, lng: 33.8139),
        TripPlace(id: 'hurghada_13', name: 'رحلة السفاري الصحراوية', description: 'مغامرة على الدراجات الرباعية في صحراء البحر الأحمر.', imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&q=80', rating: 4.7, type: 'attraction', lat: 27.2800, lng: 33.7500),
        TripPlace(id: 'hurghada_14', name: 'شاطئ فندق ماريوت', description: 'شاطئ خاص فاخر مع مرافق راقية في قلب الغردقة.', imageUrl: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80', rating: 4.6, type: 'attraction', lat: 27.2420, lng: 33.8310),
        TripPlace(id: 'hurghada_15', name: 'سوق الغردقة البازار', description: 'سوق تقليدي بمقتنيات البحر وهدايا تذكارية مصرية.', imageUrl: 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800&q=80', rating: 4.2, type: 'attraction', lat: 27.2559, lng: 33.8109),
      ],
      // Sharm El Sheikh (297555)
      '297555': [
        TripPlace(id: 'sharm_1', name: 'نعمة باي', description: 'قلب الحياة الليلية والترفيهية في شرم الشيخ.', imageUrl: 'https://images.unsplash.com/photo-1540541338287-417002076369?w=800&q=80', rating: 4.7, type: 'attraction', lat: 27.9213, lng: 34.3289),
        TripPlace(id: 'sharm_2', name: 'رأس محمد - حديقة قومية', description: 'أبرز محميات البحر الأحمر للشعاب المرجانية.', imageUrl: 'https://images.unsplash.com/photo-1583267751297-f5a6af27cf38?w=800&q=80', rating: 4.9, type: 'attraction', lat: 27.7330, lng: 34.2490),
        TripPlace(id: 'sharm_3', name: 'شارم الذهبية', description: 'منطقة ترفيه وتسوق راقية في قلب شرم.', imageUrl: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=800&q=80', rating: 4.5, type: 'attraction', lat: 27.9100, lng: 34.3200),
        TripPlace(id: 'sharm_4', name: 'شاطئ الشرم الأبيض', description: 'شاطئ شرم العذراء بمياه صافية كالكريستال.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', rating: 4.8, type: 'attraction', lat: 27.8600, lng: 34.3400),
        TripPlace(id: 'sharm_5', name: 'رحلة الغوص في البحر الأحمر', description: 'استكشاف أعماق البحر الأحمر مع الأسماك الملونة.', imageUrl: 'https://images.unsplash.com/photo-1583267751297-f5a6af27cf38?w=800&q=80', rating: 4.9, type: 'attraction', lat: 27.9000, lng: 34.3500),
        TripPlace(id: 'sharm_6', name: 'جبل موسى', description: 'الجبل المقدس الذي استلم فيه موسى الألواح الشريفة.', imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80', rating: 4.8, type: 'attraction', lat: 28.5390, lng: 33.9751),
        TripPlace(id: 'sharm_7', name: 'دير سانت كاترين', description: 'أقدم دير مسيحي في العالم في قلب سيناء.', imageUrl: 'https://images.unsplash.com/photo-1566294580659-e4e9e78c0fcc?w=800&q=80', rating: 4.9, type: 'attraction', lat: 28.5565, lng: 33.9760),
        TripPlace(id: 'sharm_8', name: 'أولد ماركت - شرم', description: 'سوق قديم شعبي بمأكولات وتسوق تذكاري في شرم.', imageUrl: 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800&q=80', rating: 4.4, type: 'attraction', lat: 27.9155, lng: 34.3245),
        TripPlace(id: 'sharm_9', name: 'رحلة يخت ليلي', description: 'رحلة ليلية فاخرة مع العشاء والموسيقى على النيل.', imageUrl: 'https://images.unsplash.com/photo-1540541338287-417002076369?w=800&q=80', rating: 4.8, type: 'attraction', lat: 27.9200, lng: 34.3300),
        TripPlace(id: 'sharm_10', name: 'شاطئ الباما باي', description: 'أحد أجمل شواطئ شرم بموسيقى وحياة ليلية.', imageUrl: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80', rating: 4.6, type: 'attraction', lat: 27.9190, lng: 34.3280),
        TripPlace(id: 'sharm_11', name: 'منطقة شرم البلد', description: 'الجزء الأصيل التاريخي في شرم الشيخ بأسواق محلية.', imageUrl: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80', rating: 4.3, type: 'attraction', lat: 27.9500, lng: 34.3470),
        TripPlace(id: 'sharm_12', name: 'رياضة الباراجلايدينج', description: 'تحليق شراعي فوق خليج العقبة بمناظر خيالية.', imageUrl: 'https://images.unsplash.com/photo-1583267751297-f5a6af27cf38?w=800&q=80', rating: 4.7, type: 'attraction', lat: 27.9100, lng: 34.3200),
        TripPlace(id: 'sharm_13', name: 'واحة سيناء - تجربة بدوية', description: 'مخيم بدوي أصيل مع الشاي البدوي في قلب سيناء.', imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&q=80', rating: 4.6, type: 'attraction', lat: 27.8700, lng: 34.2800),
        TripPlace(id: 'sharm_14', name: 'شاطئ دهب', description: 'مدينة صغيرة عتيقة ورائعة للغوص تبعد 90 دقيقة.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', rating: 4.9, type: 'attraction', lat: 28.5053, lng: 34.5130),
        TripPlace(id: 'sharm_15', name: 'بلاج هيدون جاردنز', description: 'شاطئ منتجع فاخر مع حمامات سباحة ومرافق راقية.', imageUrl: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80', rating: 4.7, type: 'attraction', lat: 27.9200, lng: 34.3100),
      ],
    };

    final places = cityAttractions[locationId] ?? 
      // Generic fallback if city not mapped
      List.generate(10, (index) => TripPlace(
        id: 'fallback_attr_${locationId}_$index',
        name: 'معلم سياحي ${index + 1}',
        description: 'مكان سياحي يستحق الزيارة في المنطقة.',
        imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80',
        rating: 4.0 + (index % 10) / 10,
        type: 'attraction',
      ));
    
    return places;
  }

  List<TripPlace> _fallbackRestaurants(String locationId) {
    final cityRestaurants = <String, List<TripPlace>>{
      '294201': [ // Cairo
        TripPlace(id: 'cairo_r1', name: 'النيل للمأكولات المصرية', description: 'أحلى كشري وفول ومطبخ مصري شعبي أصيل.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 30.0444, lng: 31.2336),
        TripPlace(id: 'cairo_r2', name: 'مطعم فيشاوي خان الخليلي', description: 'أشهر مقهى في مصر بتاريخ 250 عام في قلب الخليلي.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.8, type: 'restaurant', lat: 30.0477, lng: 31.2627),
        TripPlace(id: 'cairo_r3', name: 'بيتنا للمأكولات الشرقية', description: 'محشي ومسقعة وأطباق مصرية تقليدية شهية.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 30.0510, lng: 31.2370),
        TripPlace(id: 'cairo_r4', name: 'كافيه سيمفوني بالزمالك', description: 'كافيه راقي بإطلالة جميلة على النيل في الزمالك.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 30.0610, lng: 31.2240),
        TripPlace(id: 'cairo_r5', name: 'مطعم رمسيس الفاخر', description: 'مطعم فاخر بإطلالة على أهرامات الجيزة أثناء العشاء.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 29.9792, lng: 31.1342),
        TripPlace(id: 'cairo_r6', name: 'كشري التحرير', description: 'أشهر محل كشري في القاهرة بطابع شعبي ولذيذ.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.8, type: 'restaurant', lat: 30.0453, lng: 31.2357),
        TripPlace(id: 'cairo_r7', name: 'مطعم جاد', description: 'سلسلة مشهورة للمأكولات المصرية الشعبية بمستوى راقٍ.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 30.0500, lng: 31.2300),
        TripPlace(id: 'cairo_r8', name: 'ليلى للمشاوي', description: 'مشاوي مصرية لحوم طازجة بالفحم في جلسات فاخرة.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 30.0555, lng: 31.2222),
        TripPlace(id: 'cairo_r9', name: 'فطير المشلتت', description: 'فطائر مصرية تقليدية شهيرة للفطور والغداء.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 30.0485, lng: 31.2558),
        TripPlace(id: 'cairo_r10', name: 'كافيه ليتل', description: 'مقهى أوروبي الطابع بمعجنات وعصائر طازجة.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.4, type: 'restaurant', lat: 30.0630, lng: 31.2270),
      ],
      '295398': [ // Alexandria
        TripPlace(id: 'alex_r1', name: 'بحرية البحر المتوسط', description: 'أشهر مطعم أسماك في الإسكندرية على الشاطئ مباشرة.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.8, type: 'restaurant', lat: 31.2000, lng: 29.9100),
        TripPlace(id: 'alex_r2', name: 'كافيه اتريوم', description: 'كافيه كلاسيكي إسكندراني بتاريخ يمتد لعشرات السنين.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 31.2020, lng: 29.9050),
        TripPlace(id: 'alex_r3', name: 'البيروتي للمشاوي', description: 'شاورما وكباب لبناني شهير في الإسكندرية.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 31.2080, lng: 29.9150),
        TripPlace(id: 'alex_r4', name: 'مطعم الكباب الشامي', description: 'مطعم عريق بأطباق شامية وسورية أصيلة.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 31.1950, lng: 29.9000),
        TripPlace(id: 'alex_r5', name: 'سمكة الفنارة', description: 'مطعم سمك فاخر بإطلالة مباشرة على البحر والكورنيش.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.9, type: 'restaurant', lat: 31.2139, lng: 29.8851),
        TripPlace(id: 'alex_r6', name: 'فطير الإسكندرية', description: 'فطائر إسكندرانية لذيذة تقليدية للصباح والمساء.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 31.2100, lng: 29.9200),
        TripPlace(id: 'alex_r7', name: 'مقهى بودلير', description: 'مقهى ثقافي راقٍ بأجواء أدبية في قلب الإسكندرية.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 31.2050, lng: 29.9000),
        TripPlace(id: 'alex_r8', name: 'مطعم كباب الحر', description: 'مشاوي فاخرة في أجواء مريحة بالقرب من الكورنيش.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 31.1980, lng: 29.8980),
        TripPlace(id: 'alex_r9', name: 'حلواني العطار', description: 'أشهر محل حلويات إسكندراني بكنافة وبقلاوة شهيرة.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.8, type: 'restaurant', lat: 31.2100, lng: 29.9050),
        TripPlace(id: 'alex_r10', name: 'مطعم لوران الفاخر', description: 'مطعم راقٍ في حي لوران مع إطلالة على البحر.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 31.2248, lng: 29.9462),
      ],
      '294205': [ // Luxor
        TripPlace(id: 'luxor_r1', name: 'مطعم الكرنك', description: 'مطبخ مصري أصيل بإطلالة على معابد الكرنك المضاءة.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 25.7188, lng: 32.6573),
        TripPlace(id: 'luxor_r2', name: 'بيت سمير', description: 'مطعم شعبي مميز بالكشري والمشاوي والأطباق النوبية.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 25.6998, lng: 32.6373),
        TripPlace(id: 'luxor_r3', name: 'كافيه النيل - أقصر', description: 'كافيه بإطلالة رومانسية على النيل وسط أجواء أقصر.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 25.6990, lng: 32.6390),
        TripPlace(id: 'luxor_r4', name: 'الإيوان للمأكولات الشرقية', description: 'فتة وأطباق نوبية أصيلة في جلسات تراثية.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 25.7100, lng: 32.6400),
        TripPlace(id: 'luxor_r5', name: 'مطعم اللوتس الأقصر', description: 'مطعم فاخر بتراس مطل على النيل وأجواء فرعونية.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.8, type: 'restaurant', lat: 25.7001, lng: 32.6429),
        TripPlace(id: 'luxor_r6', name: 'مطعم سوف الصعيدي', description: 'مطبخ صعيدي أصيل يقدم أطباق المحاشي وكشك اللحمة.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 25.6975, lng: 32.6358),
        TripPlace(id: 'luxor_r7', name: 'كافيه ون عرابة', description: 'مقهى هادئ في الحي الأثري بمشروبات شرقية تقليدية.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.4, type: 'restaurant', lat: 25.7188, lng: 32.6573),
        TripPlace(id: 'luxor_r8', name: 'ستيك وباربيكيو الأقصر', description: 'مطعم لحوم مشوية فاخرة مع إطلالة على الكرنك.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 25.7010, lng: 32.6410),
      ],
      '294204': [ // Aswan
        TripPlace(id: 'aswan_r1', name: 'مطعم نيلوفر النوبي', description: 'أطباق نوبية تقليدية وشاي مصري بإطلالة على النيل.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.8, type: 'restaurant', lat: 24.0871, lng: 32.8985),
        TripPlace(id: 'aswan_r2', name: 'الحور للمأكولات المصرية', description: 'أسماك النيل الطازجة والمشاوي في أجواء شعبية.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 24.0880, lng: 32.8990),
        TripPlace(id: 'aswan_r3', name: 'كافيه الكورنيش', description: 'كافيه بإطلالة مذهلة على النيل وشروق الشمس.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 24.0871, lng: 32.8985),
        TripPlace(id: 'aswan_r4', name: 'بيت النوبة للمطبخ الأصيل', description: 'أطباق نوبية وحساء العدس والملوخية بطريقة نوبية.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 24.0895, lng: 32.8916),
        TripPlace(id: 'aswan_r5', name: 'مطعم فيلة أسوان', description: 'مطعم راقٍ قريب من معبد فيلة بأطباق متنوعة.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 24.0218, lng: 32.8853),
        TripPlace(id: 'aswan_r6', name: 'كباب الجزيرة أسوان', description: 'مشاوي بالفحم على ضفاف النيل بطعم مميز لا يُنسى.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 24.0886, lng: 32.8993),
        TripPlace(id: 'aswan_r7', name: 'حلواني الأسوانية', description: 'حلويات نوبية مميزة وبسبوسة وقطايف أسوانية رائعة.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 24.0891, lng: 32.8998),
        TripPlace(id: 'aswan_r8', name: 'مطعم المحطة أسوان', description: 'مطعم شعبي قديم بكشري وفول صباحي لذيذ.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.4, type: 'restaurant', lat: 24.0875, lng: 32.8970),
      ],
      '297549': [ // Hurghada
        TripPlace(id: 'hurghada_r1', name: 'مطعم البحر الأحمر للأسماك', description: 'أسماك البحر الأحمر الطازجة على الطريقة المصرية.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.8, type: 'restaurant', lat: 27.2579, lng: 33.8116),
        TripPlace(id: 'hurghada_r2', name: 'بوفيه الغردقة الكبير', description: 'بوفيه متنوع بأطباق عالمية ومصرية في أجواء فاخرة.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 27.2550, lng: 33.8130),
        TripPlace(id: 'hurghada_r3', name: 'كافيه بيبلوس مارينا', description: 'كافيه راقٍ بإطلالة على مارينا الغردقة.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 27.1750, lng: 33.8120),
        TripPlace(id: 'hurghada_r4', name: 'مطعم الشيف للمشاوي', description: 'مشاوي فحم فاخرة في أجواء مريحة بقرب المارينا.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 27.1760, lng: 33.8110),
        TripPlace(id: 'hurghada_r5', name: 'مصفى الكشري الغردقة', description: 'كشري مصري شعبي لذيذ وسريع في قلب الغردقة.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 27.2560, lng: 33.8090),
        TripPlace(id: 'hurghada_r6', name: 'رستوران لاگونا البحرية', description: 'أطباق بحرية راقية مع إطلالة مباشرة على البحر.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 27.1740, lng: 33.8140),
        TripPlace(id: 'hurghada_r7', name: 'مقهى النخيل الغردقة', description: 'مقهى ساحلي بأجواء استوائية وعصائر طازجة.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 27.2600, lng: 33.8150),
        TripPlace(id: 'hurghada_r8', name: 'بيتزا وباستا المارينا', description: 'مطعم إيطالي أصيل مع إطلالة على ميناء الغردقة.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.4, type: 'restaurant', lat: 27.1755, lng: 33.8125),
      ],
      '297555': [ // Sharm El Sheikh
        TripPlace(id: 'sharm_r1', name: 'مطعم المصطبة شرم', description: 'مأكولات مصرية شعبية بأسعار معقولة في قلب نعمة باي.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 27.9213, lng: 34.3289),
        TripPlace(id: 'sharm_r2', name: 'سمكة شرم البحرية', description: 'أسماك البحر الأحمر الطازجة بإطلالة على الميناء.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.8, type: 'restaurant', lat: 27.9220, lng: 34.3290),
        TripPlace(id: 'sharm_r3', name: 'كافيه كونكورد شرم', description: 'كافيه فاخر في قلب شرم ببلكون يطل على البحر.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 27.9100, lng: 34.3200),
        TripPlace(id: 'sharm_r4', name: 'لاجونا ريستوران شرم', description: 'مطعم بين النخيل بمجموعة أطباق عالمية وشرقية.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 27.9180, lng: 34.3270),
        TripPlace(id: 'sharm_r5', name: 'بوفيه أولد ماركت شرم', description: 'أطباق متنوعة في بوفيه شعبي بالسوق القديم.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 27.9155, lng: 34.3245),
        TripPlace(id: 'sharm_r6', name: 'شاورما الشرم', description: 'شاورما وسندويشات لذيذة طوال اليوم بشرم الشيخ.', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', rating: 4.5, type: 'restaurant', lat: 27.9160, lng: 34.3250),
        TripPlace(id: 'sharm_r7', name: 'مطعم ليالي شرم', description: 'أجواء رومانسية ليلية مع موسيقى وبوفيه فاخر.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', rating: 4.7, type: 'restaurant', lat: 27.9200, lng: 34.3300),
        TripPlace(id: 'sharm_r8', name: 'كافيه دريم بيتش', description: 'كافيه شاطئي مميز بمشروبات عصرية وموسيقى هادئة.', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=800&q=80', rating: 4.6, type: 'restaurant', lat: 27.9195, lng: 34.3285),
      ],
    };

    final places = cityRestaurants[locationId] ?? 
      List.generate(8, (index) => TripPlace(
        id: 'fallback_rest_${locationId}_$index',
        name: 'مطعم محلي ${index + 1}',
        description: 'أطباق مصرية لذيذة في أجواء مريحة.',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
        rating: 4.0 + (index % 10) / 10,
        type: 'restaurant',
      ));
    
    return places;
  }

  List<TripPlace> _fallbackHotels(String city) {
    return [
      TripPlace(
        id: 'mock_hotel_1',
        name: 'فندق جراند $city',
        description: 'فندق فاخر في قلب المدينة',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        rating: 4.8,
        price: '1200 EGP',
        type: 'hotel',
      ),
      TripPlace(
        id: 'mock_hotel_2',
        name: 'رويال ريزورت $city',
        description: 'منتجع فاخر في المنطقة السياحية',
        imageUrl: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=800&q=80',
        rating: 4.5,
        price: '900 EGP',
        type: 'hotel',
      ),
    ];
  }

  // ─── Generate Smart Itinerary (Groq AI) ─────────────────────────────
  Future<GeneratedItinerary?> generateSmartItinerary({
    required String destination,
    required int days,
    required List<TripPlace> selectedItems,
    String? budget,
  }) async {
    try {
      final apiKey = dotenv.env['GROQ_API_KEY'] ?? '';
      final apiUrl = dotenv.env['GROQ_API_URL'] ?? 'https://api.groq.com/openai/v1/chat/completions';

      if (apiKey.isEmpty) {
        debugPrint('GROQ_API_KEY is missing. Cannot generate itinerary.');
        return null;
      }

      final itemDescriptions = selectedItems.asMap().entries.map((e) {
        final idx = e.key;
        final item = e.value;
        final latLng = item.lat != null && item.lng != null
            ? '(${item.lat!.toStringAsFixed(4)}, ${item.lng!.toStringAsFixed(4)})'
            : '';
        return '${idx + 1}. ${item.name} [${item.type}] $latLng';
      }).join('\n');

      final budgetContext = budget != null
          ? '\nالميزانية: ${budget == 'low' ? 'اقتصادية - ركز على الأماكن المجانية والرخيصة' : budget == 'high' ? 'فاخرة - اقترح تجارب مميزة' : 'متوسطة'}'
          : '';

      final prompt = '''أنت خبير تنظيم رحلات سياحية في مصر. نظّم الأماكن التالية في جدول رحلة لمدة $days أيام في $destination.
$budgetContext

القواعد المهمة:
1. جمّع الأماكن القريبة جغرافياً في نفس اليوم (استخدم الإحداثيات)
2. حد أقصى 5 أماكن في اليوم و 8 ساعات أنشطة
3. رتب كل يوم: الصباح → معالم سياحية، الظهر → غداء، العصر → أنشطة، المساء → عشاء/استرخاء
4. أضف وقت تنقل واقعي بين الأماكن (15-30 دقيقة)
5. كل يوم يبدأ 9:00 AM وينتهي قبل 9:00 PM
6. اعطِ كل يوم عنوان جذاب واسم منطقة
7. ملاحظة هامة: يجب أن تكون الـ "note" لكل مكان مفصلة جداً (لا تقل عن 3 أسطر) باللغة العربية، تشمل نصائح للمكان، أفضل وقت للزيارة، وما الذي يميزه، ومعلومات تاريخية أو ترفيهية عنه.

الأماكن المختارة:
$itemDescriptions

أرجع النتيجة بصيغة JSON فقط:
{
  "title": "عنوان جذاب للرحلة بالعربي",
  "description": "وصف شيق للرحلة في 2 سطر",
  "days": [
    {
      "dayNum": 1,
      "title": "عنوان جذاب لليوم",
      "area": "اسم المنطقة/الحي",
      "color": "#6366f1",
      "activities": [
         {
           "name": "اسم المكان كما هو",
           "time": "10:00 AM",
           "endTime": "12:00 PM",
           "duration": 120,
           "note": "وصف تفصيلي جداً وشامل للمكان بالعربي مع نصائح ومعلومات قيمة",
           "type": "attraction أو restaurant",
           "coordinates": {"lat": 30.0444, "lng": 31.2357}
         }
      ]
    }
  ]
}''';

      final res = await _dio.post(
        apiUrl,
        options: Options(headers: {
          'Authorization': 'Bearer $apiKey',
          'Content-Type': 'application/json',
        }),
        data: {
          'model': 'llama-3.3-70b-versatile',
          'messages': [
            {'role': 'user', 'content': prompt}
          ],
          'response_format': {'type': 'json_object'},
          'temperature': 0.7,
        },
      );

      if (res.statusCode == 200) {
        final content = res.data['choices'][0]['message']['content'];
        final Map<String, dynamic> jsonMap = jsonDecode(content);
        return GeneratedItinerary.fromJson(jsonMap);
      }
    } catch (e) {
      debugPrint('generateSmartItinerary error: $e');
    }
    return null;
  }

  // Arabic → English city name map (for search API)
  static const Map<String, String> _cityNameMap = {
    'القاهرة': 'Cairo, Egypt',
    'الإسكندرية': 'Alexandria, Egypt',
    'الاسكندرية': 'Alexandria, Egypt',
    'الأقصر': 'Luxor, Egypt',
    'أسوان': 'Aswan, Egypt',
    'شرم الشيخ': 'Sharm El Sheikh, Egypt',
    'دهب': 'Dahab, Egypt',
    'الجونة': 'El Gouna, Egypt',
    'الغردقة': 'Hurghada, Egypt',
    'سيوة': 'Siwa Oasis, Egypt',
    'نويبع': 'Nuweiba, Egypt',
    'مرسى علم': 'Marsa Alam, Egypt',
    'الفيوم': 'Fayoum, Egypt',
    'بورسعيد': 'Port Said, Egypt',
    'مرسى مطروح': 'Marsa Matrouh, Egypt',
    'طابا': 'Taba, Egypt',
    'قنا': 'Qena, Egypt',
    'سوهاج': 'Sohag, Egypt',
    'أسيوط': 'Asyut, Egypt',
    'المنيا': 'Minya, Egypt',
    'بني سويف': 'Beni Suef, Egypt',
    'الإسماعيلية': 'Ismailia, Egypt',
    'السويس': 'Suez, Egypt',
    'المنصورة': 'Mansoura, Egypt',
    'طنطا': 'Tanta, Egypt',
    'دمياط': 'Damietta, Egypt',
  };
}
