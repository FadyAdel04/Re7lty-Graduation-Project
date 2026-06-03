class CorporateTrip {
  final String id;
  final String title;
  final String slug;
  final String destination;
  final String duration;
  final String price;
  final double rating;
  final List<String> images;
  final String shortDescription;
  final String fullDescription;
  final List<ItineraryDay> itinerary;
  final List<String> includedServices;
  final List<String> excludedServices;
  final String meetingLocation;
  final String companyName;
  final String? companyLogo;
  final String companyId;

  CorporateTrip({
    required this.id,
    required this.title,
    required this.slug,
    required this.destination,
    required this.duration,
    required this.price,
    required this.rating,
    required this.images,
    required this.shortDescription,
    required this.fullDescription,
    required this.itinerary,
    required this.includedServices,
    required this.excludedServices,
    required this.meetingLocation,
    required this.companyName,
    this.companyLogo,
    required this.companyId,
  });

  /// Safely parse a field that may be a List<String>, a space/comma-separated String, or null.
  static List<String> _parseStringList(dynamic raw) {
    if (raw == null) return [];
    if (raw is List) return raw.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
    if (raw is String) {
      // Split by newline, comma, or multiple spaces
      return raw.split(RegExp(r'[\n,]+')).map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    }
    return [];
  }

  factory CorporateTrip.fromJson(Map<String, dynamic> json) {
    final company = json['companyId'];
    String name = 'شركة سياحة';
    String? logo;
    String cId = '';
    
    if (company is Map) {
      name = company['name']?.toString() ?? 'شركة سياحة';
      logo = company['logo']?.toString();
      cId = company['_id']?.toString() ?? '';
    } else if (company is String) {
      cId = company;
    }

    // Safely parse price - backend may return number or string
    final priceStr = json['price']?.toString() ?? '0';
    // Safely parse duration
    final durationStr = json['duration']?.toString() ?? '';

    // Parse images - may be List or space-separated String
    final List<String> images = _parseStringList(json['images']);

    // Parse itinerary - may be List of objects, String, or null
    List<ItineraryDay> itinerary = [];
    final rawItinerary = json['itinerary'];
    if (rawItinerary is List) {
      for (final item in rawItinerary) {
        try {
          if (item is Map<String, dynamic>) {
            itinerary.add(ItineraryDay.fromJson(item));
          }
        } catch (_) {}
      }
    }

    return CorporateTrip(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      destination: json['destination']?.toString() ?? '',
      duration: durationStr,
      price: priceStr,
      rating: (json['rating'] as num?)?.toDouble() ?? 4.5,
      images: images,
      shortDescription: json['shortDescription']?.toString() ?? '',
      fullDescription: json['fullDescription']?.toString() ?? '',
      itinerary: itinerary,
      includedServices: _parseStringList(json['includedServices']),
      excludedServices: _parseStringList(json['excludedServices']),
      meetingLocation: json['meetingLocation']?.toString() ?? '',
      companyName: name,
      companyLogo: logo,
      companyId: cId,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'slug': slug,
      'destination': destination,
      'duration': duration,
      'price': price,
      'rating': rating,
      'images': images,
      'shortDescription': shortDescription,
      'fullDescription': fullDescription,
      'itinerary': itinerary.map((i) => i.toJson()).toList(),
      'includedServices': includedServices,
      'excludedServices': excludedServices,
      'meetingLocation': meetingLocation,
      'companyId': {
        'name': companyName,
        'logo': companyLogo,
        '_id': companyId,
      },
    };
  }
}

class ItineraryDay {
  final int day;
  final String title;
  final String description;
  final List<String> activities;

  ItineraryDay({
    required this.day,
    required this.title,
    required this.description,
    this.activities = const [],
  });

  factory ItineraryDay.fromJson(Map<String, dynamic> json) {
    return ItineraryDay(
      day: json['day'] ?? 1,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      activities: List<String>.from(json['activities'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'day': day,
      'title': title,
      'description': description,
      'activities': activities,
    };
  }
}
