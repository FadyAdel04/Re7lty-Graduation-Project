class Story {
  final String id;
  final String userId;
  final String mediaUrl;
  final String mediaType;
  final String? caption;
  final DateTime createdAt;
  final DateTime expiresAt;
  final bool seen;

  Story({
    required this.id,
    required this.userId,
    required this.mediaUrl,
    required this.mediaType,
    this.caption,
    required this.createdAt,
    required this.expiresAt,
    this.seen = false,
  });

  factory Story.fromJson(Map<String, dynamic> json) {
    return Story(
      id: json['_id'] ?? '',
      userId: json['userId'] ?? '',
      mediaUrl: json['mediaUrl'] ?? '',
      mediaType: json['mediaType'] ?? 'image',
      caption: json['caption'],
      createdAt: DateTime.parse(json['createdAt']),
      expiresAt: DateTime.parse(json['expiresAt']),
      seen: json['seen'] ?? false,
    );
  }
}

class UserStoriesGroup {
  final String userId;
  final String fullName;
  final String? imageUrl;
  final bool hasUnseen;
  final List<Story> stories;

  UserStoriesGroup({
    required this.userId,
    required this.fullName,
    this.imageUrl,
    required this.hasUnseen,
    required this.stories,
  });

  factory UserStoriesGroup.fromJson(Map<String, dynamic> json) {
    return UserStoriesGroup(
      userId: json['userId'] ?? '',
      fullName: json['fullName'] ?? '',
      imageUrl: json['imageUrl'],
      hasUnseen: json['hasUnseen'] ?? false,
      stories: (json['stories'] as List?)?.map((e) => Story.fromJson(e)).toList() ?? [],
    );
  }
}


