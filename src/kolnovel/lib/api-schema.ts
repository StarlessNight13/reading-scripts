import { z } from "zod";

//  Chapter schema
const metaBoxSchema = z.object({
  ero_volume: z.string(),
  ero_chapter: z.coerce.number(),
  ero_title: z.string(),
  ero_series: z.string(),
});

const titleSchema = z.object({
  rendered: z.string(),
});

const contentSchema = z.object({
  rendered: z.string(),
  protected: z.boolean(),
});

const metaSchema = z.object({
  footnotes: z.string(),
});

export const chapterSchema = z.object({
  id: z.number(),
  slug: z.string(),
  status: z.string(),
  link: z.string().url(),
  title: titleSchema,
  content: contentSchema,
  meta: metaSchema,
  categories: z.array(z.number()),
  meta_box: metaBoxSchema.optional(),
});

export type APIChapter = z.infer<typeof chapterSchema>;

//  Novel schema
export const novelSchema = z.object({
  id: z.number(),
  count: z.number(),
  link: z.string(),
  name: z.string(),
  slug: z.string(),
});

export type APINovel = z.infer<typeof novelSchema>;

//  Chapter list schema
export const chapterListSchema = z.object({
  id: z.number(),
  title: z.string(),
  link: z.string(),
  chapterIndex: z.number(),
});

// Type definitions
export type ChapterList = z.infer<typeof chapterListSchema>;
