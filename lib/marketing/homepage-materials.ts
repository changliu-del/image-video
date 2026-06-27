export const homepageWorkbenchMaterials = [
  {
    asset: '/aivideo.mp4',
    poster: '/resources/video-posters/aivideo.jpg',
    mediaType: 'video',
  },
  {
    asset: '/resources/example2.mp4',
    poster: '/resources/video-posters/example2.jpg',
    mediaType: 'video',
  },
  {
    asset: '/resources/example5.mp4',
    poster: '/resources/video-posters/example5.jpg',
    mediaType: 'video',
  },
] as const;

export const homepageHeroPreviewVideo = homepageWorkbenchMaterials[0].asset;

export const dashboardHomeMedia = {
  imageToVideo: {
    asset: '/aivideo.mp4',
    poster: '/resources/video-posters/aivideo.jpg',
    mediaType: 'video',
  },
  productImage: {
    asset: '/resources/example4.mp4',
    poster: '/resources/video-posters/example4.jpg',
    mediaType: 'video',
  },
  tryOn: {
    asset: '/resources/example5.mp4',
    poster: '/resources/video-posters/example5.jpg',
    mediaType: 'video',
  },
} as const;
