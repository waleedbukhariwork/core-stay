import 'package:codecore_mobile/features/health/data/health_repository.dart';
import 'package:codecore_mobile/features/health/health_status.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HealthNotifier extends AsyncNotifier<HealthStatus> {
  @override
  Future<HealthStatus> build() {
    return ref.read(healthRepositoryProvider).getHealth();
  }

  Future<void> retry() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(healthRepositoryProvider).getHealth(),
    );
  }
}

final healthProvider = AsyncNotifierProvider<HealthNotifier, HealthStatus>(
  HealthNotifier.new,
  retry: (retryCount, error) => null,
);
