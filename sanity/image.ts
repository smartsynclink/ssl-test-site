import { createImageUrlBuilder } from '@sanity/image-url';
import type { Image } from 'sanity';
import { dataset, projectId } from './env';

const builder = createImageUrlBuilder({ projectId, dataset });

export const urlFor = (source: Image) => builder.image(source);

/** LQIP + dimensions live on the asset metadata; used for next/image blur. */
export type SanityImage = Image & {
  asset?: { metadata?: { lqip?: string; dimensions?: { width: number; height: number } } };
  alt?: string;
};
