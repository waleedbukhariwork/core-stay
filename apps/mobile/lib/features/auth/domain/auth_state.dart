enum AuthPhase {
  checkingSession,
  unauthenticated,
  awaitingEmailVerification,
  authenticated,
  recoverableNetworkFailure,
}

class AuthUser {
  const AuthUser({required this.id, required this.email});
  factory AuthUser.fromJson(Map<String, dynamic> json) =>
      AuthUser(id: json['id'] as String, email: json['email'] as String);
  final String id;
  final String email;
}

class AuthState {
  const AuthState(
    this.phase, {
    this.user,
    this.email,
    this.resendAt,
    this.busy = false,
    this.error,
  });
  final AuthPhase phase;
  final AuthUser? user;
  final String? email;
  final DateTime? resendAt;
  final bool busy;
  final String? error;
  AuthState withOperation({bool busy = false, String? error}) => AuthState(
    phase,
    user: user,
    email: email,
    resendAt: resendAt,
    busy: busy,
    error: error,
  );
}

class AuthFailure implements Exception {
  const AuthFailure(this.code);
  final String code;
  bool get rejectsSession => const {
    'REFRESH_TOKEN_INVALID',
    'SESSION_EXPIRED',
    'SESSION_REVOKED',
  }.contains(code);
  String get message => switch (code) {
    'INVALID_CREDENTIALS' => 'Email or password is incorrect.',
    'ACCOUNT_ALREADY_EXISTS' => 'An account already exists. Please sign in.',
    'REGISTRATION_PENDING' =>
      'Verify your email to finish creating your account.',
    'VERIFICATION_INVALID' =>
      'That code is incorrect or has already been used.',
    'VERIFICATION_EXPIRED' => 'That code has expired. Request a new code.',
    'VERIFICATION_ATTEMPTS_EXCEEDED' =>
      'Too many attempts. Request a new code.',
    'VERIFICATION_RESEND_TOO_SOON' =>
      'Please wait before requesting another code.',
    'RATE_LIMITED' => 'Too many requests. Please try again shortly.',
    'NETWORK' => 'Unable to connect. Check your connection and retry.',
    'STORAGE' => 'Secure storage is unavailable. Please retry.',
    _ => 'Unable to complete the request. Please try again.',
  };
}
