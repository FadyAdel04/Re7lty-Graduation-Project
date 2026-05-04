import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../core/exceptions.dart';

class ApiService {
  late Dio _dio;
  
  // Use http://10.0.2.2:5000 for Android Emulator
  // Use http://localhost:5000 for iOS Simulator / Web
  final String baseUrl = Platform.isAndroid 
    ? dotenv.get('API_BASE_URL_ANDROID', fallback: 'http://10.0.2.2:5000/api') 
    : dotenv.get('API_BASE_URL_IOS', fallback: 'http://localhost:5000/api');

  String? _token;
  Future<String?> Function()? tokenGetter;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 20),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // If we have a token getter, get a fresh token before each request
        if (tokenGetter != null) {
          final freshToken = await tokenGetter!();
          if (freshToken != null) {
            print('🔑 ApiService: Using fresh token from getter (starts with: ${freshToken.substring(0, 10)}...)');
            options.headers['Authorization'] = 'Bearer $freshToken';
          } else {
            print('⚠️ ApiService: tokenGetter returned null');
          }
        } else if (_token != null) {
          print('🔑 ApiService: Using stored token');
          options.headers['Authorization'] = 'Bearer $_token';
        } else {
          print('⚠️ ApiService: No token available for request to ${options.path}');
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (DioException e, handler) {
        final appException = handleDioError(e);
        print('❌ ApiService Error: ${appException.message}');
        return handler.next(e); // Still pass the original error for Dio compatibility if needed
      },
    ));
  }

  void setToken(String? token) {
    _token = token;
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
