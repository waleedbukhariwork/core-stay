import 'dart:developer' as developer;

import 'package:codecore_mobile/features/entry/data/product_intro_store.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class EntryController extends AsyncNotifier<bool> {
  static const persistenceTimeout = Duration(seconds: 2);
  Future<void>? _completion;

  @override
  Future<bool> build() async {
    try {
      return await ref
          .read(productIntroStoreProvider)
          .read()
          .timeout(persistenceTimeout);
    } on Object {
      developer.log('Unable to read product intro state.', name: 'entry');
      return false;
    }
  }

  Future<void> completeIntro() => _completion ??= _complete();

  Future<void> _complete() async {
    try {
      await ref
          .read(productIntroStoreProvider)
          .complete()
          .timeout(persistenceTimeout);
    } on Object {
      developer.log('Unable to save product intro state.', name: 'entry');
    }
    // Storage failure must not block entry; a later launch can show Welcome.
    if (ref.mounted) state = const AsyncData(true);
  }
}

final entryControllerProvider = AsyncNotifierProvider<EntryController, bool>(
  EntryController.new,
  retry: (retryCount, error) => null,
);
