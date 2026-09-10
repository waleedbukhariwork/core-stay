import 'package:codecore_mobile/features/auth/data/auth_repository.dart';
import 'package:codecore_mobile/features/auth/domain/auth_state.dart';
import 'package:dio/dio.dart';

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this.repository, this.client);
  final AuthRepository repository;
  final Dio client;
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.uri.origin != Uri.parse(client.options.baseUrl).origin) {
      handler.reject(
        DioException(
          requestOptions: options,
          error: const AuthFailure('UNTRUSTED_ORIGIN'),
        ),
      );
      return;
    }
    options.extra['authGeneration'] ??= repository.generation;
    final token = repository.accessToken;
    if (token != null) options.headers['Authorization'] = 'Bearer $token';
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final request = err.requestOptions;
    final data = err.response?.data;
    if (request.extra['authGeneration'] != repository.generation) {
      handler.next(err);
      return;
    }
    final eligible =
        err.response?.statusCode == 401 &&
        data is Map<String, dynamic> &&
        data['code'] == 'ACCESS_TOKEN_EXPIRED' &&
        request.extra['authRetried'] != true &&
        request.headers['Authorization'] != null &&
        request.data is! Stream &&
        request.data is! FormData;
    if (err.response?.statusCode == 401 &&
        data is Map<String, dynamic> &&
        AuthFailure(data['code'] as String? ?? '').rejectsSession) {
      try {
        await repository.rejectSession();
      } on AuthFailure catch (failure) {
        handler.next(DioException(requestOptions: request, error: failure));
        return;
      }
    }
    if (!eligible) {
      handler.next(err);
      return;
    }
    try {
      // A late 401 can use the access token from the completed refresh.
      if (request.headers['Authorization'] ==
          'Bearer ${repository.accessToken}') {
        await repository.refresh();
      }
      request.extra['authRetried'] = true;
      request.headers['Authorization'] = 'Bearer ${repository.accessToken}';
      handler.resolve(await client.fetch<dynamic>(request));
    } on DioException catch (failure) {
      handler.next(failure);
    } on AuthFailure catch (failure) {
      handler.next(DioException(requestOptions: request, error: failure));
    } on Object {
      handler.next(
        DioException(
          requestOptions: request,
          error: const AuthFailure('SERVER'),
        ),
      );
    }
  }
}
