import 'dart:async';

import 'package:codecore_mobile/app/theme/app_breakpoints.dart';
import 'package:codecore_mobile/app/theme/app_radii.dart';
import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:codecore_mobile/features/auth/presentation/auth_controller.dart';
import 'package:codecore_mobile/features/profile/domain/profile.dart';
import 'package:codecore_mobile/features/profile/presentation/profile_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});
  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _search = TextEditingController();
  String _query = '';
  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(profileControllerProvider);
    final controller = ref.read(profileControllerProvider.notifier);
    final auth = ref.watch(authControllerProvider);
    final theme = Theme.of(context);
    final step = state.step;
    final options = state.catalog?.options[step] ?? const <PreferenceOption>[];
    final selected = state.drafts[step];
    final selection = selected is List ? selected : [selected];
    final filtered = options
        .where(
          (option) =>
              step != ProfileStep.technologies ||
              option.label.toLowerCase().contains(_query.toLowerCase()) ||
              (option.category?.toLowerCase().contains(_query.toLowerCase()) ??
                  false),
        )
        .toList();
    final categories = filtered.map((option) => option.category).toSet();
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) controller.back();
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Engineering profile'),
          leading: state.index > 0
              ? BackButton(onPressed: state.saving ? null : controller.back)
              : null,
          actions: [
            TextButton(
              onPressed: state.saving || auth.busy
                  ? null
                  : ref.read(authControllerProvider.notifier).logout,
              child: const Text('Sign out'),
            ),
          ],
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            key: PageStorageKey(step),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  maxWidth: AppBreakpoints.compact,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (state.saved == null) ...[
                      Text(
                        'Your engineering journey',
                        style: theme.textTheme.headlineMedium,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      const Text(
                        'Loading the preferences saved to your account.',
                      ),
                      if (state.loading)
                        const Padding(
                          padding: EdgeInsets.all(AppSpacing.lg),
                          child: Center(
                            child: CircularProgressIndicator(
                              semanticsLabel: 'Loading your profile',
                            ),
                          ),
                        ),
                      if (!state.loading)
                        FilledButton(
                          onPressed: controller.retry,
                          child: const Text('Retry'),
                        ),
                    ] else ...[
                      Text(
                        'STEP ${step.index + 1} '
                        'OF ${ProfileStep.values.length}',
                        style: theme.textTheme.labelLarge,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      LinearProgressIndicator(
                        value: (step.index + 1) / ProfileStep.values.length,
                        semanticsLabel: 'Profile setup progress',
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Text(step.title, style: theme.textTheme.headlineMedium),
                      const SizedBox(height: AppSpacing.sm),
                      Text(step.description, style: theme.textTheme.bodyLarge),
                      const SizedBox(height: AppSpacing.lg),
                      if (step == ProfileStep.technologies) ...[
                        TextField(
                          controller: _search,
                          enabled: !state.saving,
                          onChanged: (value) =>
                              setState(() => _query = value.trim()),
                          decoration: InputDecoration(
                            labelText: 'Search technologies',
                            prefixIcon: const Icon(Icons.search),
                            suffixIcon: _query.isEmpty
                                ? null
                                : IconButton(
                                    tooltip: 'Clear search',
                                    onPressed: () {
                                      _search.clear();
                                      setState(() => _query = '');
                                    },
                                    icon: const Icon(Icons.close),
                                  ),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          '${selection.whereType<Object>().length} selected',
                          style: theme.textTheme.labelLarge,
                        ),
                        if (selection.whereType<Object>().isNotEmpty)
                          Wrap(
                            spacing: AppSpacing.sm,
                            children: options
                                .where(
                                  (option) => selection.contains(option.id),
                                )
                                .map(
                                  (option) => InputChip(
                                    label: Text(option.label),
                                    onDeleted: state.saving
                                        ? null
                                        : () => controller.select(option),
                                    deleteButtonTooltipMessage:
                                        'Remove ${option.label}',
                                  ),
                                )
                                .toList(),
                          ),
                        const SizedBox(height: AppSpacing.md),
                      ],
                      if (filtered.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(AppSpacing.lg),
                          child: Text(
                            'No technologies found. Try another search.',
                          ),
                        ),
                      for (final category in categories) ...[
                        if (category != null)
                          Padding(
                            padding: const EdgeInsets.symmetric(
                              vertical: AppSpacing.md,
                            ),
                            child: Text(
                              category,
                              style: theme.textTheme.titleMedium,
                            ),
                          ),
                        for (final option in filtered.where(
                          (option) => option.category == category,
                        ))
                          Padding(
                            padding: const EdgeInsets.only(
                              bottom: AppSpacing.sm,
                            ),
                            child: _OptionTile(
                              option: option,
                              selected: selection.contains(option.id),
                              multiple: step.multiple,
                              enabled:
                                  !state.saving &&
                                  (option.enabled ||
                                      (step.multiple &&
                                          selection.contains(option.id))),
                              onTap: () => controller.select(option),
                            ),
                          ),
                      ],
                      const SizedBox(height: AppSpacing.lg),
                      FilledButton(
                        onPressed: state.canSave
                            ? () {
                                FocusManager.instance.primaryFocus?.unfocus();
                                unawaited(controller.save());
                              }
                            : null,
                        child: state.saving
                            ? const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  SizedBox.square(
                                    dimension: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  ),
                                  SizedBox(width: AppSpacing.sm),
                                  Text('Saving…'),
                                ],
                              )
                            : Text(
                                state.error != null
                                    ? 'Retry save'
                                    : step == ProfileStep.learningPreferences
                                    ? 'Save preferences'
                                    : 'Save and continue',
                              ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Each step is saved to your account when you continue.',
                        style: theme.textTheme.bodySmall,
                        textAlign: TextAlign.center,
                      ),
                    ],
                    if (state.error != null || auth.error != null)
                      Padding(
                        padding: const EdgeInsets.only(top: AppSpacing.md),
                        child: Semantics(
                          liveRegion: true,
                          child: Text(
                            state.error ?? auth.error!,
                            style: TextStyle(color: theme.colorScheme.error),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  const _OptionTile({
    required this.option,
    required this.selected,
    required this.multiple,
    required this.enabled,
    required this.onTap,
  });
  final PreferenceOption option;
  final bool selected;
  final bool multiple;
  final bool enabled;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      checked: selected,
      enabled: enabled,
      inMutuallyExclusiveGroup: !multiple,
      child: Card(
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.lg),
          side: BorderSide(
            color: selected
                ? theme.colorScheme.primary
                : theme.colorScheme.outlineVariant,
            width: selected ? 2 : 1,
          ),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadii.lg),
          onTap: enabled ? onTap : null,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                Icon(
                  selected
                      ? Icons.check_circle
                      : multiple
                      ? Icons.circle_outlined
                      : Icons.radio_button_unchecked,
                  color: selected
                      ? theme.colorScheme.primary
                      : theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(option.label, style: theme.textTheme.titleMedium),
                      if (option.recommended)
                        Text(
                          'Recommended',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: theme.colorScheme.primary,
                          ),
                        ),
                      if (!option.enabled) const Text('No longer available'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
