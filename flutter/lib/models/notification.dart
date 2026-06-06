class AppNotification {
  final String id;
  final String recipientId;
  final String senderId;
  final String? senderName;
  final String? senderAvatar;
  final String title;
  final String message;
  final String type;
  final String? tripId;
  final String? link;
  final Map<String, dynamic>? data;
  final bool isRead;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.recipientId,
    required this.senderId,
    this.senderName,
    this.senderAvatar,
    required this.title,
    required this.message,
    required this.type,
    this.tripId,
    this.link,
    this.data,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      recipientId: json['recipientId']?.toString() ?? '',
      senderId: json['actorId']?.toString() ?? json['senderId']?.toString() ?? '',
      senderName: json['actorName']?.toString() ?? json['senderName']?.toString(),
      senderAvatar: json['actorImage']?.toString() ?? json['senderAvatar']?.toString(),
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      type: json['type']?.toString() ?? 'system',
      tripId: json['tripId']?.toString(),
      link: json['link']?.toString(),
      data: json['metadata'] is Map
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : (json['data'] is Map ? Map<String, dynamic>.from(json['data'] as Map) : null),
      isRead: json['isRead'] == true,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }
}
