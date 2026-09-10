export type AuthEnvironment = {
  jwtSecret: string;
  verificationSecret: string;
  issuer: string;
  audience: string;
  emailMode: 'ses' | 'file';
  emailFrom: string;
  awsRegion: string;
  inbox: string;
};
export function loadAuthEnvironment(
  raw: NodeJS.ProcessEnv,
  env: string,
): AuthEnvironment {
  const key = (name: string): string => {
    const value = raw[name] ?? '';
    if (
      !/^[A-Za-z0-9+/]+={0,2}$/.test(value) ||
      Buffer.from(value, 'base64').length < 32
    )
      throw new Error(
        `Invalid configuration: ${name} must be a base64 secret of at least 32 bytes`,
      );
    return value;
  };
  const jwtSecret = key('AUTH_JWT_SECRET');
  const verificationSecret = key('AUTH_VERIFICATION_SECRET');
  if (jwtSecret === verificationSecret)
    throw new Error('Invalid configuration: auth secrets must be independent');
  const issuer = raw.AUTH_ISSUER?.trim();
  const audience = raw.AUTH_AUDIENCE?.trim();
  if (!issuer || !audience)
    throw new Error(
      'Invalid configuration: AUTH_ISSUER and AUTH_AUDIENCE are required',
    );
  const emailMode = raw.AUTH_EMAIL_MODE;
  if (emailMode !== 'ses' && !(emailMode === 'file' && env === 'local'))
    throw new Error(
      'Invalid configuration: SES is required outside local development',
    );
  const emailFrom = raw.AUTH_EMAIL_FROM ?? '';
  const awsRegion = raw.AWS_REGION ?? '';
  if (
    emailMode === 'ses' &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFrom) ||
      !/^[a-z]{2}(-[a-z]+)+-\d$/.test(awsRegion))
  )
    throw new Error(
      'Invalid configuration: SES sender and region are required',
    );
  return {
    jwtSecret,
    verificationSecret,
    issuer,
    audience,
    emailMode,
    emailFrom,
    awsRegion: awsRegion || 'us-east-1',
    inbox: '/tmp/codecore-email-inbox',
  };
}
