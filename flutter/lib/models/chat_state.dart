import '../models/ai_response.dart';
import '../models/trip_plan_data.dart';

class ChatMessage {
  final String text;
  final bool isAI;
  final DateTime timestamp;
  final List<SuggestedTrip>? suggestedTrips;

  ChatMessage({
    required this.text,
    required this.isAI,
    required this.timestamp,
    this.suggestedTrips,
  });
}

class ChatState {
  final List<ChatMessage> messages;
  final ExtractedData extractedData;
  final bool isLoading;
  final bool isGeneratingPlan;
  final TripPlanData? tripPlan;
  final double? estimatedPrice;

  ChatState({
    required this.messages,
    required this.extractedData,
    this.isLoading = false,
    this.isGeneratingPlan = false,
    this.tripPlan,
    this.estimatedPrice,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    ExtractedData? extractedData,
    bool? isLoading,
    bool? isGeneratingPlan,
    TripPlanData? tripPlan,
    double? estimatedPrice,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      extractedData: extractedData ?? this.extractedData,
      isLoading: isLoading ?? this.isLoading,
      isGeneratingPlan: isGeneratingPlan ?? this.isGeneratingPlan,
      tripPlan: tripPlan ?? this.tripPlan,
      estimatedPrice: estimatedPrice ?? this.estimatedPrice,
    );
  }
}
