import 'package:codecore_mobile/features/auth/data/auth_providers.dart';
import 'package:codecore_mobile/features/profile/data/profile_remote_service.dart';
import 'package:codecore_mobile/features/profile/data/profile_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(
    ProfileRemoteService(ref.watch(authenticatedDioProvider)),
  ),
);
