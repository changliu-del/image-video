import { queryImageEdit, submitImageEdit } from './image-edit';
import {
  type WanxiangNormalizedResponse,
  type WanxiangPayload,
  type WanxiangRequestOptions
} from './types';

export function submitTryOnSingle(
  payload: WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return submitImageEdit('try_on', payload, options);
}

export function submitTryOnMulti(
  payload: WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return submitImageEdit('try_on', payload, options);
}

export function queryTryOn(
  task: string | WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return queryImageEdit(task, options);
}
