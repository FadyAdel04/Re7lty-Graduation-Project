import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/user_service.dart';

final userServiceProvider = Provider((ref) => UserService(ref.watch(apiServiceProvider)));
