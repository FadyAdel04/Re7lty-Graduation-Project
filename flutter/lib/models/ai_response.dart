class AIResponse {
  final String reply;
  final ExtractedData extractedData;
  final bool shouldGeneratePlan;
  final double? estimatedPriceEGP;
  final List<SuggestedTrip>? suggestedPlatformTrips;
  final bool awaitingConfirmation;

  AIResponse({
    required this.reply,
    required this.extractedData,
    this.shouldGeneratePlan = false,
    this.estimatedPriceEGP,
    this.suggestedPlatformTrips,
    this.awaitingConfirmation = false,
  });

  factory AIResponse.fromJson(Map<String, dynamic> json) {
    return AIResponse(
      reply: json['reply'] ?? '',
      extractedData: ExtractedData.fromJson(json['extractedData'] ?? {}),
      shouldGeneratePlan: json['shouldGeneratePlan'] ?? false,
      estimatedPriceEGP: (json['estimatedPriceEGP'] as num?)?.toDouble(),
      awaitingConfirmation: json['awaitingConfirmation'] ?? false,
      suggestedPlatformTrips: (json['suggestedPlatformTrips'] as List?)
          ?.map((e) => SuggestedTrip.fromJson(e))
          .toList(),
    );
  }
}

class ExtractedData {
  final String? destination;
  final int? days;
  final String? budget;
  final String? tripType;
  final String? season;

  ExtractedData({
    this.destination,
    this.days,
    this.budget,
    this.tripType,
    this.season,
  });

  factory ExtractedData.fromJson(Map<String, dynamic> json) {
    return ExtractedData(
      destination: json['destination'],
      days: json['days'],
      budget: json['budget'],
      tripType: json['tripType'],
      season: json['season'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'destination': destination,
      'days': days,
      'budget': budget,
      'tripType': tripType,
      'season': season,
    };
  }
}

class SuggestedTrip {
  final String id;
  final String title;
  final String matchReason;
  final String? image;
  final String? price;

  SuggestedTrip({
    required this.id,
    required this.title,
    required this.matchReason,
    this.image,
    this.price,
  });

  factory SuggestedTrip.fromJson(Map<String, dynamic> json) {
    return SuggestedTrip(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      matchReason: json['matchReason'] ?? '',
      image: json['image'],
      price: json['price'],
    );
  }
}
