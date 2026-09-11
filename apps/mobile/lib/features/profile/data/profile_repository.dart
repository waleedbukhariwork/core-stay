import 'package:codecore_mobile/features/profile/data/profile_remote_service.dart';
import 'package:codecore_mobile/features/profile/domain/profile.dart';

class ProfileRepository {
  ProfileRepository(this.remote);
  final ProfileRemoteService remote;
  Future<({PreferenceCatalog catalog, ProfileSnapshot profile})> load() async {
    final catalog = PreferenceCatalog.fromJson(await remote.catalog());
    final profile = ProfileSnapshot.fromJson(await remote.load(), catalog);
    return (catalog: catalog, profile: profile);
  }

  Future<ProfileSnapshot> save(
    ProfileStep step,
    Object value,
    PreferenceCatalog catalog,
  ) async {
    final saved = ProfileSnapshot.fromJson(
      await remote.save({step.field: value}),
      catalog,
    );
    final actual = saved.preferences[step];
    final acknowledged = value is List && actual is List
        ? value.length == actual.length && value.every(actual.contains)
        : actual == value;
    if (!acknowledged) {
      throw const FormatException('Profile save was not acknowledged');
    }
    return saved;
  }
}
