import 'server-only';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
  ALLOWED_UPLOAD_MIME_TYPES,
  UPLOAD_MIME_EXTENSIONS,
  type UploadMimeType,
} from '@/lib/generations/validation';

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

type SignedPutUrlInput = {
  storageKey: string;
  mimeType: UploadMimeType;
  sizeBytes: number;
  expiresInSeconds?: number;
};

let cachedClient: S3Client | null = null;
let cachedClientKey = '';

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required for R2 uploads`);
  }

  return value;
}

function getR2Config(): R2Config {
  return {
    accountId: getRequiredEnv('R2_ACCOUNT_ID'),
    accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
    bucket: getRequiredEnv('R2_BUCKET'),
    publicBaseUrl: getRequiredEnv('R2_PUBLIC_BASE_URL').replace(/\/+$/, ''),
  };
}

function getR2Client(config = getR2Config()) {
  const clientKey = [
    config.accountId,
    config.accessKeyId,
    config.bucket,
  ].join(':');

  if (cachedClient && cachedClientKey === clientKey) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });
  cachedClientKey = clientKey;

  return cachedClient;
}

export function getUploadExtension(mimeType: UploadMimeType) {
  return UPLOAD_MIME_EXTENSIONS[mimeType];
}

export function buildUserUploadStorageKey(
  userId: number,
  assetId: string,
  mimeType: UploadMimeType
) {
  return `users/${userId}/uploads/${assetId}.${getUploadExtension(mimeType)}`;
}

export function buildPublicUrl(storageKey: string) {
  const config = getR2Config();
  return `${config.publicBaseUrl}/${storageKey}`;
}

export function storageKeyBelongsToUser(userId: number, storageKey: string) {
  return (
    storageKey.startsWith(`users/${userId}/uploads/`) &&
    !storageKey.includes('..') &&
    !storageKey.includes('//')
  );
}

export function storageKeyMatchesUploadAsset(
  userId: number,
  assetId: string,
  storageKey: string
) {
  if (!storageKeyBelongsToUser(userId, storageKey)) {
    return false;
  }

  const allowedExtensions = new Set(Object.values(UPLOAD_MIME_EXTENSIONS));
  const prefix = `users/${userId}/uploads/${assetId}.`;
  const extension = storageKey.slice(prefix.length);

  return storageKey.startsWith(prefix) && allowedExtensions.has(extension);
}

export async function createSignedPutUrl({
  storageKey,
  mimeType,
  sizeBytes,
  expiresInSeconds = 300,
}: SignedPutUrlInput) {
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported upload MIME type: ${mimeType}`);
  }

  const config = getR2Config();
  const client = getR2Client(config);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
    ContentType: mimeType,
    ContentLength: sizeBytes,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
