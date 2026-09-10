import 'package:codecore_mobile/core/config/app_config.dart';
import 'package:codecore_mobile/core/network/correlation_interceptor.dart';
import 'package:codecore_mobile/features/auth/data/auth_interceptor.dart';
import 'package:codecore_mobile/features/auth/data/auth_remote_service.dart';
import 'package:codecore_mobile/features/auth/data/auth_repository.dart';
import 'package:codecore_mobile/features/auth/data/secure_session_store.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

Dio _client(AppConfig config) => Dio(
  BaseOptions(
    baseUrl: config.apiBaseUrl.toString(),
    followRedirects: false,
    connectTimeout: const Duration(seconds: 8),
    receiveTimeout: const Duration(seconds: 12),
    sendTimeout: const Duration(seconds: 12),
    headers: {
      Headers.acceptHeader: Headers.jsonContentType,
      Headers.contentTypeHeader: Headers.jsonContentType,
    },
  ),
)..interceptors.add(CorrelationInterceptor());
final secureSessionStoreProvider = Provider<SecureSessionStore>(
  (ref) => PlatformSessionStore(),
);
final authRemoteProvider = Provider<AuthRemoteService>((ref) {
  final client = _client(ref.watch(appConfigProvider));
  ref.onDispose(client.close);
  return AuthRemoteService(client);
});
final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    ref.watch(authRemoteProvider),
    ref.watch(secureSessionStoreProvider),
    now: ref.watch(authNowProvider),
  ),
);
final authenticatedDioProvider = Provider<Dio>((ref) {
  final client = _client(ref.watch(appConfigProvider));
  client.interceptors.add(
    AuthInterceptor(ref.watch(authRepositoryProvider), client),
  );
  ref.onDispose(client.close);
  return client;
});

final authNowProvider = Provider<DateTime Function()>((ref) => DateTime.now);
