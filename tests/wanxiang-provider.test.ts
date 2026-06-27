import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  queryCloth,
  submitCloth
} from '../lib/providers/wanxiang/cloth';
import { DEFAULT_WANXIANG_IMAGE_EDIT_MODEL } from '../lib/providers/wanxiang/image-edit';
import {
  DEFAULT_WANXIANG_IMAGE_TO_VIDEO_MODEL,
  DEFAULT_WANXIANG_IMAGE_TO_VIDEO_RESOLUTION,
  WANXIANG_REFERENCE_TO_VIDEO_MODEL,
  queryImageToVideo,
  submitImageToVideo
} from '../lib/providers/wanxiang/img-to-video';
import {
  queryTryOn,
  submitTryOnMulti,
  submitTryOnSingle
} from '../lib/providers/wanxiang/starlink';
import {
  WanxiangClient,
  normalizeWanxiangResponse
} from '../lib/providers/wanxiang/client';
import { WanxiangProviderError } from '../lib/providers/wanxiang/types';

function mockJsonFetch(body: unknown, init: ResponseInit = {}) {
  return vi.fn(async () => {
    return new Response(JSON.stringify(body), {
      status: init.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
      ...init
    });
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('WanxiangClient', () => {
  it('posts JSON with APPCODE auth and normalizes submit task id', async () => {
    const fetchMock = mockJsonFetch({
      code: 0,
      data: { taskId: 'task-123', status: 'processing' }
    });

    const result = await new WanxiangClient({
      appCode: 'secret-code',
      fetch: fetchMock
    }).post('https://example.com/submit', { imageUrl: 'https://img.test/a.jpg' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/submit',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'APPCODE secret-code',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ imageUrl: 'https://img.test/a.jpg' })
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        providerTaskId: 'task-123',
        status: 'running'
      })
    );
  });

  it('maps HTTP errors to provider errors with raw response', async () => {
    const fetchMock = mockJsonFetch(
      { code: 'InternalError', msg: 'upstream failed' },
      { status: 502 }
    );

    await expect(
      new WanxiangClient({ appCode: 'secret-code', fetch: fetchMock }).post(
        'https://example.com/query',
        { task_id: 'task-123' }
      )
    ).rejects.toMatchObject({
      name: 'WanxiangProviderError',
      code: 'HTTP_ERROR',
      retriable: true,
      statusCode: 502,
      rawResponse: { code: 'InternalError', msg: 'upstream failed' }
    });
  });

  it('requires WANXIANG_APPCODE when options do not provide appCode', async () => {
    await expect(
      new WanxiangClient({ fetch: mockJsonFetch({ code: 0 }) }).post(
        'https://example.com/submit',
        {}
      )
    ).rejects.toMatchObject({
      code: 'MISSING_CREDENTIALS'
    });
  });

  it('maps aborted requests to timeout errors', async () => {
    const fetchMock = vi.fn(async () => {
      throw new DOMException('aborted', 'AbortError');
    });

    await expect(
      new WanxiangClient({
        appCode: 'secret-code',
        fetch: fetchMock
      }).post('https://example.com/submit', {})
    ).rejects.toMatchObject({
      code: 'TIMEOUT',
      retriable: true
    });
  });

  it('maps Wanxiang API error codes to API_ERROR', async () => {
    const fetchMock = mockJsonFetch({ code: 10001, msg: 'bad request' });

    await expect(
      new WanxiangClient({ appCode: 'secret-code', fetch: fetchMock }).post(
        'https://example.com/submit',
        {}
      )
    ).rejects.toBeInstanceOf(WanxiangProviderError);
    await expect(
      new WanxiangClient({ appCode: 'secret-code', fetch: fetchMock }).post(
        'https://example.com/submit',
        {}
      )
    ).rejects.toMatchObject({
      code: 'API_ERROR',
      message: 'bad request'
    });
  });
});

describe('normalizeWanxiangResponse', () => {
  it('extracts video result URLs from varied nested fields', () => {
    expect(
      normalizeWanxiangResponse({
        data: {
          task_id: 'video-task',
          taskStatus: 'SUCCESS',
          output: { media: { videoUrl: 'https://cdn.test/final.mp4' } }
        }
      })
    ).toEqual(
      expect.objectContaining({
        providerTaskId: 'video-task',
        status: 'succeeded',
        finalVideoUrl: 'https://cdn.test/final.mp4'
      })
    );
  });

  it('normalizes DashScope task status and video URL fields', () => {
    expect(
      normalizeWanxiangResponse({
        output: {
          task_id: 'dashscope-task',
          task_status: 'SUCCEEDED',
          video_url: 'https://dashscope-result.test/final.mp4'
        },
        request_id: 'request-123'
      })
    ).toEqual(
      expect.objectContaining({
        providerTaskId: 'dashscope-task',
        status: 'succeeded',
        finalVideoUrl: 'https://dashscope-result.test/final.mp4'
      })
    );
  });

  it('extracts image result URLs and treats result presence as success', () => {
    expect(
      normalizeWanxiangResponse({
        result: {
          taskId: 'image-task',
          images: [{ url: 'https://cdn.test/final.webp' }]
        }
      })
    ).toEqual(
      expect.objectContaining({
        providerTaskId: 'image-task',
        status: 'succeeded',
        finalImageUrl: 'https://cdn.test/final.webp'
      })
    );
  });

  it('normalizes DashScope image generation choice content', () => {
    expect(
      normalizeWanxiangResponse(
        {
          output: {
            task_id: 'image-edit-task',
            task_status: 'SUCCEEDED',
            choices: [
              {
                message: {
                  content: [
                    {
                      image: 'https://dashscope-result.test/final.png'
                    }
                  ]
                }
              }
            ]
          },
          request_id: 'request-123'
        },
        'image'
      )
    ).toEqual(
      expect.objectContaining({
        providerTaskId: 'image-edit-task',
        status: 'succeeded',
        finalImageUrl: 'https://dashscope-result.test/final.png'
      })
    );
  });

  it('preserves failed status and error message', () => {
    expect(
      normalizeWanxiangResponse({
        data: {
          id: 'failed-task',
          state: 'failed',
          error_message: 'generation failed'
        }
      })
    ).toEqual(
      expect.objectContaining({
        providerTaskId: 'failed-task',
        status: 'failed',
        errorMessage: 'generation failed'
      })
    );
  });
});

describe('Wanxiang capability exports', () => {
  it('submits image-to-video jobs through Bailian DashScope', async () => {
    vi.stubEnv('DASHSCOPE_API_KEY', 'dashscope-key');
    vi.stubEnv('DASHSCOPE_VIDEO_SYNTHESIS_URL', 'https://override.test/i2v');
    const fetchMock = mockJsonFetch({
      output: { task_id: 'i2v-task', task_status: 'PENDING' }
    });

    await submitImageToVideo(
      {
        inputImageUrl: 'https://img.test/product.png',
        prompt: '模特转动身体展示衣服',
        durationSeconds: 12,
        metadata: { jobId: 'local-job' }
      },
      { fetch: fetchMock }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://override.test/i2v',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer dashscope-key',
          'X-DashScope-Async': 'enable',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          model: DEFAULT_WANXIANG_IMAGE_TO_VIDEO_MODEL,
          input: {
            img_url: 'https://img.test/product.png',
            prompt: '模特转动身体展示衣服'
          },
          parameters: {
            resolution: DEFAULT_WANXIANG_IMAGE_TO_VIDEO_RESOLUTION,
            duration: 12,
            prompt_extend: true,
            audio: false
          }
        })
      })
    );
  });

  it('uses the selected Pro image-to-video model in DashScope payloads', async () => {
    vi.stubEnv('DASHSCOPE_API_KEY', 'dashscope-key');
    vi.stubEnv('DASHSCOPE_VIDEO_SYNTHESIS_URL', 'https://override.test/i2v');
    const fetchMock = mockJsonFetch({
      output: { task_id: 'i2v-pro-task', task_status: 'PENDING' }
    });

    await submitImageToVideo(
      {
        inputImageUrl: 'https://img.test/product.png',
        prompt: '高质量广告片',
        durationSeconds: 5,
        videoModelMode: 'wanxiang_2_7'
      },
      { fetch: fetchMock }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://override.test/i2v',
      expect.objectContaining({
        body: JSON.stringify({
          model: 'wan2.7-i2v-2026-04-25',
          input: {
            prompt: '高质量广告片',
            media: [
              {
                type: 'first_frame',
                url: 'https://img.test/product.png'
              }
            ]
          },
          parameters: {
            resolution: '720P',
            duration: 5,
            prompt_extend: true
          }
        })
      })
    );
  });

  it('uses Wanxiang 2.7 reference-to-video when an appearing model image is provided', async () => {
    vi.stubEnv('DASHSCOPE_API_KEY', 'dashscope-key');
    vi.stubEnv('DASHSCOPE_VIDEO_SYNTHESIS_URL', 'https://override.test/i2v');
    const fetchMock = mockJsonFetch({
      output: { task_id: 'r2v-task', task_status: 'PENDING' }
    });

    await submitImageToVideo(
      {
        inputImageUrl: 'https://img.test/product.png',
        modelImageUrl: 'https://img.test/model.png',
        prompt: 'Create a product video with the selected model.',
        durationSeconds: 5,
        videoModelMode: 'wanxiang_2_7'
      },
      { fetch: fetchMock }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://override.test/i2v',
      expect.objectContaining({
        body: JSON.stringify({
          model: WANXIANG_REFERENCE_TO_VIDEO_MODEL,
          input: {
            prompt:
              'Create a product video with the selected model.\n\nUse Image 1 as the primary product or source reference and Image 2 as the appearing model reference. Keep both references visually consistent in the generated video.',
            media: [
              {
                type: 'reference_image',
                url: 'https://img.test/product.png'
              },
              {
                type: 'reference_image',
                url: 'https://img.test/model.png'
              }
            ]
          },
          parameters: {
            resolution: '720P',
            duration: 5,
            prompt_extend: true
          }
        })
      })
    );
  });

  it('queries image-to-video jobs through Bailian DashScope task API', async () => {
    vi.stubEnv('DASHSCOPE_API_KEY', 'dashscope-key');
    vi.stubEnv('DASHSCOPE_BASE_URL', 'https://dashscope.example/api/v1');
    const fetchMock = mockJsonFetch({
      output: {
        task_id: 'i2v-task',
        task_status: 'SUCCEEDED',
        video_url: 'https://dashscope-result.test/final.mp4'
      }
    });

    const result = await queryImageToVideo('i2v-task', { fetch: fetchMock });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://dashscope.example/api/v1/tasks/i2v-task',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer dashscope-key'
        })
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: 'succeeded',
        finalVideoUrl: 'https://dashscope-result.test/final.mp4'
      })
    );
  });

  it('submits apparel image jobs through Bailian Wanxiang image edit', async () => {
    vi.stubEnv('DASHSCOPE_API_KEY', 'dashscope-key');
    vi.stubEnv('DASHSCOPE_IMAGE_GENERATION_URL', 'https://override.test/image');
    vi.stubEnv('DASHSCOPE_BASE_URL', 'https://dashscope.example/api/v1');
    const fetchMock = mockJsonFetch({
      output: { task_id: 'cloth-task', task_status: 'PENDING' }
    });

    await submitCloth(
      {
        inputImageUrl: 'https://img.test/a.jpg',
        prompt: 'Create a clean product campaign image.',
        aspectRatio: '16:9'
      },
      { fetch: fetchMock }
    );
    await queryCloth('cloth-task', { fetch: fetchMock });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://override.test/image',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer dashscope-key',
          'X-DashScope-Async': 'enable',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          model: DEFAULT_WANXIANG_IMAGE_EDIT_MODEL,
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  { image: 'https://img.test/a.jpg' },
                  { text: 'Create a clean product campaign image.' }
                ]
              }
            ]
          },
          parameters: {
            size: '2048*1152',
            n: 1,
            watermark: false
          }
        })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://dashscope.example/api/v1/tasks/cloth-task',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer dashscope-key'
        })
      })
    );
  });

  it('submits try-on single, multi, and query helpers through Bailian image edit', async () => {
    vi.stubEnv('DASHSCOPE_API_KEY', 'dashscope-key');
    vi.stubEnv('DASHSCOPE_IMAGE_GENERATION_URL', 'https://override.test/image');
    vi.stubEnv('DASHSCOPE_BASE_URL', 'https://dashscope.example/api/v1');
    const fetchMock = mockJsonFetch({
      output: { task_id: 'try-task', task_status: 'PENDING' }
    });

    await submitTryOnSingle(
      {
        modelImageUrl: 'https://img.test/model.jpg',
        garmentImageUrls: ['https://img.test/top.jpg'],
        aspectRatio: '9:16',
        prompt: 'Dress the model with the garment.'
      },
      { fetch: fetchMock }
    );
    await submitTryOnMulti(
      {
        modelImageUrl: 'https://img.test/model.jpg',
        garmentImageUrls: ['https://img.test/top.jpg', 'https://img.test/bottom.jpg'],
        aspectRatio: '3:4'
      },
      { fetch: fetchMock }
    );
    await queryTryOn({ taskId: 'try-task' }, { fetch: fetchMock });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://override.test/image',
      expect.objectContaining({
        body: JSON.stringify({
          model: DEFAULT_WANXIANG_IMAGE_EDIT_MODEL,
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  { image: 'https://img.test/top.jpg' },
                  { image: 'https://img.test/model.jpg' },
                  { text: 'Dress the model with the garment.' }
                ]
              }
            ]
          },
          parameters: {
            size: '1152*2048',
            n: 1,
            watermark: false
          }
        })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://override.test/image',
      expect.objectContaining({
        body: JSON.stringify({
          model: DEFAULT_WANXIANG_IMAGE_EDIT_MODEL,
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  { image: 'https://img.test/top.jpg' },
                  { image: 'https://img.test/bottom.jpg' },
                  { image: 'https://img.test/model.jpg' },
                  {
                    text:
                      'Create a natural virtual try-on image. Dress the person in the model image with the provided garment reference images, preserve the person identity and pose, keep fabric details accurate, and make lighting and fit realistic.'
                  }
                ]
              }
            ]
          },
          parameters: {
            size: '1536*2048',
            n: 1,
            watermark: false
          }
        })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://dashscope.example/api/v1/tasks/try-task',
      expect.objectContaining({
        method: 'GET'
      })
    );
  });
});
