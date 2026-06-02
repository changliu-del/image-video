import { postWanxiangJson } from './client';
import {
  type WanxiangNormalizedResponse,
  type WanxiangPayload,
  type WanxiangRequestOptions
} from './types';

export const DEFAULT_WANXIANG_IMG_TO_VIDEO_SUBMIT_URL =
  'https://imgtovideo.market.alicloudapi.com/maigc/api/imgToVideo/submit';
export const DEFAULT_WANXIANG_IMG_TO_VIDEO_QUERY_URL =
  'https://imgtovideo.market.alicloudapi.com/maigc/api/imgToVideo/query';

export function submitImageToVideo(
  payload: WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return postWanxiangJson(
    options.url ||
      process.env.WANXIANG_IMG_TO_VIDEO_SUBMIT_URL ||
      DEFAULT_WANXIANG_IMG_TO_VIDEO_SUBMIT_URL,
    payload,
    { ...options, resultMediaType: 'video' }
  );
}

export function queryImageToVideo(
  task: string | WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return postWanxiangJson(
    options.url ||
      process.env.WANXIANG_IMG_TO_VIDEO_QUERY_URL ||
      DEFAULT_WANXIANG_IMG_TO_VIDEO_QUERY_URL,
    toTaskPayload(task),
    { ...options, resultMediaType: 'video' }
  );
}

function toTaskPayload(task: string | WanxiangPayload): WanxiangPayload {
  return typeof task === 'string' ? { task_id: task } : task;
}
