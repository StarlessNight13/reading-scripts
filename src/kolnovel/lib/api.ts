import { z } from "zod";
import {
  APIChapter,
  APINovel,
  ChapterList,
  chapterListSchema,
  chapterSchema,
  novelSchema,
} from "./api-schema";
import { tryCatch } from "./utils";

const API_URL = "https://kolnovel.com/wp-json/wp/v2";
const SITE_URL = "https://kolnovel.com";

/**
 * Utility functions for API operations
 */
class ApiUtils {
  /**
   * Calculate chapter pagination information
   */
  static currentChapterPage(
    chapterCount: number,
    chapterIndex: number,
    collectionSize: number,
    offset: number = 0
  ) {
    const totalCollections = Math.ceil(chapterCount / collectionSize);
    const originalCollection = Math.floor(
      (chapterIndex - offset) / collectionSize
    );
    const page = totalCollections - originalCollection;
    return { page, totalCollections, originalCollection };
  }

  /**
   * Extract chapter index from title
   */
  static getChapterIndex(chapterTitle: string, novelName: string): number {
    const pureString = chapterTitle.replace(novelName, "").trim();
    const index = pureString.split(" ")[0];
    return Number(index);
  }

  /**
   * Parse headers to get total pages
   */
  static getTotalPages(response: Response): number {
    const totalPagesHeader = response.headers.get("X-WP-TotalPages");
    const totalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1;

    if (isNaN(totalPages) || totalPages < 1) {
      console.warn(
        `Invalid X-WP-TotalPages header: '${totalPagesHeader}'. Defaulting to 1.`
      );
      return 1;
    }

    return totalPages;
  }
}

/**
 * API client for novel service interactions
 */
class NovelApiClient {
  constructor(private baseUrl: string = API_URL) {}

  /**
   * Fetch and parse JSON with error handling
   */
  private async fetchJson<T>(
    url: string,
    schema: z.ZodType<T>
  ): Promise<T | null> {
    const { data: response, error } = await tryCatch(fetch(url));
    if (error || !response) return null;

    try {
      const data = await response.json();
      const result = schema.safeParse(data);
      if (!result.success) {
        console.error(`Invalid JSON from ${url}:`, result.error);
        return null;
      }
      return result.data;
    } catch (err) {
      console.error(`Error parsing JSON from ${url}:`, err);
      return null;
    }
  }

  /**
   * Get novel by ID
   */
  async getNovel(id: number): Promise<APINovel | null> {
    return this.fetchJson(`${this.baseUrl}/categories/${id}`, novelSchema);
  }

  /**
   * Get novel by chapter ID
   */
  async getNovelByChapterId(chapterId: number): Promise<APINovel | null> {
    const novels = await this.fetchJson(
      `${this.baseUrl}/categories?post=${chapterId}`,
      z.array(novelSchema)
    );
    return novels?.[0] ?? null;
  }

  /**
   * Get novel by slug
   */
  async getNovelBySlug(slug: string): Promise<APINovel | null> {
    const novels = await this.fetchJson(
      `${this.baseUrl}/categories?slug=${slug}`,
      z.array(novelSchema)
    );
    return novels?.[0] ?? null;
  }

  /**
   * Get chapter by ID
   */
  async getChapter(id: number): Promise<APIChapter | null> {
    return this.fetchJson(`${this.baseUrl}/posts/${id}`, chapterSchema);
  }

  /**
   * Get paginated chapters for a novel
   */
  async getChaptersByNovelId(
    novelId: number,
    page: number = 1,
    pageSize: number = 10
  ): Promise<APIChapter[] | null> {
    return this.fetchJson(
      `${this.baseUrl}/posts?categories=${novelId}&per_page=${pageSize}&page=${page}`,
      z.array(chapterSchema)
    );
  }

  /**
   * Get chapter data (alias for getChapter)
   */
  async getChapterData(chapterId: number): Promise<APIChapter | null> {
    return this.getChapter(chapterId);
  }

  /**
   * Get chapter list from HTML content
   */
  async getChaptersList(
    uri: string,
    currentChapterId: number
  ): Promise<{
    data: ChapterList[];
    currentChapterIndex: number;
  } | null> {
    const { data: response, error } = await tryCatch(
      fetch(`${SITE_URL}/series/${uri}`)
    );
    if (error || !response) return null;

    try {
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const sections = this.extractSections(doc);
      const { chapters, currentChapterIndex } = this.processChapters(
        sections,
        currentChapterId
      );

      const result = z.array(chapterListSchema).safeParse(chapters);
      return result.success ? { data: result.data, currentChapterIndex } : null;
    } catch (err) {
      console.error(`Error parsing chapters list:`, err);
      return null;
    }
  }

  /**
   * Extract sections from HTML document
   */
  private extractSections(doc: Document) {
    const sectionTitles = doc.querySelectorAll(".ts-chl-collapsible");
    const chapterLists = doc.querySelectorAll<HTMLUListElement>(
      "div.bixbox.bxcl.epcheck > div > div > ul"
    );

    const sections: { title: string; content: HTMLUListElement }[] = [];
    let currentListIndex = 0;

    for (let i = 0; i < sectionTitles.length; i++) {
      const title = sectionTitles[i].textContent?.trim() ?? "";
      const nextTitle = sectionTitles[i + 1] || null;

      while (
        currentListIndex < chapterLists.length &&
        (!nextTitle ||
          chapterLists[currentListIndex].compareDocumentPosition(nextTitle) &
            Node.DOCUMENT_POSITION_FOLLOWING)
      ) {
        sections.push({ title, content: chapterLists[currentListIndex] });
        currentListIndex++;
        break;
      }
    }

    return sections;
  }

  /**
   * Process sections into chapter list
   */
  private processChapters(
    sections: { title: string; content: HTMLUListElement }[],
    currentChapterId: number
  ) {
    let currentChapterIndex = 0;

    const chapters = sections.flatMap((section) => {
      return Array.from(section.content?.children ?? []).map((item) => {
        const chapterId = Number(item.getAttribute("data-id"));
        const chapterLink =
          item.querySelector("a")?.getAttribute("href") ?? "404";
        const chapterTitle =
          item.querySelector(".epl-title")?.textContent ?? "unknown";

        const rawIndex = item.querySelector(".epl-num")?.textContent ?? "";
        const cleanIndex = rawIndex
          .replace(section.title, "")
          .replace("الفصل", "")
          .trim();
        const index = Number(cleanIndex) - 1;

        if (currentChapterId === chapterId) {
          currentChapterIndex = index;
        }

        return {
          id: chapterId,
          chapterIndex: index,
          title: chapterTitle,
          link: chapterLink,
        };
      });
    });

    return { chapters: chapters.reverse(), currentChapterIndex };
  }
}

export const api = new NovelApiClient();
export const apiUtils = ApiUtils;
