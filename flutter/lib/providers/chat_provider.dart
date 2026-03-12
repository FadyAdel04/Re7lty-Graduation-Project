import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/chat_state.dart';
import '../models/ai_response.dart';
import '../services/ai_service.dart';
import '../services/travel_advisor_service.dart';

final aiServiceProvider = Provider((ref) => AIService());
final travelAdvisorServiceProvider = Provider((ref) => TravelAdvisorService());

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier(
    aiService: ref.watch(aiServiceProvider),
    travelService: ref.watch(travelAdvisorServiceProvider),
  );
});

class ChatNotifier extends StateNotifier<ChatState> {
  final AIService aiService;
  final TravelAdvisorService travelService;

  ChatNotifier({required this.aiService, required this.travelService})
      : super(ChatState(
          messages: [
            ChatMessage(
              text: 'مرحباً بك! أنا TripAI، مستشارك الشخصي لتخطيط الرحلات. 🌍✨ يسعدني مساعدتك في تصميم رحلة استثنائية. أخبرني، ما هي وجهتك القادمة؟',
              isAI: true,
              timestamp: DateTime.now(),
            ),
          ],
          extractedData: ExtractedData(),
        ));

  void addMessage(String text, bool isAI, {List<SuggestedTrip>? suggestions}) {
    state = state.copyWith(
      messages: [
        ...state.messages,
        ChatMessage(
          text: text,
          isAI: isAI,
          timestamp: DateTime.now(),
          suggestedTrips: suggestions,
        ),
      ],
    );
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    addMessage(text, false);
    state = state.copyWith(isLoading: true);

    try {
      final history = state.messages
          .map((m) => {'role': m.isAI ? 'assistant' : 'user', 'content': m.text})
          .toList();

      final response = await aiService.sendMessage(
        text,
        history,
        state.extractedData,
      );

      addMessage(response.reply, true, suggestions: response.suggestedPlatformTrips);

      state = state.copyWith(
        extractedData: ExtractedData(
          destination: response.extractedData.destination ?? state.extractedData.destination,
          days: response.extractedData.days ?? state.extractedData.days,
          budget: response.extractedData.budget ?? state.extractedData.budget,
          tripType: response.extractedData.tripType ?? state.extractedData.tripType,
        ),
        estimatedPrice: response.estimatedPriceEGP ?? state.estimatedPrice,
        isLoading: false,
      );

      if (response.shouldGeneratePlan && state.tripPlan == null) {
        _generatePlan();
      }
    } catch (e) {
      addMessage('عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.', true);
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> _generatePlan() async {
    final dest = state.extractedData.destination;
    final days = state.extractedData.days ?? 3;

    if (dest == null) return;

    state = state.copyWith(isGeneratingPlan: true);
    addMessage('رائع! جاري البحث عن أفضل الأماكن في $dest... 🔍✨', true);

    try {
      final plan = await travelService.getTripPlan(dest, days);
      state = state.copyWith(
        tripPlan: plan,
        isGeneratingPlan: false,
      );
      if (plan != null) {
        addMessage('تم! 🎉 لقد جهزت لك خطة رحلة متكاملة إلى $dest. يمكنك مراجعتها وحفظها الآن.', true);
      }
    } catch (e) {
      addMessage('واجهت مشكلة أثناء البحث عن الأماكن.', true);
      state = state.copyWith(isGeneratingPlan: false);
    }
  }
}
