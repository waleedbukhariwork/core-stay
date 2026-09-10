import 'package:codecore_mobile/features/auth/domain/auth_state.dart';
import 'package:dio/dio.dart';

class AuthRemoteService {
  AuthRemoteService(this.dio);
  final Dio dio;
  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/auth/$path',
        data: body,
      );
      final payload = response.data?['data'];
      if (payload is! Map<String, dynamic>) throw const AuthFailure('SERVER');
      return payload;
    } on DioException catch (error) {
      throw authFailure(error);
    }
  }
}

AuthFailure authFailure(DioException error) {
  if (error.error is AuthFailure) return error.error! as AuthFailure;
  final data = error.response?.data;
  if (data is Map<String, dynamic> && data['code'] is String) {
    return AuthFailure(data['code'] as String);
  }
  return AuthFailure(error.response == null ? 'NETWORK' : 'SERVER');
}
