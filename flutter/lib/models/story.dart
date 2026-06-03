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
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      mediaUrl: json['mediaUrl']?.toString() ?? '',
      mediaType: json['mediaType']?.toString() ?? 'image',
      caption: json['caption']?.toString(),
      createdAt: DateTime.parse(json['createdAt'].toString()),
      expiresAt: DateTime.parse(json['expiresAt'].toString()),
      seen: json['seen'] == true,
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


