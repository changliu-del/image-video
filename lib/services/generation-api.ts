// Client-side API service for video generation
// Following ai-ops-fe convention: typed service functions

import type {
  PresignUploadRequest,
  PresignUploadResponse,
  CompleteUploadRequest,
  CreateGenerationRequest,
  GenerationResponse,
} from '@/types/api';

async function readResponseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json() as {
      error?: unknown; message?: unknown;
      details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
    };
    const fieldError = Object.values(data.details?.fieldErrors ?? {}).flat().find(Boolean);
    if (fieldError) return fieldError;
    const formError = data.details?.formErrors?.find(Boolean);
    if (formError) return formError;
    if (typeof data.error === 'string') return data.error;
    if (typeof data.message === 'string') return data.message;
  } catch {}
  return fallback;
}

async function postJson<T>(url: string, body: unknown, fallbackError: string): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readResponseError(response, fallbackError));
  return response.json() as Promise<T>;
}

export function presignUpload(data: PresignUploadRequest): Promise<PresignUploadResponse> {
  return postJson<PresignUploadResponse>('/api/assets/presign', data, 'Upload could not be prepared.');
}

export function completeUpload(data: CompleteUploadRequest): Promise<void> {
  return postJson<void>('/api/assets/complete', data, 'Image could not be saved.');
}

export async function uploadToPresignedUrl(url: string, file: File): Promise<void> {
  const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!response.ok) throw new Error('Image upload failed.');
}

export function createGeneration(data: CreateGenerationRequest): Promise<GenerationResponse> {
  return postJson<GenerationResponse>('/api/generations', data, 'Generation could not be started.');
}
