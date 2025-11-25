import sanitizeHtml from "sanitize-html";
import {
  ChapterExtractor,
  cleanContentDOM,
} from "@/util/extraction";
import {
  ChapterData,
  GenericChapterMetaData,
  GenericVolumeInfo,
  GenericChapterInfo,
  ChapterIdentifier
} from "@/types";

class CenelExtractor implements ChapterExtractor {
  extractChapterData(doc: Document, url?: string): ChapterData {
    // 1. Attempt to find ID via Bookmark button, fallback to current chapter data
    const bookmarkBtn = doc.querySelector<HTMLAnchorElement>(
      'a.wp-manga-action-button[data-action="bookmark"]'
    );
    const currentChapEl = doc.querySelector<HTMLAnchorElement>(
      "#wp-manga-current-chap"
    );

    const chapterHeading = doc.querySelector("#chapter-heading")?.textContent?.trim();

    const rawId =
      bookmarkBtn?.getAttribute("data-chapter") ||
      currentChapEl?.getAttribute("data-id");
    const id: ChapterIdentifier = rawId ? rawId : String(Date.now()); // Keep as string for now if it's a link-like ID

    // 2. Extract Content
    const contentContainer = doc.querySelector<HTMLDivElement>(
      "div.reading-content > div.text-left > div.text-right"
    );

    if (!contentContainer) {
      console.warn("[Reader] Content container not found.");
      return {
        content: "<p>Error: Content not found</p>",
        id,
        url: url ?? window.location.href,
        title: "Error: Content not found",
      };
    }

    const cleanedContainer = cleanContentDOM(contentContainer);
    const sanitizedContent = sanitizeHtml(cleanedContainer.innerHTML);

    return { content: sanitizedContent, id, url: url ?? window.location.href, title: chapterHeading ?? "" };
  }

  extractChaptersMetaData(
    doc: Document,
    currentChapterId?: ChapterIdentifier // `currentChapterId` might be useful if the current chapter isn't `selected` in the DOM
  ): GenericChapterMetaData | null {
    const chapterSelects = doc.querySelectorAll<HTMLSelectElement>(
      "#manga-reading-nav-head select.selectpicker_chapter"
    );
    const volumeSelect = doc.querySelector<HTMLSelectElement>(
      "#manga-reading-nav-head select.volume-select"
    );

    const parseChaptersFromSelect = (
      select: HTMLSelectElement,
      isVolumeSelected: boolean
    ): { chapters: GenericChapterInfo[]; selectedIndex: number } => {
      const chapters: GenericChapterInfo[] = [];
      let selectedIndex = -1;

      Array.from(select.options)
        .reverse()
        .forEach((opt, index) => {
          const link = opt.getAttribute("data-redirect");
          const title = opt.text.trim();
          if (!link) return;

          // Determine if this chapter is the default selected one or matches currentChapterId
          const isSelected = opt.selected || (currentChapterId && link === currentChapterId);
          if (isSelected) {
            selectedIndex = index;
          }

          chapters.push({
            title,
            link,
            id: link,
            isDefaultSelected: !!isSelected,
          });
        });

      return { chapters, selectedIndex };
    };

    // Case 1: No Volumes, just chapters
    if (!volumeSelect && chapterSelects.length > 0) {
      const { chapters, selectedIndex } = parseChaptersFromSelect(
        chapterSelects[0],
        true // This chapter select is "selected" by default
      );
      return {
        isGrouped: false, // Treat as a single group of chapters
        volumes: [
          {
            id: "default-volume", // Use a string ID for consistency
            title: "Chapters",
            chapters,
          },
        ],
      };
    }

    // Case 2: Volumes exist
    if (volumeSelect) {
      const volumes: GenericVolumeInfo[] = [];
      const chapterMap = new Map<ChapterIdentifier, HTMLSelectElement>();

      chapterSelects.forEach((sel) => {
        const forAttr = sel.getAttribute("for");
        if (forAttr?.startsWith("volume-id-")) {
          chapterMap.set(forAttr.replace("volume-id-", ""), sel);
        }
      });

      Array.from(volumeSelect.options)
        .reverse()
        .forEach((volOpt) => {
          const volId: ChapterIdentifier = volOpt.value;
          const chapterSel = chapterMap.get(volId);

          if (chapterSel) {
            const { chapters } = parseChaptersFromSelect(
              chapterSel,
              volOpt.selected
            );
            volumes.push({
              id: volId,
              title: volOpt.text.trim(),
              chapters,
            });
          }
        });

      return {
        isGrouped: true,
        volumes: volumes,
      };
    }

    return null;
  }
}

export const cenelExtractor = new CenelExtractor();