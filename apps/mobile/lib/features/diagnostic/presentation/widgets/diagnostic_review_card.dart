import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:codecore_mobile/features/diagnostic/domain/diagnostic.dart';
import 'package:flutter/material.dart';

class DiagnosticReviewCard extends StatelessWidget {
  const DiagnosticReviewCard({required this.review, super.key});
  final DiagnosticReview review;
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Icon(
          review.correct ? Icons.check_circle_outline : Icons.lightbulb_outline,
          size: 48,
          color: theme.colorScheme.primary,
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          review.correct ? 'Correct' : 'Let’s look at the reasoning',
          style: theme.textTheme.headlineMedium,
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(review.question.prompt, style: theme.textTheme.titleMedium),
        const SizedBox(height: AppSpacing.md),
        Text('Expected answer', style: theme.textTheme.titleSmall),
        Text(review.correctAnswer),
        const SizedBox(height: AppSpacing.lg),
        Text(review.explanation),
        const SizedBox(height: AppSpacing.lg),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Key idea', style: theme.textTheme.titleMedium),
                const SizedBox(height: AppSpacing.sm),
                Text(review.keyIdea),
                const SizedBox(height: AppSpacing.md),
                Text(
                  review.question.concept,
                  style: theme.textTheme.labelLarge,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
