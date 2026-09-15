import 'package:codecore_mobile/app/theme/app_radii.dart';
import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:codecore_mobile/features/diagnostic/domain/diagnostic.dart';
import 'package:flutter/material.dart';

class DiagnosticQuestionCard extends StatelessWidget {
  const DiagnosticQuestionCard({
    required this.question,
    required this.selectedOptionId,
    this.onSelect,
    super.key,
  });
  final DiagnosticQuestion question;
  final String? selectedOptionId;
  final ValueChanged<String>? onSelect;
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(question.categoryLabel, style: theme.textTheme.labelLarge),
        const SizedBox(height: AppSpacing.sm),
        Text(question.skill, style: theme.textTheme.titleMedium),
        const SizedBox(height: AppSpacing.lg),
        Text(question.prompt, style: theme.textTheme.headlineSmall),
        if (question.context != null) ...[
          const SizedBox(height: AppSpacing.md),
          Text(question.context!),
        ],
        if (question.code != null) ...[
          const SizedBox(height: AppSpacing.lg),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(AppRadii.md),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: SelectableText(
                question.code!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontFamily: 'monospace',
                  color: theme.colorScheme.onSurface,
                  height: 1.6,
                ),
              ),
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        for (final option in question.options)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: Semantics(
              selected: selectedOptionId == option.id,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  alignment: Alignment.centerLeft,
                  padding: const EdgeInsets.all(AppSpacing.md),
                  backgroundColor: selectedOptionId == option.id
                      ? theme.colorScheme.secondaryContainer
                      : null,
                  disabledForegroundColor: theme.colorScheme.onSurface,
                ),
                onPressed: onSelect == null ? null : () => onSelect!(option.id),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      selectedOptionId == option.id
                          ? Icons.radio_button_checked
                          : Icons.radio_button_unchecked,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        option.label,
                        style: theme.textTheme.bodyLarge,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
