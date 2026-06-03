import 'package:clerk_flutter/clerk_flutter.dart';

void test(ClerkAuthState auth) async {
  if (auth.client.signUp != null) {
    await auth.updateSignUp(
      auth.client.signUp!,
      username: 'testuser123',
    );
  }
}
