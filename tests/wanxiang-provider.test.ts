import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_WANXIANG_CLOTH_SUBMIT_URL,
  queryCloth,
  submitCloth
} from '../lib/providers/wanxiang/cloth';
import {
  DEFAULT_WANXIANG_IMAGE_TO_VIDEO_DURATION_SECONDS,
  DEFAULT_WANXIANG_IMAGE_TO_VIDEO_MODEL,
  DEFAULT_WANXIANG_IMAGE_TO_VIDEO_RESOLUTION,
  queryImageToVideo,
  submitImageToVideo
} from '../lib/providers/wanxiang/img-to-video';
import {
  DEFAULT_WANXIANG_TRY_ON_MULTI_SUBMIT_URL,
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
        durationSeconds: DEFAULT_WANXIANG_IMAGE_TO_VIDEO_DURATION_SECONDS,
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
            duration: DEFAULT_WANXIANG_IMAGE_TO_VIDEO_DURATION_SECONDS,
            prompt_extend: true,
            audio: false
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

  it('uses default cloth endpoint and accepts query task id shorthand', async () => {
    vi.stubEnv('WANXIANG_APPCODE', 'env-code');
    const fetchMock = mockJsonFetch({ code: 0, data: { task_id: 'cloth-task' } });

    await submitCloth({ imageUrl: 'https://img.test/a.jpg' }, { fetch: fetchMock });
    await queryCloth('cloth-task', { fetch: fetchMock });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      DEFAULT_WANXIANG_CLOTH_SUBMIT_URL,
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/maigc/api/cloth/query'),
      expect.objectContaining({
        body: JSON.stringify({ task_id: 'cloth-task' })
      })
    );
  });

  it('exports try-on single, multi, and query helpers', async () => {
    vi.stubEnv('WANXIANG_APPCODE', 'env-code');
    const fetchMock = mockJsonFetch({ code: 0, data: { task_id: 'try-task' } });

    await submitTryOnSingle({ modelUrl: 'https://img.test/model.jpg' }, { fetch: fetchMock });
    await submitTryOnMulti({ modelUrl: 'https://img.test/model.jpg' }, { fetch: fetchMock });
    await queryTryOn({ taskId: 'try-task' }, { fetch: fetchMock });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      DEFAULT_WANXIANG_TRY_ON_MULTI_SUBMIT_URL,
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/maigc/api/starlink/query'),
      expect.objectContaining({
        body: JSON.stringify({ taskId: 'try-task' })
      })
    );
  });
});
