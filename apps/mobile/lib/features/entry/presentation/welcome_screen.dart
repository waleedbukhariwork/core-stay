import 'package:codecore_mobile/app/router/app_routes.dart';
import 'package:codecore_mobile/app/theme/app_colors.dart';
import 'package:codecore_mobile/app/theme/app_spacing.dart';
import 'package:codecore_mobile/features/entry/presentation/widgets/codecore_brand.dart';
import 'package:codecore_mobile/features/entry/presentation/widgets/entry_layout.dart';
import 'package:codecore_mobile/features/entry/presentation/widgets/product_loop.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  bool _opening = false;

  Future<void> _open(AppRoute route) async {
    if (_opening) return;
    setState(() => _opening = true);
    await context.pushNamed<void>(route.name);
    if (mounted) setState(() => _opening = false);
  }

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
              'BUILT FOR ENGINEERS',
              style: text.labelLarge?.copyWith(color: context.appColors.accent),
            ),
            const SizedBox(height: AppSpacing.md),
            Semantics(
              header: true,
              child: Text(
                'Stay sharp in a field that never stops changing.',
                style: text.headlineLarge,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Stay current, strengthen what matters, and keep improving '
              'with CodeCore.',
              style: text.bodyLarge?.copyWith(
                color: context.appColors.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            const Divider(),
            const SizedBox(height: AppSpacing.md),
            const ProductLoop(),
            const SizedBox(height: AppSpacing.md),
            const Divider(),
            const SizedBox(height: AppSpacing.xxl),
            const Spacer(),
            FilledButton(
              onPressed: _opening ? null : () => _open(AppRoute.intro),
              child: const Text('Get started', textAlign: TextAlign.center),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextButton(
              onPressed: _opening ? null : () => _open(AppRoute.auth),
              child: const Text(
                'I already have an account',
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
