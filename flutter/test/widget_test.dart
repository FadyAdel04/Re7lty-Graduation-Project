import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:re7lty_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame, wrapped in required providers
    await tester.pumpWidget(
      ProviderScope(
        child: ClerkAuth(
          config: ClerkAuthConfig(
            publishableKey: '',
          ),
          child: const Re7ltyApp(),
        ),
      ),
    );

    // Verify that the splash page is showing and has a CircularProgressIndicator
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}



