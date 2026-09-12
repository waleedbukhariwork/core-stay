export class PreferenceOptionDto {
  id!: string | number;
  label!: string;
  enabled!: boolean;
  order!: number;
  category!: string | null;
  exclusiveGroup!: string | null;
  recommended!: boolean;
}

export class PreferenceCatalogResponseDto {
  goals!: PreferenceOptionDto[];
  role!: PreferenceOptionDto[];
  experience!: PreferenceOptionDto[];
  technologies!: PreferenceOptionDto[];
  focusAreas!: PreferenceOptionDto[];
  dailyMinutes!: PreferenceOptionDto[];
  learningPreferences!: PreferenceOptionDto[];
}
