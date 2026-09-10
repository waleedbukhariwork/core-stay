import 'dart:async';

import 'package:codecore_mobile/features/auth/data/auth_providers.dart';
import 'package:codecore_mobile/features/auth/presentation/auth_controller.dart';
import 'package:codecore_mobile/features/auth/presentation/auth_layout.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key});
  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final _form = GlobalKey<FormState>();
  final _code = TextEditingController();
  Timer? _timer;
  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authControllerProvider);
    final controller = ref.read(authControllerProvider.notifier);
    final seconds =
        ((state.resendAt
                        ?.difference(ref.read(authNowProvider)())
                        .inMilliseconds ??
                    0) /
                1000)
            .ceil()
            .clamp(0, 60);
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) controller.cancelVerification();
      },
      child: AuthLayout(
        title: 'Verify email',
        state: state,
        onBack: controller.cancelVerification,
        children: [
          Text(
            'Enter the six-digit code sent to ${state.email ?? 'your email'}. '
            'Codes expire after 10 minutes.',
          ),
          const SizedBox(height: 24),
          Form(
            key: _form,
            child: TextFormField(
              controller: _code,
              enabled: !state.busy,
              decoration: const InputDecoration(labelText: 'Verification code'),
              keyboardType: TextInputType.number,
              autofillHints: const [AutofillHints.oneTimeCode],
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              validator: (value) =>
                  value?.length == 6 ? null : 'Enter the six-digit code.',
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: state.busy
                ? null
                : () {
                    if (_form.currentState!.validate()) {
                      unawaited(controller.verify(_code.text));
                    }
                  },
            child: const Text('Verify email'),
          ),
          TextButton(
            onPressed: state.busy || seconds > 0 ? null : controller.resend,
            child: Text(
              seconds > 0 ? 'Resend code in ${seconds}s' : 'Resend code',
            ),
          ),
        ],
      ),
    );
  }
}
