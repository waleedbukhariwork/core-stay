import { describe, expect, it } from 'vitest';
import {
  identityFailure,
  type IdentityFailureCode,
} from '../../domain/identity-failure.js';
import { toProblemDetails } from '../../../../platform/http/errors/to-problem-details.js';
import { mapIdentityFailure } from './identity-error.mapper.js';

describe('Identity failure HTTP compatibility', () => {
  it.each<[IdentityFailureCode, number]>([
    ['ACCOUNT_ALREADY_EXISTS', 409],
    ['REGISTRATION_PENDING', 409],
    ['INVALID_CREDENTIALS', 401],
    ['EMAIL_NOT_VERIFIED', 403],
    ['VERIFICATION_INVALID', 400],
    ['VERIFICATION_EXPIRED', 400],
    ['VERIFICATION_ATTEMPTS_EXCEEDED', 429],
    ['VERIFICATION_RESEND_TOO_SOON', 429],
    ['SESSION_REVOKED', 401],
    ['SESSION_EXPIRED', 401],
    ['REFRESH_TOKEN_INVALID', 401],
    ['ACCESS_TOKEN_INVALID', 401],
    ['ACCESS_TOKEN_EXPIRED', 401],
    ['EMAIL_DELIVERY_UNAVAILABLE', 503],
  ])('preserves %s and status %i', (code, status) => {
    expect(
      toProblemDetails(mapIdentityFailure(identityFailure(code)), 'request-1'),
    ).toEqual({
      type: `https://codecore.dev/problems/${code.toLowerCase().replaceAll('_', '-')}`,
      title: 'Authentication request failed',
      status,
      code,
      requestId: 'request-1',
    });
  });
  it('preserves the fifth-guess 400 distinct from an already locked challenge', () => {
    expect(
      toProblemDetails(
        mapIdentityFailure(
          identityFailure(
            'VERIFICATION_ATTEMPTS_EXCEEDED',
            'attempt_limit_reached',
          ),
        ),
      ).status,
    ).toBe(400);
  });
  it('does not interpret unrelated provider or SQL exceptions as identity failures', () => {
    expect(
      mapIdentityFailure({ code: 'ACCOUNT_ALREADY_EXISTS' }),
    ).toBeUndefined();
    const failure = new Error('secret SQL details');
    expect(mapIdentityFailure(failure)).toBeUndefined();
    const problem = toProblemDetails(failure);
    expect(problem.status).toBe(500);
    expect(JSON.stringify(problem)).not.toContain(failure.message);
  });
});
