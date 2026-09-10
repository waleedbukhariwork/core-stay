import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProductIntroStore {
  ProductIntroStore([this._preferences]);

  final SharedPreferencesAsync? _preferences;

  static const completionKey = 'hasSeenProductIntro';

  Future<bool> read() async {
    return await (_preferences ?? SharedPreferencesAsync()).getBool(
          completionKey,
        ) ??
        false;
  }

  Future<void> complete() {
    return (_preferences ?? SharedPreferencesAsync()).setBool(
      completionKey,
      true,
    );
  }
}

final productIntroStoreProvider = Provider<ProductIntroStore>(
  (ref) => ProductIntroStore(),
);
