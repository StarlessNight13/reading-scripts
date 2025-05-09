// Define the shape of the chapter data we pass to the component
interface ChapterInfo {
  id: string;
  title: string;
  link: string;
  chapterIndex: number;
}

interface VolumeInfo {
  id: number;
  title: string;
  chapters: ChapterInfo[];
}

interface InitialChapterData {
  id: number; // ID from data attribute (might be missing)
  uri: string;
  title: string;
  content: string;
}

// --- Helper Functions ---

/**
 * Removes specified CSS/JS links from the document head.
 */
function cleanupHeadScriptsAndStyles(): void {
  const selectorsToRemove: string[] = [
    "#bootstrap-css",
    "#bootstrap-js",
    "#jquery-js",
    "#jquery-css", // Note: original code had #jquery-css twice, removed duplicate selector
    "#fontawesome-css",
    "#fontawesome-js",
    "#toastr-js",
    "#toastr-css", // Note: original code had #toastr-css twice
    "#madara-css-css",
    "#child-style-css",
    "#slick-theme-css",
    "#slick-css",
    "#ionicons-css",
    "#madara-icons-css",
    "#loaders-css",
    "#wp-pagenavi-css",
    "#jquery-core-js",
    "#jquery-migrate-js",
    "#wp-custom-css",
    // Add any other specific selectors if needed
  ];

  selectorsToRemove.forEach((selector) => {
    document.head.querySelector(selector)?.remove();
  });
  console.log("Removed legacy scripts and styles.");
}

function extractChaptersMetaData() {
  const chaptersSelectElement = Array.from(
    document.querySelectorAll<HTMLSelectElement>(
      "#manga-reading-nav-head select.selectpicker_chapter"
    )
  );
  const volumesSelectElement = document.querySelector<HTMLSelectElement>(
    "#manga-reading-nav-head select.volume-select"
  );

  if (!chaptersSelectElement || !volumesSelectElement) {
    console.warn("Chapters or volumes select dropdown not found.");
    return [];
  }

  const Volumes: VolumeInfo[] = [];

  for (const volume of volumesSelectElement.options) {
    const volumeId = volume.value;
    console.log(volumeId);
    const chapters = chaptersSelectElement.find(
      (chapterSelector) => chapterSelector.getAttribute("data-vol") === volumeId
    );
    if (!chapters) {
      console.warn(`Volume ${volumeId} not found in chapter list.`);
      continue;
    }
    const VolumeChapters = [];
    for (const chapter of chapters) {
      const chapterId = chapter.value;
      const chapterTitle = chapter.text;
      const chapterLink = chapter.getAttribute("data-redirect");
      if (!chapterId || !chapterTitle || !chapterLink) {
        console.warn(
          `Invalid chapter data for ${chapterId}: ${chapterTitle} - ${chapterLink}`
        );
        continue;
      }
      const chapterData = {
        id: chapterId,
        title: chapterTitle,
        link: chapterLink,
        chapterIndex: Number(chapter.getAttribute("data-chapter-index")),
      };
      VolumeChapters.push(chapterData);
      console.log(chapterData);
    }
    Volumes.push({
      id: Number(volumeId),
      title: volume.text,
      chapters: VolumeChapters,
    });
  }

  return Volumes;
}

export { extractChaptersMetaData, cleanupHeadScriptsAndStyles };
