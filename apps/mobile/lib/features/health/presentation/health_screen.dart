import 'package:codecore_mobile/app/theme/app_breakpoints.dart';
import 'package:codecore_mobile/app/theme/app_colors.dart';
import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:codecore_mobile/app/theme/theme_mode_controller.dart';
import 'package:codecore_mobile/core/errors/app_failure.dart';
import 'package:codecore_mobile/core/widgets/app_status_body.dart';
import 'package:codecore_mobile/features/health/presentation/health_notifier.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HealthScreen extends ConsumerWidget {
  const HealthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final health = ref.watch(healthProvider);
    final colors = context.appColors;

    return Scaffold(
      appBar: AppBar(
        title: const Text('CodeCore'),
      ),
      body: AppStatusBody(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Infrastructure check',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'This screen verifies the API, database, and client '
              'architecture. It is not product UI.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.lg),
            _ThemeControls(colors: colors),
            const SizedBox(height: AppSpacing.lg),
            health.when(
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.xl),
                  child: CircularProgressIndicator(),
                ),
              ),
              data: (status) => AppMessageCard(
                title: 'API healthy',
                message: status.ok
                    ? 'The NestJS health endpoint reached PostgreSQL.'
                    : 'The API responded without a healthy status.',
                color: colors.success,
              ),
              error: (error, _) => AppMessageCard(
                title: 'Health check failed',
                message: error is AppFailure
                    ? error.message
                    : 'Something went wrong.',
                color: colors.error,
                action: FilledButton(
                  onPressed: () => ref.read(healthProvider.notifier).retry(),
                  child: const Text('Retry'),
                ),
              ),
            ),
            if (AppBreakpoints.isCompact(MediaQuery.sizeOf(context).width))
              const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }
}

class _ThemeControls extends ConsumerWidget {
  const _ThemeControls({required this.colors});

  final AppColors colors;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(themeModeProvider);

    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: [
        for (final mode in ThemeMode.values)
          ChoiceChip(
            label: Text(mode.name),
            selected: selected == mode,
            onSelected: (_) {
              ref.read(themeModeProvider.notifier).mode = mode;
            },
            selectedColor: colors.accent.withValues(alpha: 0.2),
          ),
      ],
    );
  }
}
