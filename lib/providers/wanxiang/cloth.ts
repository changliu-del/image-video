import { postWanxiangJson } from './client';
import {
  type WanxiangNormalizedResponse,
  type WanxiangPayload,
  type WanxiangRequestOptions
} from './types';

export const DEFAULT_WANXIANG_CLOTH_SUBMIT_URL =
  'https://cloth1.market.alicloudapi.com/maigc/api/cloth/submit';
export const DEFAULT_WANXIANG_CLOTH_QUERY_URL =
  'https://cloth1.market.alicloudapi.com/maigc/api/cloth/query';

export function submitCloth(
  payload: WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return postWanxiangJson(
    options.url ||
      process.env.WANXIANG_CLOTH_SUBMIT_URL ||
      DEFAULT_WANXIANG_CLOTH_SUBMIT_URL,
    payload,
    { ...options, resultMediaType: 'image' }
  );
}

export function queryCloth(
  task: string | WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return postWanxiangJson(
    options.url ||
      process.env.WANXIANG_CLOTH_QUERY_URL ||
      DEFAULT_WANXIANG_CLOTH_QUERY_URL,
    toTaskPayload(task),
    { ...options, resultMediaType: 'image' }
  );
}

function toTaskPayload(task: string | WanxiangPayload): WanxiangPayload {
  return typeof task === 'string' ? { task_id: task } : task;
}
