import 'package:codecore_mobile/app/theme/app_colors.dart';
import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:flutter/material.dart';

class ProductLoop extends StatelessWidget {
  const ProductLoop({super.key});

  static const steps = ['Learn', 'Practice', 'Review', 'Reinforce', 'Track'];

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: steps.join(', then '),
      excludeSemantics: true,
      child: Wrap(
        spacing: AppSpacing.sm,
        runSpacing: AppSpacing.sm,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          for (var i = 0; i < steps.length; i++)
            Text.rich(
              TextSpan(
                text: steps[i],
                children: [
                  if (i < steps.length - 1)
                    TextSpan(
                      text: '  →',
                      style: TextStyle(color: context.appColors.accent),
                    ),
                ],
              ),
              style: Theme.of(context).textTheme.labelLarge,
            ),
        ],
      ),
    );
  }
}
