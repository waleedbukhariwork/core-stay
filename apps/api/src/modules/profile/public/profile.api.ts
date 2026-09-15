export abstract class ProfileApi {
  // The implementation verifies this opaque actor with Identity; shape is not proof of access.
  abstract isComplete(
    actor: Readonly<{ kind: 'user'; userId: string; sessionId: string }>,
  ): Promise<boolean>;
}
