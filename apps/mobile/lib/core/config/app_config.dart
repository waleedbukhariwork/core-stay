import 'package:codecore_mobile/core/config/app_environment.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppConfig {
  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
  });

  factory AppConfig.fromEnvironment({
    TargetPlatform? platform,
    String envName = const String.fromEnvironment(
      'APP_ENV',
      defaultValue: 'local',
    ),
    String apiBaseUrl = const String.fromEnvironment('API_BASE_URL'),
  }) {
    final environment = AppEnvironment.values.asNameMap()[envName];
    if (environment == null) {
      throw ArgumentError.value(envName, 'APP_ENV', 'Unsupported environment');
    }

    if (apiBaseUrl.isNotEmpty) {
      return AppConfig(
        environment: environment,
        apiBaseUrl: Uri.parse(apiBaseUrl),
      );
    }

    if (environment == AppEnvironment.local) {
      return AppConfig(
        environment: environment,
        apiBaseUrl: localApiBaseUrl(platform ?? defaultTargetPlatform),
      );
    }

    throw StateError(
      'API_BASE_URL is required for the ${environment.name} environment',
    );
  }

  final AppEnvironment environment;
  final Uri apiBaseUrl;

  static Uri localApiBaseUrl(TargetPlatform platform) {
    final host = platform == TargetPlatform.android ? '10.0.2.2' : '127.0.0.1';
    return Uri.parse('http://$host:4999/api/v1');
  }
}

final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.fromEnvironment();
});
