import 'package:codecore_mobile/app/theme/app_colors.dart';
import 'package:codecore_mobile/app/theme/app_radii.dart';
import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:codecore_mobile/features/entry/presentation/widgets/product_loop.dart';
import 'package:flutter/material.dart';

class PreviewVisual extends StatelessWidget {
  const PreviewVisual({required this.index, super.key});

  final int index;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final text = Theme.of(context).textTheme;
    final rows = switch (index) {
      0 => const [
        ('01', 'Concepts', 'Understand what is changing.'),
        ('02', 'Practices', 'Connect ideas to everyday engineering.'),
        ('03', 'Perspective', 'See why a change matters.'),
      ],
      1 => const [
        ('01', 'Reason it through', 'Consider the trade-offs.'),
        ('02', 'Put it into practice', 'Apply the idea to a real problem.'),
        ('03', 'Return to it', 'Make understanding last.'),
      ],
      _ => const [
        ('01', 'Build on strengths', 'See what is taking shape.'),
        ('02', 'Find the gaps', 'Understand what needs attention.'),
        ('03', 'Take the next step', 'Keep moving with purpose.'),
      ],
    };
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border.all(color: colors.border),
        borderRadius: BorderRadius.circular(AppRadii.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            switch (index) {
              0 => 'A wider engineering perspective',
              1 => 'Understanding, made durable',
              _ => 'Progress with direction',
            },
            style: text.titleMedium,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text('A look at the experience ahead', style: text.bodyMedium),
          const SizedBox(height: AppSpacing.lg),
          for (var i = 0; i < rows.length; i++) ...[
            if (i > 0) ...[
              const SizedBox(height: AppSpacing.md),
              Divider(color: colors.border, height: 1),
              const SizedBox(height: AppSpacing.md),
            ],
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ExcludeSemantics(
                  child: Text(
                    rows[i].$1,
                    style: text.labelLarge?.copyWith(color: colors.accent),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(rows[i].$2, style: text.titleMedium),
                      const SizedBox(height: AppSpacing.xs),
                      Text(rows[i].$3, style: text.bodyMedium),
                    ],
                  ),
                ),
              ],
            ),
          ],
          if (index == 2) ...[
            const SizedBox(height: AppSpacing.lg),
            const ProductLoop(),
          ],
        ],
      ),
    );
  }
}
