import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:codecore_mobile/features/auth/presentation/auth_controller.dart';
import 'package:codecore_mobile/features/diagnostic/domain/diagnostic.dart';
import 'package:codecore_mobile/features/diagnostic/presentation/diagnostic_controller.dart';
import 'package:codecore_mobile/features/diagnostic/presentation/widgets/diagnostic_question_card.dart';
import 'package:codecore_mobile/features/diagnostic/presentation/widgets/diagnostic_review_card.dart';
import 'package:codecore_mobile/features/entry/presentation/widgets/entry_layout.dart';
import 'package:codecore_mobile/features/profile/presentation/diagnostic_intro_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DiagnosticScreen extends ConsumerWidget {
  const DiagnosticScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(diagnosticControllerProvider);
    final controller = ref.read(diagnosticControllerProvider.notifier);
    final saved = state.saved;
    if (state.loaded && saved == null) return const DiagnosticIntroScreen();
    final theme = Theme.of(context);
    final review = state.showReview ? saved?.review : null;
    final confidenceQuestion = saved?.confidenceQuestion;
    final question = saved?.question;
    final complete = saved?.completed == true && review == null;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          complete ? 'Diagnostic complete' : 'Engineering diagnostic',
        ),
      ),
      body: SafeArea(
        child: EntryLayout(
          children: [
            if (saved == null) ...[
              if (state.busy) ...[
                const Center(child: CircularProgressIndicator()),
                const SizedBox(height: AppSpacing.md),
                const Text('Loading your diagnostic progress…'),
              ],
              if (!state.busy)
                FilledButton(
                  onPressed: controller.reload,
                  child: const Text('Retry'),
                ),
            ] else ...[
              if (!complete) ...[
                Text(
                  '${saved.answered} of ${saved.total} answers saved',
                  style: theme.textTheme.labelLarge,
                ),
                const SizedBox(height: AppSpacing.sm),
                LinearProgressIndicator(
                  value: saved.answered / saved.total,
                  semanticsLabel: 'Diagnostic progress',
                ),
                const SizedBox(height: AppSpacing.xl),
              ],
              if (review != null) ...[
                DiagnosticReviewCard(review: review),
                const SizedBox(height: AppSpacing.lg),
                FilledButton(
                  onPressed: state.busy ? null : controller.next,
                  child: Text(
                    saved.completed ? 'Finish diagnostic' : 'Next question',
                  ),
                ),
              ] else if (complete) ...[
                Icon(
                  Icons.task_alt,
                  size: 64,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Diagnostic complete.',
                  style: theme.textTheme.headlineLarge,
                ),
                const SizedBox(height: AppSpacing.md),
                Text('All ${saved.total} answers are saved.'),
                const SizedBox(height: AppSpacing.md),
                const Text(
                  'You’ve finished your engineering diagnostic. Thank you '
                  'for taking the time to reflect on your understanding.',
                ),
              ] else if (confidenceQuestion != null) ...[
                Text(
                  'How sure were you?',
                  style: theme.textTheme.headlineMedium,
                ),
                const SizedBox(height: AppSpacing.md),
                const Text(
                  'Your answer is saved. Choose your confidence before '
                  'seeing the explanation.',
                ),
                const SizedBox(height: AppSpacing.lg),
                DiagnosticQuestionCard(
                  question: confidenceQuestion,
                  selectedOptionId: saved.confidenceAnswer,
                ),
                const SizedBox(height: AppSpacing.md),
                for (final confidence in DiagnosticConfidence.values)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: Semantics(
                      selected: state.selectedConfidence == confidence,
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          backgroundColor:
                              state.selectedConfidence == confidence
                              ? theme.colorScheme.secondaryContainer
                              : null,
                        ),
                        onPressed: state.busy
                            ? null
                            : () => controller.selectConfidence(confidence),
                        child: Text(confidence.label),
                      ),
                    ),
                  ),
                FilledButton(
                  onPressed: state.busy || state.selectedConfidence == null
                      ? null
                      : controller.submitConfidence,
                  child: const Text('See answer review'),
                ),
              ] else if (question != null) ...[
                DiagnosticQuestionCard(
                  question: question,
                  selectedOptionId: state.selectedOptionId,
                  onSelect: state.busy || state.answerPending
                      ? null
                      : controller.select,
                ),
                const SizedBox(height: AppSpacing.lg),
                FilledButton(
                  onPressed: state.busy || state.selectedOptionId == null
                      ? null
                      : controller.submit,
                  child: Text(
                    state.answerPending ? 'Retry submission' : 'Submit answer',
                  ),
                ),
                if (state.answerPending && !state.busy)
                  TextButton(
                    onPressed: controller.reload,
                    child: const Text('Check saved progress'),
                  ),
              ],
              if (state.busy) ...[
                const SizedBox(height: AppSpacing.md),
                const Center(child: CircularProgressIndicator()),
              ],
            ],
            if (state.error != null) ...[
              const SizedBox(height: AppSpacing.md),
              Semantics(
                liveRegion: true,
                child: Text(
                  state.error!,
                  style: TextStyle(color: theme.colorScheme.error),
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            _SignOut(disabled: state.busy),
          ],
        ),
      ),
    );
  }
}

class _SignOut extends ConsumerWidget {
  const _SignOut({required this.disabled});
  final bool disabled;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    return Column(
      children: [
        TextButton(
          onPressed: disabled || auth.busy
              ? null
              : ref.read(authControllerProvider.notifier).logout,
          child: const Text('Sign out'),
        ),
        if (auth.error != null)
          Text(
            auth.error!,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
      ],
    );
  }
}
