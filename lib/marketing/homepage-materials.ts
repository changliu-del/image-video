export const homepageWorkbenchMaterials = [
  {
    asset: '/aivideo.mp4',
    mediaType: 'video',
  },
  {
    asset: '/resources/example2.mp4',
    mediaType: 'video',
  },
  {
    asset: '/resources/example5.mp4',
    mediaType: 'video',
  },
] as const;

export const homepageHeroPreviewVideo = homepageWorkbenchMaterials[0].asset;

export const workbenchHomeMedia = {
  imageToVideo: {
    asset: '/aivideo.mp4',
    mediaType: 'video',
  },
  productImage: {
    asset: '/resources/example2.mp4',
    mediaType: 'video',
  },
  tryOn: {
    asset: '/resources/example5.mp4',
    mediaType: 'video',
  },
} as const;

export const workbenchHomeFallbackImages = [
  '/resources/example1.png',
  '/resources/example2.png',
  '/resources/example3.png',
  '/resources/example4.png',
  '/resources/example5.png',
  '/resources/example6.png',
] as const;
