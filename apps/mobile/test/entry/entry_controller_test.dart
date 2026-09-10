import 'dart:async';

import 'package:codecore_mobile/features/entry/application/entry_controller.dart';
import 'package:codecore_mobile/features/entry/data/product_intro_store.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'entry_test_support.dart';

ProviderContainer _container(MemoryIntroPreferences preferences) {
  final container = ProviderContainer(
    overrides: [
      productIntroStoreProvider.overrideWithValue(
        ProductIntroStore(preferences),
      ),
    ],
  );
  addTearDown(container.dispose);
  return container;
}

void main() {
  test('fresh user has not completed the intro', () async {
    final container = _container(MemoryIntroPreferences());
    expect(await container.read(entryControllerProvider.future), isFalse);
  });

  test(
    'completion persists only the intro flag and survives a new owner',
    () async {
      final preferences = MemoryIntroPreferences();
      final container = _container(preferences);
      await container.read(entryControllerProvider.future);
      await container.read(entryControllerProvider.notifier).completeIntro();
      expect(container.read(entryControllerProvider).requireValue, isTrue);
      expect(preferences.values, {ProductIntroStore.completionKey: true});
      expect(
        await _container(preferences).read(entryControllerProvider.future),
        isTrue,
      );
    },
  );

  test('returning user reads the completed flag', () async {
    final container = _container(MemoryIntroPreferences(value: true));
    expect(await container.read(entryControllerProvider.future), isTrue);
  });

  test('read failure falls back to an unseen intro', () async {
    final preferences = MemoryIntroPreferences()..failRead = true;
    expect(
      await _container(preferences).read(entryControllerProvider.future),
      isFalse,
    );
  });

  for (final value in [
    false,
    'true',
    1,
    <String>['true'],
  ]) {
    test('unexpected or false value $value never completes intro', () async {
      expect(
        await _container(MemoryIntroPreferences(value: value))
            .read(entryControllerProvider.future),
        isFalse,
      );
    });
  }

  test('write failure allows entry but does not survive relaunch', () async {
    final preferences = MemoryIntroPreferences()..failWrite = true;
    final container = _container(preferences);
    await container.read(entryControllerProvider.future);
    await container.read(entryControllerProvider.notifier).completeIntro();
    expect(container.read(entryControllerProvider).requireValue, isTrue);
    expect(
      await _container(preferences).read(entryControllerProvider.future),
      isFalse,
    );
  });

  test('overlapping completion actions share one persistence write', () async {
    final preferences = MemoryIntroPreferences()
      ..pendingWrite = Completer<void>();
    final container = _container(preferences);
    await container.read(entryControllerProvider.future);
    final controller = container.read(entryControllerProvider.notifier);
    final first = controller.completeIntro();
    final second = controller.completeIntro();
    expect(identical(first, second), isTrue);
    expect(preferences.writes, 1);
    preferences.pendingWrite!.complete();
    await Future.wait([first, second]);
    expect(container.read(entryControllerProvider).requireValue, isTrue);
  });

  testWidgets('stalled read has a bounded startup fallback', (tester) async {
    final preferences = MemoryIntroPreferences()
      ..pendingRead = Completer<bool?>();
    final container = _container(preferences);
    final initial = container.read(entryControllerProvider.future);
    await tester.pump(EntryController.persistenceTimeout);
    expect(await initial, isFalse);
    preferences.pendingRead!.complete(true);
    await tester.pump();
    expect(container.read(entryControllerProvider).requireValue, isFalse);
  });

  testWidgets('stalled write does not trap the user', (tester) async {
    final preferences = MemoryIntroPreferences()
      ..pendingWrite = Completer<void>();
    final container = _container(preferences);
    final initial = container.read(entryControllerProvider.future);
    await tester.pump();
    await initial;
    final completion = container
        .read(entryControllerProvider.notifier)
        .completeIntro();
    await tester.pump(EntryController.persistenceTimeout);
    await completion;
    expect(container.read(entryControllerProvider).requireValue, isTrue);
    preferences.pendingWrite!.complete();
    await tester.pump();
  });
}
