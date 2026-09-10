import 'dart:async';

import 'package:codecore_mobile/app/router/app_routes.dart';
import 'package:codecore_mobile/app/theme/app_breakpoints.dart';
import 'package:codecore_mobile/app/theme/app_colors.dart';
import 'package:codecore_mobile/app/theme/app_radii.dart';
import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:codecore_mobile/features/entry/application/entry_controller.dart';
import 'package:codecore_mobile/features/entry/presentation/widgets/entry_layout.dart';
import 'package:codecore_mobile/features/entry/presentation/widgets/preview_visual.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class ProductIntroScreen extends ConsumerStatefulWidget {
  const ProductIntroScreen({super.key});

  @override
  ConsumerState<ProductIntroScreen> createState() => _ProductIntroScreenState();
}

class _ProductIntroScreenState extends ConsumerState<ProductIntroScreen> {
  final _pages = PageController();
  int _index = 0;
  bool _moving = false;
  bool _finishing = false;

  static const _headlines = [
    'Stay current.',
    'Stay sharp.',
    'Know what to strengthen next.',
  ];
  static String _description(int index) => switch (index) {
    0 =>
      'Make sense of the concepts, practices, and changes that matter. '
          'Discover what is relevant to your role and stack.',
    1 =>
      'Practice engineering thinking, not trivia. '
          'Build judgment and reinforce what you learn over time.',
    _ =>
      'Understand your strengths, uncover gaps, and see what deserves '
          'your attention next.',
  };

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  Future<void> _move(int page) async {
    if (_moving || _finishing) return;
    setState(() => _moving = true);
    if (MediaQuery.disableAnimationsOf(context)) {
      _pages.jumpToPage(page);
    } else {
      await _pages.animateToPage(
        page,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
      );
    }
    if (mounted) setState(() => _moving = false);
  }

  void _back() {
    if (_moving || _finishing) return;
    if (_index > 0) {
      unawaited(_move(_index - 1));
    } else if (context.canPop()) {
      context.pop();
    } else {
      context.goNamed(AppRoute.welcome.name);
    }
  }

  Future<void> _finish() async {
    if (_finishing) return;
    setState(() => _finishing = true);
    await ref.read(entryControllerProvider.notifier).completeIntro();
    if (mounted) context.goNamed(AppRoute.auth.name);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final text = Theme.of(context).textTheme;
    return PopScope(
      canPop: _index == 0 && !_finishing && !_moving,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _back();
      },
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: AppBreakpoints.compact,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.lg,
                      AppSpacing.sm,
                      AppSpacing.lg,
                      0,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Inside CodeCore',
                            style: text.titleMedium,
                          ),
                        ),
                        TextButton(
                          onPressed: _finishing ? null : _finish,
                          child: const Text('Skip'),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                    ),
                    child: Semantics(
                      label: 'Product preview, page ${_index + 1} of 3',
                      liveRegion: true,
                      excludeSemantics: true,
                      child: Row(
                        children: [
                          for (var i = 0; i < 3; i++)
                            Container(
                              width: i == _index ? 28 : 8,
                              height: 4,
                              margin: const EdgeInsets.only(
                                right: AppSpacing.xs,
                              ),
                              decoration: BoxDecoration(
                                color: i == _index
                                    ? colors.accent
                                    : colors.border,
                                borderRadius: BorderRadius.circular(
                                  AppRadii.pill,
                                ),
                              ),
                            ),
                          const SizedBox(width: AppSpacing.sm),
                          Text('${_index + 1} / 3', style: text.bodyMedium),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: PageView.builder(
                      controller: _pages,
                      itemCount: 3,
                      physics: _finishing
                          ? const NeverScrollableScrollPhysics()
                          : null,
                      onPageChanged: (page) => setState(() => _index = page),
                      itemBuilder: (context, index) => EntryLayout(
                        key: PageStorageKey(index),
                        children: [
                          const Spacer(),
                          Semantics(
                            header: true,
                            child: Text(
                              _headlines[index],
                              style: text.headlineLarge,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Text(
                            _description(index),
                            style: text.bodyLarge?.copyWith(
                              color: colors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xl),
                          PreviewVisual(index: index),
                          const Spacer(),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        FilledButton(
                          onPressed: _finishing || _moving
                              ? null
                              : _index == 2
                              ? _finish
                              : () => _move(_index + 1),
                          child: Text(
                            _finishing
                                ? 'Opening account entry…'
                                : _index == 2
                                ? 'Create my profile'
                                : 'Continue',
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        TextButton(
                          onPressed: _finishing || _moving ? null : _back,
                          child: const Text('Back'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
