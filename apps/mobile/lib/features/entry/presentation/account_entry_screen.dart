import 'package:codecore_mobile/app/router/app_routes.dart';
import 'package:codecore_mobile/app/theme/app_colors.dart';
import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:codecore_mobile/features/entry/presentation/widgets/codecore_brand.dart';
import 'package:codecore_mobile/features/entry/presentation/widgets/entry_layout.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AccountEntryScreen extends StatelessWidget {
  const AccountEntryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: EntryLayout(
          children: [
            const CodeCoreBrand(),
            const SizedBox(height: AppSpacing.xxl),
            const Spacer(),
            Text(
              'YOUR NEXT CHAPTER',
              style: text.labelLarge?.copyWith(color: context.appColors.accent),
            ),
            const SizedBox(height: AppSpacing.md),
            Semantics(
              header: true,
              child: Text('Make progress your own.', style: text.headlineLarge),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'An account will give your engineering growth a home.',
              style: text.bodyLarge?.copyWith(
                color: context.appColors.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            for (final benefit in const [
              (Icons.bookmark_outline_rounded, 'Save your progress'),
              (Icons.badge_outlined, 'Build your engineering profile'),
              (Icons.tune_rounded, 'Personalize learning and practice'),
              (Icons.sync_rounded, 'Sync progress securely across devices'),
            ])
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ExcludeSemantics(
                      child: Icon(benefit.$1, color: context.appColors.accent),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(child: Text(benefit.$2, style: text.bodyLarge)),
                  ],
                ),
              ),
            const Spacer(),
            const SizedBox(height: AppSpacing.lg),
            FilledButton(
              onPressed: () => context.pushNamed(AppRoute.register.name),
              child: const Text('Create account'),
            ),
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton(
              onPressed: () => context.pushNamed(AppRoute.login.name),
              child: const Text('Sign in'),
            ),
            if (context.canPop()) ...[
              const SizedBox(height: AppSpacing.sm),
              TextButton(
                onPressed: () => context.pop(),
                child: const Text('Back to welcome'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
