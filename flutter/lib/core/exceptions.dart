import 'package:dio/dio.dart';

/// Base class for all app exceptions
abstract class AppException implements Exception {
  final String message;
  final String? code;

  AppException(this.message, [this.code]);

  @override
  String toString() => message;
}

class NetworkException extends AppException {
  NetworkException([String message = 'لا يوجد اتصال بالإنترنت']) : super(message);
}

class ServerException extends AppException {
  ServerException([String message = 'حدث خطأ في السيرفر']) : super(message);
}

class AuthException extends AppException {
  AuthException([String message = 'خطأ في المصادقة']) : super(message);
}

class ValidationException extends AppException {
  ValidationException(String message) : super(message);
}

/// Helper to handle Dio errors and convert them to AppExceptions
AppException handleDioError(DioException e) {
  if (e.type == DioExceptionType.connectionTimeout ||
      e.type == DioExceptionType.sendTimeout ||
      e.type == DioExceptionType.receiveTimeout ||
      e.type == DioExceptionType.connectionError) {
    return NetworkException();
  }

  if (e.response != null) {
    final status = e.response?.statusCode;
    final data = e.response?.data;
    
    // Extract error message from backend if available
    String? serverMsg;
    if (data is Map) {
      serverMsg = data['error']?.toString() ?? data['message']?.toString();
    }

    if (status == 401 || status == 403) {
      return AuthException(serverMsg ?? 'غير مصرح لك بالوصول');
    }
    
    if (status == 400) {
      return ValidationException(serverMsg ?? 'بيانات غير صالحة، يرجى التأكد من المدخلات');
    }

    if (status == 404) {
      return ValidationException(serverMsg ?? 'المصدر غير موجود');
    }

    if (status! >= 500) {
      return ServerException(serverMsg ?? 'حدث خطأ في السيرفر، يرجى المحاولة لاحقاً');
    }
    
    return ServerException(serverMsg ?? 'خطأ غير معروف ($status)');
  }

  return ServerException('حدث خطأ غير متوقع: ${e.message}');
}
