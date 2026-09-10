import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract class SecureSessionStore {
  Future<String?> read();
  Future<void> write(String token);
  Future<void> clear();
}

class PlatformSessionStore implements SecureSessionStore {
  PlatformSessionStore([FlutterSecureStorage? storage])
    : _storage =
          storage ??
          const FlutterSecureStorage(
            aOptions: AndroidOptions(resetOnError: false),
            iOptions: IOSOptions(
              accessibility: KeychainAccessibility.first_unlock_this_device,
            ),
          );
  static const key = 'codecore.refreshToken';
  final FlutterSecureStorage _storage;
  @override
  Future<String?> read() => _storage.read(key: key);
  @override
  Future<void> write(String token) => _storage.write(key: key, value: token);
  @override
  Future<void> clear() => _storage.delete(key: key);
}
