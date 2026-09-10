import { Injectable } from '@nestjs/common';
import {
  IdentityApi,
  type AuthenticatedActor,
} from '../public/identity.api.js';
import { SessionTokens } from './ports/session-tokens.js';
import { Clock } from './ports/clock.js';
import { identityFailure } from '../domain/identity-failure.js';
@Injectable()
export class ActorAuthenticator extends IdentityApi {
  // A copied or deserialized identity must be authenticated again, not trusted by shape.
  private readonly actors = new WeakMap<AuthenticatedActor, number>();
  constructor(
    private readonly tokens: SessionTokens,
    private readonly clock: Clock,
  ) {
    super();
  }
  async authenticate(raw: string): Promise<AuthenticatedActor> {
    const claims = await this.tokens.verify(raw);
    const actor: AuthenticatedActor = Object.freeze({
      kind: 'user',
      userId: claims.userId,
      sessionId: claims.sessionId,
    });
    this.actors.set(actor, claims.expiresAt);
    return actor;
  }
  assertAuthenticated(actor: AuthenticatedActor): void {
    const expiresAt = this.actors.get(actor);
    if (expiresAt === undefined) throw identityFailure('ACCESS_TOKEN_INVALID');
    if (expiresAt <= this.clock.now().getTime())
      throw identityFailure('ACCESS_TOKEN_EXPIRED');
  }
}
