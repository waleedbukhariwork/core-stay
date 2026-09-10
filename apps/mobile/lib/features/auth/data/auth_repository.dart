import 'dart:async';

import 'package:codecore_mobile/features/auth/data/auth_remote_service.dart';
import 'package:codecore_mobile/features/auth/data/secure_session_store.dart';
import 'package:codecore_mobile/features/auth/domain/auth_state.dart';
import 'package:dio/dio.dart';

class AuthRepository {
  AuthRepository(this.remote, this.store, {DateTime Function()? now})
    : now = now ?? DateTime.now;
  final DateTime Function() now;
  final AuthRemoteService remote;
  final SecureSessionStore store;
  void Function(AuthState)? onState;
  String? accessToken;
  String? _refreshToken;
  Future<void>? _refreshing;
  AuthUser? _user;
  bool _pendingSave = false;
  bool _rejected = false;
  int _generation = 0;
  int get generation => _generation;
  Future<void> _storageTail = Future<void>.value();
  Future<void> _persist(Future<void> Function() action) {
    final operation = _storageTail.then((_) => action());
    _storageTail = operation.catchError((Object _) {});
    return operation;
  }

  void _emit(AuthState state) => onState?.call(state);
  Future<void> restore() async {
    try {
      if (_rejected) {
        await _clear();
        return;
      }
      _refreshToken ??= await store.read();
      if (_refreshToken == null) {
        _emit(const AuthState(AuthPhase.unauthenticated));
        return;
      }
      await refresh();
    } on AuthFailure catch (error) {
      if (!error.rejectsSession) _recover(error);
    } on Object {
      _recover(const AuthFailure('STORAGE'));
    }
  }

  void _recover(AuthFailure error) => _emit(
    AuthState(
      AuthPhase.recoverableNetworkFailure,
      user: _user,
      error: error.message,
    ),
  );
  Future<void> register(String email, String password) async {
    try {
      final data = await remote.post('register', {
        'email': email,
        'password': password,
      });
      _awaitVerification(email, data);
    } on AuthFailure catch (error) {
      if (error.code != 'REGISTRATION_PENDING') rethrow;
      _awaitVerification(email, const {'resendAfter': 0});
    }
  }

  void _awaitVerification(String email, Map<String, dynamic> data) => _emit(
    AuthState(
      AuthPhase.awaitingEmailVerification,
      email: email.trim(),
      resendAt: now().add(
        Duration(seconds: data['resendAfter'] as int? ?? 60),
      ),
    ),
  );
  Future<void> login(String email, String password) async {
    try {
      await _accept(
        await remote.post('login', {'email': email, 'password': password}),
      );
    } on AuthFailure catch (error) {
      if (error.code != 'EMAIL_NOT_VERIFIED') rethrow;
      _awaitVerification(email, const {'resendAfter': 0});
    }
  }

  Future<void> verify(String email, String code) async => _accept(
    await remote.post('email-verification/verify', {
      'email': email,
      'code': code,
    }),
  );
  Future<void> resend(String email) async => _awaitVerification(
    email,
    await remote.post('email-verification/resend', {'email': email}),
  );
  Future<void> _accept(Map<String, dynamic> data, [int? generation]) async {
    if (generation != null && generation != _generation) {
      throw const AuthFailure('SESSION_REVOKED');
    }
    final user = data['user'];
    if (data['refreshToken'] is! String ||
        data['accessToken'] is! String ||
        user is! Map<String, dynamic> ||
        user['id'] is! String ||
        user['email'] is! String) {
      throw const AuthFailure('SERVER');
    }
    if (generation == null) _generation++;
    _refreshToken = data['refreshToken'] as String;
    accessToken = data['accessToken'] as String;
    _user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    _pendingSave = true;
    await _save();
  }

  Future<void> _save() async {
    final generation = _generation;
    final token = _refreshToken!;
    try {
      await _persist(() => store.write(token));
    } on Object {
      _recover(const AuthFailure('STORAGE'));
      throw const AuthFailure('STORAGE');
    }
    if (generation != _generation) return;
    _pendingSave = false;
    _emit(AuthState(AuthPhase.authenticated, user: _user));
  }

  Future<void> refresh() =>
      _refreshing ??= _refresh().whenComplete(() => _refreshing = null);
  Future<void> _refresh() async {
    final generation = _generation;
    try {
      if (_pendingSave) {
        await _save();
        return;
      }
      final token = _refreshToken;
      if (token == null) throw const AuthFailure('REFRESH_TOKEN_INVALID');
      await _accept(
        await remote.post('refresh', {'refreshToken': token}),
        generation,
      );
    } on AuthFailure catch (error) {
      if (generation != _generation) rethrow;
      if (error.rejectsSession) {
        _rejected = true;
        await _clear();
      } else {
        _recover(error);
      }
      rethrow;
    }
  }

  Future<void> _clear() async {
    final generation = ++_generation;
    accessToken = null;
    _refreshToken = null;
    _user = null;
    _pendingSave = false;
    try {
      await _persist(store.clear);
    } on Object {
      _recover(const AuthFailure('STORAGE'));
      throw const AuthFailure('STORAGE');
    }
    if (generation != _generation) return;
    _rejected = false;
    _emit(const AuthState(AuthPhase.unauthenticated));
  }

  Future<void> rejectSession() async {
    _rejected = true;
    await _clear();
  }

  Future<void> logout(Dio authenticated) async {
    try {
      await authenticated.post<void>('/auth/logout');
    } on DioException catch (error) {
      final failure = authFailure(error);
      if (!failure.rejectsSession) throw failure;
    }
    _rejected = true;
    await _clear();
  }

  void cancelVerification() =>
      _emit(const AuthState(AuthPhase.unauthenticated));
}
