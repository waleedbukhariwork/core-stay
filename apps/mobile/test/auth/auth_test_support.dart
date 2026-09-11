import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:codecore_mobile/features/auth/data/auth_remote_service.dart';
import 'package:codecore_mobile/features/auth/data/secure_session_store.dart';
import 'package:dio/dio.dart';

class MemorySessionStore implements SecureSessionStore {
  String? token;
  int writes = 0;
  int clears = 0;
  bool failRead = false;
  bool failWrite = false;
  bool failClear = false;
  @override
  Future<String?> read() async {
    if (failRead) throw StateError('storage');
    return token;
  }

  @override
  Future<void> write(String value) async {
    if (failWrite) throw StateError('storage');
    writes++;
    token = value;
  }

  @override
  Future<void> clear() async {
    if (failClear) throw StateError('storage');
    clears++;
    token = null;
  }
}

Map<String, dynamic> sessionData([String suffix = '1']) => {
  'accessToken': 'access-$suffix',
  'refreshToken': 'refresh-$suffix',
  'expiresIn': 600,
  'user': {
    'id': 'user-1',
    'email': 'engineer@example.com',
    'emailVerified': true,
    'status': 'active',
  },
};

class FakeAuthRemote extends AuthRemoteService {
  FakeAuthRemote() : super(Dio());
  final calls = <String>[];
  Future<Map<String, dynamic>> Function(String, Map<String, dynamic>)? respond;
  @override
  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body,
  ) async {
    calls.add(path);
    if (respond != null) return respond!(path, body);
    if (path == 'register' || path == 'email-verification/resend') {
      return {'resendAfter': 60, 'expiresIn': 600};
    }
    return sessionData();
  }
}

class CallbackAdapter implements HttpClientAdapter {
  CallbackAdapter(this.respond);
  final FutureOr<ResponseBody> Function(RequestOptions) respond;
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async => respond(options);
  @override
  void close({bool force = false}) {}
}

ResponseBody jsonResponse(Object body, [int status = 200]) =>
    ResponseBody.fromString(
      jsonEncode(body),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );

Map<String, dynamic> profileCatalogData() {
  const choices = {
    'goals': ('stay_current', 'Stay current in my field'),
    'role': ('backend', 'Backend'),
    'experience': ('years_1_3', '1–3 years'),
    'technologies': ('typescript', 'TypeScript'),
    'focusAreas': ('debugging', 'Debugging'),
    'dailyMinutes': (10, '10 minutes'),
    'learningPreferences': ('challenge_first', 'Challenge me first'),
  };
  return {
    for (final entry in choices.entries)
      entry.key: [
        {
          'id': entry.value.$1,
          'label': entry.value.$2,
          'enabled': true,
          'order': 0,
          'category': null,
          'exclusiveGroup': null,
          'recommended': entry.key == 'dailyMinutes',
        },
      ],
  };
}
