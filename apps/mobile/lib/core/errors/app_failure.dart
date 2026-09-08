sealed class AppFailure implements Exception {
  const AppFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

final class NetworkFailure extends AppFailure {
  const NetworkFailure([super.message = 'Unable to reach CodeCore.']);
}

final class TimeoutFailure extends AppFailure {
  const TimeoutFailure([super.message = 'The request timed out.']);
}

final class ServerFailure extends AppFailure {
  const ServerFailure(
    super.message, {
    this.statusCode,
  });

  final int? statusCode;
}

final class UnknownFailure extends AppFailure {
  const UnknownFailure([super.message = 'Something went wrong.']);
}
