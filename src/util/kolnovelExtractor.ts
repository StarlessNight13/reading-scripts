import sanitizeHtml from "sanitize-html";
import {
  ChapterExtractor,
  cleanContentDOM,
  postRequest,
} from "@/util/extraction";
import {
  ChapterData,
  GenericChapterMetaData,
  GenericChapterInfo,
  ChapterIdentifier,
} from "@/types";

const TEMPLATE_URL =
  "https://kolnovel.com/wp-content/themes/lightnovel_1.1.5_current/template-parts/single/list_1.php";

class KolnovelExtractor implements ChapterExtractor {
  // Helper to remove specific classes from style element (kolnovel specific)
  private removeClassesFromElements(doc: Document): boolean {
    const styleElement = doc.querySelector("article > style:nth-child(2)");
    if (!styleElement?.textContent) {
      return false;
    }

    const classesToRemove = new Set<string>();
    const regex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(styleElement.textContent)) !== null) {
      classesToRemove.add(match[1]);
    }

    if (!classesToRemove.size) {
      return false;
    }

    classesToRemove.forEach((className) => {
      doc.querySelectorAll<HTMLElement>(`.${className}`).forEach((element) => {
        element.classList.remove(className);
      });
    });

    return true;
  }

  // Helper to parse chapter ID from article ID (kolnovel specific)
  private parseChapterIdFromArticleId(articleId: string): number | null {
    const match = articleId.match(/post-(\d+)/);
    return match?.[1] ? parseInt(match[1], 10) : null;
  }

  extractChapterData(doc: Document, url?: string): ChapterData | null {
    const rawContentElement = doc.querySelector<HTMLDivElement>("#kol_content");
    if (!rawContentElement) {
      return null;
    }

    this.removeClassesFromElements(doc); // Kolnovel specific cleanup
    const cleanContentElement = cleanContentDOM(rawContentElement);

    const articleElement = doc.querySelector("article");
    if (!articleElement) {
      console.error("Failed to extract article element");
      return null;
    }

    const chapterId = this.parseChapterIdFromArticleId(articleElement.id);
    if (chapterId === null) {
      console.error("Failed to extract chapter ID");
      return null;
    }

    const chapterTitle =
      doc.querySelector("#Top_Up > div.cat-series")?.textContent?.trim() ?? "";

    return {
      content: sanitizeHtml(cleanContentElement.innerHTML),
      id: chapterId,
      url: url ?? location.href,
      title: chapterTitle,
    };
  }

  extractChaptersMetaData(
    doc: Document,
    currentChapterId?: ChapterIdentifier
  ): GenericChapterMetaData | null {
    const chapterSelector =
      doc.querySelector<HTMLSelectElement>("#menu_chap_bot");
    if (!chapterSelector) return null;

    const chapters: GenericChapterInfo[] = Array.from(chapterSelector.options)
      .reverse()
      .map(({ text, value }) => ({
        title: text,
        id: Number(value), // Kolnovel chapter IDs are numbers
        isDefaultSelected: Number(value) === currentChapterId,
      }));

    return {
      isGrouped: false, // Kolnovel has a flat chapter list
      volumes: [
        {
          id: "kolnovel-chapters",
          title: "Chapters",
          chapters: chapters,
        },
      ],
    };
  }

  // Kolnovel specific utility to fetch redirect URL
  async fetchRedirectUrl(chapterId: ChapterIdentifier): Promise<string | null> {
    try {
      const redirectUrl = await postRequest(TEMPLATE_URL, { data: chapterId });
      return redirectUrl || null;
    } catch (error) {
      console.error("Error fetching redirect URL:", error);
      throw error;
    }
  }

  // Kolnovel specific utility to fetch chapter list via POST
  async fetchChapterList(
    seriId: number,
    chapterId: number
  ): Promise<GenericChapterInfo[]> {
    try {
      const htmlContent = await postRequest(TEMPLATE_URL, {
        seri: seriId,
        ID: chapterId,
      });
      const doc = new DOMParser().parseFromString(htmlContent, "text/html");
      const metaData = this.extractChaptersMetaData(doc, chapterId);
      return metaData ? metaData.volumes[0].chapters : [];
    } catch (error) {
      console.error("Error fetching chapter list:", error);
      throw error;
    }
  }

  // Kolnovel specific utility to get ChapterNovelInfo from the script tag
  getChapterNovelInfo(doc: Document): { seri: number; id: number } | null {
    const scriptElement = doc.querySelector("article > script:nth-child(8)");
    if (!scriptElement?.textContent) {
      return null;
    }

    const seriMatch = scriptElement.textContent.match(/'seri'\s*:\s*(\d+)/);
    const idMatch = scriptElement.textContent.match(/'ID'\s*:\s*(\d+)/);

    if (seriMatch && idMatch) {
      return {
        seri: parseInt(seriMatch[1], 10),
        id: parseInt(idMatch[1], 10),
      };
    }
    return null;
  }
}

export const kolnovelExtractor = new KolnovelExtractor();
