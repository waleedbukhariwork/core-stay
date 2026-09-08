import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class CorrelationInterceptor extends Interceptor {
  CorrelationInterceptor({Random? random})
    : _random = random ?? Random.secure();

  final Random _random;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.headers.putIfAbsent('X-Request-Id', _requestId);
    options.headers.putIfAbsent(
      'X-App-Platform',
      () => defaultTargetPlatform.name,
    );
    handler.next(options);
  }

  String _requestId() {
    final bytes = List<int>.generate(16, (_) => _random.nextInt(256));
    return bytes.map((byte) => byte.toRadixString(16).padLeft(2, '0')).join();
  }
}
