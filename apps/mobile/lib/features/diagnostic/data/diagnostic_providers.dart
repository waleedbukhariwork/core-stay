import 'package:codecore_mobile/features/auth/data/auth_providers.dart';
import 'package:codecore_mobile/features/diagnostic/data/diagnostic_remote_service.dart';
import 'package:codecore_mobile/features/diagnostic/data/diagnostic_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final diagnosticRepositoryProvider = Provider<DiagnosticRepository>(
  (ref) => DiagnosticRepository(
    DiagnosticRemoteService(ref.watch(authenticatedDioProvider)),
  ),
);
