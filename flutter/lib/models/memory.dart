class MemoryItem {
  final String url;
  final String tripTitle;
  final String destination;
  final DateTime? date;

  MemoryItem({
    required this.url,
    required this.tripTitle,
    required this.destination,
    this.date,
  });

  factory MemoryItem.fromJson(Map<String, dynamic> json) {
    return MemoryItem(
      url: json['url']?.toString() ?? '',
      tripTitle: json['tripTitle']?.toString() ?? '',
      destination: json['destination']?.toString() ?? '',
      date: json['date'] != null ? DateTime.tryParse(json['date'].toString()) : null,
    );
  }
}

class TravelMemory {
  final String id;
  final String userId;
  final String monthLabel;
  final List<MemoryItem> items;
  final int trackIndex;

  TravelMemory({
    required this.id,
    required this.userId,
    required this.monthLabel,
    required this.items,
    this.trackIndex = 0,
  });

  factory TravelMemory.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List? ?? [];
    return TravelMemory(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      monthLabel: json['monthLabel']?.toString() ?? '',
      items: rawItems.map((e) => MemoryItem.fromJson(e as Map<String, dynamic>)).toList(),
      trackIndex: (json['trackIndex'] as num?)?.toInt() ?? 0,
    );
  }

  String? get coverUrl => items.isNotEmpty ? items.first.url : null;
}
