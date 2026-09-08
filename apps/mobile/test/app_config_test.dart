import 'package:codecore_mobile/core/config/app_config.dart';
import 'package:codecore_mobile/core/config/app_environment.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('local Android uses the emulator host loopback', () {
    final config = AppConfig.fromEnvironment(
      platform: TargetPlatform.android,
    );

    expect(config.environment, AppEnvironment.local);
    expect(config.apiBaseUrl.toString(), 'http://10.0.2.2:4999/api/v1');
  });

  test('local iOS uses localhost', () {
    final config = AppConfig.fromEnvironment(
      platform: TargetPlatform.iOS,
    );

    expect(config.apiBaseUrl.toString(), 'http://127.0.0.1:4999/api/v1');
  });

  test('explicit API_BASE_URL wins over the local default', () {
    final config = AppConfig.fromEnvironment(
      platform: TargetPlatform.android,
      apiBaseUrl: 'https://example.test/api/v1',
    );

    expect(config.apiBaseUrl.toString(), 'https://example.test/api/v1');
  });

  test('non-local environments require API_BASE_URL', () {
    expect(
      () => AppConfig.fromEnvironment(envName: 'production'),
      throwsStateError,
    );
  });
}
