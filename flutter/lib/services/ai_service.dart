import 'package:dio/dio.dart';
import '../models/ai_response.dart';
import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';

class AIService {
  final String _apiKey = dotenv.get('GROQ_API_KEY', fallback: '');
  final String _apiUrl = dotenv.get('GROQ_API_URL', fallback: 'https://api.groq.com/openai/v1/chat/completions');
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 20),
  ));

  static const String systemPrompt = '''أنت TripAI - مستشار سفر احترافي لمنصة "رحلتي" (Re7lty).
🎯 دورك: تخطيط رحلات، اقتراح رحلات المنصة، الإجابة عن أسئلة السفر والمنصة.
⚙️ قواعد السلوك:
1. ✅ لا تكرر الأسئلة: راجع extractedData أولاً.
2. ✅ اسأل عن الناقص فقط: وجهة، أيام، ميزانية.
3. ✅ أرجع JSON فقط. لا markdown، لا نص إضافي.
''';

  Future<AIResponse> sendMessage(
    String userMessage,
    List<Map<String, String>> history,
    ExtractedData? currentData,
  ) async {
    try {
      final List<Map<String, String>> messages = [
        {'role': 'system', 'content': '$systemPrompt\nContext: ${jsonEncode(currentData?.toJson())}'},
        ...history,
        {'role': 'user', 'content': userMessage},
      ];

      final response = await _dio.post(
        _apiUrl,
        options: Options(headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        }),
        data: {
          'messages': messages,
          'model': 'llama-3.3-70b-versatile',
          'temperature': 0.7,
          'max_tokens': 1000,
          'response_format': {'type': 'json_object'},
        },
      );

      if (response.statusCode == 200) {
        final content = response.data['choices'][0]['message']['content'];
        return AIResponse.fromJson(jsonDecode(content));
      } else {
        throw Exception('Failed to get answer from AI');
      }
    } catch (e) {
      print('AI Service Error: $e');
      rethrow;
    }
  }
}


