import 'package:dio/dio.dart';
import '../models/memory.dart';
import 'api_service.dart';

class MemoryService {
  final ApiService _api;

  MemoryService(this._api);

  Future<List<TravelMemory>> getMemories(String userId) async {
    final response = await _api.get('/memories/$userId');
    final data = response.data;
    if (data is! List) return [];
    return data.map((e) => TravelMemory.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TravelMemory> saveMemory({
    required String monthLabel,
    required List<Map<String, dynamic>> items,
    int trackIndex = 0,
  }) async {
    final response = await _api.post('/memories', data: {
      'monthLabel': monthLabel,
      'items': items,
      'trackIndex': trackIndex,
    });
    return TravelMemory.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteMemory(String id) async {
    await _api.delete('/memories/$id');
  }
}
