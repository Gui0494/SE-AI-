import crypto from 'crypto';
import { db } from '../db';

const TOKEN_EXPIRY_HOURS = {
  verification: 24,
  reset: 1,
};

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a verification/reset token using the existing VerificationToken model.
 * identifier format: "verify:{email}" or "reset:{email}"
 */
export async function createToken(
  email: string,
  type: 'verification' | 'reset'
): Promise<string> {
  const identifier = `${type}:${email}`;
  const token = generateToken();
  const hours = TOKEN_EXPIRY_HOURS[type];
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000);

  // Delete any existing tokens for this identifier
  await db.verificationToken.deleteMany({ where: { identifier } });

  await db.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

/**
 * Verify a token and return the email if valid. Deletes the token after use.
 */
export async function verifyToken(
  token: string,
  type: 'verification' | 'reset'
): Promise<string | null> {
  const record = await db.verificationToken.findUnique({ where: { token } });

  if (!record) return null;
  if (!record.identifier.startsWith(`${type}:`)) return null;
  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return null;
  }

  const email = record.identifier.replace(`${type}:`, '');

  // Delete the token (single-use)
  await db.verificationToken.delete({ where: { token } });

  return email;
}
