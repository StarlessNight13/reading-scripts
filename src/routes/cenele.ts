import { ReaderView } from "@/components/reader";
import { initSettings } from "@/components/settings";
import { initSidebar } from "@/components/sidebar";
import { createChapterController } from "@/lib/chapterController";
import { initVIewTracker } from "@/lib/viewTracker";
import {
  ChapterData,
  ChapterIdentifier,
  GenericChapterInfo,
  GenericChapterMetaData,
} from "@/types";
import { cenelExtractor } from "@/util/cenelExtractor";
import {
  getReaderState,
  injectToggle,
  setReaderState,
} from "@/util/entrypointUtils";
import van from "vanjs-core";

const HOST_IDENTIFIER = "cenel";

// --- Main Logic ---
async function launchReaderApp() {
  const initialDoc = document; // The current document

  // Extract initial chapter data and metadata using the specific extractor
  const currentChapter: ChapterData | null =
    cenelExtractor.extractChapterData(initialDoc);
  const metaDataRaw: GenericChapterMetaData | null =
    cenelExtractor.extractChaptersMetaData(
      initialDoc,
      currentChapter?.id || undefined
    ); // Pass current chapter ID for selection

  if (!currentChapter?.content || !metaDataRaw) {
    console.error("[Reader] Failed to initialize. Missing data.");
    return;
  }

  // 1. Prep Environment
  document.body.innerHTML = "";
  document.body.className = document.body.classList.contains("text-ui-light")
    ? "dark default"
    : "light default";
  window.scrollTo(0, 0);

  // 2. State
  const chapterData = van.state(currentChapter);
  const genericMetaData = van.state(metaDataRaw);
  const loading = van.state(false);
  const loadedIds = new Set<ChapterIdentifier>([currentChapter.id]);

  let initialGlobalChapterIndex = 0;
  if (currentChapter.id) {
    let count = 0;
    for (const vol of metaDataRaw.volumes) {
      for (const chap of vol.chapters) {
        if (chap.isDefaultSelected) {
          initialGlobalChapterIndex = count;
          break;
        }
        count++;
      }
    }
  }
  const currentGlobalChapterIdx = van.state(initialGlobalChapterIndex);

  // 3. Logic & UI
  const controller = createChapterController(
    genericMetaData,
    currentGlobalChapterIdx,
    loading,
    loadedIds,
    {
      extractor: cenelExtractor,
      resolveChapterUrl: async (chapter: GenericChapterInfo) => chapter.link!, // Cenel uses direct link
    }
  );

  controller.initIndices();

  // 4. Render
  van.add(document.body, ReaderView(chapterData, loading));

  initSettings();
  initVIewTracker();
  initSidebar(genericMetaData, currentGlobalChapterIdx, {
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
  const isEnabled = getReaderState();
  if (isEnabled) {
    document.body.setAttribute("host", HOST_IDENTIFIER);
    launchReaderApp();
  } else {
    const target = document.querySelector<HTMLDivElement>("#reader-settings");
    if (target) {
      target.style.display = "flex";
      target.style.justifyContent = "center";
      target.style.alignItems = "center";
      target.style.flexDirection = "column";
      target.style.gap = "1rem";
      injectToggle(target, false, "✖ Close", "Reader Mode ⚙️", "rs-main-btn");
    } else {
      console.warn("Cenel toggle button target '#reader-settings' not found.");
      // Fallback or just don't show if target is missing
    }
  }
}
