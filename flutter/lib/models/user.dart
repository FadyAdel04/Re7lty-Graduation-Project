class User {
  final String id;
  final String clerkId;
  final String? email;
  final String? username;
  final String? fullName;
  final String? imageUrl;
  final String? bio;
  final String? location;
  final String? coverImage;
  final List<String> trips;
  final int followers;
  final int following;
  final int totalLikes;
  final int activityScore;
  final String badgeLevel;
  final String role;
  final String profileType;
  final bool isOnboarded;
  final String? companyId;
  final Subscription subscription;

  User({
    required this.id,
    required this.clerkId,
    this.email,
    this.username,
    this.fullName,
    this.imageUrl,
    this.bio,
    this.location,
    this.coverImage,
    this.trips = const [],
    this.followers = 0,
    this.following = 0,
    this.totalLikes = 0,
    this.activityScore = 0,
    this.badgeLevel = 'none',
    this.role = 'user',
    this.profileType = 'user',
    this.isOnboarded = false,
    this.companyId,
    required this.subscription,
  });

  // Getters for compatibility and cleaner code
  int get tripsCount => trips.length;
  bool get isCompany => profileType == 'company';
  String? get avatar => imageUrl;
  String? get profileImageUrl => imageUrl;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      clerkId: json['clerkId'] ?? '',
      email: json['email'],
      username: json['username'],
      fullName: json['fullName'],
      imageUrl: json['imageUrl'],
      bio: json['bio'],
      location: json['location'],
      coverImage: json['coverImage'],
      trips: (json['trips'] as List?)?.map((e) => e.toString()).toList() ?? [],
      followers: json['followers'] ?? 0,
      following: json['following'] ?? 0,
      totalLikes: json['totalLikes'] ?? 0,
      activityScore: json['activityScore'] ?? 0,
      badgeLevel: json['badgeLevel'] ?? 'none',
      role: json['role'] ?? 'user',
      profileType: json['profileType'] ?? 'user',
      isOnboarded: json['isOnboarded'] ?? false,
      companyId: json['companyId'],
      subscription: Subscription.fromJson(json['subscription'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'clerkId': clerkId,
      'email': email,
      'username': username,
      'fullName': fullName,
      'imageUrl': imageUrl,
      'bio': bio,
      'location': location,
      'coverImage': coverImage,
      'role': role,
      'profileType': profileType,
      'isOnboarded': isOnboarded,
      'subscription': subscription.toJson(),
    };
  }
}

class Subscription {
  final String plan;
  final String status;
  final DateTime? startDate;
  final DateTime? endDate;

  Subscription({
    this.plan = 'free_trial',
    this.status = 'active',
    this.startDate,
    this.endDate,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      plan: json['plan'] ?? 'free_trial',
      status: json['status'] ?? 'active',
      startDate: json['startDate'] != null ? DateTime.parse(json['startDate']) : null,
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'plan': plan,
      'status': status,
      'startDate': startDate?.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
    };
  }
}


