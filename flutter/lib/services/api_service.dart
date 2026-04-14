import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';

import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiService {
  late Dio _dio;
  
  // Use http://10.0.2.2:5000 for Android Emulator
  // Use http://localhost:5000 for iOS Simulator / Web
  final String baseUrl = Platform.isAndroid 
    ? dotenv.get('API_BASE_URL_ANDROID', fallback: 'http://10.0.2.2:5000/api') 
    : dotenv.get('API_BASE_URL_IOS', fallback: 'http://localhost:5000/api');

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (DioException e, handler) {
        if (e.type == DioExceptionType.connectionTimeout) {
          print('⚠️ API Timeout: Could not connect to $baseUrl — is the server running?');
        } else if (e.type == DioExceptionType.receiveTimeout) {
          print('⚠️ API Receive Timeout: Server took too long to respond.');
        } else {
          print('❌ API Error [${e.type.name}]: ${e.message}');
        }
        return handler.next(e);
      },
    ));
  }

  void setToken(String? token) {
    if (token != null && token.isNotEmpty) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    } else {
      _dio.options.headers.remove('Authorization');
    }
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return await _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return await _dio.post(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> put(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return await _dio.put(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> patch(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return await _dio.patch(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> delete(String path, {Map<String, dynamic>? queryParameters}) async {
    return await _dio.delete(path, queryParameters: queryParameters);
  }
}

final apiServiceProvider = Provider((ref) => ApiService());
