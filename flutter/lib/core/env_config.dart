import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Central API URL resolution — works on any device/network.
///
/// Priority:
/// 1. User override in app settings (SharedPreferences)
/// 2. `API_BASE_URL` in `.env`
/// 3. `BACKEND_URL` in `.env` (+ `/api`)
/// 4. Debug only: `API_BASE_URL_DEV` (emulator / LAN IP)
class EnvConfig {
  EnvConfig._();

  static const _prefsKey = 'api_base_url_override';

  static String? _apiBaseUrl;

  /// Call once in [main] before [runApp].
  static Future<void> init() async {
    _apiBaseUrl = await resolveApiBaseUrl();
    if (kDebugMode) {
      debugPrint('🌐 API base URL: ${_apiBaseUrl ?? "(not set)"}');
    }
  }

  /// Base URL ending with `/api` — used by [ApiService].
  static String get apiBaseUrl {
    final v = _apiBaseUrl;
    if (v == null || v.isEmpty) {
      throw StateError(
        'API URL not configured. Set BACKEND_URL in .env or server URL in Settings.',
      );
    }
    return v;
  }

  /// Whether a usable API URL is configured.
  static bool get hasApiBaseUrl => _apiBaseUrl != null && _apiBaseUrl!.isNotEmpty;

  /// Origin without `/api` — used by services that call `/api/...` paths.
  static String get backendOrigin {
    final base = apiBaseUrl;
    if (base.endsWith('/api')) {
      return base.substring(0, base.length - 4);
    }
    return base;
  }

  static String get webAppUrl =>
      dotenv.env['WEB_APP_URL']?.trim() ?? 'https://re7lty-graduation-project.vercel.app';

  static Future<String> resolveApiBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final override = prefs.getString(_prefsKey)?.trim();
    if (override != null && override.isNotEmpty) {
      return normalizeApiBaseUrl(override);
    }
    return _fromEnv();
  }

  static Future<void> setApiBaseUrlOverride(String? url) async {
    final prefs = await SharedPreferences.getInstance();
    if (url == null || url.trim().isEmpty) {
      await prefs.remove(_prefsKey);
    } else {
      await prefs.setString(_prefsKey, normalizeApiBaseUrl(url.trim()));
    }
    _apiBaseUrl = await resolveApiBaseUrl();
  }

  static Future<String?> getApiBaseUrlOverride() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_prefsKey);
  }

  static String _fromEnv() {
    final direct = dotenv.env['API_BASE_URL']?.trim();
    if (direct != null && direct.isNotEmpty) {
      return normalizeApiBaseUrl(direct);
    }

    final backend = dotenv.env['BACKEND_URL']?.trim();
    if (backend != null && backend.isNotEmpty) {
      return normalizeApiBaseUrl(backend);
    }

    if (kDebugMode) {
      final dev = dotenv.env['API_BASE_URL_DEV']?.trim();
      if (dev != null && dev.isNotEmpty) {
        return normalizeApiBaseUrl(dev);
      }
    }

    return '';
  }

  /// Ensures URL ends with `/api` (no trailing slash after api).
  static String normalizeApiBaseUrl(String raw) {
    var url = raw.trim();
    if (url.isEmpty) return '';

    while (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }

    if (url.endsWith('/api')) return url;

    return '$url/api';
  }

  static String get apiConfigHint =>
      'مثال: https://your-backend.vercel.app أو http://192.168.1.10:5000';
}
