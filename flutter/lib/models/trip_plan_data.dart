class TravelAdvisorLocation {
  final String locationId;
  final String name;
  final String? latitude;
  final String? longitude;

  TravelAdvisorLocation({
    required this.locationId,
    required this.name,
    this.latitude,
    this.longitude,
  });

  factory TravelAdvisorLocation.fromJson(Map<String, dynamic> json) {
    return TravelAdvisorLocation(
      locationId: json['location_id'] ?? '',
      name: json['name'] ?? '',
      latitude: json['latitude'],
      longitude: json['longitude'],
    );
  }
}

class TravelAdvisorAttraction {
  final String locationId;
  final String name;
  final String? description;
  final String? rating;
  final String? imageUrl;
  final String? latitude;
  final String? longitude;

  TravelAdvisorAttraction({
    required this.locationId,
    required this.name,
    this.description,
    this.rating,
    this.imageUrl,
    this.latitude,
    this.longitude,
  });

  factory TravelAdvisorAttraction.fromJson(Map<String, dynamic> json) {
    String? photoUrl = json['photo']?['images']?['medium']?['url'] ?? 
                      json['photo']?['images']?['large']?['url'];
    
    return TravelAdvisorAttraction(
      locationId: json['location_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      rating: json['rating'],
      imageUrl: photoUrl,
      latitude: json['latitude'],
      longitude: json['longitude'],
    );
  }
}

class TravelAdvisorRestaurant {
  final String locationId;
  final String name;
  final String? rating;
  final String? imageUrl;
  final String? cuisine;

  TravelAdvisorRestaurant({
    required this.locationId,
    required this.name,
    this.rating,
    this.imageUrl,
    this.cuisine,
  });

  factory TravelAdvisorRestaurant.fromJson(Map<String, dynamic> json) {
    String? photoUrl = json['photo']?['images']?['medium']?['url'];
    String? cuisineName = (json['cuisine'] as List?)?.isNotEmpty == true 
        ? json['cuisine'][0]['name'] 
        : null;

    return TravelAdvisorRestaurant(
      locationId: json['location_id'] ?? '',
      name: json['name'] ?? '',
      rating: json['rating'],
      imageUrl: photoUrl,
      cuisine: cuisineName,
    );
  }
}

class TravelAdvisorHotel {
  final String locationId;
  final String name;
  final String? rating;
  final String? imageUrl;
  final String? price;

  TravelAdvisorHotel({
    required this.locationId,
    required this.name,
    this.rating,
    this.imageUrl,
    this.price,
  });

  factory TravelAdvisorHotel.fromJson(Map<String, dynamic> json) {
    String? photoUrl = json['photo']?['images']?['medium']?['url'];

    return TravelAdvisorHotel(
      locationId: json['location_id'] ?? '',
      name: json['name'] ?? '',
      rating: json['rating'],
      imageUrl: photoUrl,
      price: json['price'],
    );
  }
}

class TripPlanData {
  final TravelAdvisorLocation location;
  final List<TravelAdvisorAttraction> attractions;
  final List<TravelAdvisorRestaurant> restaurants;
  final List<TravelAdvisorHotel> hotels;

  TripPlanData({
    required this.location,
    this.attractions = const [],
    this.restaurants = const [],
    this.hotels = const [],
  });
}


