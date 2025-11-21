import sanitizeHtml from "sanitize-html";
import {
  ChapterData,
  ChapterInfo,
  ChaptersMetaData,
  VolumeInfo,
} from "../types";

/**
 * cleans up reading content by removing empty or useless paragraphs
 */
function cleanContentDOM(container: HTMLElement): HTMLElement {
  const paragraphs = container.querySelectorAll("p");

  paragraphs.forEach((p) => {
    const text = p.textContent?.trim() ?? "";
    const html = p.innerHTML.trim();
    const hasContent = text.length > 0 || (html !== "" && html !== "&nbsp;");

    // Check for empty span inside p
    const singleSpan = p.firstElementChild;
    const isEmptySpan =
      p.children.length === 1 &&
      singleSpan?.tagName === "SPAN" &&
      !singleSpan.textContent?.trim();

    if (!hasContent || isEmptySpan) {
      p.remove();
    }
  });

  return container;
}

export function extractChapterData(doc: Document, url?: string): ChapterData {
  // 1. Attempt to find ID via Bookmark button, fallback to current chapter data
  const bookmarkBtn = doc.querySelector<HTMLAnchorElement>(
    'a.wp-manga-action-button[data-action="bookmark"]'
  );
  const currentChapEl = doc.querySelector<HTMLAnchorElement>(
    "#wp-manga-current-chap"
  );

  const rawId =
    bookmarkBtn?.getAttribute("data-chapter") ||
    currentChapEl?.getAttribute("data-id");
  const id = rawId ? Number(rawId) : Date.now(); // Fallback ID if parsing fails

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
    };
  }

  const cleanedContainer = cleanContentDOM(contentContainer);
  const sanitizedContent = sanitizeHtml(cleanedContainer.innerHTML);

  return { content: sanitizedContent, id, url: url ?? window.location.href };
}

// --- Meta Data Extraction ---

function getSelectElements() {
  const chapterSelects = document.querySelectorAll<HTMLSelectElement>(
    "#manga-reading-nav-head select.selectpicker_chapter"
  );
  const volumeSelect = document.querySelector<HTMLSelectElement>(
    "#manga-reading-nav-head select.volume-select"
  );
  return { chapterSelects, volumeSelect };
}

function parseChaptersFromSelect(
  select: HTMLSelectElement,
  isVolumeSelected: boolean
): { chapters: ChapterInfo[]; selectedIndex: number } {
  const chapters: ChapterInfo[] = [];
  let selectedIndex = -1;

  // Options are often listed newest first, so we reverse to read top-down
  Array.from(select.options)
    .reverse()
    .forEach((opt, index) => {
      const link = opt.getAttribute("data-redirect");
      const title = opt.text.trim();
      if (!link) return;

      if (opt.selected) selectedIndex = index;

      chapters.push({
        title,
        link,
        isDefaultSelected: opt.selected,
      });
    });

  if (!isVolumeSelected) selectedIndex = -1;

  return { chapters, selectedIndex };
}

export function extractChaptersMetaData(): ChaptersMetaData | null {
  const { chapterSelects, volumeSelect } = getSelectElements();

  // Case 1: No Volumes, just chapters
  if (!volumeSelect && chapterSelects.length > 0) {
    const { chapters, selectedIndex } = parseChaptersFromSelect(
      chapterSelects[0],
      true
    );
    return {
      Volumes: [
        {
          id: 1,
          title: "Default",
          chapters,
          selectedChapterIndex: selectedIndex,
          isDefaultSelected: true,
        },
      ],
      selectedVolumeId: "1",
    };
  }

  // Case 2: Volumes exist
  if (volumeSelect) {
    const volumes: VolumeInfo[] = [];
    // Map volume-id-{id} to the specific chapter select element
    const chapterMap = new Map<string, HTMLSelectElement>();

    chapterSelects.forEach((sel) => {
      const forAttr = sel.getAttribute("for");
      if (forAttr?.startsWith("volume-id-")) {
        chapterMap.set(forAttr.replace("volume-id-", ""), sel);
      }
    });

    Array.from(volumeSelect.options)
      .reverse()
      .forEach((volOpt) => {
        const volId = volOpt.value;
        const chapterSel = chapterMap.get(volId);

        if (chapterSel) {
          const { chapters, selectedIndex } = parseChaptersFromSelect(
            chapterSel,
            volOpt.selected
          );
          volumes.push({
            id: Number(volId),
            title: volOpt.text.trim(),
            chapters,
            selectedChapterIndex: selectedIndex,
            isDefaultSelected: volOpt.selected,
          });
        }
      });

    return {
      Volumes: volumes,
      selectedVolumeId: volumeSelect.value,
    };
  }

  return null;
}
