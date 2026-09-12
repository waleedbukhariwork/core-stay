export const PROFILE_STEPS = [
  'goals',
  'role',
  'experience',
  'technologies',
  'focusAreas',
  'dailyMinutes',
  'learningPreferences',
] as const;
export type ProfileStep = (typeof PROFILE_STEPS)[number];
export type PreferenceOption = Readonly<{
  id: string | number;
  label: string;
  enabled: boolean;
  order: number;
  category: string | null;
  exclusiveGroup: string | null;
  recommended: boolean;
}>;
type OptionDefinition = readonly [
  id: string | number,
  label: string,
  metadata?: Partial<
    Pick<
      PreferenceOption,
      'category' | 'exclusiveGroup' | 'recommended' | 'enabled'
    >
  >,
];
function options(
  definitions: readonly OptionDefinition[],
): readonly PreferenceOption[] {
  return Object.freeze(
    definitions.map(([id, label, metadata], order) =>
      Object.freeze({
        id,
        label,
        order,
        enabled: true,
        category: null,
        exclusiveGroup: null,
        recommended: false,
        ...metadata,
      }),
    ),
  );
}
export type PreferenceCatalog = Readonly<
  Record<ProfileStep, readonly PreferenceOption[]>
>;
export const PREFERENCE_CATALOG: PreferenceCatalog = Object.freeze({
  goals: options([
    ['stay_current', 'Stay current in my field'],
    ['fundamentals', 'Strengthen fundamentals'],
    ['better_engineer', 'Become a better engineer'],
    ['interviews', 'Prepare for interviews'],
    ['senior_role', 'Prepare for a senior role'],
    ['system_design', 'Improve system design'],
    ['new_area', 'Learn a new area'],
  ]),
  role: options([
    ['backend', 'Backend'],
    ['frontend', 'Frontend'],
    ['full_stack', 'Full-stack'],
    ['mobile', 'Mobile'],
    ['platform', 'DevOps / Platform'],
    ['data', 'Data'],
    ['other', 'Other'],
  ]),
  experience: options([
    ['under_1', 'Less than 1 year'],
    ['years_1_3', '1\u20133 years'],
    ['years_3_5', '3\u20135 years'],
    ['years_5_8', '5\u20138 years'],
    ['years_8_plus', '8+ years'],
  ]),
  technologies: options([
    ['javascript', 'JavaScript', { category: 'Languages' }],
    ['typescript', 'TypeScript', { category: 'Languages' }],
    ['python', 'Python', { category: 'Languages' }],
    ['java', 'Java', { category: 'Languages' }],
    ['kotlin', 'Kotlin', { category: 'Languages' }],
    ['dart', 'Dart', { category: 'Languages' }],
    ['go', 'Go', { category: 'Languages' }],
    ['csharp', 'C#', { category: 'Languages' }],
    ['cpp', 'C++', { category: 'Languages' }],
    ['rust', 'Rust', { category: 'Languages' }],
    ['react', 'React', { category: 'Frontend' }],
    ['nextjs', 'Next.js', { category: 'Frontend' }],
    ['angular', 'Angular', { category: 'Frontend' }],
    ['vue', 'Vue', { category: 'Frontend' }],
    ['flutter', 'Flutter', { category: 'Frontend' }],
    ['nodejs', 'Node.js', { category: 'Backend' }],
    ['nestjs', 'NestJS', { category: 'Backend' }],
    ['express', 'Express', { category: 'Backend' }],
    ['spring_boot', 'Spring Boot', { category: 'Backend' }],
    ['django', 'Django', { category: 'Backend' }],
    ['fastapi', 'FastAPI', { category: 'Backend' }],
    ['dotnet', '.NET', { category: 'Backend' }],
    ['postgresql', 'PostgreSQL', { category: 'Data' }],
    ['mysql', 'MySQL', { category: 'Data' }],
    ['mongodb', 'MongoDB', { category: 'Data' }],
    ['redis', 'Redis', { category: 'Data' }],
    ['aws', 'AWS', { category: 'Cloud / Platform' }],
    ['azure', 'Azure', { category: 'Cloud / Platform' }],
    ['gcp', 'GCP', { category: 'Cloud / Platform' }],
    ['docker', 'Docker', { category: 'Cloud / Platform' }],
    ['kubernetes', 'Kubernetes', { category: 'Cloud / Platform' }],
  ]),
  focusAreas: options([
    ['debugging', 'Debugging'],
    ['api_design', 'API Design'],
    ['databases', 'Databases'],
    ['security', 'Security'],
    ['concurrency', 'Concurrency'],
    ['system_design', 'System Design'],
    ['distributed_systems', 'Distributed Systems'],
    ['testing', 'Testing'],
    ['git_collaboration', 'Git & Collaboration'],
    ['performance', 'Performance'],
  ]),
  dailyMinutes: options([
    [5, '5 minutes'],
    [10, '10 minutes', { recommended: true }],
    [15, '15 minutes'],
  ]),
  learningPreferences: options([
    [
      'challenge_first',
      'Challenge me first',
      { exclusiveGroup: 'primary_approach' },
    ],
    ['explain_first', 'Explain first', { exclusiveGroup: 'primary_approach' }],
    ['real_world', 'Real-world examples'],
    ['visual', 'Visual explanations'],
    ['deep_technical', 'Deeper technical explanations'],
  ]),
});
export function supportedValues(step: ProfileStep): (string | number)[] {
  return PREFERENCE_CATALOG[step]
    .filter((option) => option.enabled)
    .map((option) => option.id);
}
