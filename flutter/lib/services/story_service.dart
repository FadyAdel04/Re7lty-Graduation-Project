import 'api_service.dart';
import '../models/story.dart';

class StoryService {
  final ApiService _apiService;

  StoryService(this._apiService);

  Future<List<UserStoriesGroup>> getFollowingStories() async {
    try {
      final response = await _apiService.get('/stories/following');
      if (response.statusCode == 200) {
        final List users = response.data['users'] ?? [];
        return users.map((u) => UserStoriesGroup.fromJson(u)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<Story>> getMyStories() async {
    try {
      final response = await _apiService.get('/stories/me');
      if (response.statusCode == 200) {
        final List items = response.data['items'] ?? [];
        return items.map((s) => Story.fromJson(s)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<void> createStory(String mediaUrl, String mediaType, {String? caption}) async {
    await _apiService.post('/stories', data: {
      'mediaUrl': mediaUrl,
      'mediaType': mediaType,
      'caption': caption,
    });
  }

  Future<void> markAsViewed(String storyId) async {
    await _apiService.post('/stories/$storyId/view');
  }
}
