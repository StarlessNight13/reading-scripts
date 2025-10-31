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

// Constants
const API_URL = "https://kolnovel.com/wp-json/wp/v2";

// Schema definitions

/**
 * Helper functions
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
  static getChapterIndex(chapterTitle: string, novelName: string) {
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
        `Invalid X-WP-TotalPages header found ('${totalPagesHeader}'). Assuming 1 page.`
      );
      return 1;
    }

    return totalPages;
  }
}

/**
 * API client for interacting with the novel service
 */
class NovelApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get novel by its ID
   */
  async getNovel(id: number): Promise<APINovel | null> {
    const { data: response, error } = await tryCatch(
      fetch(`${this.baseUrl}/categories/${id}`)
    );

    if (error || !response) return null;

    try {
      const data = await response.json();
      const result = novelSchema.safeParse(data);
      return result.success ? result.data : null;
    } catch (err) {
      console.error(`Error parsing novel data: ${err}`);
      return null;
    }
  }

  /**
   * Get novel by chapter ID
   */
  async getNovelByChapterId(chapterId: number): Promise<APINovel | null> {
    const { data: response, error } = await tryCatch(
      fetch(`${this.baseUrl}/categories?post=${chapterId}`)
    );

    if (error || !response) return null;

    try {
      const data = await response.json();
      const result = z.array(novelSchema).safeParse(data);
      return result.success && result.data.length > 0 ? result.data[0] : null;
    } catch (err) {
      console.error(`Error parsing novel by chapter ID: ${err}`);
      return null;
    }
  }

  /**
   * Get novel by its slug
   */
  async getNovelBySlug(slug: string): Promise<APINovel | null> {
    const { data: response, error } = await tryCatch(
      fetch(`${this.baseUrl}/categories?slug=${slug}`)
    );

    if (error || !response) return null;

    try {
      const data = await response.json();
      const result = z.array(novelSchema).safeParse(data);
      return result.success && result.data.length > 0 ? result.data[0] : null;
    } catch (err) {
      console.error(`Error parsing novel by slug: ${err}`);
      return null;
    }
  }

  /**
   * Get a specific chapter by ID
   */
  async getChapter(id: number): Promise<APIChapter | null> {
    const { data: response, error } = await tryCatch(
      fetch(`${this.baseUrl}/posts/${id}`)
    );

    if (error || !response) return null;

    try {
      const data = await response.json();
      const result = chapterSchema.safeParse(data);
      return result.success ? result.data : null;
    } catch (err) {
      console.error(`Error parsing chapter data: ${err}`);
      return null;
    }
  }

  /**
   * Get paginated chapters for a novel
   */
  async getChaptersByNovelId(
    novelId: number,
    page: number = 1,
    pageSize: number = 10
  ): Promise<APIChapter[] | null> {
    const url = `${this.baseUrl}/posts?categories=${novelId}&per_page=${pageSize}&page=${page}`;
    const { data: response, error } = await tryCatch(fetch(url));

    if (error || !response) return null;

    try {
      const data = await response.json();
      const result = z.array(chapterSchema).safeParse(data);
      return result.success ? result.data : null;
    } catch (err) {
      console.error(`Error parsing chapters by novel ID: ${err}`);
      return null;
    }
  }

  /**
   * Get chapter data by ID
   */
  async getChapterData(chapterId: number): Promise<APIChapter | null> {
    const { data: response, error } = await tryCatch(
      fetch(`${this.baseUrl}/posts/${chapterId}`)
    );

    if (error || !response) return null;

    try {
      const data = await response.json();
      return chapterSchema.parse(data);
    } catch (err) {
      console.error(`Error parsing chapter data: ${err}`);
      return null;
    }
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
    // Fetch and parse the HTML document
    const { data: response, error } = await tryCatch(
      fetch(`https://kolnovel.com/series/${uri}`)
    );
    if (error || !response) return null;

    try {
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      // Extract section titles and chapter lists
      const sectionTitles = doc.querySelectorAll(".ts-chl-collapsible");
      const chapterLists = doc.querySelectorAll<HTMLUListElement>(
        "div.bixbox.bxcl.epcheck > div > div > ul"
      );

      // Pair section titles with their corresponding chapter lists
      const sections = [];
      let currentListIndex = 0;

      for (let i = 0; i < sectionTitles.length; i++) {
        const title = sectionTitles[i].textContent?.trim() ?? "";
        const nextTitle = sectionTitles[i + 1] || null;
        let currentList = null;

        // Find all chapter lists that belong to this section title
        while (
          currentListIndex < chapterLists.length &&
          (!nextTitle ||
            chapterLists[currentListIndex].compareDocumentPosition(nextTitle) &
              Node.DOCUMENT_POSITION_FOLLOWING)
        ) {
          currentList = chapterLists[currentListIndex];
          currentListIndex++;
        }

        if (currentList) {
          sections.push({ title, content: currentList });
        }
      }
      let currentChapterIndex = 0;
      // Process each section to extract chapter information
      const extractChapterInfo = (section: {
        title: string;
        content: HTMLUListElement;
      }): ChapterList[] => {
        return Array.from(section.content?.children ?? []).map((item) => {
          const chapterId = Number(item.getAttribute("data-id"));
          const chapterLink =
            item.querySelector("a")?.getAttribute("href") ?? "404";
          const chapterTitle =
            item.querySelector(".epl-title")?.textContent ?? "unknown";

          // Clean up chapter index by removing section title and "الفصل" text
          const rawIndex = item.querySelector(".epl-num")?.textContent ?? "";
          const cleanIndex = rawIndex
            .replace(section.title ?? "الفصل", "")
            .replace("الفصل", "")
            .trim();
          if (currentChapterId === chapterId) {
            currentChapterIndex = Number(cleanIndex) - 1;
          }
          return {
            id: chapterId,
            chapterIndex: Number(cleanIndex) - 1,
            title: chapterTitle,
            link: chapterLink,
          };
        });
      };

      // Process all sections and create the final chapter list
      const chapters = sections.flatMap(extractChapterInfo).reverse(); // Reverse to maintain original order

      // Validate and return the chapter list
      const result = z.array(chapterListSchema).safeParse(chapters);
      return result.success
        ? {
            data: result.data,
            currentChapterIndex: currentChapterIndex,
          }
        : null;
    } catch (err) {
      console.error(`Error parsing chapters list: ${err}`);
      return null;
    }
  }
}

// Export a preconfigured API client instance and utility functions
export const api = new NovelApiClient();
export const apiUtils = ApiUtils;
