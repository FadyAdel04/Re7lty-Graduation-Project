import '../models/user.dart';

/// Clerk ID preferred — matches backend `/users/:clerkId` routes.
String userProfileId(User user) =>
    user.clerkId.isNotEmpty ? user.clerkId : user.id;
