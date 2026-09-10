import 'dart:async';

import 'package:codecore_mobile/features/auth/data/auth_interceptor.dart';
import 'package:codecore_mobile/features/auth/data/auth_remote_service.dart';
import 'package:codecore_mobile/features/auth/data/auth_repository.dart';
import 'package:codecore_mobile/features/auth/data/secure_session_store.dart';
import 'package:codecore_mobile/features/auth/domain/auth_state.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

import 'auth_test_support.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late FakeAuthRemote remote;
  late MemorySessionStore store;
  late AuthRepository repository;
  late List<AuthState> states;
  setUp(() {
    remote = FakeAuthRemote();
    store = MemorySessionStore();
    states = [];
    repository = AuthRepository(remote, store)..onState = states.add;
  });
  test('secure platform store persists only refresh material', () async {
    FlutterSecureStorage.setMockInitialValues({});
    final platform = PlatformSessionStore();
    await platform.write('opaque-token');
    expect(await PlatformSessionStore().read(), 'opaque-token');
    expect(await const FlutterSecureStorage().readAll(), {
      PlatformSessionStore.key: 'opaque-token',
    });
    await platform.clear();
    expect(await platform.read(), isNull);
  });
  test(
    'empty startup resolves to unauthenticated without network calls',
    () async {
      await repository.restore();
      expect(states.last.phase, AuthPhase.unauthenticated);
      expect(remote.calls, isEmpty);
    },
  );
  test('registration enters verification without persisting secrets', () async {
    await repository.register('engineer@example.com', 'safe passphrase');
    expect(states.last.phase, AuthPhase.awaitingEmailVerification);
    expect(states.last.email, 'engineer@example.com');
    expect(store.token, isNull);
    expect(states.last.resendAt!.isAfter(DateTime.now()), isTrue);
  });
  test('pending registration resumes verification', () async {
    remote.respond = (_, _) async =>
        throw const AuthFailure('REGISTRATION_PENDING');
    await repository.register('engineer@example.com', 'safe passphrase');
    expect(states.last.phase, AuthPhase.awaitingEmailVerification);
  });
  test('verified login stores refresh and keeps access in memory', () async {
    await repository.login('engineer@example.com', 'safe passphrase');
    expect(states.last.phase, AuthPhase.authenticated);
    expect(store.token, 'refresh-1');
    expect(repository.accessToken, 'access-1');
    expect(store.writes, 1);
  });
  test('valid unverified credentials resume verification', () async {
    remote.respond = (_, _) async =>
        throw const AuthFailure('EMAIL_NOT_VERIFIED');
    await repository.login('engineer@example.com', 'safe passphrase');
    expect(states.last.phase, AuthPhase.awaitingEmailVerification);
    expect(store.token, isNull);
  });
  test('verification establishes a persistent session', () async {
    await repository.verify('engineer@example.com', '123456');
    expect(states.last.phase, AuthPhase.authenticated);
    expect(store.token, 'refresh-1');
  });
  test('restart restores by rotating persisted refresh token', () async {
    store.token = 'previous-refresh';
    remote.respond = (path, body) async {
      expect(path, 'refresh');
      expect(body, {'refreshToken': 'previous-refresh'});
      return sessionData('2');
    };
    await repository.restore();
    expect(states.last.phase, AuthPhase.authenticated);
    expect(store.token, 'refresh-2');
    expect(repository.accessToken, 'access-2');
  });
  test('concurrent refresh requests share one operation', () async {
    await repository.login('engineer@example.com', 'safe passphrase');
    final pending = Completer<Map<String, dynamic>>();
    remote.respond = (_, _) => pending.future;
    final first = repository.refresh();
    final second = repository.refresh();
    expect(remote.calls.where((p) => p == 'refresh'), hasLength(1));
    pending.complete(sessionData('2'));
    await Future.wait([first, second]);
    expect(store.token, 'refresh-2');
    expect(store.writes, 2);
  });
  for (final code in [
    'SESSION_REVOKED',
    'SESSION_EXPIRED',
    'REFRESH_TOKEN_INVALID',
  ]) {
    test('$code clears persisted state on restore', () async {
      store.token = 'saved';
      remote.respond = (_, _) async => throw AuthFailure(code);
      await repository.restore();
      expect(store.token, isNull);
      expect(repository.accessToken, isNull);
      expect(states.last.phase, AuthPhase.unauthenticated);
    });
  }
  test('network refresh failure preserves token and supports retry', () async {
    store.token = 'saved';
    remote.respond = (_, _) async => throw const AuthFailure('NETWORK');
    await repository.restore();
    expect(store.token, 'saved');
    expect(store.clears, 0);
    expect(states.last.phase, AuthPhase.recoverableNetworkFailure);
    remote.respond = (_, _) async => sessionData('2');
    await repository.restore();
    expect(states.last.phase, AuthPhase.authenticated);
  });
  test(
    'malformed session response preserves the saved token and recovers',
    () async {
      store.token = 'saved';
      remote.respond = (_, _) async => {'accessToken': 'incomplete'};
      await repository.restore();
      expect(store.token, 'saved');
      expect(states.last.phase, AuthPhase.recoverableNetworkFailure);
    },
  );
  test('remote rejects a malformed success envelope safely', () async {
    final client = Dio()
      ..httpClientAdapter = CallbackAdapter(
        (_) => jsonResponse({'data': 'invalid'}),
      );
    await expectLater(
      AuthRemoteService(client).post('refresh', {}),
      throwsA(
        isA<AuthFailure>().having((error) => error.code, 'code', 'SERVER'),
      ),
    );
  });
  test('server failure preserves refresh material', () async {
    store.token = 'saved';
    remote.respond = (_, _) async => throw const AuthFailure('SERVER');
    await repository.restore();
    expect(store.token, 'saved');
    expect(states.last.phase, AuthPhase.recoverableNetworkFailure);
  });
  test(
    'storage read failure is recoverable rather than first-run logout',
    () async {
      store.failRead = true;
      await repository.restore();
      expect(states.last.phase, AuthPhase.recoverableNetworkFailure);
      expect(remote.calls, isEmpty);
    },
  );
  test(
    'rotated token storage failure retries save without reusing old token',
    () async {
      store
        ..token = 'saved'
        ..failWrite = true;
      await repository.restore();
      expect(states.last.phase, AuthPhase.recoverableNetworkFailure);
      expect(store.token, 'saved');
      store.failWrite = false;
      await repository.restore();
      expect(remote.calls, ['refresh']);
      expect(store.token, 'refresh-1');
      expect(states.last.phase, AuthPhase.authenticated);
    },
  );
  test(
    'rejected token is not reused when secure deletion temporarily fails',
    () async {
      store
        ..token = 'saved'
        ..failClear = true;
      remote.respond = (_, _) async =>
          throw const AuthFailure('SESSION_REVOKED');
      await repository.restore();
      expect(states.last.phase, AuthPhase.recoverableNetworkFailure);
      store.failClear = false;
      await repository.restore();
      expect(remote.calls, ['refresh']);
      expect(store.token, isNull);
      expect(states.last.phase, AuthPhase.unauthenticated);
    },
  );
  test('logout revokes remotely then clears local session', () async {
    await repository.login('engineer@example.com', 'safe passphrase');
    final client = Dio()
      ..httpClientAdapter = CallbackAdapter((options) {
        expect(options.path, '/auth/logout');
        return jsonResponse({}, 204);
      });
    await repository.logout(client);
    expect(store.token, isNull);
    expect(repository.accessToken, isNull);
    expect(states.last.phase, AuthPhase.unauthenticated);
  });
  test('offline logout does not discard a still-live session', () async {
    await repository.login('engineer@example.com', 'safe passphrase');
    final client = Dio()
      ..httpClientAdapter = CallbackAdapter(
        (options) => throw DioException(
          requestOptions: options,
          type: DioExceptionType.connectionError,
        ),
      );
    await expectLater(repository.logout(client), throwsA(isA<AuthFailure>()));
    expect(store.token, 'refresh-1');
  });
  test('in-flight refresh cannot resurrect a session after logout', () async {
    await repository.login('engineer@example.com', 'safe passphrase');
    final pending = Completer<Map<String, dynamic>>();
    remote.respond = (_, _) => pending.future;
    final refresh = repository.refresh();
    final rejected = expectLater(refresh, throwsA(isA<AuthFailure>()));
    final client = Dio()
      ..httpClientAdapter = CallbackAdapter((_) => jsonResponse({}, 204));
    await repository.logout(client);
    pending.complete(sessionData('2'));
    await rejected;
    expect(store.token, isNull);
    expect(repository.accessToken, isNull);
    expect(states.last.phase, AuthPhase.unauthenticated);
  });
  group('Dio authenticated coordination', () {
    late Dio client;
    setUp(() async {
      await repository.login('engineer@example.com', 'safe passphrase');
      client = Dio(BaseOptions(baseUrl: 'https://example.com/api/v1'));
      client.interceptors.add(AuthInterceptor(repository, client));
    });
    test(
      'concurrent expired requests refresh once and retry each once',
      () async {
        final pending = Completer<Map<String, dynamic>>();
        final started = Completer<void>();
        remote.respond = (_, _) {
          if (!started.isCompleted) started.complete();
          return pending.future;
        };
        final oldRequests = Completer<void>();
        var old = 0;
        var retried = 0;
        client.httpClientAdapter = CallbackAdapter((options) {
          if (options.headers['Authorization'] == 'Bearer access-1') {
            if (++old == 3) oldRequests.complete();
            return jsonResponse({'code': 'ACCESS_TOKEN_EXPIRED'}, 401);
          }
          retried++;
          expect(options.extra['authRetried'], isTrue);
          expect(options.headers['Authorization'], 'Bearer access-2');
          return jsonResponse({'data': 'ok'});
        });
        final requests = List.generate(
          3,
          (_) => client.get<dynamic>('/auth/me'),
        );
        await oldRequests.future;
        await started.future;
        expect(remote.calls.where((p) => p == 'refresh'), hasLength(1));
        pending.complete(sessionData('2'));
        await Future.wait(requests);
        expect(retried, 3);
        expect(old, 3);
      },
    );
    test('authenticated client refuses a different origin', () async {
      var dispatched = false;
      client.httpClientAdapter = CallbackAdapter((_) {
        dispatched = true;
        return jsonResponse({});
      });
      await expectLater(
        client.get<dynamic>('https://other.example/auth/me'),
        throwsA(isA<DioException>()),
      );
      expect(dispatched, isFalse);
    });
    test(
      'late rejection from a previous session cannot clear a new login',
      () async {
        final pending = Completer<ResponseBody>();
        final dispatched = Completer<void>();
        client.httpClientAdapter = CallbackAdapter((_) {
          dispatched.complete();
          return pending.future;
        });
        final oldRequest = client.get<dynamic>('/auth/me');
        final rejected = expectLater(oldRequest, throwsA(isA<DioException>()));
        await dispatched.future;
        await repository.rejectSession();
        remote.respond = (_, _) async => sessionData('new-login');
        await repository.login('engineer@example.com', 'safe passphrase');
        pending.complete(jsonResponse({'code': 'SESSION_REVOKED'}, 401));
        await rejected;
        expect(store.token, 'refresh-new-login');
        expect(states.last.phase, AuthPhase.authenticated);
      },
    );
    test('late stale 401 uses replacement without a second refresh', () async {
      final stale = Completer<ResponseBody>();
      var count = 0;
      remote.respond = (_, _) async => sessionData('2');
      client.httpClientAdapter = CallbackAdapter((options) {
        if (options.path == '/slow' &&
            options.headers['Authorization'] == 'Bearer access-1') {
          return stale.future;
        }
        if (options.headers['Authorization'] == 'Bearer access-1') {
          return jsonResponse({'code': 'ACCESS_TOKEN_EXPIRED'}, 401);
        }
        count++;
        return jsonResponse({});
      });
      final slow = client.get<dynamic>('/slow');
      await client.get<dynamic>('/fast');
      stale.complete(jsonResponse({'code': 'ACCESS_TOKEN_EXPIRED'}, 401));
      await slow;
      expect(count, 2);
      expect(remote.calls.where((p) => p == 'refresh'), hasLength(1));
    });
    test('a second expiry is not retried recursively', () async {
      remote.respond = (_, _) async => sessionData('2');
      var calls = 0;
      client.httpClientAdapter = CallbackAdapter((_) {
        calls++;
        return jsonResponse({'code': 'ACCESS_TOKEN_EXPIRED'}, 401);
      });
      await expectLater(
        client.get<dynamic>('/auth/me'),
        throwsA(isA<DioException>()),
      );
      expect(calls, 2);
      expect(remote.calls.where((p) => p == 'refresh'), hasLength(1));
    });
    for (final item in [
      (401, 'INVALID_CREDENTIALS'),
      (403, 'FORBIDDEN'),
      (400, 'VALIDATION_FAILED'),
      (401, 'ACCESS_TOKEN_INVALID'),
    ]) {
      test('${item.$2} does not trigger refresh', () async {
        client.httpClientAdapter = CallbackAdapter(
          (_) => jsonResponse({'code': item.$2}, item.$1),
        );
        await expectLater(
          client.get<dynamic>('/auth/me'),
          throwsA(isA<DioException>()),
        );
        expect(remote.calls, ['login']);
      });
    }
    test(
      'confirmed session rejection from a protected endpoint clears state',
      () async {
        client.httpClientAdapter = CallbackAdapter(
          (_) => jsonResponse({'code': 'SESSION_REVOKED'}, 401),
        );
        await expectLater(
          client.get<dynamic>('/auth/me'),
          throwsA(isA<DioException>()),
        );
        expect(store.token, isNull);
        expect(states.last.phase, AuthPhase.unauthenticated);
      },
    );
    test('rejected automatic refresh clears session', () async {
      remote.respond = (_, _) async =>
          throw const AuthFailure('SESSION_REVOKED');
      client.httpClientAdapter = CallbackAdapter(
        (_) => jsonResponse({'code': 'ACCESS_TOKEN_EXPIRED'}, 401),
      );
      await expectLater(
        client.get<dynamic>('/auth/me'),
        throwsA(isA<DioException>()),
      );
      expect(store.token, isNull);
      expect(states.last.phase, AuthPhase.unauthenticated);
    });
    test('network failure in automatic refresh preserves material', () async {
      remote.respond = (_, _) async => throw const AuthFailure('NETWORK');
      client.httpClientAdapter = CallbackAdapter(
        (_) => jsonResponse({'code': 'ACCESS_TOKEN_EXPIRED'}, 401),
      );
      await expectLater(
        client.get<dynamic>('/auth/me'),
        throwsA(isA<DioException>()),
      );
      expect(store.token, 'refresh-1');
      expect(states.last.phase, AuthPhase.recoverableNetworkFailure);
    });
  });
  test('remote client targets versioned API and maps safe errors', () async {
    final client = Dio(BaseOptions(baseUrl: 'https://example.com/api/v1'))
      ..httpClientAdapter = CallbackAdapter((options) {
        expect(options.uri.toString(), 'https://example.com/api/v1/auth/login');
        expect(options.headers['Authorization'], isNull);
        return jsonResponse({
          'code': 'INVALID_CREDENTIALS',
          'detail': 'unsafe internal detail',
        }, 401);
      });
    await expectLater(
      AuthRemoteService(client).post('login', {}),
      throwsA(
        isA<AuthFailure>().having(
          (e) => e.message,
          'message',
          'Email or password is incorrect.',
        ),
      ),
    );
  });
}
