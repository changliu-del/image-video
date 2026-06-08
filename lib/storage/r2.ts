import 'server-only';

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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
  mimeType: string;
  sizeBytes: number;
  expiresInSeconds?: number;
};

type SignedGetUrlInput = {
  storageKey: string;
  expiresInSeconds?: number;
};

type GetObjectInput = {
  storageKey: string;
  range?: string | null;
};

type PutObjectInput = {
  storageKey: string;
  body: Buffer | Uint8Array;
  mimeType: string;
};

type VerifyUploadedObjectInput = {
  storageKey: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

export const ADMIN_MEDIA_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/webm',
] as const;

export type AdminMediaMimeType = (typeof ADMIN_MEDIA_MIME_TYPES)[number];

const ADMIN_MEDIA_MIME_EXTENSIONS: Record<AdminMediaMimeType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
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

export function getAdminMediaExtension(mimeType: AdminMediaMimeType) {
  return ADMIN_MEDIA_MIME_EXTENSIONS[mimeType];
}

export function isAdminMediaMimeType(
  mimeType: string
): mimeType is AdminMediaMimeType {
  return ADMIN_MEDIA_MIME_TYPES.includes(
    mimeType as AdminMediaMimeType
  );
}

export function buildTemplatePreviewStorageKey(
  templateId: string,
  assetId: string,
  mimeType: AdminMediaMimeType
) {
  return `templates/${templateId}/${assetId}.${getAdminMediaExtension(mimeType)}`;
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

export function storageKeyMatchesTemplatePreview(
  templateId: string,
  assetId: string,
  storageKey: string
) {
  if (
    !storageKey.startsWith(`templates/${templateId}/`) ||
    storageKey.includes('..') ||
    storageKey.includes('//')
  ) {
    return false;
  }

  const allowedExtensions = new Set(
    Object.values(ADMIN_MEDIA_MIME_EXTENSIONS)
  );
  const prefix = `templates/${templateId}/${assetId}.`;
  const extension = storageKey.slice(prefix.length);

  return storageKey.startsWith(prefix) && allowedExtensions.has(extension);
}

export async function createSignedPutUrl({
  storageKey,
  mimeType,
  sizeBytes,
  expiresInSeconds = 300,
}: SignedPutUrlInput) {
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType as UploadMimeType)) {
    throw new Error(`Unsupported upload MIME type: ${mimeType}`);
  }

  return createSignedPutUrlForMime({
    storageKey,
    mimeType,
    sizeBytes,
    expiresInSeconds,
  });
}

export async function createSignedGetUrl({
  storageKey,
  expiresInSeconds = 3600,
}: SignedGetUrlInput) {
  const config = getR2Config();
  const client = getR2Client(config);
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function getObjectFromR2({ storageKey, range }: GetObjectInput) {
  const config = getR2Config();
  const client = getR2Client(config);
  return client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: storageKey,
      Range: range ?? undefined,
    })
  );
}

export async function createSignedAdminMediaPutUrl({
  storageKey,
  mimeType,
  sizeBytes,
  expiresInSeconds = 300,
}: SignedPutUrlInput) {
  if (!isAdminMediaMimeType(mimeType)) {
    throw new Error(`Unsupported admin media MIME type: ${mimeType}`);
  }

  return createSignedPutUrlForMime({
    storageKey,
    mimeType,
    sizeBytes,
    expiresInSeconds,
  });
}

export async function uploadObjectToR2({
  storageKey,
  body,
  mimeType,
}: PutObjectInput) {
  const config = getR2Config();
  const client = getR2Client(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: storageKey,
      Body: body,
      ContentType: mimeType,
      ContentLength: body.byteLength,
    })
  );

  return buildPublicUrl(storageKey);
}

export async function verifyUploadedObject({
  storageKey,
  mimeType,
  sizeBytes,
}: VerifyUploadedObjectInput) {
  const config = getR2Config();
  const client = getR2Client(config);
  const object = await client.send(
    new HeadObjectCommand({
      Bucket: config.bucket,
      Key: storageKey,
    })
  );

  if (sizeBytes != null && object.ContentLength !== sizeBytes) {
    return false;
  }

  if (mimeType && object.ContentType && object.ContentType !== mimeType) {
    return false;
  }

  return true;
}

async function createSignedPutUrlForMime({
  storageKey,
  mimeType,
  sizeBytes,
  expiresInSeconds,
}: Required<SignedPutUrlInput>) {
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
