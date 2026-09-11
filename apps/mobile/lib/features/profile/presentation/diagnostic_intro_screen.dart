import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:codecore_mobile/features/auth/presentation/auth_controller.dart';
import 'package:codecore_mobile/features/entry/presentation/widgets/entry_layout.dart';
import 'package:codecore_mobile/features/profile/presentation/profile_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DiagnosticIntroScreen extends ConsumerWidget {
  const DiagnosticIntroScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final auth = ref.watch(authControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Your next step')),
      body: SafeArea(
        child: EntryLayout(
          children: [
            const Icon(Icons.explore_outlined, size: 64),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Discover your starting point.',
              style: theme.textTheme.headlineLarge,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Your engineering profile is saved.',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: AppSpacing.md),
            const Text(
              'Next comes a diagnostic to explore what you know '
              'and where you can grow. The diagnostic is coming next.',
            ),
            const SizedBox(height: AppSpacing.xl),
            OutlinedButton(
              onPressed: ref.read(profileControllerProvider.notifier).edit,
              child: const Text('Review my preferences'),
            ),
            TextButton(
              onPressed: auth.busy
                  ? null
                  : ref.read(authControllerProvider.notifier).logout,
              child: const Text('Sign out'),
            ),
            if (auth.error != null)
              Text(
                auth.error!,
                style: TextStyle(color: theme.colorScheme.error),
              ),
          ],
        ),
      ),
    );
  }
}
