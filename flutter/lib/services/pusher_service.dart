import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class PusherService {
  final PusherChannelsFlutter _pusher = PusherChannelsFlutter.getInstance();
  bool _isInitialized = false;

  Future<void> initPusher({
    required Function(PusherEvent) onEvent,
  }) async {
    if (_isInitialized) return;

    try {
      final apiKey = dotenv.env['PUSHER_KEY'] ?? '808117abcc490d314cda';
      final cluster = dotenv.env['PUSHER_CLUSTER'] ?? 'ap2';

      await _pusher.init(
        apiKey: apiKey,
        cluster: cluster,
        onEvent: onEvent,
        onSubscriptionSucceeded: (channelName, data) {
          print("Pusher Subscribed to $channelName");
        },
        onSubscriptionError: (message, e) {
          print("Pusher Subscription Error: $message");
        },
      );
      await _pusher.connect();
      _isInitialized = true;
    } catch (e) {
      print("Pusher Initialization Error: $e");
    }
  }

  Future<void> subscribeToChannel(String channelName) async {
    if (!_isInitialized) return;
    try {
      await _pusher.subscribe(channelName: channelName);
    } catch (e) {
      print("Pusher subscribe error: $e");
    }
  }

  Future<void> unsubscribeFromChannel(String channelName) async {
    if (!_isInitialized) return;
    try {
      await _pusher.unsubscribe(channelName: channelName);
    } catch (e) {
      print("Pusher unsubscribe error: $e");
    }
  }
}

final pusherServiceProvider = Provider<PusherService>((ref) {
  return PusherService();
});
