import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/user_service.dart';
import '../services/memory_service.dart';
import '../services/media_upload_service.dart';
import '../services/corporate_trip_service.dart';
import '../services/content_report_service.dart';

final userServiceProvider = Provider((ref) => UserService(ref.watch(apiServiceProvider)));

final contentReportServiceProvider = Provider(
  (ref) => ContentReportService(ref.watch(apiServiceProvider)),
);

final corporateTripServiceProvider = Provider((ref) => CorporateTripService(
      ref.watch(apiServiceProvider),
      ref.watch(mediaUploadServiceProvider),
    ));

final memoryServiceProvider = Provider((ref) => MemoryService(ref.watch(apiServiceProvider)));

final mediaUploadServiceProvider = Provider((ref) => MediaUploadService(ref.watch(apiServiceProvider)));
