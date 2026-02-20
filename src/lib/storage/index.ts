import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
]);

const MAX_SIZE_BY_PLAN: Record<string, number> = {
  FREE: 10 * 1024 * 1024,       // 10MB
  PRO: 50 * 1024 * 1024,        // 50MB
  ENTERPRISE: 100 * 1024 * 1024, // 100MB
};

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return _client;
}

function getBucket(): string {
  return process.env.S3_BUCKET_NAME || 'se-ai-uploads';
}

function getPublicBaseUrl(): string {
  return process.env.S3_PUBLIC_URL || '';
}

export function isAllowedType(contentType: string): boolean {
  return ALLOWED_TYPES.has(contentType);
}

export function getMaxSize(plan: string): number {
  return MAX_SIZE_BY_PLAN[plan] || MAX_SIZE_BY_PLAN.FREE;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}

export async function getUploadUrl(
  key: string,
  contentType: string,
  maxSize?: number
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const client = getClient();
  const bucket = getBucket();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ...(maxSize ? { ContentLength: maxSize } : {}),
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  const publicUrl = `${getPublicBaseUrl()}/${key}`;

  return { uploadUrl, publicUrl };
}

export async function deleteFile(key: string): Promise<void> {
  const client = getClient();
  const bucket = getBucket();

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
