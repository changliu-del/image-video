import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { VideoAspectRatio } from '@/lib/providers/video/types';
import type { EcommerceOverlayText } from '@/lib/templates/ecommerce';

export interface VideoOutputSpec {
  width: number;
  height: number;
}

export const VIDEO_OUTPUT_SPECS: Record<VideoAspectRatio, VideoOutputSpec> = {
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 }
};

export interface FfmpegCommand {
  command: string;
  args: string[];
}

export interface RenderEcommerceVideoInput {
  inputPath: string;
  outputPath: string;
  aspectRatio: VideoAspectRatio;
  overlay: EcommerceOverlayText;
  durationSeconds?: number;
  logoPath?: string;
  ffmpegPath?: string;
  fontFile?: string;
}

export interface GenerateThumbnailInput {
  inputPath: string;
  outputPath: string;
  aspectRatio: VideoAspectRatio;
  seekSeconds?: number;
  ffmpegPath?: string;
}

const COMMON_FONT_FILES = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  '/Library/Fonts/Arial Bold.ttf'
];

export async function renderEcommerceVideo(input: RenderEcommerceVideoInput) {
  await mkdir(dirname(input.outputPath), { recursive: true });
  const command = buildRenderEcommerceVideoCommand(input);
  await runCommand(command);
  return {
    outputPath: input.outputPath,
    spec: VIDEO_OUTPUT_SPECS[input.aspectRatio]
  };
}

export async function generateThumbnail(input: GenerateThumbnailInput) {
  await mkdir(dirname(input.outputPath), { recursive: true });
  const command = buildThumbnailCommand(input);
  await runCommand(command);
  return {
    outputPath: input.outputPath,
    spec: VIDEO_OUTPUT_SPECS[input.aspectRatio]
  };
}

export function buildRenderEcommerceVideoCommand(
  input: RenderEcommerceVideoInput
): FfmpegCommand {
  const spec = VIDEO_OUTPUT_SPECS[input.aspectRatio];
  const hasLogo = Boolean(input.logoPath);
  const audioInputIndex = hasLogo ? 2 : 1;
  const args = [
    '-y',
    '-i',
    input.inputPath
  ];

  if (input.logoPath) {
    args.push('-i', input.logoPath);
  }

  args.push(
    '-f',
    'lavfi',
    '-i',
    'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-filter_complex',
    buildFilterGraph({
      spec,
      overlay: input.overlay,
      aspectRatio: input.aspectRatio,
      hasLogo,
      fontFile: resolveFontFile(input.fontFile)
    }),
    '-map',
    '[vout]',
    '-map',
    `${audioInputIndex}:a`,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '18',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart'
  );

  if (input.durationSeconds) {
    args.push('-t', String(input.durationSeconds));
  }

  args.push('-shortest', input.outputPath);

  return {
    command: input.ffmpegPath ?? 'ffmpeg',
    args
  };
}

export function buildThumbnailCommand(input: GenerateThumbnailInput): FfmpegCommand {
  const spec = VIDEO_OUTPUT_SPECS[input.aspectRatio];

  return {
    command: input.ffmpegPath ?? 'ffmpeg',
    args: [
      '-y',
      '-ss',
      String(input.seekSeconds ?? 1),
      '-i',
      input.inputPath,
      '-frames:v',
      '1',
      '-vf',
      `scale=${spec.width}:${spec.height}:force_original_aspect_ratio=increase,crop=${spec.width}:${spec.height},setsar=1`,
      '-q:v',
      '3',
      input.outputPath
    ]
  };
}

function buildFilterGraph(input: {
  spec: VideoOutputSpec;
  overlay: EcommerceOverlayText;
  aspectRatio: VideoAspectRatio;
  hasLogo: boolean;
  fontFile?: string;
}) {
  const { width, height } = input.spec;
  const layout = getLayout(input.aspectRatio);
  const filters = [
    `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,format=yuv420p[base]`
  ];
  let current = 'base';
  let index = 0;

  const addText = (
    text: string,
    options: {
      y: number;
      fontSize: number;
      fontColor?: string;
      boxColor?: string;
      boxBorderWidth?: number;
      maxCharsPerLine: number;
    }
  ) => {
    const normalized = wrapForDrawtext(text, options.maxCharsPerLine);
    if (!normalized) return;
    const next = `v${index++}`;
    filters.push(
      `[${current}]${drawTextFilter({
        ...options,
        text: normalized,
        fontFile: input.fontFile
      })}[${next}]`
    );
    current = next;
  };

  addText(input.overlay.headline, layout.headline);
  addText(input.overlay.sellingPoint, layout.sellingPoint);
  addText(input.overlay.priceText, layout.price);
  addText(input.overlay.ctaText, layout.cta);

  if (input.hasLogo) {
    filters.push(`[1:v]scale=-1:${layout.logoHeight}[logo]`);
    filters.push(
      `[${current}][logo]overlay=x=${layout.margin}:y=${layout.margin}:format=auto[vout]`
    );
  } else {
    filters.push(`[${current}]format=yuv420p[vout]`);
  }

  return filters.join(';');
}

function drawTextFilter(input: {
  text: string;
  y: number;
  fontSize: number;
  maxCharsPerLine: number;
  fontFile?: string;
  fontColor?: string;
  boxColor?: string;
  boxBorderWidth?: number;
}) {
  const options = [
    input.fontFile ? `fontfile='${escapeDrawtext(input.fontFile)}'` : undefined,
    `text='${escapeDrawtext(input.text)}'`,
    'x=(w-text_w)/2',
    `y=${input.y}`,
    `fontsize=${input.fontSize}`,
    `fontcolor=${input.fontColor ?? 'white'}`,
    'line_spacing=12',
    'box=1',
    `boxcolor=${input.boxColor ?? 'black@0.52'}`,
    `boxborderw=${input.boxBorderWidth ?? 24}`,
    'fix_bounds=1'
  ].filter(Boolean);

  return `drawtext=${options.join(':')}`;
}

function getLayout(aspectRatio: VideoAspectRatio) {
  if (aspectRatio === '16:9') {
    return {
      margin: 64,
      logoHeight: 80,
      headline: {
        y: 72,
        fontSize: 60,
        boxBorderWidth: 22,
        maxCharsPerLine: 34
      },
      sellingPoint: {
        y: 640,
        fontSize: 42,
        boxBorderWidth: 20,
        maxCharsPerLine: 48
      },
      price: {
        y: 800,
        fontSize: 72,
        fontColor: '0xFFE066',
        boxBorderWidth: 24,
        maxCharsPerLine: 20
      },
      cta: {
        y: 920,
        fontSize: 48,
        boxColor: '0xE11D48@0.88',
        boxBorderWidth: 22,
        maxCharsPerLine: 18
      }
    };
  }

  if (aspectRatio === '1:1') {
    return {
      margin: 56,
      logoHeight: 78,
      headline: {
        y: 76,
        fontSize: 58,
        boxBorderWidth: 22,
        maxCharsPerLine: 28
      },
      sellingPoint: {
        y: 660,
        fontSize: 38,
        boxBorderWidth: 18,
        maxCharsPerLine: 34
      },
      price: {
        y: 810,
        fontSize: 70,
        fontColor: '0xFFE066',
        boxBorderWidth: 24,
        maxCharsPerLine: 18
      },
      cta: {
        y: 930,
        fontSize: 44,
        boxColor: '0xE11D48@0.88',
        boxBorderWidth: 20,
        maxCharsPerLine: 16
      }
    };
  }

  return {
    margin: 64,
    logoHeight: 96,
    headline: {
      y: 128,
      fontSize: 72,
      boxBorderWidth: 26,
      maxCharsPerLine: 22
    },
    sellingPoint: {
      y: 1180,
      fontSize: 46,
      boxBorderWidth: 20,
      maxCharsPerLine: 26
    },
    price: {
      y: 1480,
      fontSize: 86,
      fontColor: '0xFFE066',
      boxBorderWidth: 28,
      maxCharsPerLine: 16
    },
    cta: {
      y: 1640,
      fontSize: 52,
      boxColor: '0xE11D48@0.88',
      boxBorderWidth: 24,
      maxCharsPerLine: 14
    }
  };
}

function resolveFontFile(fontFile: string | undefined) {
  if (fontFile && existsSync(fontFile)) {
    return fontFile;
  }

  return COMMON_FONT_FILES.find((file) => existsSync(file));
}

function wrapForDrawtext(value: string, maxCharsPerLine: number) {
  const words = value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 2).join('\n');
}

function escapeDrawtext(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/%/g, '\\%')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

async function runCommand(command: FfmpegCommand) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command.command, command.args, {
      stdio: ['ignore', 'ignore', 'pipe'],
      shell: false
    });
    let stderr = '';

    child.stderr.on('data', (chunk: Buffer) => {
      stderr = `${stderr}${chunk.toString('utf8')}`.slice(-12000);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command.command} exited with code ${code ?? 'unknown'}: ${stderr}`
        )
      );
    });
  });
}
