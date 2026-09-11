import 'dart:async';

import 'package:codecore_mobile/features/auth/presentation/auth_controller.dart';
import 'package:codecore_mobile/features/profile/data/profile_providers.dart';
import 'package:codecore_mobile/features/profile/domain/profile.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ProfileState {
  const ProfileState({
    this.catalog,
    this.saved,
    this.drafts = const {},
    this.index = 0,
    this.edited = const {},
    this.loading = false,
    this.saving = false,
    this.error,
  });
  final PreferenceCatalog? catalog;
  final ProfileSnapshot? saved;
  final Map<ProfileStep, Object?> drafts;
  final int index;
  final Set<ProfileStep> edited;
  final bool loading;
  final bool saving;
  final String? error;
  bool get diagnostic =>
      saved?.nextIndex == ProfileStep.values.length &&
      index == ProfileStep.values.length;
  ProfileStep get step =>
      ProfileStep.values[index.clamp(0, ProfileStep.values.length - 1)];
  bool get canSave =>
      !saving && !loading && (catalog?.valid(step, drafts[step]) ?? false);
  ProfileState copyWith({
    PreferenceCatalog? catalog,
    ProfileSnapshot? saved,
    Map<ProfileStep, Object?>? drafts,
    int? index,
    Set<ProfileStep>? edited,
    bool? loading,
    bool? saving,
    String? error,
  }) => ProfileState(
    catalog: catalog ?? this.catalog,
    saved: saved ?? this.saved,
    drafts: drafts ?? this.drafts,
    index: index ?? this.index,
    edited: edited ?? this.edited,
    loading: loading ?? this.loading,
    saving: saving ?? this.saving,
    error: error,
  );
}

class ProfileController extends Notifier<ProfileState> {
  int _epoch = 0;
  @override
  ProfileState build() {
    final userId = ref.watch(
      authControllerProvider.select((auth) => auth.user?.id),
    );
    final epoch = ++_epoch;
    if (userId != null) unawaited(Future<void>.microtask(() => _load(epoch)));
    return ProfileState(loading: userId != null);
  }

  Future<void> _load(int epoch) async {
    if (!ref.mounted || epoch != _epoch) return;
    state = state.copyWith(loading: true);
    try {
      final result = await ref.read(profileRepositoryProvider).load();
      if (!ref.mounted || epoch != _epoch) return;
      state = ProfileState(
        catalog: result.catalog,
        saved: result.profile,
        drafts: result.profile.preferences,
        index: result.profile.nextIndex,
      );
    } on Object {
      if (ref.mounted && epoch == _epoch) {
        state = state.copyWith(
          loading: false,
          error:
              'We couldn’t load your profile. '
              'Your saved progress is safe. Please retry.',
        );
      }
    }
  }

  Future<void> retry() async {
    if (state.loading || state.saving) return;
    await _load(_epoch);
  }

  void select(PreferenceOption option) {
    if (state.saving || state.catalog == null) return;
    final current = state.drafts[state.step];
    if (!option.enabled && !(current is List && current.contains(option.id))) {
      return;
    }
    final step = state.step;
    var value = option.id;
    if (step.multiple) {
      final selected = List<Object>.from(
        state.drafts[step] as List? ?? const [],
      );
      if (selected.contains(option.id)) {
        selected.remove(option.id);
      } else {
        if (option.exclusiveGroup != null) {
          selected.removeWhere(
            (id) => state.catalog!.options[step]!.any(
              (other) =>
                  other.id == id &&
                  other.exclusiveGroup == option.exclusiveGroup,
            ),
          );
        }
        selected.add(option.id);
      }
      value = List<Object>.unmodifiable(selected);
    }
    state = state.copyWith(
      drafts: Map.unmodifiable({...state.drafts, step: value}),
      edited: Set.unmodifiable({...state.edited, step}),
    );
  }

  void back() {
    if (state.saving || state.index == 0) return;
    state = state.copyWith(index: state.index - 1);
  }

  void edit() {
    if (!state.saving && state.saved != null) state = state.copyWith(index: 0);
  }

  Future<void> save() async {
    if (!state.canSave) return;
    final epoch = _epoch;
    final step = state.step;
    final value = state.drafts[step]!;
    final catalog = state.catalog!;
    state = state.copyWith(saving: true);
    try {
      final saved = await ref
          .read(profileRepositoryProvider)
          .save(step, value, catalog);
      if (!ref.mounted || epoch != _epoch) return;
      // Preserve unsaved edits while accepting other fields from the server.
      final next = (state.index + 1).clamp(0, saved.nextIndex);
      state = state.copyWith(
        saved: saved,
        drafts: Map.unmodifiable({
          ...saved.preferences,
          for (final editedStep in state.edited)
            if (editedStep != step) editedStep: state.drafts[editedStep],
        }),
        edited: Set.unmodifiable({...state.edited}..remove(step)),
        index: next,
        saving: false,
      );
    } on Object {
      if (ref.mounted && epoch == _epoch) {
        state = state.copyWith(
          saving: false,
          error:
              'We couldn’t confirm this save. '
              'Your selections are still here. Retry to save and continue.',
        );
      }
    }
  }
}

final profileControllerProvider =
    NotifierProvider<ProfileController, ProfileState>(ProfileController.new);
