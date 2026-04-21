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

  factory CorporateTrip.fromJson(Map<String, dynamic> json) {
    final company = json['companyId'];
    String name = 'شركة سياحة';
    String? logo;
    String cId = '';
    
    if (company is Map) {
      name = company['name'] ?? 'شركة سياحة';
      logo = company['logo'];
      cId = company['_id'] ?? '';
    } else if (company is String) {
      cId = company;
    }

    return CorporateTrip(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      destination: json['destination'] ?? '',
      duration: json['duration'] ?? '',
      price: json['price'] ?? '0',
      rating: (json['rating'] ?? 4.5).toDouble(),
      images: List<String>.from(json['images'] ?? []),
      shortDescription: json['shortDescription'] ?? '',
      fullDescription: json['fullDescription'] ?? '',
      itinerary: (json['itinerary'] as List? ?? [])
          .map((i) => ItineraryDay.fromJson(i))
          .toList(),
      includedServices: List<String>.from(json['includedServices'] ?? []),
      excludedServices: List<String>.from(json['excludedServices'] ?? []),
      meetingLocation: json['meetingLocation'] ?? '',
      companyName: name,
      companyLogo: logo,
      companyId: cId,
    );
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
}
