import 'dart:async';

import 'package:codecore_mobile/features/auth/data/auth_providers.dart';
import 'package:codecore_mobile/features/auth/domain/auth_state.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    final repository = ref.watch(authRepositoryProvider)
      ..onState = (next) {
        if (ref.mounted) state = next;
      };
    ref.onDispose(() => repository.onState = null);
    unawaited(Future<void>.microtask(repository.restore));
    return const AuthState(AuthPhase.checkingSession);
  }

  Future<void> _run(Future<void> Function() action) async {
    if (state.busy) return;
    state = state.withOperation(busy: true);
    try {
      await action();
    } on AuthFailure catch (error) {
      if (ref.mounted) state = state.withOperation(error: error.message);
    } on Object {
      if (ref.mounted) {
        state = state.withOperation(
          error: 'Unable to complete the request. Please retry.',
        );
      }
    } finally {
      if (ref.mounted && state.busy) state = state.withOperation();
    }
  }

  Future<void> register(String email, String password) =>
      _run(() => ref.read(authRepositoryProvider).register(email, password));
  Future<void> login(String email, String password) =>
      _run(() => ref.read(authRepositoryProvider).login(email, password));
  Future<void> verify(String code) =>
      _run(() => ref.read(authRepositoryProvider).verify(state.email!, code));
  Future<void> resend() =>
      _run(() => ref.read(authRepositoryProvider).resend(state.email!));
  Future<void> retry() =>
      _run(() => ref.read(authRepositoryProvider).restore());
  Future<void> logout() => _run(
    () => ref
        .read(authRepositoryProvider)
        .logout(ref.read(authenticatedDioProvider)),
  );
  void cancelVerification() {
    if (!state.busy) ref.read(authRepositoryProvider).cancelVerification();
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(
  AuthController.new,
);
