import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { requestLogOptions } from './pino-factory.js';
describe('Auth request logging', () => {
  it('omits credentials, headers, response tokens and query strings', () => {
    const options = requestLogOptions(pino({ level: 'silent' }));
    const req = options.serializers!.req!({
      id: 'safe-id',
      method: 'POST',
      url: '/api/v1/auth/login?password=secret',
      headers: { authorization: 'Bearer access-secret' },
      body: {
        password: 'secret',
        code: '123456',
        refreshToken: 'refresh-secret',
      },
    });
    const res = options.serializers!.res!({
      statusCode: 200,
      body: { accessToken: 'access-secret', refreshToken: 'refresh-secret' },
    });
    expect(req).toEqual({
      id: 'safe-id',
      method: 'POST',
      url: '/api/v1/auth/login',
    });
    expect(res).toEqual({ statusCode: 200 });
  });
});
