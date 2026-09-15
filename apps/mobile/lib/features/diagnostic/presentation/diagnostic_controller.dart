import 'dart:async';

import 'package:codecore_mobile/features/auth/presentation/auth_controller.dart';
import 'package:codecore_mobile/features/diagnostic/data/diagnostic_providers.dart';
import 'package:codecore_mobile/features/diagnostic/domain/diagnostic.dart';
import 'package:codecore_mobile/features/profile/presentation/profile_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DiagnosticState {
  const DiagnosticState({
    this.saved,
    this.loaded = false,
    this.busy = false,
    this.selectedOptionId,
    this.selectedConfidence,
    this.showReview = false,
    this.answerPending = false,
    this.error,
  });
  final DiagnosticSnapshot? saved;
  final bool loaded;
  final bool busy;
  final String? selectedOptionId;
  final DiagnosticConfidence? selectedConfidence;
  final bool showReview;
  final bool answerPending;
  final String? error;
  DiagnosticState copyWith({
    bool? busy,
    String? selectedOptionId,
    DiagnosticConfidence? selectedConfidence,
    bool? showReview,
    bool? answerPending,
    String? error,
  }) => DiagnosticState(
    saved: saved,
    loaded: loaded,
    busy: busy ?? this.busy,
    selectedOptionId: selectedOptionId ?? this.selectedOptionId,
    selectedConfidence: selectedConfidence ?? this.selectedConfidence,
    showReview: showReview ?? this.showReview,
    answerPending: answerPending ?? this.answerPending,
    error: error,
  );
}

class DiagnosticController extends Notifier<DiagnosticState> {
  int _epoch = 0;
  final Stopwatch _questionTime = Stopwatch();
  int? _submittedDuration;
  @override
  DiagnosticState build() {
    final userId = ref.watch(
      authControllerProvider.select((auth) => auth.user?.id),
    );
    final eligible = ref.watch(
      profileControllerProvider.select((profile) => profile.diagnostic),
    );
    final epoch = ++_epoch;
    _questionTime.stop();
    _submittedDuration = null;
    if (userId != null && eligible) {
      unawaited(Future<void>.microtask(() => _load(epoch)));
    }
    return DiagnosticState(busy: userId != null && eligible);
  }

  Future<void> _load(int epoch) async {
    if (!ref.mounted || epoch != _epoch) return;
    await _run(
      () => ref.read(diagnosticRepositoryProvider).read(),
      epoch: epoch,
    );
  }

  Future<void> reload() async {
    if (!state.busy) await _load(_epoch);
  }

  Future<void> start() async {
    if (!state.busy) {
      await _run(() => ref.read(diagnosticRepositoryProvider).start());
    }
  }

  void select(String optionId) {
    if (state.busy ||
        state.answerPending ||
        state.saved?.question?.options.any((option) => option.id == optionId) !=
            true) {
      return;
    }
    state = state.copyWith(selectedOptionId: optionId);
  }

  void selectConfidence(DiagnosticConfidence confidence) {
    if (!state.busy) state = state.copyWith(selectedConfidence: confidence);
  }

  Future<void> submit() async {
    final question = state.saved?.question;
    final selected = state.selectedOptionId;
    if (state.busy || question == null || selected == null) return;
    _submittedDuration ??= _questionTime.elapsedMilliseconds.clamp(0, 86400000);
    state = state.copyWith(answerPending: true);
    await _run(
      () => ref
          .read(diagnosticRepositoryProvider)
          .answer(question.id, selected, _submittedDuration!),
      showReview: true,
    );
  }

  Future<void> submitConfidence() async {
    final question = state.saved?.confidenceQuestion;
    final selected = state.selectedConfidence;
    if (state.busy || question == null || selected == null) return;
    await _run(
      () => ref
          .read(diagnosticRepositoryProvider)
          .confidence(question.id, selected),
      showReview: true,
    );
  }

  Future<void> next() async {
    // Refresh before presenting the next question so multiple devices converge.
    if (!state.busy) await _load(_epoch);
  }

  Future<void> _run(
    Future<DiagnosticSnapshot?> Function() operation, {
    int? epoch,
    bool showReview = false,
  }) async {
    final requestEpoch = epoch ?? _epoch;
    state = state.copyWith(busy: true);
    try {
      final saved = await operation();
      if (!ref.mounted || requestEpoch != _epoch) return;
      state = DiagnosticState(
        saved: saved,
        loaded: true,
        showReview: showReview && saved?.review != null,
        selectedOptionId:
            !showReview && saved?.question?.id == state.saved?.question?.id
            ? state.selectedOptionId
            : null,
      );
      _submittedDuration = null;
      _questionTime
        ..reset()
        ..start();
    } on Object catch (error) {
      if (ref.mounted && requestEpoch == _epoch) {
        state = state.copyWith(
          busy: false,
          error: error is DiagnosticFailure
              ? error.message
              : 'We couldn’t confirm this request. Your selections are still '
                    'here. Check your connection and retry.',
        );
      }
    }
  }
}

final diagnosticControllerProvider =
    NotifierProvider<DiagnosticController, DiagnosticState>(
      DiagnosticController.new,
    );
