import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/env_config.dart';
import '../core/exceptions.dart';

const _retryAfter401Key = 'retry_after_401';

class ApiService {
  late Dio _dio;
  
  late final String baseUrl;

  String? _token;
  Future<String?> Function()? tokenGetter;

  // Token cache to avoid fetching a new token on every request
  String? _cachedToken;
  DateTime? _tokenCachedAt;
  static const _tokenCacheDuration = Duration(seconds: 45);

  ApiService() {
    baseUrl = EnvConfig.apiBaseUrl;

    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 45),
      sendTimeout: const Duration(seconds: 20),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        } else {
          print('⚠️ ApiService: No token available for request to ${options.path}');
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401 &&
            e.requestOptions.extra[_retryAfter401Key] != true) {
          invalidateTokenCache();
          try {
            final token = await _getToken();
            if (token != null && token.isNotEmpty) {
              final opts = e.requestOptions;
              opts.extra[_retryAfter401Key] = true;
              opts.headers['Authorization'] = 'Bearer $token';
              final response = await _dio.fetch(opts);
              return handler.resolve(response);
            }
          } catch (_) {}
        }

        final appException = handleDioError(e);
        print('❌ ApiService Error: ${appException.message}');
        return handler.next(e);
      },
    ));
  }

  /// Returns a valid token, using cache when possible to avoid repeated Clerk network calls.
  Future<String?> _getToken() async {
    // 1. Use cached token if still valid
    if (_cachedToken != null && _tokenCachedAt != null) {
      final age = DateTime.now().difference(_tokenCachedAt!);
      if (age < _tokenCacheDuration && !_isJwtExpired(_cachedToken!)) {
        return _cachedToken;
      }
    }

    // 2. Fetch fresh token from getter
    if (tokenGetter != null) {
      try {
        final freshToken = await tokenGetter!();
        if (freshToken != null && freshToken.isNotEmpty && !_isJwtExpired(freshToken)) {
          print('🔑 ApiService: Fresh token fetched and cached');
          _cachedToken = freshToken;
          _tokenCachedAt = DateTime.now();
          return freshToken;
        }
        if (freshToken != null && freshToken.isNotEmpty) {
          invalidateTokenCache();
        }
      } catch (e) {
        print('⚠️ ApiService: tokenGetter error: $e');
      }
    }

    // 3. Fall back to stored token
    if (_token != null) {
      return _token;
    }

    return null;
  }

  /// Call this when user logs out to clear token cache.
  void setToken(String? token) {
    _token = token;
    if (token == null) {
      _cachedToken = null;
      _tokenCachedAt = null;
    }
  }

  /// Force-invalidate the cached token (e.g. after a 401).
  void invalidateTokenCache() {
    _cachedToken = null;
    _tokenCachedAt = null;
  }

  static bool _isJwtExpired(String jwt) {
    try {
      final parts = jwt.split('.');
      if (parts.length != 3) return true;
      final normalized = base64Url.normalize(parts[1]);
      final payload = json.decode(utf8.decode(base64Url.decode(normalized)));
      final exp = payload['exp'];
      if (exp is! num) return false;
      final expiryMs = exp.toInt() * 1000;
      return DateTime.now().millisecondsSinceEpoch >= expiryMs - 10000;
    } catch (_) {
      return false;
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
