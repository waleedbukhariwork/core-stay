import 'dart:async';

import 'package:codecore_mobile/app/theme/app_theme.dart';
import 'package:codecore_mobile/core/errors/app_failure.dart';
import 'package:codecore_mobile/features/health/data/health_repository.dart';
import 'package:codecore_mobile/features/health/health_status.dart';
import 'package:codecore_mobile/features/health/presentation/health_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeHealthRepository implements HealthRepository {
  _FakeHealthRepository(this._onGet);

  final Future<HealthStatus> Function() _onGet;

  @override
  Future<HealthStatus> getHealth() => _onGet();
}

Widget _app(HealthRepository repository) {
  return ProviderScope(
    overrides: [
      healthRepositoryProvider.overrideWithValue(repository),
    ],
    child: MaterialApp(
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      home: const HealthScreen(),
    ),
  );
}

void main() {
  testWidgets('shows a loading indicator while health is pending', (
    tester,
  ) async {
    final completer = Completer<HealthStatus>();
    await tester.pumpWidget(
      _app(_FakeHealthRepository(() => completer.future)),
    );
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    completer.complete(const HealthStatus(ok: true));
    await tester.pumpAndSettle();
  });

  testWidgets('shows success after a healthy response', (tester) async {
    await tester.pumpWidget(
      _app(
        _FakeHealthRepository(() async => const HealthStatus(ok: true)),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('API healthy'), findsOneWidget);
  });

  testWidgets('shows an error and retries', (tester) async {
    var shouldFail = true;
    await tester.pumpWidget(
      _app(
        _FakeHealthRepository(() async {
          if (shouldFail) {
            throw const NetworkFailure();
          }
          return const HealthStatus(ok: true);
        }),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Health check failed'), findsOneWidget);
    expect(find.text('Unable to reach CodeCore.'), findsOneWidget);

    shouldFail = false;
    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();

    expect(find.text('API healthy'), findsOneWidget);
  });

  testWidgets('does not overflow on a compact width with large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 720);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(
          size: Size(320, 720),
          textScaler: TextScaler.linear(1.6),
        ),
        child: _app(
          _FakeHealthRepository(() async => const HealthStatus(ok: true)),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('API healthy'), findsOneWidget);
  });
}
