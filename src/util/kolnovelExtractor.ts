import {
  ChapterData,
  ChapterIdentifier,
  GenericChapterInfo,
  GenericChapterMetaData,
} from "@/types";
import {
  ChapterExtractor,
  cleanContentDOM,
  postRequest,
} from "@/util/extraction";
import sanitizeHtml from "sanitize-html";

const TEMPLATE_URL =
  "https://kolnovel.com/wp-content/themes/lightnovel_1.1.5_current/template-parts/single/list_1.php";

class KolnovelExtractor implements ChapterExtractor {
  // Helper to remove specific classes from style element (kolnovel specific)
  private removeClassesFromElements(doc: Document): boolean {
    const styleElements = Array.from(
      doc.querySelectorAll<HTMLStyleElement>("article > style")
    );

    const classesToRemove = this.findClassesWithSpecificStyles(styleElements);
    console.log(classesToRemove);

    classesToRemove.forEach((selector) => {
      const elementsToRemove = doc.querySelectorAll<HTMLElement>(selector);
      elementsToRemove.forEach((element) => {
        element.remove();
      });
    });

    return true;
  }

  // Helper to find classes with specific styles (kolnovel specific)
  private findClassesWithSpecificStyles(
    styleElements: HTMLStyleElement[]
  ): string[] {
    const targetStyles: Record<string, string> = {
      height: "0.1px",
      overflow: "hidden",
      position: "fixed",
      opacity: "0",
      "text-indent": "-99999px",
      bottom: "-999px",
    };

    const foundClassNames: string[] = [];

    for (const styleElement of styleElements) {
      if (styleElement.tagName === "STYLE") {
        const styleSheet = styleElement.sheet;
        if (styleSheet instanceof CSSStyleSheet) {
          for (const rule of styleSheet.cssRules) {
            if (rule instanceof CSSStyleRule) {
              let matchesAllStyles = true;
              for (const prop in targetStyles) {
                if (rule.style.getPropertyValue(prop) !== targetStyles[prop]) {
                  matchesAllStyles = false;
                  break;
                }
              }
              if (matchesAllStyles) {
                foundClassNames.push(rule.selectorText);
              }
            }
          }
        }
      }
    }
    return foundClassNames;
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
    const articleElement = doc.querySelector("article");

    if (!articleElement) {
      return null;
    }

    const chapterIdMatch = articleElement.id.match(/post-(\d+)/);
    if (!chapterIdMatch) {
      return null;
    }
    const chapterId = parseInt(chapterIdMatch[1], 10);

    const scripts = [
      doc.querySelector("article > script:nth-child(8)"),
      doc.querySelector("#content > div > script:nth-child(4)"),
      doc.querySelector("body > script:nth-child(5)"),
    ];

    for (const scriptElement of scripts) {
      if (scriptElement && scriptElement.textContent) {
        const seriMatch1 =
          scriptElement.textContent.match(/'seri'\s*:\s*(\d+)/);
        if (seriMatch1) {
          return { seri: parseInt(seriMatch1[1], 10), id: chapterId };
        }

        const seriMatch2 =
          scriptElement.textContent.match(/"series_ID":"(\d+)"/);
        if (seriMatch2) {
          return { seri: parseInt(seriMatch2[1], 10), id: chapterId };
        }

        const seriMatch3 = scriptElement.textContent.match(/"mid":"(\d+)"/);
        if (seriMatch3) {
          return { seri: parseInt(seriMatch3[1], 10), id: chapterId };
        }
      }
    }

    return null;
  }
}

export const kolnovelExtractor = new KolnovelExtractor();
