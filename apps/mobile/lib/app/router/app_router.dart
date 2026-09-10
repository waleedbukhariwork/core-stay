import 'package:codecore_mobile/app/router/app_routes.dart';
import 'package:codecore_mobile/features/auth/domain/auth_state.dart';
import 'package:codecore_mobile/features/auth/presentation/auth_controller.dart';
import 'package:codecore_mobile/features/auth/presentation/credentials_screen.dart';
import 'package:codecore_mobile/features/auth/presentation/profile_boundary_screen.dart';
import 'package:codecore_mobile/features/auth/presentation/verify_email_screen.dart';
import 'package:codecore_mobile/features/entry/application/entry_controller.dart';
import 'package:codecore_mobile/features/entry/presentation/account_entry_screen.dart';
import 'package:codecore_mobile/features/entry/presentation/product_intro_screen.dart';
import 'package:codecore_mobile/features/entry/presentation/splash_screen.dart';
import 'package:codecore_mobile/features/entry/presentation/welcome_screen.dart';
import 'package:codecore_mobile/features/health/presentation/health_screen.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final _startupProvider = FutureProvider<void>((ref) async {
  await Future.wait([
    ref.read(entryControllerProvider.future),
    Future<void>.delayed(const Duration(milliseconds: 650)),
  ]);
});

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier(0);
  ref
    ..listen(_startupProvider, (_, _) => refresh.value++)
    ..listen(authControllerProvider, (_, _) => refresh.value++);
  final router = GoRouter(
    initialLocation: AppRoute.splash.path,
    refreshListenable: refresh,
    redirect: (context, state) {
      final ready = ref.read(_startupProvider).hasValue;
      final auth = ref.read(authControllerProvider);
      if (!ready || auth.phase == AuthPhase.checkingSession) {
        return state.uri.path == AppRoute.splash.path
            ? null
            : AppRoute.splash.path;
      }
      final path = state.uri.path;
      final requiredRoute = switch (auth.phase) {
        AuthPhase.authenticated => AppRoute.profile,
        AuthPhase.awaitingEmailVerification => AppRoute.verify,
        AuthPhase.recoverableNetworkFailure => AppRoute.recovery,
        _ => null,
      };
      if (requiredRoute != null) {
        return path == requiredRoute.path ? null : requiredRoute.path;
      }
      if ({
        AppRoute.profile.path,
        AppRoute.verify.path,
        AppRoute.recovery.path,
      }.contains(path)) {
        return AppRoute.auth.path;
      }
      if (state.uri.path == AppRoute.splash.path) {
        return ref.read(entryControllerProvider).value ?? false
            ? AppRoute.auth.path
            : AppRoute.welcome.path;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoute.register.path,
        name: AppRoute.register.name,
        builder: (context, state) => const CredentialsScreen(register: true),
      ),
      GoRoute(
        path: AppRoute.login.path,
        name: AppRoute.login.name,
        builder: (context, state) => const CredentialsScreen(register: false),
      ),
      GoRoute(
        path: AppRoute.verify.path,
        name: AppRoute.verify.name,
        builder: (context, state) => const VerifyEmailScreen(),
      ),
      GoRoute(
        path: AppRoute.profile.path,
        name: AppRoute.profile.name,
        builder: (context, state) => const ProfileBoundaryScreen(),
      ),
      GoRoute(
        path: AppRoute.recovery.path,
        name: AppRoute.recovery.name,
        builder: (context, state) => const SessionRecoveryScreen(),
      ),
      GoRoute(
        path: AppRoute.splash.path,
        name: AppRoute.splash.name,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoute.welcome.path,
        name: AppRoute.welcome.name,
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: AppRoute.intro.path,
        name: AppRoute.intro.name,
        builder: (context, state) => const ProductIntroScreen(),
      ),
      GoRoute(
        path: AppRoute.auth.path,
        name: AppRoute.auth.name,
        builder: (context, state) => const AccountEntryScreen(),
      ),
      GoRoute(
        path: AppRoute.health.path,
        name: AppRoute.health.name,
        builder: (context, state) => const HealthScreen(),
      ),
    ],
  );
  ref.onDispose(() {
    router.dispose();
    refresh.dispose();
  });
  return router;
});
