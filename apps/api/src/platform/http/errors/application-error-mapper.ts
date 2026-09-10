import type { AppException } from './app-exception.js';
export type ApplicationErrorMapper = (
  error: unknown,
) => AppException | undefined;
export const APPLICATION_ERROR_MAPPERS = Symbol('APPLICATION_ERROR_MAPPERS');
