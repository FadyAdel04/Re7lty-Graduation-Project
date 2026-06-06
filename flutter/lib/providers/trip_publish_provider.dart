import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/trip.dart';
import '../providers/api_provider.dart';
import '../providers/trip_draft_provider.dart';
import '../providers/trip_provider.dart';
import '../services/trip_draft_storage.dart';
import '../services/trip_publish_service.dart';
import '../pages/home/home_page.dart';

enum TripPublishPhase { uploading, creating, done, error }

class TripPublishState {
  final TripPublishPhase phase;
  final double progress;
  final String status;
  final String? errorMessage;
  final Trip? createdTrip;

  const TripPublishState({
    this.phase = TripPublishPhase.uploading,
    this.progress = 0,
    this.status = '',
    this.errorMessage,
    this.createdTrip,
  });

  bool get isActive =>
      phase == TripPublishPhase.uploading || phase == TripPublishPhase.creating;

  TripPublishState copyWith({
    TripPublishPhase? phase,
    double? progress,
    String? status,
    String? errorMessage,
    Trip? createdTrip,
    bool clearError = false,
  }) {
    return TripPublishState(
      phase: phase ?? this.phase,
      progress: progress ?? this.progress,
      status: status ?? this.status,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      createdTrip: createdTrip ?? this.createdTrip,
    );
  }
}

class TripPublishNotifier extends StateNotifier<TripPublishState?> {
  TripPublishNotifier(this._ref) : super(null);

  final Ref _ref;

  Future<void> publish({
    required TripPostType type,
    TripDraft? draft,
    Map<String, dynamic>? extraData,
  }) async {
    if (state?.isActive == true) return;

    state = const TripPublishState(
      phase: TripPublishPhase.uploading,
      progress: 0,
      status: 'جاري التحضير...',
    );

    try {
      final service = TripPublishService(
        _ref.read(tripServiceProvider),
        _ref.read(mediaUploadServiceProvider),
      );

      final trip = await service.publish(
        type: type,
        draft: draft,
        extraData: extraData,
        onProgress: (progress, status) {
          if (!mounted) return;
          state = state!.copyWith(
            phase: TripPublishPhase.uploading,
            progress: progress.clamp(0.0, 0.99),
            status: status,
          );
        },
      );

      await TripDraftStorage.clear();

      final filter = _ref.read(homeFilterProvider);
      _ref.read(feedProvider(filter).notifier).prependTrip(trip);

      state = TripPublishState(
        phase: TripPublishPhase.done,
        progress: 1,
        status: 'تم النشر بنجاح!',
        createdTrip: trip,
      );

      Future.delayed(const Duration(seconds: 4), () {
        if (mounted && state?.phase == TripPublishPhase.done) {
          state = null;
        }
      });
    } catch (e) {
      state = TripPublishState(
        phase: TripPublishPhase.error,
        progress: 0,
        status: 'فشل النشر',
        errorMessage: e.toString(),
      );
    }
  }

  void dismiss() => state = null;
}

final tripPublishProvider =
    StateNotifierProvider<TripPublishNotifier, TripPublishState?>((ref) {
  return TripPublishNotifier(ref);
});
