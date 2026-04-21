import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:clerk_flutter/clerk_flutter.dart';

import 'pages/home/home_page.dart';
import 'pages/auth/login_page.dart';
import 'pages/trip/trip_detail_page.dart';
import 'pages/trip/trip_comments_page.dart';
import 'pages/chat/ai_chat_page.dart';
import 'pages/trip/create_trip_page.dart';
import 'pages/profile/profile_page.dart';
import 'pages/search/search_page.dart';
import 'pages/drawer/corporate_trips_page.dart';
import 'pages/drawer/leaderboard_page.dart';
import 'pages/drawer/support_page.dart';
import 'pages/drawer/settings_page.dart';
import 'pages/company/company_page.dart';
import 'pages/home/notifications_page.dart';
import 'pages/auth/onboarding_page.dart';
import 'pages/auth/company_registration_page.dart';
import 'pages/search/friends_list_page.dart';
import 'package:re7lty_app/providers/api_provider.dart';
import 'providers/theme_provider.dart';
import 'services/api_service.dart';
import 'theme/app_colors.dart';
import 'services/user_service.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  
  MapboxOptions.setAccessToken(dotenv.get('MAPBOX_ACCESS_TOKEN', fallback: ''));

  runApp(
    ProviderScope(
      child: ClerkAuth(
        config: ClerkAuthConfig(
          publishableKey: dotenv.get('CLERK_PUBLISHABLE_KEY', fallback: ''),
        ),
        child: Re7ltyApp(),
      ),
    ),
  );
}

class Re7ltyApp extends ConsumerWidget {
  Re7ltyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);

    final GoRouter router = GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(
          path: '/onboarding',
          builder: (context, state) => OnboardingPage(),
        ),
        GoRoute(
          path: '/company-registration',
          builder: (context, state) => CompanyRegistrationPage(),
        ),
        GoRoute(
          path: '/friends',
          builder: (context, state) => FriendsListPage(),
        ),
        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) {
            return MainScaffold(navigationShell: navigationShell);
          },
          branches: [
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/',
                  builder: (context, state) => HomePage(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/search',
                  builder: (context, state) => SearchPage(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/ai-chat',
                  builder: (context, state) => AIChatPage(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/corporate-trips',
                  builder: (context, state) => CorporateTripsPage(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/profile',
                  builder: (context, state) => UserProfilePage(userId: 'me'),
                ),
              ],
            ),
          ],
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => LoginPage(),
        ),
        GoRoute(
          path: '/user/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return UserProfilePage(userId: id);
          },
        ),
        GoRoute(
          path: '/notifications',
          builder: (context, state) => NotificationsPage(),
        ),
        GoRoute(
          path: '/trip/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return TripDetailPage(tripId: id);
          },
        ),
        GoRoute(
          path: '/trip/:id/comments',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return TripCommentsPage(tripId: id);
          },
        ),
        GoRoute(
          path: '/leaderboard',
          builder: (context, state) => LeaderboardPage(),
        ),
        GoRoute(
          path: '/support',
          builder: (context, state) => SupportPage(),
        ),
        GoRoute(
          path: '/create-trip',
          builder: (context, state) => CreateTripPage(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => SettingsPage(),
        ),
        GoRoute(
          path: '/company/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return CompanyPage(companyId: id);
          },
        ),
      ],
    );

    return ClerkAuthBuilder(
      signedInBuilder: (context, authState) {
        ClerkAuth.of(context).sessionToken().then((token) {
          ref.read(apiServiceProvider).setToken(token.jwt);
        });

        return MaterialApp.router(
          title: 'Re7lty',
          debugShowCheckedModeBanner: false,
          themeMode: themeMode,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: AppColors.primaryOrange,
              primary: AppColors.primaryOrange,
              surface: Colors.white,
            ),
            useMaterial3: true,
            scaffoldBackgroundColor: const Color(0xFFF8FAFC),
            textTheme: GoogleFonts.cairoTextTheme(Theme.of(context).textTheme),
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: AppColors.primaryOrange,
              primary: AppColors.primaryOrange,
              brightness: Brightness.dark,
              surface: AppColors.cardDark,
            ),
            useMaterial3: true,
            scaffoldBackgroundColor: AppColors.darkBackground,
            textTheme: GoogleFonts.cairoTextTheme(Theme.of(context).textTheme).apply(
              bodyColor: Colors.white,
              displayColor: Colors.white,
            ),
          ),
          routerConfig: router,
          builder: (context, child) {
            if (child == null) return const SizedBox.shrink();
            return Directionality(textDirection: TextDirection.rtl, child: child);
          },
        );
      },
      signedOutBuilder: (context, authState) {
        ref.read(apiServiceProvider).setToken(null);
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: ThemeData(fontFamily: GoogleFonts.cairo().fontFamily),
          home: Directionality(
            textDirection: TextDirection.rtl,
            child: LoginPage(),
          ),
        );
      },
    );
  }
}

class MainScaffold extends ConsumerStatefulWidget {
  final StatefulNavigationShell navigationShell;
  const MainScaffold({super.key, required this.navigationShell});
  @override
  ConsumerState<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends ConsumerState<MainScaffold> {
  @override
  void initState() {
    super.initState();
    _checkOnboarding();
  }

  Future<void> _checkOnboarding() async {
    try {
      final user = await ref.read(userServiceProvider).getUserById('me');
      if (!user.isOnboarded && mounted) {
        context.go('/onboarding');
      }
    } catch (e) {}
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: Container(
        height: 70,
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkBackground : Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildCustomNavItem(0, Icons.home_outlined, Icons.home_rounded, 'الرئيسية'),
            _buildCustomNavItem(1, Icons.explore_outlined, Icons.explore, 'استكشاف'),
            _buildAssistantButton(),
            _buildCustomNavItem(3, Icons.business_center_outlined, Icons.business_center_rounded, 'الشركات'),
            _buildCustomNavItem(4, Icons.person_outline_rounded, Icons.person_rounded, 'حسابي'),
          ],
        ),
      ),
    );
  }

  Widget _buildAssistantButton() {
    return GestureDetector(
      onTap: () => widget.navigationShell.goBranch(2),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primaryOrange,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primaryOrange.withOpacity(0.4),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(Icons.smart_toy_outlined, color: Colors.white, size: 28),
          ),
          const SizedBox(height: 4),
          const Text(
            'AI CHAT',
            style: TextStyle(
              color: AppColors.primaryOrange,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomNavItem(int index, IconData outline, IconData filled, String label) {
    final selected = widget.navigationShell.currentIndex == index;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: () => widget.navigationShell.goBranch(index),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            selected ? filled : outline,
            color: selected ? AppColors.primaryOrange : (isDark ? Colors.grey : Colors.grey.shade400),
            size: 26,
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: selected ? AppColors.primaryOrange : (isDark ? Colors.grey : Colors.grey.shade400),
              fontSize: 10,
              fontWeight: selected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
