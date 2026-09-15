import 'package:dio/dio.dart';

class DiagnosticRemoteService {
  DiagnosticRemoteService(this.client);
  final Dio client;
  Future<Map<String, dynamic>?> read() async =>
      _data(await client.get<Map<String, dynamic>>('/diagnostic'));
  Future<Map<String, dynamic>> start() async =>
      _required(await client.post<Map<String, dynamic>>('/diagnostic'));
  Future<Map<String, dynamic>> answer(
    String questionId,
    String optionId,
    int durationMs,
  ) async => _required(
    await client.post<Map<String, dynamic>>(
      '/diagnostic/answers',
      data: {
        'questionId': questionId,
        'selectedOptionId': optionId,
        'responseDurationMs': durationMs,
      },
    ),
  );
  Future<Map<String, dynamic>> confidence(
    String questionId,
    String confidence,
  ) async => _required(
    await client.patch<Map<String, dynamic>>(
      '/diagnostic/confidence',
      data: {
        'questionId': questionId,
        'confidence': confidence,
      },
    ),
  );
  Map<String, dynamic>? _data(Response<Map<String, dynamic>> response) {
    if (response.data?.containsKey('data') != true) {
      throw const FormatException('Invalid diagnostic response');
    }
    return response.data!['data'] as Map<String, dynamic>?;
  }

  Map<String, dynamic> _required(Response<Map<String, dynamic>> response) =>
      _data(response) ?? (throw const FormatException('Missing diagnostic'));
}
