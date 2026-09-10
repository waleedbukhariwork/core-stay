export const APP_ENVIRONMENTS = [
  'local',
  'dev',
  'staging',
  'production',
] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];
