import 'package:codecore_mobile/core/errors/app_failure.dart';
import 'package:dio/dio.dart';

AppFailure mapDioException(DioException error) {
  switch (error.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return const TimeoutFailure();
    case DioExceptionType.connectionError:
      return const NetworkFailure();
    case DioExceptionType.badResponse:
      return ServerFailure(
        _safeServerMessage(error.response?.data),
        statusCode: error.response?.statusCode,
      );
    case DioExceptionType.cancel:
    case DioExceptionType.badCertificate:
    case DioExceptionType.transformTimeout:
    case DioExceptionType.unknown:
      return const UnknownFailure();
  }
}

String _safeServerMessage(Object? data) {
  if (data is Map<String, dynamic>) {
    final title = data['title'];
    if (title is String && title.isNotEmpty) {
      return title;
    }
  }
  return 'The server could not complete the request.';
}
