import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'pages/home/home_page.dart';
import 'pages/auth/login_page.dart';
import 'pages/trip/trip_detail_page.dart';

import 'pages/chat/ai_chat_page.dart';

import 'pages/trip/create_trip_page.dart';

import 'pages/profile/profile_page.dart';

import 'pages/search/search_page.dart';

import 'pages/drawer/corporate_trips_page.dart';
import 'pages/drawer/leaderboard_page.dart';
import 'pages/drawer/support_page.dart';
import 'pages/drawer/settings_page.dart';

import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  
  runApp(
    const ProviderScope(
      child: Re7ltyApp(),
    ),
  );
}

class Re7ltyApp extends StatelessWidget {
  const Re7ltyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final GoRouter router = GoRouter(
      initialLocation: '/',
      routes: [
        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) {
            return MainScaffold(navigationShell: navigationShell);
          },
          branches: [
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/',
                  builder: (context, state) => const HomePage(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/search',
                  builder: (context, state) => const SearchPage(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/create-trip',
                  builder: (context, state) => const CreateTripPage(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/ai-chat',
                  builder: (context, state) => const TripAIChatPage(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/profile',
                  builder: (context, state) => const UserProfilePage(userId: 'me'),
                ),
              ],
            ),
          ],
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginPage(),
        ),
        GoRoute(
          path: '/user/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return UserProfilePage(userId: id);
          },
        ),
        GoRoute(
          path: '/trip/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return TripDetailPage(tripId: id);
          },
        ),
        GoRoute(
          path: '/corporate-trips',
          builder: (context, state) => const CorporateTripsPage(),
        ),
        GoRoute(
          path: '/leaderboard',
          builder: (context, state) => const LeaderboardPage(),
        ),
        GoRoute(
          path: '/support',
          builder: (context, state) => const SupportPage(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsPage(),
        ),
      ],
    );

    return MaterialApp.router(
      title: 'Re7lty',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFF97316),
          primary: const Color(0xFFF97316),
          secondary: const Color(0xFF0F172A),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8F9FA),
        textTheme: GoogleFonts.cairoTextTheme(Theme.of(context).textTheme).apply(
          bodyColor: Colors.black87,
          displayColor: Colors.black87,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 1,
          iconTheme: const IconThemeData(color: Colors.black87),
          titleTextStyle: GoogleFonts.cairo(color: Colors.black87, fontSize: 20, fontWeight: FontWeight.bold),
        ),
      ),
      routerConfig: router,
      builder: (context, child) => Directionality(textDirection: TextDirection.rtl, child: child!),
    );
  }
}

class MainScaffold extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainScaffold({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      floatingActionButton: FloatingActionButton(
        elevation: 4,
        backgroundColor: const Color(0xFFF97316),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        onPressed: () => navigationShell.goBranch(2),
        child: const Icon(Icons.add_location_alt, color: Colors.white, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        color: Colors.white,
        elevation: 8,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.home_outlined, Icons.home, 'الرئيسية', 0),
              _buildNavItem(Icons.search_outlined, Icons.search, 'استكشف', 1),
              const SizedBox(width: 40), // Empty space for the FAB notch
              _buildNavItem(Icons.chat_bubble_outline, Icons.chat_bubble, 'المساعد', 3),
              _buildNavItem(Icons.person_outline, Icons.person, 'حسابي', 4),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData unselected, IconData selected, String label, int index) {
    final isSelected = navigationShell.currentIndex == index;
    return InkWell(
      onTap: () => navigationShell.goBranch(index),
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isSelected ? selected : unselected,
            color: isSelected ? const Color(0xFFF97316) : Colors.grey[500],
            size: 26,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? const Color(0xFFF97316) : Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}
