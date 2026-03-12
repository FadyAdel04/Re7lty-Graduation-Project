import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:re7lty_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const Re7ltyApp());

    // Verify some text from the home page
    expect(find.text('Re7lty'), findsOneWidget);
  });
}
