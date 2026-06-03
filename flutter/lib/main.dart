import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:device_preview/device_preview.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'pages/home/home_page.dart';
import 'pages/auth/login_page.dart';
import 'pages/trip/trip_detail_page.dart';
import 'pages/trip/trip_comments_page.dart';
import 'pages/chat/ai_chat_page.dart';
import 'pages/trip/create_trip_page.dart';
import 'pages/trip/edit_trip_page.dart';
import 'pages/booking/booking_verify_page.dart';
import 'pages/booking/booking_payment_result_page.dart';
import 'widgets/payment_resume_listener.dart';
import 'pages/profile/profile_page.dart';
import 'pages/company/create_corporate_trip_page.dart';
import 'pages/discover/discover_page.dart';
import 'pages/drawer/corporate_trips_page.dart';
import 'pages/drawer/leaderboard_page.dart';
import 'pages/drawer/support_page.dart';
import 'pages/drawer/settings_page.dart';
import 'pages/company/company_page.dart';
import 'pages/home/notifications_page.dart';
import 'pages/corporate/corporate_trip_details_page.dart';
import 'pages/auth/onboarding_page.dart';
import 'pages/auth/company_registration_page.dart';
import 'pages/search/friends_list_page.dart';
import 'pages/company/company_dashboard_page.dart';
import 'pages/company/company_messages_page.dart';
import 'pages/chat/messages_page.dart';
import 'pages/chat/direct_chat_page.dart';
import 'pages/chat/group_chat_page.dart';
import 'pages/chat/company_chat_detail_page.dart';
import 'package:re7lty_app/providers/api_provider.dart';
import 'providers/user_provider.dart';
import 'providers/auth_bootstrap_provider.dart';
import 'providers/theme_provider.dart';
import 'services/api_service.dart';
import 'theme/app_colors.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'core/env_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  await EnvConfig.init();

  if (!kIsWeb) {
    MapboxOptions.setAccessToken(dotenv.get('MAPBOX_ACCESS_TOKEN', fallback: ''));
  }

  runApp(
    DevicePreview(
      enabled: !kReleaseMode,
      builder: (context) => ProviderScope(
        child: ClerkAuth(
          config: ClerkAuthConfig(
            publishableKey: dotenv.get('CLERK_PUBLISHABLE_KEY', fallback: ''),
          ),
          child: Re7ltyApp(),
        ),
      ),
    ),
  );
}

class Re7ltyApp extends ConsumerStatefulWidget {
  const Re7ltyApp({super.key});

  @override
  ConsumerState<Re7ltyApp> createState() => _Re7ltyAppState();
}

class _Re7ltyAppState extends ConsumerState<Re7ltyApp> {
  GoRouter? _router;

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);
    ref.watch(authBootstrapProvider);

    ref.listen<AuthBootstrapState>(authBootstrapProvider, (previous, next) {
      if (previous?.status != next.status) {
        _router?.refresh();
      }
    });

    // Initialize router only once
    _router ??= GoRouter(
      initialLocation: '/splash',
      refreshListenable: ClerkAuth.of(context),
      redirect: (context, state) {
        final auth = ClerkAuth.of(context);
        final bootstrap = ref.read(authBootstrapProvider);

        final location = state.matchedLocation;
        final loggingIn = location == '/login';
        final isSplash = location == '/splash';
        final isOnboardingFlow =
            location == '/onboarding' || location == '/company-registration';
        final isPaymentResult =
            location.startsWith('/booking-payment-result');

        if (auth.session == null) {
          if (auth.client.sessions.isNotEmpty &&
              !loggingIn &&
              !isSplash &&
              !isPaymentResult) {
            return '/splash';
          }
          if (loggingIn || isSplash) return null;
          return '/login';
        }

        // Signed in: always bootstrap via splash before home/onboarding.
        if (loggingIn) return '/splash';

        switch (bootstrap.status) {
          case AuthBootstrapStatus.pending:
          case AuthBootstrapStatus.loading:
          case AuthBootstrapStatus.error:
            if (!isSplash) return '/splash';
            return null;

          case AuthBootstrapStatus.needsOnboarding:
            if (!isOnboardingFlow) return '/onboarding';
            return null;

          case AuthBootstrapStatus.ready:
            if (isSplash || isOnboardingFlow) return '/';
            return null;
        }
      },
      routes: [
        GoRoute(
          path: '/splash',
          builder: (context, state) => const SplashPage(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginPage(),
        ),
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
                  builder: (context, state) {
                    return const HomePage();
                  },
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/search',
                  builder: (context, state) => const DiscoverPage(),
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
                  path: '/corporate',
                  builder: (context, state) {
                    return const CorporateTripsPage();
                  },
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/profile',
                  builder: (context, state) {
                    final role = ref.watch(userRoleProvider);
                    if (role == 'company') return const CompanyDashboardPage();
                    return UserProfilePage(userId: 'me');
                  },
                ),
              ],
            ),
          ],
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
          path: '/trip/:id/edit',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return EditTripPage(tripId: id);
          },
        ),
        GoRoute(
          path: '/booking-payment-result',
          builder: (context, state) {
            final q = state.uri.queryParameters;
            return BookingPaymentResultPage(
              success: q['success'],
              pending: q['pending'],
              txnResponseCode: q['txn_response_code'],
              merchantOrderId: q['merchant_order_id'],
              orderId: q['order'],
            );
          },
        ),
        GoRoute(
          path: '/verify-booking',
          builder: (context, state) => const BookingVerifyPage(),
        ),
        GoRoute(
          path: '/verify-booking/:reference',
          builder: (context, state) {
            final reference = state.pathParameters['reference']!;
            return BookingVerifyPage(initialReference: reference);
          },
        ),
        GoRoute(
          path: '/corporate-trip/:id',
          builder: (context, state) {
            final trip = state.extra as Map<String, dynamic>;
            return CorporateTripDetailsPage(trip: trip);
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
          path: '/create-corporate-trip',
          builder: (context, state) => const CreateCorporateTripPage(),
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
        GoRoute(
          path: '/messages',
          builder: (context, state) => const MessagesPage(),
        ),
        GoRoute(
          path: '/company-messages',
          builder: (context, state) => const CompanyMessagesPage(),
        ),
        // Chat detail routes
        GoRoute(
          path: '/chat/company/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return CompanyChatDetailPage(conversationId: id);
          },
        ),
        GoRoute(
          path: '/chat/direct/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return DirectChatPage(conversationId: id);
          },
        ),
        GoRoute(
          path: '/chat/group/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return GroupChatPage(groupId: id);
          },
        ),
      ],
    );

    return MaterialApp.router(
      useInheritedMediaQuery: true,
      locale: DevicePreview.locale(context),
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
        brightness: Brightness.dark,
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primaryOrange,
          primary: AppColors.primaryOrange,
          brightness: Brightness.dark,
          surface: AppColors.cardDark,
          onSurface: Colors.white,
          onPrimary: Colors.white,
        ),
        scaffoldBackgroundColor: AppColors.darkBackground,
        cardTheme: const CardThemeData(
          color: AppColors.cardDark,
          elevation: 0,
        ),
        textTheme: GoogleFonts.cairoTextTheme(
          ThemeData.dark().textTheme,
        ).apply(
          bodyColor: Colors.white,
          displayColor: Colors.white,
        ),
        iconTheme: const IconThemeData(color: Colors.white70),
        dividerTheme: DividerThemeData(color: Colors.white.withOpacity(0.1)),
      ),
      routerConfig: _router!,
      builder: (context, child) {
        return _AuthTokenSync(
          ref: ref,
          child: PaymentResumeListener(
            child: Directionality(
              textDirection: TextDirection.rtl,
              child: DevicePreview.appBuilder(context, child),
            ),
          ),
        );
      },
    );
  }
}

/// Helper widget to sync Clerk token with ApiService efficiently
class _AuthTokenSync extends StatefulWidget {
  final Widget child;
  final WidgetRef ref;
  const _AuthTokenSync({required this.child, required this.ref});

  @override
  State<_AuthTokenSync> createState() => _AuthTokenSyncState();
}

class _AuthTokenSyncState extends State<_AuthTokenSync> {
  String? _lastSessionId;

  @override
  void initState() {
    super.initState();
    // Set a dynamic token getter that fetches fresh token from Clerk
    widget.ref.read(apiServiceProvider).tokenGetter = () async {
      if (!mounted) return null;
      
      try {
        final auth = ClerkAuth.of(context);
        if (auth.session == null) {
          print('⏳ tokenGetter: No session available');
          return null;
        }
        
        print('⏳ tokenGetter: Fetching session token...');
        final token = await auth.sessionToken();
        return token?.jwt;
      } catch (e) {
        print('❌ tokenGetter Error: $e');
        return null;
      }
    };
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncToken();
  }

  Future<void> _syncToken() async {
    final auth = ClerkAuth.of(context);
    final sessionId = auth.session?.id;

    if (sessionId != _lastSessionId) {
      _lastSessionId = sessionId;
      if (sessionId == null) {
        widget.ref.read(apiServiceProvider).setToken(null);
      }
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initAuth());
  }

  Future<void> _initAuth() async {
    final auth = ClerkAuth.of(context);

    try {
      await auth.refreshClient();
    } catch (_) {}

    const maxWait = Duration(seconds: 8);
    const step = Duration(milliseconds: 200);
    final deadline = DateTime.now().add(maxWait);

    while (mounted && DateTime.now().isBefore(deadline)) {
      if (auth.session != null) break;
      await Future.delayed(step);
    }

    if (!mounted) return;

    if (auth.session == null) {
      ref.read(authBootstrapProvider.notifier).reset();
      context.go('/login');
      return;
    }

    await ref.read(authBootstrapProvider.notifier).resolve();
  }

  @override
  Widget build(BuildContext context) {
    final bootstrap = ref.watch(authBootstrapProvider);
    final isError = bootstrap.status == AuthBootstrapStatus.error;

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset('assets/images/logo.png', height: 100)
                  .animate()
                  .fadeIn(duration: 800.ms)
                  .scale(begin: const Offset(0.8, 0.8)),
              const SizedBox(height: 24),
              if (isError) ...[
                Icon(Icons.cloud_off_rounded, size: 48, color: Colors.red.shade400),
                const SizedBox(height: 16),
                Text(
                  'تعذّر الاتصال بالحساب',
                  style: GoogleFonts.cairo(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  bootstrap.errorMessage ??
                      'تأكد من اتصال الإنترنت وتشغيل السيرفر ثم أعد المحاولة.',
                  style: GoogleFonts.cairo(
                    fontSize: 14,
                    color: Colors.grey.shade700,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: bootstrap.status == AuthBootstrapStatus.loading
                      ? null
                      : () => ref.read(authBootstrapProvider.notifier).resolve(),
                  icon: const Icon(Icons.refresh_rounded),
                  label: Text(
                    'إعادة المحاولة',
                    style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primaryOrange,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
              ] else
                const CircularProgressIndicator(color: AppColors.primaryOrange),
            ],
          ),
        ),
      ),
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
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final userRole = ref.watch(userRoleProvider);
    final isCompany = userRole == 'company';

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
            isCompany 
              ? _buildCustomNavItem(4, Icons.dashboard_outlined, Icons.dashboard_rounded, 'لوحتي')
              : _buildCustomNavItem(4, Icons.person_outline_rounded, Icons.person_rounded, 'حسابي'),
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
            color: selected ? AppColors.primaryOrange : (isDark ? Colors.white54 : Colors.grey.shade400),
            size: 26,
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: selected ? AppColors.primaryOrange : (isDark ? Colors.white54 : Colors.grey.shade400),
              fontSize: 10,
              fontWeight: selected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
