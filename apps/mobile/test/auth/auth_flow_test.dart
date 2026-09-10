import 'dart:async';

import 'package:codecore_mobile/app/app.dart';
import 'package:codecore_mobile/app/router/app_router.dart';
import 'package:codecore_mobile/app/router/app_routes.dart';
import 'package:codecore_mobile/app/theme/theme_mode_controller.dart';
import 'package:codecore_mobile/features/auth/data/auth_providers.dart';
import 'package:codecore_mobile/features/auth/data/auth_repository.dart';
import 'package:codecore_mobile/features/auth/domain/auth_state.dart';
import 'package:codecore_mobile/features/auth/presentation/auth_controller.dart';
import 'package:codecore_mobile/features/auth/presentation/credentials_screen.dart';
import 'package:codecore_mobile/features/auth/presentation/profile_boundary_screen.dart';
import 'package:codecore_mobile/features/auth/presentation/verify_email_screen.dart';
import 'package:codecore_mobile/features/entry/data/product_intro_store.dart';
import 'package:codecore_mobile/features/entry/presentation/account_entry_screen.dart';
import 'package:codecore_mobile/features/entry/presentation/welcome_screen.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../entry/entry_test_support.dart';
import 'auth_test_support.dart';

Future<ProviderContainer> start(
  WidgetTester tester, {
  FakeAuthRemote? remote,
  MemorySessionStore? store,
  bool seen = true,
  ThemeMode theme = ThemeMode.light,
  DateTime Function()? now,
}) async {
  final repository = AuthRepository(
    remote ?? FakeAuthRemote(),
    store ?? MemorySessionStore(),
    now: now,
  );
  final authenticated = Dio()
    ..httpClientAdapter = CallbackAdapter((_) => jsonResponse({}, 204));
  final container = ProviderContainer(
    overrides: [
      authRepositoryProvider.overrideWithValue(repository),
      authenticatedDioProvider.overrideWithValue(authenticated),
      if (now != null) authNowProvider.overrideWithValue(now),
      productIntroStoreProvider.overrideWithValue(
        ProductIntroStore(MemoryIntroPreferences(value: seen)),
      ),
    ],
  );
  addTearDown(container.dispose);
  container.read(themeModeProvider.notifier).mode = theme;
  await tester.pumpWidget(
    UncontrolledProviderScope(container: container, child: const CodeCoreApp()),
  );
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 700));
  await tester.pumpAndSettle();
  return container;
}

Future<void> tap(WidgetTester tester, String text) async {
  final button = find.ancestor(
    of: find.text(text),
    matching: find.byWidgetPredicate((widget) => widget is ButtonStyleButton),
  );
  final target = button.evaluate().isNotEmpty
      ? button.last
      : find.text(text).last;
  await tester.ensureVisible(target);
  await tester.tap(target);
  await tester.pumpAndSettle();
}

Future<void> fill(WidgetTester tester, {bool register = true}) async {
  final fields = find.byType(TextFormField);
  await tester.enterText(fields.at(0), 'engineer@example.com');
  await tester.enterText(fields.at(1), 'a safe long passphrase');
  if (register) await tester.enterText(fields.at(2), 'a safe long passphrase');
}

void main() {
  testWidgets('account entry offers functional register and login actions', (
    tester,
  ) async {
    final container = await start(tester);
    await tap(tester, 'Create account');
    expect(find.byType(CredentialsScreen), findsOneWidget);
    container.read(routerProvider).goNamed(AppRoute.auth.name);
    await tester.pumpAndSettle();
    await tap(tester, 'Sign in');
    expect(find.text('Welcome back.'), findsOneWidget);
  });
  testWidgets('registration validates email, passphrase and confirmation', (
    tester,
  ) async {
    final remote = FakeAuthRemote();
    await start(tester, remote: remote);
    await tap(tester, 'Create account');
    await tap(tester, 'Create account');
    expect(find.text('Enter a valid email address.'), findsOneWidget);
    expect(find.text('Use 12–128 characters.'), findsOneWidget);
    await fill(tester);
    await tester.enterText(find.byType(TextFormField).at(2), 'different');
    await tap(tester, 'Create account');
    expect(find.text('Passwords must match.'), findsOneWidget);
    expect(remote.calls, isEmpty);
  });
  testWidgets(
    'registration loading prevents duplicate submits '
    'and routes to verification',
    (tester) async {
      final remote = FakeAuthRemote();
      final pending = Completer<Map<String, dynamic>>();
      remote.respond = (_, _) => pending.future;
      await start(tester, remote: remote);
      await tap(tester, 'Create account');
      await fill(tester);
      final button = find.widgetWithText(FilledButton, 'Create account');
      await tester.ensureVisible(button);
      await tester.tap(button);
      await tester.pump();
      expect(tester.widget<FilledButton>(button).onPressed, isNull);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester.tap(button);
      expect(remote.calls, ['register']);
      pending.complete({'resendAfter': 60});
      await tester.pumpAndSettle();
      expect(find.byType(VerifyEmailScreen), findsOneWidget);
    },
  );
  testWidgets('registration error is safe and retryable', (tester) async {
    final remote = FakeAuthRemote()
      ..respond = (_, _) async =>
          throw const AuthFailure('ACCOUNT_ALREADY_EXISTS');
    await start(tester, remote: remote);
    await tap(tester, 'Create account');
    await fill(tester);
    await tap(tester, 'Create account');
    expect(
      find.text('An account already exists. Please sign in.'),
      findsOneWidget,
    );
    expect(
      tester
          .widget<FilledButton>(
            find.widgetWithText(FilledButton, 'Create account'),
          )
          .onPressed,
      isNotNull,
    );
  });
  testWidgets('verification validates code and displays server expiration', (
    tester,
  ) async {
    final remote = FakeAuthRemote();
    final container = await start(tester, remote: remote);
    await container
        .read(authControllerProvider.notifier)
        .register('engineer@example.com', 'safe passphrase');
    await tester.pumpAndSettle();
    await tap(tester, 'Verify email');
    expect(find.text('Enter the six-digit code.'), findsOneWidget);
    remote.respond = (_, _) async =>
        throw const AuthFailure('VERIFICATION_EXPIRED');
    await tester.enterText(find.byType(TextFormField), '123456');
    await tap(tester, 'Verify email');
    expect(
      find.text('That code has expired. Request a new code.'),
      findsOneWidget,
    );
  });
  testWidgets(
    'verification success routes to authenticated boundary and logout works',
    (tester) async {
      final store = MemorySessionStore();
      final container = await start(tester, store: store);
      await container
          .read(authControllerProvider.notifier)
          .register('engineer@example.com', 'safe passphrase');
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField), '123456');
      await tap(tester, 'Verify email');
      expect(find.byType(ProfileBoundaryScreen), findsOneWidget);
      expect(find.text('engineer@example.com'), findsOneWidget);
      expect(store.token, 'refresh-1');
      await tap(tester, 'Sign out');
      expect(find.byType(AccountEntryScreen), findsOneWidget);
      expect(store.token, isNull);
    },
  );
  testWidgets(
    'resend cooldown disables repeated send and resets after success',
    (tester) async {
      var now = DateTime(2026, 9);
      final remote = FakeAuthRemote();
      final container = await start(tester, remote: remote, now: () => now);
      await container
          .read(authControllerProvider.notifier)
          .register('engineer@example.com', 'safe passphrase');
      await tester.pumpAndSettle();
      expect(find.text('Resend code in 60s'), findsOneWidget);
      expect(
        tester
            .widget<TextButton>(
              find.widgetWithText(TextButton, 'Resend code in 60s'),
            )
            .onPressed,
        isNull,
      );
      now = now.add(const Duration(seconds: 60));
      await tester.pump(const Duration(seconds: 1));
      await tap(tester, 'Resend code');
      expect(remote.calls, ['register', 'email-verification/resend']);
      expect(find.text('Resend code in 60s'), findsOneWidget);
    },
  );
  testWidgets(
    'login invalid credentials are generic and success routes to profile',
    (tester) async {
      final remote = FakeAuthRemote()
        ..respond = (_, _) async =>
            throw const AuthFailure('INVALID_CREDENTIALS');
      await start(tester, remote: remote);
      await tap(tester, 'Sign in');
      await fill(tester, register: false);
      await tap(tester, 'Sign in');
      expect(find.text('Email or password is incorrect.'), findsOneWidget);
      remote.respond = (_, _) async => sessionData();
      await tap(tester, 'Sign in');
      expect(find.byType(ProfileBoundaryScreen), findsOneWidget);
    },
  );
  testWidgets('unverified login resumes email verification', (tester) async {
    final remote = FakeAuthRemote()
      ..respond = (_, _) async => throw const AuthFailure('EMAIL_NOT_VERIFIED');
    await start(tester, remote: remote);
    await tap(tester, 'Sign in');
    await fill(tester, register: false);
    await tap(tester, 'Sign in');
    expect(find.byType(VerifyEmailScreen), findsOneWidget);
  });
  testWidgets('restored session bypasses first-run intro', (tester) async {
    final store = MemorySessionStore()..token = 'saved';
    await start(tester, store: store, seen: false);
    expect(find.byType(ProfileBoundaryScreen), findsOneWidget);
  });
  testWidgets('missing session preserves first-run welcome', (tester) async {
    await start(tester, seen: false);
    expect(find.byType(WelcomeScreen), findsOneWidget);
  });
  testWidgets(
    'rejected startup session routes returning users to account entry',
    (tester) async {
      final remote = FakeAuthRemote()
        ..respond = (_, _) async => throw const AuthFailure('SESSION_REVOKED');
      final store = MemorySessionStore()..token = 'saved';
      await start(tester, remote: remote, store: store);
      expect(find.byType(AccountEntryScreen), findsOneWidget);
    },
  );
  testWidgets('offline restoration preserves token and offers retry', (
    tester,
  ) async {
    final remote = FakeAuthRemote()
      ..respond = (_, _) async => throw const AuthFailure('NETWORK');
    final store = MemorySessionStore()..token = 'saved';
    await start(tester, remote: remote, store: store);
    expect(find.byType(SessionRecoveryScreen), findsOneWidget);
    expect(store.token, 'saved');
    remote.respond = (_, _) async => sessionData();
    await tap(tester, 'Retry');
    expect(find.byType(ProfileBoundaryScreen), findsOneWidget);
  });
  testWidgets('unauthenticated deep link cannot reach profile boundary', (
    tester,
  ) async {
    final container = await start(tester);
    container.read(routerProvider).goNamed(AppRoute.profile.name);
    await tester.pumpAndSettle();
    expect(find.byType(AccountEntryScreen), findsOneWidget);
  });
  for (final theme in [ThemeMode.light, ThemeMode.dark]) {
    for (final scale in [1.0, 2.0]) {
      testWidgets('auth screens fit compact layout in $theme at scale $scale', (
        tester,
      ) async {
        tester.view.physicalSize = const Size(320, 568);
        tester.view.devicePixelRatio = 1;
        tester.platformDispatcher.textScaleFactorTestValue = scale;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
        final container = await start(tester, theme: theme);
        await tap(tester, 'Create account');
        expect(tester.takeException(), isNull);
        await fill(tester);
        await tap(tester, 'Create account');
        expect(find.byType(VerifyEmailScreen), findsOneWidget);
        expect(tester.takeException(), isNull);
        await tester.enterText(find.byType(TextFormField), '123456');
        await tap(tester, 'Verify email');
        expect(find.byType(ProfileBoundaryScreen), findsOneWidget);
        expect(tester.takeException(), isNull);
        await tap(tester, 'Sign out');
        container.read(routerProvider).goNamed(AppRoute.login.name);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      });
    }
  }
}
