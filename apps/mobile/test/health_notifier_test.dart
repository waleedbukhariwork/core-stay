import 'package:codecore_mobile/core/errors/app_failure.dart';
import 'package:codecore_mobile/features/health/data/health_repository.dart';
import 'package:codecore_mobile/features/health/health_status.dart';
import 'package:codecore_mobile/features/health/presentation/health_notifier.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeHealthRepository implements HealthRepository {
  _FakeHealthRepository(this._onGet);

  final Future<HealthStatus> Function() _onGet;
  int calls = 0;

  @override
  Future<HealthStatus> getHealth() {
    calls += 1;
    return _onGet();
  }
}

void main() {
  test('health notifier loads a successful status', () async {
    final repository = _FakeHealthRepository(
      () async => const HealthStatus(ok: true),
    );
    final container = ProviderContainer(
      overrides: [
        healthRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);

    final status = await container.read(healthProvider.future);
    expect(status.ok, isTrue);
    expect(repository.calls, 1);
  });

  test('health notifier surfaces failures and retry is explicit', () async {
    var shouldFail = true;
    final repository = _FakeHealthRepository(() async {
      if (shouldFail) {
        throw const NetworkFailure();
      }
      return const HealthStatus(ok: true);
    });
    final container = ProviderContainer(
      overrides: [
        healthRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);

    await expectLater(
      container.read(healthProvider.future),
      throwsA(isA<NetworkFailure>()),
    );

    shouldFail = false;
    await container.read(healthProvider.notifier).retry();
    expect(container.read(healthProvider).asData?.value.ok, isTrue);
    expect(repository.calls, 2);
  });
}
