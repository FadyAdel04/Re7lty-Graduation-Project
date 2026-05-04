class AppNotification {
  final String id;
  final String recipientId;
  final String senderId;
  final String? senderName;
  final String? senderAvatar;
  final String title;
  final String message;
  final String type; // 'follow', 'like', 'comment', 'system'
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
    this.data,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['_id'] ?? json['id'] ?? '',
      recipientId: json['recipientId'] ?? '',
      senderId: json['senderId'] ?? '',
      senderName: json['senderName'],
      senderAvatar: json['senderAvatar'],
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'system',
      data: json['data'],
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
    );
  }
}
