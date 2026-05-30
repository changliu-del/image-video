// Type definitions for all API request/response interfaces
// Following ai-ops-fe convention: centralized types/api.ts

import type {
  Asset,
  CreditLedgerEntry,
  GenerationJob,
  User,
} from '@/lib/db/schema';

// ---- Pagination ----
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

// ---- Assets ----
export interface PresignUploadRequest {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PresignUploadResponse {
  assetId: string;
  uploadUrl: string;
  storageKey: string;
  publicUrl?: string;
}

export interface CompleteUploadRequest {
  assetId: string;
  storageKey: string;
}

// ---- Generations ----
export type GenerationType = 'image-to-video' | 'text-to-image';
export type GenerationAspectRatio = '9:16' | '1:1' | '16:9';

export interface CreateImageToVideoGenerationRequest {
  generationType?: 'image-to-video';
  mode?: 'image-to-video';
  inputAssetId: string;
  productName: string;
  headline: string;
  sellingPoint: string;
  priceText: string;
  ctaText: string;
  aspectRatio: GenerationAspectRatio;
  durationSeconds: 5 | 8 | 10;
  templateSlug: 'flash_sale' | 'new_arrival' | 'best_seller';
}

export type CreateTextToImageGenerationRequest =
  | {
      generationType: 'text-to-image';
      mode?: 'text-to-image';
      prompt: string;
      aspectRatio?: GenerationAspectRatio;
    }
  | {
      generationType?: 'text-to-image';
      mode: 'text-to-image';
      prompt: string;
      aspectRatio?: GenerationAspectRatio;
    };

export type CreateGenerationRequest =
  | CreateImageToVideoGenerationRequest
  | CreateTextToImageGenerationRequest;

export interface GenerationResponse {
  jobId: string;
  status: string;
}

// ---- Admin ----
export type AdminUserListResponse = PaginatedResponse<User>;
export type AdminAssetListResponse = PaginatedResponse<Asset>;
export type AdminJobListResponse = PaginatedResponse<GenerationJob>;
export type AdminCreditListResponse = PaginatedResponse<CreditLedgerEntry>;
