import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Health check endpoint for uptime monitoring.
 * Returns 200 if the app and DB are healthy, 503 otherwise.
 */
export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {
    app: 'ok',
    database: 'error',
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
