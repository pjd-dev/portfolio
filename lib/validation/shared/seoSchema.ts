import { z } from "zod";

const openGraphSeoSchema = z.object({
  title: z.string().optional(), // og:title
  description: z.string().optional(), // og:description
  image: z.string().url().optional(), // og:image
  url: z.string().url().optional(), // og:url
  type: z.enum(["website", "article", "profile", "book", "video.other"]).optional(), // og:type
});

const twitterSeoSchema = z.object({
  card: z.enum(["summary", "summary_large_image", "app", "player"]).optional(), // twitter:card
  title: z.string().optional(), // twitter:title
  description: z.string().optional(), // twitter:description
  image: z.string().url().optional(), // twitter:image
  site: z.string().optional(), // twitter:site (@handle or name)
  creator: z.string().optional(), // twitter:creator
});

/**
 * SEO metadata for a page.
 * - Basic: title/description/keywords/image/canonical
 * - OG: openGraph
 * - Twitter: twitter
 */
export const pageSeoSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    image: z.string().url().optional(),
    canonical: z.string().url().optional(),
    openGraph: openGraphSeoSchema.optional(),
    twitter: twitterSeoSchema.optional(),
  })
  .default({});

export type PageSeo = z.infer<typeof pageSeoSchema>;
export type OpenGraphSeo = z.infer<typeof openGraphSeoSchema>;
export type TwitterSeo = z.infer<typeof twitterSeoSchema>;
