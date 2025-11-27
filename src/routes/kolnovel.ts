import { ReaderView } from "@/components/reader";
import { initSettings } from "@/components/settings";
import { initSidebar } from "@/components/sidebar";
import { createChapterController } from "@/lib/chapterController";
import { initVIewTracker } from "@/lib/viewTracker";
import {
  ChapterIdentifier,
  GenericChapterInfo,
  GenericChapterMetaData,
} from "@/types";
import {
  getReaderState,
  injectToggle,
  setReaderState,
} from "@/util/entrypointUtils"; // Shared utility
import { kolnovelExtractor } from "@/util/kolnovelExtractor"; // Import Kolnovel's extractor
import van from "vanjs-core";

const HOST_IDENTIFIER = "kolnovel";

function removeBaseStyles() {
  const selectors = ["#style-css", "#wp-custom-css"];

  selectors.forEach((selector) => {
    document.head.querySelectorAll(selector).forEach((e) => e.remove());
  });

  document.head.querySelectorAll("head > style").forEach((e) => {
    const content = e.textContent;
    if (content && !content.includes("KEEP_STYLE")) {
      e.remove();
    }
  });

  const selectorsToRemove = [
    "#bootstrap-css",
    "#bootstrap-js",
    "#jquery-js",
    "#jquery-css",
    "#fontawesome-css",
    "#fontawesome-js",
    "#toastr-js",
    "#toastr-css",
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
  ];

  selectorsToRemove.forEach((selector) => {
    document.head.querySelector(selector)?.remove();
  });
}

async function launchReaderApp() {
  const initialDoc = document; // The current document

  // Get initial novel info (seri, id) for fetching chapter list
  const novelInfo = kolnovelExtractor.getChapterNovelInfo(initialDoc);
  if (!novelInfo) {
    console.error("Failed to extract Kolnovel novel data.");
    return;
  }

  // Fetch all chapters and current chapter content in parallel
  const [chapterListFromApi, currentChapterData] = await Promise.all([
    kolnovelExtractor.fetchChapterList(novelInfo.seri, novelInfo.id),
    kolnovelExtractor.extractChapterData(initialDoc),
  ]);

  if (!currentChapterData?.content || !chapterListFromApi) {
    console.error("Failed to extract Kolnovel chapter data or metadata.");
    return;
  }

  // Map the fetched Kolnovel-specific list to the generic format
  const genericMetaData: GenericChapterMetaData = {
    isGrouped: false,
    volumes: [
      {
        id: "kolnovel-chapters-volume",
        title: "Chapters",
        chapters: chapterListFromApi.map((chap) => ({
          id: chap.id,
          title: chap.title,
          link: `https://kolnovel.com/?p=${chap.id}`, // Placeholder, actual resolution by controller config
          isDefaultSelected: chap.isDefaultSelected,
        })),
      },
    ],
  };

  // 1. Prep Environment
  document.body.innerHTML = "";
  window.scrollTo(0, 0);

  // 2. State
  const chapterData = van.state(currentChapterData);
  const genericMetaDataState = van.state(genericMetaData);
  const loading = van.state(false);
  const loadedIds = new Set<ChapterIdentifier>([currentChapterData.id]);

  // Determine initial global chapter index
  const initialGlobalChapterIndex =
    genericMetaData.volumes[0].chapters.findIndex(
      (chap) => chap.id === currentChapterData.id
    );
  const currentGlobalChapterIdx = van.state(
    initialGlobalChapterIndex !== -1 ? initialGlobalChapterIndex : 0
  );

  // 3. Logic & UI
  const controller = createChapterController(
    genericMetaDataState,
    currentGlobalChapterIdx,
    loading,
    loadedIds,
    {
      extractor: kolnovelExtractor,
      resolveChapterUrl: async (chapter: GenericChapterInfo) =>
        kolnovelExtractor.fetchRedirectUrl(chapter.id), // Kolnovel needs redirect fetch
      fetchOptions: {
        credentials: "include", // Kolnovel needs this
      },
      getInitialGlobalChapterIndex: (metaData: GenericChapterMetaData) => {
        // Re-calculate based on currentChapterData.id if necessary
        const foundIdx = metaData.volumes[0].chapters.findIndex(
          (chap) => chap.id === currentChapterData.id
        );
        return foundIdx !== -1 ? foundIdx : 0;
      },
    }
  );

  controller.initIndices(); // This will use getInitialGlobalChapterIndex if provided
  // Set theme and remove base styles
  document.body.className = document.body.classList.contains("darkmode")
    ? "dark"
    : "light";
  removeBaseStyles();
  document.body.setAttribute("host", HOST_IDENTIFIER);

  // 4. Render
  van.add(document.body, ReaderView(chapterData, loading));

  initSettings();
  initVIewTracker();
  initSidebar(genericMetaDataState, currentGlobalChapterIdx, {
    getChapterLink: (chapter: GenericChapterInfo) => chapter.link!,
  });
}

export default function main(disabled: boolean) {
  console.clear();
  if (disabled) {
    setReaderState(false);
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, document.title, url.toString());
    return;
  }
  if (document.querySelector("#Top_Up")) {
    const isEnabled = getReaderState();
    // Check for a specific element that indicates a reading page (Kolnovel specific)
    if (isEnabled) {
      launchReaderApp();
    } else {
      const target = document.querySelector("#kol_navbar"); // Kolnovel's existing toggle target
      if (target) {
        injectToggle(
          target,
          false,
          "Disable Reader",
          "Enable Reader",
          "start-reader-btn"
        );
      } else {
        console.warn("Kolnovel toggle button target '.socialts' not found.");
      }
    }
  }
}
