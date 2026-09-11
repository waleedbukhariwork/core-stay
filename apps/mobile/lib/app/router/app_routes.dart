enum AppRoute {
  splash('/'),
  welcome('/welcome'),
  intro('/intro'),
  auth('/auth'),
  register('/auth/register'),
  login('/auth/login'),
  verify('/auth/verify'),
  profile('/profile-setup'),
  diagnostic('/diagnostic-intro'),
  recovery('/session-recovery'),
  health('/health');

  const AppRoute(this.path);

  final String path;
}
