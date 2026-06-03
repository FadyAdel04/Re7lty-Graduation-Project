import 'dart:io';
import 'package:dio/dio.dart';
import 'api_service.dart';

/// Cloudinary uploads — matches web `uploadFileToCloudinary` (`/auto/upload`).
class MediaUploadService {
  final ApiService _api;
  final Dio _uploadDio = Dio();

  MediaUploadService(this._api);

  Future<Map<String, dynamic>> _signature() async {
    final sigRes = await _api.get('/trips/cloudinary-signature');
    return sigRes.data as Map<String, dynamic>;
  }

  /// Upload image or video (same as web CreateTrip).
  Future<String> uploadMediaFile(File file) async {
    final sig = await _signature();
    final cloudName = sig['cloudName']?.toString();
    if (cloudName == null || cloudName.isEmpty) {
      throw Exception('Cloudinary غير مُعد على السيرفر');
    }

    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path),
      'api_key': sig['apiKey'],
      'timestamp': sig['timestamp'],
      'signature': sig['signature'],
      'folder': sig['folder'] ?? 're7lty/frontend_uploads',
    });

    final uploadRes = await _uploadDio.post(
      'https://api.cloudinary.com/v1_1/$cloudName/auto/upload',
      data: formData,
    );

    final url = uploadRes.data['secure_url']?.toString();
    if (url == null || url.isEmpty) {
      throw Exception('فشل رفع الملف');
    }
    return url;
  }

  Future<String> uploadImageFile(File file) => uploadMediaFile(file);
}
