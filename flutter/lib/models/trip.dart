class Trip {
  final String id;
  final String title;
  final String? destination;
  final String? city;
  final String? duration;
  final double rating;
  final String? image;
  final String? author;
  final String? authorImage;
  final int authorFollowers;
  final int likes;
  final int saves;
  final int shares;
  final String? description;
  final String? budget;
  final String? season;
  final List<Activity> activities;
  final List<DayPlan> days;
  final List<Food> foodAndRestaurants;
  final List<Hotel> hotels;
  final List<Comment> comments;
  final DateTime postedAt;
  final String? ownerId;
  final bool isAIGenerated;
  final String postType;
  final bool isLoved;

  Trip({
    required this.id,
    required this.title,
    this.destination,
    this.city,
    this.duration,
    this.rating = 4.5,
    this.image,
    this.author,
    this.authorImage,
    this.authorFollowers = 0,
    this.likes = 0,
    this.saves = 0,
    this.shares = 0,
    this.description,
    this.budget,
    this.season,
    this.activities = const [],
    this.days = const [],
    this.foodAndRestaurants = const [],
    this.hotels = const [],
    this.comments = const [],
    required this.postedAt,
    this.ownerId,
    this.isAIGenerated = false,
    this.postType = 'detailed',
    this.isLoved = false,
  });

  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      destination: json['destination'],
      city: json['city'],
      duration: json['duration'],
      rating: (json['rating'] ?? 4.5).toDouble(),
      image: json['image'],
      author: json['author'],
      authorImage: json['authorImage'] ?? json['authorAvatar'],
      authorFollowers: json['authorFollowers'] ?? 0,
      likes: json['likes'] ?? 0,
      saves: json['saves'] ?? 0,
      shares: json['shares'] ?? 0,
      description: json['description'],
      budget: json['budget'],
      season: json['season'],
      activities: (json['activities'] as List? ?? [])
          .map((i) => Activity.fromJson(i))
          .toList(),
      days: (json['days'] as List? ?? [])
          .map((i) => DayPlan.fromJson(i))
          .toList(),
      foodAndRestaurants: (json['foodAndRestaurants'] as List? ?? [])
          .map((i) => Food.fromJson(i))
          .toList(),
      hotels: (json['hotels'] as List? ?? [])
          .map((i) => Hotel.fromJson(i))
          .toList(),
      comments: (json['comments'] as List? ?? [])
          .map((i) => Comment.fromJson(i))
          .toList(),
      postedAt: json['postedAt'] != null 
          ? DateTime.parse(json['postedAt']) 
          : DateTime.now(),
      ownerId: json['ownerId'],
      isAIGenerated: json['isAIGenerated'] ?? false,
      postType: json['postType'] ?? 'detailed',
      isLoved: json['viewerLoved'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'destination': destination,
      'city': city,
      'duration': duration,
      'rating': rating,
      'image': image,
      'author': author,
      'authorImage': authorImage,
      'authorFollowers': authorFollowers,
      'likes': likes,
      'saves': saves,
      'shares': shares,
      'description': description,
      'budget': budget,
      'season': season,
      'activities': activities.map((i) => i.toJson()).toList(),
      'days': days.map((i) => i.toJson()).toList(),
      'foodAndRestaurants': foodAndRestaurants.map((i) => i.toJson()).toList(),
      'hotels': hotels.map((i) => i.toJson()).toList(),
      'postedAt': postedAt.toIso8601String(),
      'ownerId': ownerId,
      'isAIGenerated': isAIGenerated,
      'postType': postType,
    };
  }
}

class Activity {
  final String name;
  final List<String> images;
  final List<String> videos;
  final double? lat;
  final double? lng;
  final int day;

  Activity({
    required this.name,
    this.images = const [],
    this.videos = const [],
    this.lat,
    this.lng,
    required this.day,
  });

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      name: json['name'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      videos: List<String>.from(json['videos'] ?? []),
      lat: json['coordinates']?['lat']?.toDouble(),
      lng: json['coordinates']?['lng']?.toDouble(),
      day: json['day'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'images': images,
      'videos': videos,
      'coordinates': {'lat': lat, 'lng': lng},
      'day': day,
    };
  }
}

class DayPlan {
  final String title;
  final String date;
  final List<int> activities;

  DayPlan({
    required this.title,
    required this.date,
    this.activities = const [],
  });

  factory DayPlan.fromJson(Map<String, dynamic> json) {
    return DayPlan(
      title: json['title'] ?? '',
      date: json['date'] ?? '',
      activities: List<int>.from(json['activities'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'date': date,
      'activities': activities,
    };
  }
}

class Food {
  final String name;
  final String image;
  final double rating;
  final String description;

  Food({
    required this.name,
    required this.image,
    this.rating = 0.0,
    required this.description,
  });

  factory Food.fromJson(Map<String, dynamic> json) {
    return Food(
      name: json['name'] ?? '',
      image: json['image'] ?? '',
      rating: (json['rating'] ?? 0.0).toDouble(),
      description: json['description'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'image': image,
      'rating': rating,
      'description': description,
    };
  }
}

class Hotel {
  final String name;
  final String image;
  final double rating;
  final String description;
  final String priceRange;

  Hotel({
    required this.name,
    required this.image,
    this.rating = 0.0,
    required this.description,
    required this.priceRange,
  });

  factory Hotel.fromJson(Map<String, dynamic> json) {
    return Hotel(
      name: json['name'] ?? '',
      image: json['image'] ?? '',
      rating: (json['rating'] ?? 0.0).toDouble(),
      description: json['description'] ?? '',
      priceRange: json['priceRange'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'image': image,
      'rating': rating,
      'description': description,
      'priceRange': priceRange,
    };
  }
}

class Comment {
  final String id;
  final String authorId;
  final String author;
  final String? authorAvatar;
  final String content;
  final String date;
  final int likes;

  Comment({
    required this.id,
    required this.authorId,
    required this.author,
    this.authorAvatar,
    required this.content,
    required this.date,
    this.likes = 0,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['_id'] ?? '',
      authorId: json['authorId'] ?? '',
      author: json['author'] ?? '',
      authorAvatar: json['authorAvatar'],
      content: json['content'] ?? '',
      date: json['date'] ?? '',
      likes: json['likes'] ?? 0,
    );
  }
}


