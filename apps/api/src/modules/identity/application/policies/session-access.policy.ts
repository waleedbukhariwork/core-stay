import { Injectable } from '@nestjs/common';
import {
  IdentityApi,
  type AuthenticatedActor,
} from '../../public/identity.api.js';
import type { Session } from '../../domain/session.js';
import { identityFailure } from '../../domain/identity-failure.js';
@Injectable()
export class SessionAccessPolicy {
  constructor(private readonly actors: IdentityApi) {}
  assertActor(actor: AuthenticatedActor): void {
    this.actors.assertAuthenticated(actor);
  }
  assertOwnership(
    actor: AuthenticatedActor,
    session: Session | undefined,
  ): asserts session is Session {
    this.assertActor(actor);
    if (
      !session ||
      session.userId !== actor.userId ||
      session.id !== actor.sessionId
    )
      throw identityFailure('SESSION_REVOKED');
  }
}
