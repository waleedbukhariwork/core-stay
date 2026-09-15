import 'package:codecore_mobile/features/diagnostic/data/diagnostic_remote_service.dart';
import 'package:codecore_mobile/features/diagnostic/domain/diagnostic.dart';
import 'package:dio/dio.dart';

class DiagnosticRepository {
  DiagnosticRepository(this.remote);
  final DiagnosticRemoteService remote;
  Future<DiagnosticSnapshot?> read() async {
    final json = await remote.read();
    return json == null ? null : DiagnosticSnapshot.fromJson(json);
  }

  Future<DiagnosticSnapshot> start() => _save(remote.start);
  Future<DiagnosticSnapshot> answer(
    String questionId,
    String optionId,
    int durationMs,
  ) => _save(() => remote.answer(questionId, optionId, durationMs));
  Future<DiagnosticSnapshot> confidence(
    String questionId,
    DiagnosticConfidence confidence,
  ) => _save(() => remote.confidence(questionId, confidence.value));
  Future<DiagnosticSnapshot> _save(
    Future<Map<String, dynamic>> Function() operation,
  ) async {
    try {
      return DiagnosticSnapshot.fromJson(await operation());
    } on DioException catch (error) {
      if (error.response?.statusCode == 409) {
        // Another client may have advanced. Resolve from server state.
        final saved = await read();
        if (saved != null) return saved;
      }
      final body = error.response?.data;
      if (body is Map && body['code'] == 'DIAGNOSTIC_UNAVAILABLE') {
        throw const DiagnosticFailure(
          'The diagnostic is not available yet. Please try again later.',
        );
      }
      rethrow;
    }
  }
}
