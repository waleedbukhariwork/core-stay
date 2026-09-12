export class ProfileResponseDto {
  preferences!: {
    goals: string[] | null;
    role: string | null;
    experience: string | null;
    technologies: string[] | null;
    focusAreas: string[] | null;
    dailyMinutes: number | null;
    learningPreferences: string[] | null;
  };
  status!: 'not_started' | 'in_progress' | 'complete';
  nextStep!:
    | 'goals'
    | 'role'
    | 'experience'
    | 'technologies'
    | 'focusAreas'
    | 'dailyMinutes'
    | 'learningPreferences'
    | 'DIAGNOSTIC';
}
