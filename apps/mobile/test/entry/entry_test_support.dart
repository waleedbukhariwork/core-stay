import 'dart:async';

import 'package:codecore_mobile/features/entry/data/product_intro_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

// The platform double allows tests to control failures and pending writes.
// ignore: must_be_immutable
class MemoryIntroPreferences implements SharedPreferencesAsync {
  MemoryIntroPreferences({Object? value}) {
    if (value != null) values[ProductIntroStore.completionKey] = value;
  }

  final values = <String, Object>{};
  bool failRead = false;
  bool failWrite = false;
  int writes = 0;
  Completer<bool?>? pendingRead;
  Completer<void>? pendingWrite;

  @override
  Future<bool?> getBool(String key) async {
    if (failRead) throw StateError('Read unavailable');
    if (pendingRead != null) return pendingRead!.future;
    return values[key] as bool?;
  }

  @override
  Future<void> setBool(String key, bool value) async {
    writes++;
    if (failWrite) throw StateError('Write unavailable');
    if (pendingWrite != null) await pendingWrite!.future;
    values[key] = value;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
