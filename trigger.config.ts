import { ffmpeg } from '@trigger.dev/build/extensions/core';
import { defineConfig } from '@trigger.dev/sdk';

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? 'ecommerce-video-saas',
  maxDuration: 900,
  build: {
    extensions: [ffmpeg({ version: '7' })]
  }
});
