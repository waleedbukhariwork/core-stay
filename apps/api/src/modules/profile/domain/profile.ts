import {
  PREFERENCE_CATALOG,
  PROFILE_STEPS,
  type ProfileStep,
} from './preference-catalog.js';
export interface ProfilePreferences {
  goals: string[] | null;
  role: string | null;
  experience: string | null;
  technologies: string[] | null;
  focusAreas: string[] | null;
  dailyMinutes: number | null;
  learningPreferences: string[] | null;
}
export interface ProfileUpdate {
  goals?: string[];
  role?: string;
  experience?: string;
  technologies?: string[];
  focusAreas?: string[];
  dailyMinutes?: number;
  learningPreferences?: string[];
}
export type ProfileProgress = {
  status: 'not_started' | 'in_progress' | 'complete';
  nextStep: ProfileStep | 'DIAGNOSTIC';
};
export class InvalidPreferences extends Error {
  constructor() {
    super('Invalid profile preferences');
  }
}
export function emptyPreferences(): ProfilePreferences {
  return {
    goals: null,
    role: null,
    experience: null,
    technologies: null,
    focusAreas: null,
    dailyMinutes: null,
    learningPreferences: null,
  };
}
export function validSelection(step: ProfileStep, value: unknown): boolean {
  const multi = !['role', 'experience', 'dailyMinutes'].includes(step);
  const values = multi ? value : [value];
  if (
    !Array.isArray(values) ||
    values.length === 0 ||
    new Set(values).size !== values.length
  )
    return false;
  if (!multi && Array.isArray(value)) return false;
  const options = PREFERENCE_CATALOG[step];
  const exclusive = new Set<string>();
  for (const selected of values) {
    const option = options.find(
      (option) => option.enabled && option.id === selected,
    );
    if (!option) return false;
    if (option.exclusiveGroup) {
      if (exclusive.has(option.exclusiveGroup)) return false;
      exclusive.add(option.exclusiveGroup);
    }
  }
  return true;
}
export function validateUpdate(update: ProfileUpdate): ProfileUpdate {
  const keys = Object.keys(update);
  if (
    !keys.length ||
    keys.some((key) => !PROFILE_STEPS.includes(key as ProfileStep))
  )
    throw new InvalidPreferences();
  const normalized: Record<string, unknown> = {};
  for (const step of keys as ProfileStep[]) {
    const value = update[step];
    if (!validSelection(step, value)) throw new InvalidPreferences();
    normalized[step] = Array.isArray(value)
      ? PREFERENCE_CATALOG[step]
          .filter((option) => value.includes(option.id as string))
          .map((option) => option.id)
      : value;
  }
  return normalized as ProfileUpdate;
}
export function profileProgress(
  preferences: ProfilePreferences,
): ProfileProgress {
  const nextStep = PROFILE_STEPS.find(
    (step) => !validSelection(step, preferences[step]),
  );
  return {
    status: !nextStep
      ? 'complete'
      : PROFILE_STEPS.some((step) => preferences[step] !== null)
        ? 'in_progress'
        : 'not_started',
    nextStep: nextStep ?? 'DIAGNOSTIC',
  };
}
