import 'package:codecore_mobile/core/errors/app_failure.dart';
import 'package:codecore_mobile/core/network/api_client.dart';
import 'package:codecore_mobile/features/health/health_status.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HealthRepository {
  HealthRepository(this._client);

  final ApiClient _client;

  Future<HealthStatus> getHealth() async {
    final payload = await _client.getJson('/health');
    final data = payload['data'];
    if (data is Map<String, dynamic> && data['status'] == 'ok') {
      return const HealthStatus(ok: true);
    }
    throw const ServerFailure('Health check returned an unexpected payload.');
  }
}

final healthRepositoryProvider = Provider<HealthRepository>((ref) {
  return HealthRepository(ref.watch(apiClientProvider));
});
