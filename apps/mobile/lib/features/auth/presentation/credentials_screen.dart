import 'package:codecore_mobile/features/auth/presentation/auth_controller.dart';
import 'package:codecore_mobile/features/auth/presentation/auth_layout.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class CredentialsScreen extends ConsumerStatefulWidget {
  const CredentialsScreen({required this.register, super.key});
  final bool register;
  @override
  ConsumerState<CredentialsScreen> createState() => _CredentialsScreenState();
}

class _CredentialsScreenState extends ConsumerState<CredentialsScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirmation = TextEditingController();
  bool _obscure = true;
  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _confirmation.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    final controller = ref.read(authControllerProvider.notifier);
    if (widget.register) {
      await controller.register(_email.text.trim(), _password.text);
    } else {
      await controller.login(_email.text.trim(), _password.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authControllerProvider);
    return AuthLayout(
      title: widget.register ? 'Create account' : 'Sign in',
      state: state,
      children: [
        Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                widget.register ? 'Make progress your own.' : 'Welcome back.',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _email,
                enabled: !state.busy,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (value) =>
                    value != null &&
                        RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                            .hasMatch(value.trim()) &&
                        value.trim().length <= 254
                    ? null
                    : 'Enter a valid email address.',
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _password,
                enabled: !state.busy,
                obscureText: _obscure,
                autocorrect: false,
                enableSuggestions: false,
                autofillHints: [
                  if (widget.register)
                    AutofillHints.newPassword
                  else
                    AutofillHints.password,
                ],
                decoration: InputDecoration(
                  labelText: 'Password',
                  suffixIcon: IconButton(
                    tooltip: _obscure ? 'Show password' : 'Hide password',
                    onPressed: () => setState(() => _obscure = !_obscure),
                    icon: Icon(
                      _obscure
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                  ),
                ),
                validator: (value) {
                  final length = value?.runes.length ?? 0;
                  return length < (widget.register ? 12 : 1) || length > 128
                      ? (widget.register
                            ? 'Use 12–128 characters.'
                            : 'Enter your password (up to 128 characters).')
                      : null;
                },
              ),
              if (widget.register) ...[
                const SizedBox(height: 8),
                const Text(
                  'Use 12–128 characters. Spaces and passphrases are welcome.',
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmation,
                  enabled: !state.busy,
                  obscureText: true,
                  autocorrect: false,
                  enableSuggestions: false,
                  decoration: const InputDecoration(
                    labelText: 'Confirm password',
                  ),
                  validator: (value) =>
                      value == _password.text ? null : 'Passwords must match.',
                ),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: state.busy ? null : _submit,
                child: Text(widget.register ? 'Create account' : 'Sign in'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
