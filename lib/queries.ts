import { groq } from 'next-sanity';

const IMAGE = `{ ..., asset->{ _id, url, metadata { lqip, dimensions } } }`;

export const SETTINGS_QUERY = groq`*[_type == "siteSettings"][0]{
  ..., logo${IMAGE},
  serviceCategories[]{ ..., image${IMAGE} }
}`;

const SECTIONS = `sections[]{
  ...,
  images[]${IMAGE},
  image${IMAGE},
  photos[]{ ..., image${IMAGE} },
  projects[]->{ _id, title, caption, category, beforeImage${IMAGE}, afterImage${IMAGE} },
  videos[]->{ _id, title, caption, "videoUrl": video.asset->url, poster${IMAGE} },
  video->{ _id, title, "videoUrl": video.asset->url, poster${IMAGE} },
  faqs[]->{ _id, question, answer },
  groups[]{ ..., faqs[]->{ _id, question, answer } },
  reviews[]->{ _id, author, quote, initials, rating }
}`;

export const PAGE_QUERY = groq`*[_type == "page" && slug.current == $slug][0]{ ..., ${SECTIONS} }`;
export const HOME_QUERY = groq`*[_type == "page" && isHome == true][0]{ ..., ${SECTIONS} }`;
export const SLUGS_QUERY = groq`*[_type == "page" && isHome != true].slug.current`;
