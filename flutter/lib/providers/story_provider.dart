import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/story_service.dart';
import '../services/api_service.dart';
import '../models/story.dart';

final storyServiceProvider = Provider((ref) => StoryService(ref.watch(apiServiceProvider)));

final followingStoriesProvider = FutureProvider<List<UserStoriesGroup>>((ref) async {
  final service = ref.watch(storyServiceProvider);
  return service.getFollowingStories();
});

final myStoriesProvider = FutureProvider<List<Story>>((ref) async {
  final service = ref.watch(storyServiceProvider);
  return service.getMyStories();
});


