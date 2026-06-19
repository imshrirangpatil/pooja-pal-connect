import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { Errors } from '../utils/errors';

const client = new OAuth2Client(env.googleClientId);

export interface GoogleProfile {
  googleId: string;
  email?: string;
  name?: string;
  picture?: string;
}

/** Verify a Google ID token against Google's public keys and extract the profile. */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) throw Errors.googleAuthFailed();
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AppError') throw err;
    throw Errors.googleAuthFailed();
  }
}
