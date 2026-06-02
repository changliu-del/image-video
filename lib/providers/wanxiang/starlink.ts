import { postWanxiangJson } from './client';
import {
  type WanxiangNormalizedResponse,
  type WanxiangPayload,
  type WanxiangRequestOptions
} from './types';

export const DEFAULT_WANXIANG_TRY_ON_SINGLE_SUBMIT_URL =
  'https://aifitting1.market.alicloudapi.com/maigc/api/starlink/submit';
export const DEFAULT_WANXIANG_TRY_ON_MULTI_SUBMIT_URL =
  'https://aifitting1.market.alicloudapi.com/maigc/api/starlink/multi/submit';
export const DEFAULT_WANXIANG_TRY_ON_QUERY_URL =
  'https://aifitting1.market.alicloudapi.com/maigc/api/starlink/query';

export function submitTryOnSingle(
  payload: WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return postWanxiangJson(
    options.url ||
      process.env.WANXIANG_TRY_ON_SINGLE_SUBMIT_URL ||
      DEFAULT_WANXIANG_TRY_ON_SINGLE_SUBMIT_URL,
    payload,
    { ...options, resultMediaType: 'image' }
  );
}

export function submitTryOnMulti(
  payload: WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return postWanxiangJson(
    options.url ||
      process.env.WANXIANG_TRY_ON_MULTI_SUBMIT_URL ||
      DEFAULT_WANXIANG_TRY_ON_MULTI_SUBMIT_URL,
    payload,
    { ...options, resultMediaType: 'image' }
  );
}

export function queryTryOn(
  task: string | WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return postWanxiangJson(
    options.url ||
      process.env.WANXIANG_TRY_ON_QUERY_URL ||
      DEFAULT_WANXIANG_TRY_ON_QUERY_URL,
    toTaskPayload(task),
    { ...options, resultMediaType: 'image' }
  );
}

function toTaskPayload(task: string | WanxiangPayload): WanxiangPayload {
  return typeof task === 'string' ? { task_id: task } : task;
}
