import { queryImageEdit, submitImageEdit } from './image-edit';
import {
  type WanxiangNormalizedResponse,
  type WanxiangPayload,
  type WanxiangRequestOptions
} from './types';

export function submitCloth(
  payload: WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return submitImageEdit('apparel_image', payload, options);
}

export function queryCloth(
  task: string | WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return queryImageEdit(task, options);
}
