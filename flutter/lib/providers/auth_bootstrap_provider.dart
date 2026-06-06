import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/exceptions.dart';
import '../services/user_service.dart';
import 'api_provider.dart';

enum AuthBootstrapStatus { pending, loading, ready, needsOnboarding, error }

class AuthBootstrapState {
  final AuthBootstrapStatus status;
  final String? errorMessage;

  const AuthBootstrapState({
    required this.status,
    this.errorMessage,
  });

  const AuthBootstrapState.pending()
      : status = AuthBootstrapStatus.pending,
        errorMessage = null;

  const AuthBootstrapState.loading()
      : status = AuthBootstrapStatus.loading,
        errorMessage = null;

  const AuthBootstrapState.ready()
      : status = AuthBootstrapStatus.ready,
        errorMessage = null;

  const AuthBootstrapState.needsOnboarding()
      : status = AuthBootstrapStatus.needsOnboarding,
        errorMessage = null;

  const AuthBootstrapState.error(String message)
      : status = AuthBootstrapStatus.error,
        errorMessage = message;
}

class AuthBootstrapNotifier extends StateNotifier<AuthBootstrapState> {
  AuthBootstrapNotifier(this._userService) : super(const AuthBootstrapState.pending());

  final UserService _userService;

  void reset() {
    state = const AuthBootstrapState.pending();
  }

  void markOnboarded() {
    state = const AuthBootstrapState.ready();
  }

  Future<void> resolve() async {
    state = const AuthBootstrapState.loading();
    try {
      final user = await _userService.getUserById('me');
      state = user.isOnboarded
          ? const AuthBootstrapState.ready()
          : const AuthBootstrapState.needsOnboarding();
    } on DioException catch (e) {
      state = AuthBootstrapState.error(handleDioError(e).message);
    } catch (e) {
      state = AuthBootstrapState.error(
        'تعذّر تحميل حسابك. تأكد من اتصال الإنترنت وتشغيل السيرفر ثم أعد المحاولة.',
      );
    }
  }
}

final authBootstrapProvider =
    StateNotifierProvider<AuthBootstrapNotifier, AuthBootstrapState>((ref) {
  return AuthBootstrapNotifier(ref.watch(userServiceProvider));
});
