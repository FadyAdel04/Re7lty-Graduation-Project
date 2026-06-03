import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import 'api_provider.dart';

final currentUserProvider = FutureProvider<User>((ref) async {
  final userService = ref.watch(userServiceProvider);
  return await userService.getUserById('me');
});

// For Testing: Manually set role to 'company' or 'user'
final debugRoleProvider = StateProvider<String?>((ref) => null);

final userRoleProvider = Provider<String>((ref) {
  final debugRole = ref.watch(debugRoleProvider);
  if (debugRole != null) return debugRole;

  final userAsync = ref.watch(currentUserProvider);
  return userAsync.maybeWhen(
    data: (user) {
      if (user.profileType == 'company' || 
          user.role == 'company_approved' || 
          user.role == 'company_owner') {
        return 'company';
      }
      return 'user';
    },
    orElse: () => 'user',
  );
});
