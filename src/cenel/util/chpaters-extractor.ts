/**
 * @fileoverview Extracts chapter and volume metadata from the current page.
 */

interface ChapterInfo {
  title: string; // Parsed title of the chapter
  link: string; // Constructed link to the chapter
  chapterIndex: number; // Parsed chapter number or sequential index
}

interface VolumeInfo {
  id: number; // Numeric ID of the volume
  title: string; // Text of the volume option
  chapters: ChapterInfo[];
  selectedChapterIndex: number; // Index of the selected chapter within this volume's chapter list
}

interface ChaptersMetaData {
  Volumes: VolumeInfo[];
  selectedVolumeId: string | undefined; // The 'value' of the currently selected volume in the dropdown
}
// Regex to parse chapter text like "الفصل 123 - Chapter Title"
const CHAPTER_TEXT_PATTERN = /^الفصل\s(\d+)\s-\s(.+)$/;

/**
 * Fetches essential DOM elements required for metadata extraction.
 * @returns {object|null} An object containing DOM elements, or null if any are missing.
 */
function getRequiredPageElements(): {
  novelBaseLink: string;
  chaptersSelectElementsNodeList: NodeListOf<HTMLSelectElement>;
  volumesSelectElement: HTMLSelectElement | null;
} | null {
  const novelLinkElement = document.querySelector<HTMLAnchorElement>(
    "#manga-reading-nav-head > div > div.entry-header_wrap > div > div.c-breadcrumb > ol > li:nth-child(2) > a"
  );
  const chaptersSelectElementsNodeList =
    document.querySelectorAll<HTMLSelectElement>(
      "#manga-reading-nav-head select.selectpicker_chapter"
    );
  const volumesSelectElement = document.querySelector<HTMLSelectElement>(
    "#manga-reading-nav-head select.volume-select"
  );

  if (!novelLinkElement || !chaptersSelectElementsNodeList.length) {
    console.warn(
      "Essential elements (novel link, chapters select, or volumes select) not found."
    );
    return null;
  }
  return {
    novelBaseLink: novelLinkElement.href,
    chaptersSelectElementsNodeList,
    volumesSelectElement,
  };
}

/**
 * Builds a map of volume IDs to their corresponding chapter select elements.
 * @param {NodeListOf<HTMLSelectElement>} chaptersSelectElementsNodeList - List of chapter select elements.
 * @returns {Map<string, HTMLSelectElement>} A map where keys are volume IDs and values are chapter select elements.
 */
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

/**
 * Parses chapter text to extract its title and number.
 * @param {string} chapterText - The text of the chapter option.
 * @param {number} defaultIndex - The default index to use if chapter number cannot be parsed.
 * @returns {{title: string, chapterIndex: number}} Parsed chapter details.
 */
function parseChapterDetails(
  chapterText: string,
  defaultIndex: number
): { title: string; chapterIndex: number } {
  const match = chapterText.match(CHAPTER_TEXT_PATTERN);
  if (match) {
    const chapterNumber = parseInt(match[1], 10);
    const chapterTitle = match[2].trim();
    return {
      title: chapterTitle,
      chapterIndex: !isNaN(chapterNumber) ? chapterNumber : defaultIndex,
    };
  }
  return {
    title: chapterText.trim(), // Fallback to full text as title
    chapterIndex: defaultIndex,
  };
}

/**
 * Extracts chapter information for a single volume.
 * @param {HTMLSelectElement} volumeChapterSelector - The select element containing chapters for a volume.
 * @param {string} novelBaseLink - The base URL for constructing chapter links.
 * @param {string} volumeIdForDebug - The ID of the current volume, for logging purposes.
 * @returns {{chapters: ChapterInfo[], selectedChapterIndex: number}} An object containing the list of chapters and the index of the selected chapter.
 */
function extractChaptersForVolume(volumeChapterSelector: HTMLSelectElement): {
  chapters: ChapterInfo[];
  selectedChapterIndex: number;
} {
  const chapters: ChapterInfo[] = [];
  // Use selectedIndex, which is the index of the first selected option, or -1 if none.
  // Default to 0 if no selection or if the control is empty.
  const selectedOptIndex = volumeChapterSelector.selectedIndex;
  let resolvedSelectedChapterIndex = selectedOptIndex;

  Array.from(volumeChapterSelector.options).forEach((chapterOption, index) => {
    const chapterLink = chapterOption.getAttribute("data-redirect");
    const chapterText = chapterOption.text;

    if (!chapterLink || !chapterText) {
      console.warn(
        `Invalid chapter data (missing ID or text) for chapter in Volume. Option:`,
        chapterOption
      );
      return; // Skip this chapter
    }

    const { title, chapterIndex } = parseChapterDetails(chapterText, index);

    chapters.push({
      title: title,
      link: chapterLink,
      chapterIndex: chapterIndex,
    });
  });

  // If there are no chapters, selectedChapterIndex should ideally reflect that (e.g. -1 or 0).
  // The original code used `?? 0`, so if no chapters, selected index becomes 0.
  // If chapters exist, resolvedSelectedChapterIndex points to the selected one or the first one.
  if (chapters.length === 0) {
    resolvedSelectedChapterIndex = -1; // Or -1 if you prefer to indicate no possible selection
  }

  return { chapters, selectedChapterIndex: resolvedSelectedChapterIndex };
}

/**
 * Main function to extract metadata for all volumes and their chapters.
 * It also identifies the ID of the volume currently selected in the UI.
 * @returns {ChaptersMetaData | null} An object containing all volume and chapter data,
 * and the ID of the currently selected volume, or null if essential elements are missing.
 */
function extractChaptersMetaData(): ChaptersMetaData | null {
  const elements = getRequiredPageElements();
  if (!elements) {
    console.log(elements);
    return null; // Essential elements not found
  }
  const { chaptersSelectElementsNodeList, volumesSelectElement } = elements;
  if (!volumesSelectElement && chaptersSelectElementsNodeList.length === 0) {
    return null;
  } else if (!volumesSelectElement) {
    const chapterSelectElement = chaptersSelectElementsNodeList[0];
    const { chapters, selectedChapterIndex } =
      extractChaptersForVolume(chapterSelectElement);
    return {
      Volumes: [
        {
          id: 1,
          title: "unknown",
          chapters: chapters,
          selectedChapterIndex,
        },
      ],
      selectedVolumeId: "1",
    };
  }

  const chapterSelectorsMap = buildChapterSelectorsMap(
    chaptersSelectElementsNodeList
  );

  // This is the ID of the volume currently selected in the <select> dropdown when the function is called.
  const currentSelectedVolumeId = volumesSelectElement.value;

  const extractedVolumes = [];
  // The original code reversed the volume options. Preserving this behavior.
  // If order doesn't matter or should match DOM order, .reverse() can be removed.
  const volumeOptions = Array.from(volumesSelectElement.options).reverse();

  for (const volumeOption of volumeOptions) {
    const volumeId = volumeOption.value; // This is a string
    const volumeTitle = volumeOption.text.trim();
    const volumeChapterSelector = chapterSelectorsMap.get(volumeId);

    if (!volumeChapterSelector) {
      console.warn(
        `Chapter selector for Volume ID ${volumeId} ("${volumeTitle}") not found in map.`
      );
      continue; // Skip this volume
    }

    const { chapters, selectedChapterIndex } = extractChaptersForVolume(
      volumeChapterSelector
    );

    extractedVolumes.push({
      id: Number(volumeId), // Converting volumeId string to number, as in original
      title: volumeTitle,
      chapters: chapters,
      selectedChapterIndex: selectedChapterIndex,
    });
  }

  return {
    Volumes: extractedVolumes,
    selectedVolumeId: currentSelectedVolumeId, // The ID of the volume selected in the dropdown
  };
}

export { extractChaptersMetaData };
