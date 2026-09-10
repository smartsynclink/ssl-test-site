'use client';

/**
 * Boots the Sanity Studio. The config holds functions (structure, document
 * actions, schema templates), so it is imported here inside the client module
 * rather than passed across the server/client boundary.
 */
import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';

const Studio = () => <NextStudio config={config} />;

export default Studio;
