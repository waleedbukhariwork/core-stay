import 'package:codecore_mobile/app/theme/app_colors.dart';
import 'package:codecore_mobile/app/theme/app_radii.dart';
import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:flutter/material.dart';

class CodeCoreBrand extends StatelessWidget {
  const CodeCoreBrand({this.large = false, super.key});

  final bool large;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return Semantics(
      label: 'CodeCore',
      excludeSemantics: true,
      child: Wrap(
        spacing: AppSpacing.md,
        runSpacing: AppSpacing.sm,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Container(
            padding: EdgeInsets.all(large ? AppSpacing.lg : AppSpacing.sm),
            decoration: BoxDecoration(
              color: colors.accent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadii.lg),
              border: Border.all(color: colors.accent.withValues(alpha: 0.3)),
            ),
            child: Icon(
              Icons.code_rounded,
              color: colors.accent,
              size: large ? 48 : 24,
            ),
          ),
          Text('CodeCore', style: Theme.of(context).textTheme.titleLarge),
        ],
      ),
    );
  }
}
