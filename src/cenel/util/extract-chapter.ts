import sanitizeHtml from "sanitize-html";

function removeEmptyParagraphs(container: HTMLElement): HTMLElement {
  const allParagraphs = container.querySelectorAll("p");

  allParagraphs.forEach((p) => {
    if (
      p.children.length === 0 &&
      (p.textContent === null || p.textContent.trim() === "")
    ) {
      p.remove();
      return;
    }

    if (p.children.length === 1 && p.firstElementChild?.tagName === "SPAN") {
      const spanChild = p.firstElementChild as HTMLSpanElement;
      if (
        spanChild.textContent === null ||
        spanChild.textContent.trim() === ""
      ) {
        p.remove();
        return;
      }
    }

    if (p.innerHTML.trim() === "&nbsp;" || p.innerHTML.trim() === "") {
      p.remove();
      return;
    }
  });

  return container;
}

export default function extractChapterData(doc: Document) {
  const bookmarkButton = doc.querySelector<HTMLAnchorElement>(
    'a.wp-manga-action-button[data-action="bookmark"]'
  );
  const chapterIdStr = bookmarkButton?.getAttribute("data-chapter");
  const id = chapterIdStr
    ? Number(chapterIdStr)
    : Number(
        doc
          .querySelector<HTMLAnchorElement>("#wp-manga-current-chap")
          ?.getAttribute("data-id")
      ); // Parse ID, handle missing attribute

  const contentContainer = doc.querySelector<HTMLDivElement>(
    " div.reading-content > div.text-left > div.text-right"
  );
  if (!contentContainer) {
    console.warn("Could not find content container.");
    return { content: "", id };
  }

  const content =
    removeEmptyParagraphs(contentContainer).innerHTML ??
    "<p>Error: Chapter content not found.</p>";

  if (content.includes("Error: Chapter content not found.")) {
    console.warn("Could not extract chapter content from expected selectors.");
  }
  const sanitizedContent = sanitizeHtml(content);

  return { content: sanitizedContent, id };
}

// --------- Chapter List ---------
export interface ChapterInfo {
  title: string;
  link: string;
  isDefaultSelected: boolean;
}

export interface VolumeInfo {
  id: number;
  title: string;
  chapters: ChapterInfo[];
  selectedChapterIndex: number;
  isDefaultSelected: boolean;
}

export interface ChaptersMetaData {
  Volumes: VolumeInfo[];
  selectedVolumeId: string | undefined;
}

function getRequiredPageElements(): {
  chaptersSelectElementsNodeList: NodeListOf<HTMLSelectElement>;
  volumesSelectElement: HTMLSelectElement | null;
} | null {
  const chaptersSelectElementsNodeList =
    document.querySelectorAll<HTMLSelectElement>(
      "#manga-reading-nav-head select.selectpicker_chapter"
    );
  const volumesSelectElement = document.querySelector<HTMLSelectElement>(
    "#manga-reading-nav-head select.volume-select"
  );

  if (!chaptersSelectElementsNodeList.length) {
    console.warn("Essential elements not found.");
    return null;
  }
  return {
    chaptersSelectElementsNodeList,
    volumesSelectElement,
  };
}

function buildChapterSelectorsMap(
  chaptersSelectElementsNodeList: NodeListOf<HTMLSelectElement>
): Map<string, HTMLSelectElement> {
  const chapterSelectorsMap = new Map();
  chaptersSelectElementsNodeList.forEach((selector) => {
    const forAttribute = selector.getAttribute("for");
    if (forAttribute?.startsWith("volume-id-")) {
      const volumeId = forAttribute.substring("volume-id-".length);
      chapterSelectorsMap.set(volumeId, selector);
    } else {
      console.warn(
        "Chapter selector found without a valid 'for' attribute linking to a volume ID:",
        selector
      );
    }
  });
  return chapterSelectorsMap;
}

function extractChaptersForVolume(
  volumeChapterSelector: HTMLSelectElement,
  selectedVolume: boolean
): {
  chapters: ChapterInfo[];
  selectedChapterIndex: number;
} {
  const chapters: ChapterInfo[] = [];
  const selectedOptIndex = volumeChapterSelector.selectedIndex;
  let resolvedSelectedChapterIndex = selectedOptIndex;

  Array.from(volumeChapterSelector.options)
    .reverse()
    .forEach((chapterOption, index) => {
      const chapterLink = chapterOption.getAttribute("data-redirect");
      const chapterText = chapterOption.text;
      const isChapterSelected = chapterOption.selected;

      if (!chapterLink || !chapterText) {
        console.warn(
          `Invalid chapter data (missing ID or text) for chapter in Volume. Option:`,
          chapterOption
        );
        return;
      }
      resolvedSelectedChapterIndex = isChapterSelected
        ? index
        : resolvedSelectedChapterIndex;

      chapters.push({
        title: chapterText,
        link: chapterLink,
        isDefaultSelected: isChapterSelected,
      });
    });

  if (chapters.length === 0 || !selectedVolume) {
    resolvedSelectedChapterIndex = -1;
  }

  return {
    chapters,
    selectedChapterIndex: resolvedSelectedChapterIndex,
  };
}

function extractChaptersMetaData(): ChaptersMetaData | null {
  const elements = getRequiredPageElements();
  if (!elements) {
    return null;
  }
  const { chaptersSelectElementsNodeList, volumesSelectElement } = elements;
  if (!volumesSelectElement && chaptersSelectElementsNodeList.length === 0) {
    return null;
  } else if (!volumesSelectElement) {
    const chapterSelectElement = chaptersSelectElementsNodeList[0];
    const { chapters, selectedChapterIndex } = extractChaptersForVolume(
      chapterSelectElement,
      true
    );
    return {
      Volumes: [
        {
          id: 1,
          title: "unknown",
          chapters: chapters,
          selectedChapterIndex,
          isDefaultSelected: true,
        },
      ],
      selectedVolumeId: "1",
    };
  }

  const chapterSelectorsMap = buildChapterSelectorsMap(
    chaptersSelectElementsNodeList
  );

  const currentSelectedVolumeId = volumesSelectElement.value;

  const extractedVolumes = [];
  const volumeOptions = Array.from(volumesSelectElement.options).reverse();

  for (const volumeOption of volumeOptions) {
    const volumeId = volumeOption.value;
    const volumeTitle = volumeOption.text.trim();
    const volumeChapterSelector = chapterSelectorsMap.get(volumeId);
    const isSelected = volumeOption.selected;

    if (!volumeChapterSelector) {
      console.warn(
        `Chapter selector for Volume ID ${volumeId} ("${volumeTitle}") not found in map.`
      );
      continue;
    }

    const { chapters, selectedChapterIndex } = extractChaptersForVolume(
      volumeChapterSelector,
      isSelected
    );

    extractedVolumes.push({
      id: Number(volumeId),
      title: volumeTitle,
      chapters: chapters,
      selectedChapterIndex: selectedChapterIndex,
      isDefaultSelected: isSelected,
    });
  }

  return {
    Volumes: extractedVolumes,
    selectedVolumeId: currentSelectedVolumeId,
  };
}

export { extractChaptersMetaData };
