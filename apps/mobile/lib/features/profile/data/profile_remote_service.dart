import 'package:dio/dio.dart';

class ProfileRemoteService {
  ProfileRemoteService(this.client);
  final Dio client;
  Future<Map<String, dynamic>> catalog() async =>
      _data(await client.get<Map<String, dynamic>>('/profile/catalog'));
  Future<Map<String, dynamic>> load() async =>
      _data(await client.get<Map<String, dynamic>>('/profile'));
  Future<Map<String, dynamic>> save(Map<String, Object?> update) async =>
      _data(await client.patch<Map<String, dynamic>>('/profile', data: update));
  Map<String, dynamic> _data(Response<Map<String, dynamic>> response) {
    final data = response.data?['data'];
    if (data is! Map<String, dynamic>) {
      throw const FormatException('Invalid profile response');
    }
    return data;
  }
}
