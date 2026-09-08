import { describe, expect, it } from 'vitest';
import { flattenValidationErrors } from './flatten-validation-errors.js';

describe('flattenValidationErrors', () => {
  it('flattens nested class-validator errors', () => {
    const errors = flattenValidationErrors([
      {
        property: 'profile',
        children: [
          {
            property: 'name',
            constraints: { isString: 'name must be a string' },
            children: [],
          },
        ],
        constraints: undefined,
      },
    ]);

    expect(errors).toEqual([
      { field: 'profile.name', message: 'name must be a string' },
    ]);
  });
});
