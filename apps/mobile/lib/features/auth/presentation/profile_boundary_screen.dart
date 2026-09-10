import 'package:codecore_mobile/features/auth/presentation/auth_controller.dart';
import 'package:codecore_mobile/features/auth/presentation/auth_layout.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ProfileBoundaryScreen extends ConsumerWidget {
  const ProfileBoundaryScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(authControllerProvider);
    return AuthLayout(
      title: 'Profile setup',
      state: state,
      children: [
        Text(
          'You’re signed in.',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 16),
        Text(state.user?.email ?? ''),
        const SizedBox(height: 16),
        const Text(
          'Your account is ready. '
          'Setting up your engineering profile comes next.',
        ),
        const SizedBox(height: 24),
        OutlinedButton(
          onPressed: state.busy
              ? null
              : ref.read(authControllerProvider.notifier).logout,
          child: const Text('Sign out'),
        ),
      ],
    );
  }
}

class SessionRecoveryScreen extends ConsumerWidget {
  const SessionRecoveryScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(authControllerProvider);
    return AuthLayout(
      title: 'Reconnect to CodeCore',
      state: state,
      children: [
        const Text(
          'We couldn’t restore your session. '
          'Your saved session is kept so you can retry.',
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: state.busy
              ? null
              : ref.read(authControllerProvider.notifier).retry,
          child: const Text('Retry'),
        ),
      ],
    );
  }
}
