enum ProfileStep {
  goals(
    'goals',
    'What are you working toward?',
    'Choose the goals that matter to you. You can select more than one.',
  ),
  role(
    'role',
    'What kind of engineer are you?',
    'Choose the role that best reflects your work today.',
  ),
  experience(
    'experience',
    'How long have you been engineering?',
    'Your experience helps set context. It does not define your level.',
  ),
  technologies(
    'technologies',
    'What’s in your tech stack?',
    'Search and select the technologies you work with or want to explore.',
  ),
  focusAreas(
    'focusAreas',
    'Where would you like to grow?',
    'Choose one or more areas you want to strengthen.',
  ),
  dailyMinutes(
    'dailyMinutes',
    'Make room for progress.',
    'Choose a daily time commitment that fits your routine.',
  ),
  learningPreferences(
    'learningPreferences',
    'How do you like to learn?',
    'Choose at least one. Pick one primary approach; '
        'other preferences can be combined.',
  );

  const ProfileStep(this.field, this.title, this.description);
  final String field;
  final String title;
  final String description;
  bool get multiple =>
      this != role && this != experience && this != dailyMinutes;
}

class PreferenceOption {
  const PreferenceOption({
    required this.id,
    required this.label,
    required this.enabled,
    required this.order,
    required this.category,
    required this.exclusiveGroup,
    required this.recommended,
  });
  factory PreferenceOption.fromJson(Object? value, ProfileStep step) {
    if (value is! Map<String, dynamic> ||
        (step == ProfileStep.dailyMinutes
            ? value['id'] is! int
            : value['id'] is! String) ||
        (value['id'] is String && (value['id'] as String).isEmpty) ||
        value['label'] is! String ||
        (value['label'] as String).isEmpty ||
        value['enabled'] is! bool ||
        value['order'] is! int ||
        (value['order'] as int) < 0 ||
        (value['category'] != null && value['category'] is! String) ||
        (value['exclusiveGroup'] != null &&
            value['exclusiveGroup'] is! String) ||
        value['recommended'] is! bool) {
      throw const FormatException('Invalid preference catalog');
    }
    return PreferenceOption(
      id: value['id']! as Object,
      label: value['label'] as String,
      enabled: value['enabled'] as bool,
      order: value['order'] as int,
      category: value['category'] as String?,
      exclusiveGroup: value['exclusiveGroup'] as String?,
      recommended: value['recommended'] as bool,
    );
  }
  final Object id;
  final String label;
  final bool enabled;
  final int order;
  final String? category;
  final String? exclusiveGroup;
  final bool recommended;
}

class PreferenceCatalog {
  PreferenceCatalog(this.options);
  factory PreferenceCatalog.fromJson(Map<String, dynamic> json) {
    final options = <ProfileStep, List<PreferenceOption>>{};
    for (final step in ProfileStep.values) {
      final raw = json[step.field];
      if (raw is! List || raw.isEmpty) {
        throw const FormatException('Missing preference options');
      }
      final rows =
          raw.map((item) => PreferenceOption.fromJson(item, step)).toList()
            ..sort((a, b) => a.order.compareTo(b.order));
      if (rows.map((row) => row.id).toSet().length != rows.length ||
          rows.map((row) => row.order).toSet().length != rows.length ||
          !rows.any((row) => row.enabled)) {
        throw const FormatException('Invalid preference options');
      }
      options[step] = List.unmodifiable(rows);
    }
    return PreferenceCatalog(Map.unmodifiable(options));
  }
  final Map<ProfileStep, List<PreferenceOption>> options;
  bool valid(ProfileStep step, Object? value) {
    if (step.multiple && value is! List) return false;
    if (!step.multiple && value is List) return false;
    final values = step.multiple ? value! as List : [value];
    if (values.isEmpty || values.toSet().length != values.length) return false;
    final groups = <String>{};
    for (final item in values) {
      final matches = options[step]!.where(
        (option) => option.enabled && option.id == item,
      );
      if (matches.isEmpty) return false;
      final group = matches.single.exclusiveGroup;
      if (group != null && !groups.add(group)) return false;
    }
    return true;
  }
}

class ProfileSnapshot {
  ProfileSnapshot(this.preferences, this.nextIndex);
  factory ProfileSnapshot.fromJson(
    Map<String, dynamic> json,
    PreferenceCatalog catalog,
  ) {
    final raw = json['preferences'];
    if (raw is! Map<String, dynamic>) {
      throw const FormatException('Invalid profile');
    }
    final preferences = <ProfileStep, Object?>{};
    for (final step in ProfileStep.values) {
      if (!raw.containsKey(step.field)) {
        throw const FormatException('Incomplete profile response');
      }
      final value = raw[step.field];
      if (value != null) {
        final values = step.multiple && value is List ? value : [value];
        if ((step.multiple && value is! List) ||
            (!step.multiple && value is List) ||
            values.isEmpty ||
            values.toSet().length != values.length ||
            values.any(
              (id) =>
                  (step == ProfileStep.dailyMinutes
                      ? id is! int
                      : id is! String) ||
                  !catalog.options[step]!.any((option) => option.id == id),
            )) {
          throw const FormatException('Invalid saved preferences');
        }
      }
      preferences[step] = value is List
          ? List<Object>.unmodifiable(value.cast<Object>())
          : value;
    }
    final next = ProfileStep.values.indexWhere(
      (step) => !catalog.valid(step, preferences[step]),
    );
    final nextIndex = next < 0 ? ProfileStep.values.length : next;
    final status = next < 0
        ? 'complete'
        : preferences.values.every((value) => value == null)
        ? 'not_started'
        : 'in_progress';
    final expected = next < 0 ? 'DIAGNOSTIC' : ProfileStep.values[next].field;
    if (json['status'] != status || json['nextStep'] != expected) {
      throw const FormatException('Inconsistent profile progress');
    }
    return ProfileSnapshot(Map.unmodifiable(preferences), nextIndex);
  }
  final Map<ProfileStep, Object?> preferences;
  final int nextIndex;
}
