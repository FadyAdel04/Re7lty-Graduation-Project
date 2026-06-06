import 'api_service.dart';

class ContentReportService {
  final ApiService _api;

  ContentReportService(this._api);

  Future<void> submitReport({
    required String tripId,
    required String reason,
    String? description,
    String tripModel = 'Trip',
  }) async {
    final body = <String, dynamic>{
      'tripId': tripId,
      'reason': reason,
      'tripModel': tripModel,
    };
    if (description != null && description.trim().isNotEmpty) {
      body['description'] = description.trim();
    }

    final response = await _api.post('/content-reports', data: body);
    final code = response.statusCode ?? 0;
    if (code >= 200 && code < 300) return;

    final err = response.data is Map ? response.data['error'] : null;
    throw Exception(err?.toString() ?? 'فشل إرسال البلاغ');
  }
}
