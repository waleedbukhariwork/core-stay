import 'dart:async';

import 'package:codecore_mobile/app/app.dart';
import 'package:codecore_mobile/app/router/app_router.dart';
import 'package:codecore_mobile/app/theme/theme_mode_controller.dart';
import 'package:codecore_mobile/features/auth/data/auth_providers.dart';
import 'package:codecore_mobile/features/entry/data/product_intro_store.dart';
import 'package:codecore_mobile/features/entry/presentation/account_entry_screen.dart';
import 'package:codecore_mobile/features/entry/presentation/product_intro_screen.dart';
import 'package:codecore_mobile/features/entry/presentation/splash_screen.dart';
import 'package:codecore_mobile/features/entry/presentation/welcome_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../auth/auth_test_support.dart';
import 'entry_test_support.dart';

Future<ProviderContainer> _start(
  WidgetTester tester,
  MemoryIntroPreferences preferences, {
  ThemeMode themeMode = ThemeMode.system,
}) async {
  final container = ProviderContainer(
    overrides: [
      secureSessionStoreProvider.overrideWithValue(MemorySessionStore()),
      productIntroStoreProvider.overrideWithValue(
        ProductIntroStore(preferences),
      ),
    ],
  );
  addTearDown(container.dispose);
  container.read(themeModeProvider.notifier).mode = themeMode;
  await tester.pumpWidget(
    UncontrolledProviderScope(container: container, child: const CodeCoreApp()),
  );
  expect(find.byType(SplashScreen), findsOneWidget);
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 700));
  await tester.pumpAndSettle();
  return container;
}

Future<void> _tap(WidgetTester tester, String label) async {
  final target = find.text(label);
  await tester.ensureVisible(target);
  await tester.tap(target);
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('fresh splash resolves to Welcome with a three-page preview', (
    tester,
  ) async {
    final preferences = MemoryIntroPreferences();
    await _start(tester, preferences);
    expect(find.byType(WelcomeScreen), findsOneWidget);
    await _tap(tester, 'Get started');
    expect(find.byType(ProductIntroScreen), findsOneWidget);
    expect(find.text('Stay current.'), findsOneWidget);
    expect(find.text('1 / 3'), findsOneWidget);
    expect(preferences.values, isEmpty);
  });

  testWidgets('existing-account action opens boundary and Back returns', (
    tester,
  ) async {
    final preferences = MemoryIntroPreferences();
    await _start(tester, preferences);
    await _tap(tester, 'I already have an account');
    expect(find.byType(AccountEntryScreen), findsOneWidget);
    expect(find.byType(TextField), findsNothing);
    expect(find.text('Create account'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
    expect(preferences.values, isEmpty);
    await _tap(tester, 'Back to welcome');
    expect(find.byType(WelcomeScreen), findsOneWidget);
    await _tap(tester, 'Get started');
    expect(find.byType(ProductIntroScreen), findsOneWidget);
  });

  testWidgets(
    'complete preview stores flag and removes intro from back stack',
    (
      tester,
    ) async {
      final preferences = MemoryIntroPreferences();
      final container = await _start(tester, preferences);
      await _tap(tester, 'Get started');
      await _tap(tester, 'Continue');
      expect(find.text('Stay sharp.'), findsOneWidget);
      await _tap(tester, 'Continue');
      expect(find.text('Know what to strengthen next.'), findsOneWidget);
      expect(find.text('3 / 3'), findsOneWidget);
      await _tap(tester, 'Create my profile');
      expect(find.byType(AccountEntryScreen), findsOneWidget);
      expect(preferences.values, {ProductIntroStore.completionKey: true});
      expect(container.read(routerProvider).canPop(), isFalse);
      await tester.pumpWidget(const SizedBox.shrink());
      await _start(tester, preferences);
      expect(find.byType(AccountEntryScreen), findsOneWidget);
      expect(find.byType(WelcomeScreen), findsNothing);
    },
  );

  for (var page = 0; page < 3; page++) {
    testWidgets('skip from page ${page + 1} persists and reaches boundary', (
      tester,
    ) async {
      final preferences = MemoryIntroPreferences();
      final container = await _start(tester, preferences);
      await _tap(tester, 'Get started');
      for (var i = 0; i < page; i++) {
        await _tap(tester, 'Continue');
      }
      await _tap(tester, 'Skip');
      expect(find.byType(AccountEntryScreen), findsOneWidget);
      expect(preferences.values, {ProductIntroStore.completionKey: true});
      expect(container.read(routerProvider).canPop(), isFalse);
      await tester.pumpWidget(const SizedBox.shrink());
      await _start(tester, preferences);
      expect(find.byType(AccountEntryScreen), findsOneWidget);
    });
  }

  testWidgets(
    'Back, system back, and swipes keep preview position consistent',
    (
      tester,
    ) async {
      final preferences = MemoryIntroPreferences();
      await _start(tester, preferences);
      await _tap(tester, 'Get started');
      await _tap(tester, 'Continue');
      await _tap(tester, 'Back');
      expect(find.text('1 / 3'), findsOneWidget);
      await tester.drag(find.byType(PageView), const Offset(-600, 0));
      await tester.pumpAndSettle();
      expect(find.text('2 / 3'), findsOneWidget);
      await tester.binding.handlePopRoute();
      await tester.pumpAndSettle();
      expect(find.text('1 / 3'), findsOneWidget);
      await tester.binding.handlePopRoute();
      await tester.pumpAndSettle();
      expect(find.byType(WelcomeScreen), findsOneWidget);
      expect(preferences.values, isEmpty);
    },
  );

  testWidgets(
    'repeated start and continue taps do not duplicate routes or pages',
    (
      tester,
    ) async {
      final container = await _start(tester, MemoryIntroPreferences());
      await tester.ensureVisible(find.text('Get started'));
      await tester.tap(find.text('Get started'));
      await tester.tap(find.text('Get started'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continue'));
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      expect(find.text('2 / 3'), findsOneWidget);
      await _tap(tester, 'Back');
      await _tap(tester, 'Back');
      expect(find.byType(WelcomeScreen), findsOneWidget);
      expect(container.read(routerProvider).canPop(), isFalse);
    },
  );

  testWidgets('repeated skip taps perform one write and one transition', (
    tester,
  ) async {
    final preferences = MemoryIntroPreferences()
      ..pendingWrite = Completer<void>();
    final container = await _start(tester, preferences);
    await _tap(tester, 'Get started');
    await tester.tap(find.text('Skip'));
    await tester.tap(find.text('Skip'));
    await tester.pump();
    expect(preferences.writes, 1);
    preferences.pendingWrite!.complete();
    await tester.pumpAndSettle();
    expect(find.byType(AccountEntryScreen), findsOneWidget);
    expect(container.read(routerProvider).canPop(), isFalse);
  });

  testWidgets('write failure still reaches account entry', (tester) async {
    final preferences = MemoryIntroPreferences()..failWrite = true;
    await _start(tester, preferences);
    await _tap(tester, 'Get started');
    await _tap(tester, 'Skip');
    expect(find.byType(AccountEntryScreen), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('returning user bypasses Welcome and intro', (tester) async {
    await _start(tester, MemoryIntroPreferences(value: true));
    expect(find.byType(AccountEntryScreen), findsOneWidget);
    expect(find.byType(WelcomeScreen), findsNothing);
    expect(find.byType(ProductIntroScreen), findsNothing);
  });

  for (final corrupt in [false, true]) {
    testWidgets(
      'startup falls back for ${corrupt ? 'corrupt' : 'unavailable'} storage',
      (
        tester,
      ) async {
        final preferences = MemoryIntroPreferences(
          value: corrupt ? 'true' : null,
        )..failRead = !corrupt;
        await _start(tester, preferences);
        expect(find.byType(WelcomeScreen), findsOneWidget);
        expect(tester.takeException(), isNull);
      },
    );
  }

  for (final mode in ThemeMode.values) {
    for (final scenario in const [
      (Size(320, 568), 1.0),
      (Size(320, 568), 2.0),
      (Size(412, 924), 1.0),
      (Size(393, 852), 1.6),
      (Size(844, 390), 2.0),
    ]) {
      testWidgets(
        'all entry pages fit $mode at ${scenario.$1}, text ${scenario.$2}',
        (
          tester,
        ) async {
          tester.view.physicalSize = scenario.$1;
          tester.view.devicePixelRatio = 1;
          tester.platformDispatcher.textScaleFactorTestValue = scenario.$2;
          tester.platformDispatcher.platformBrightnessTestValue =
              Brightness.dark;
          addTearDown(tester.view.resetPhysicalSize);
          addTearDown(tester.view.resetDevicePixelRatio);
          addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
          addTearDown(
            tester.platformDispatcher.clearPlatformBrightnessTestValue,
          );

          await _start(tester, MemoryIntroPreferences(), themeMode: mode);
          expect(tester.takeException(), isNull);
          final context = tester.element(find.byType(WelcomeScreen));
          expect(
            Theme.of(context).brightness,
            mode == ThemeMode.light ? Brightness.light : Brightness.dark,
          );
          expect(MediaQuery.textScalerOf(context).scale(10), scenario.$2 * 10);
          await _tap(tester, 'Get started');
          expect(tester.takeException(), isNull);
          await _tap(tester, 'Continue');
          expect(tester.takeException(), isNull);
          await _tap(tester, 'Continue');
          expect(tester.takeException(), isNull);
          await _tap(tester, 'Create my profile');
          expect(find.byType(AccountEntryScreen), findsOneWidget);
          expect(tester.takeException(), isNull);
        },
      );
    }
  }

  testWidgets('system theme responds to platform brightness changes', (
    tester,
  ) async {
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.light;
    addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);
    await _start(tester, MemoryIntroPreferences());
    expect(
      Theme.of(tester.element(find.byType(WelcomeScreen))).brightness,
      Brightness.light,
    );
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    await tester.pumpAndSettle();
    expect(
      Theme.of(tester.element(find.byType(WelcomeScreen))).brightness,
      Brightness.dark,
    );
  });

  testWidgets(
    'progress has an accessible page label and reduced motion works',
    (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      tester.platformDispatcher.accessibilityFeaturesTestValue =
          const FakeAccessibilityFeatures(disableAnimations: true);
      addTearDown(
        tester.platformDispatcher.clearAccessibilityFeaturesTestValue,
      );
      await _start(tester, MemoryIntroPreferences());
      await _tap(tester, 'Get started');
      expect(
        find.bySemanticsLabel('Product preview, page 1 of 3'),
        findsOneWidget,
      );
      await _tap(tester, 'Continue');
      expect(
        find.bySemanticsLabel('Product preview, page 2 of 3'),
        findsOneWidget,
      );
      expect(tester.takeException(), isNull);
      semantics.dispose();
    },
  );
}
