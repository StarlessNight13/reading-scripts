import { State } from "vanjs-core";
import { updateReaderContent } from "@/components/reader";
import {
  ChapterData,
  GenericChapterMetaData,
  GenericChapterInfo,
  ChapterIdentifier,
} from "@/types";
import { ChapterExtractor } from "@/util/extraction";

// Configuration specific to each site's chapter fetching and extraction
interface ChapterControllerConfig {
  extractor: ChapterExtractor; // The site-specific extractor instance
  // A function to resolve the actual fetchable URL for a chapter
  resolveChapterUrl: (
    chapter: GenericChapterInfo,
    metaData: GenericChapterMetaData
  ) => Promise<string | null>;
  // Any specific fetch options, like credentials
  fetchOptions?: RequestInit;
  // Optional: A function to derive initial chapter index from site-specific metadata
  getInitialGlobalChapterIndex?: (metaData: GenericChapterMetaData) => number;
}

const fetchContent = async (
  url: string,
  extractor: ChapterExtractor,
  fetchOptions?: RequestInit
): Promise<ChapterData | null> => {
  try {
    const res = await fetch(url, fetchOptions);
    if (!res.ok) throw new Error(`Fetch Error: ${res.status}`);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    return extractor.extractChapterData(doc, url);
  } catch (e) {
    console.error("Error fetching chapter content:", e);
    return null;
  }
};

export function createChapterController(
  metaData: State<GenericChapterMetaData | null>,
  currentGlobalChapterIdx: State<number>,
  isLoading: State<boolean>,
  loadedIds: Set<ChapterIdentifier>, // Updated to use ChapterIdentifier
  config: ChapterControllerConfig
) {
  // ... (initIndices and loadNext logic as before) ...
  const initIndices = () => {
    const data = metaData.val;
    if (data && config.getInitialGlobalChapterIndex) {
      currentGlobalChapterIdx.val = config.getInitialGlobalChapterIndex(data);
    }
  };

  const loadNext = async () => {
    const data = metaData.val;
    if (!data || isLoading.val) return;

    isLoading.val = true;
    let nextGlobalIdx = currentGlobalChapterIdx.val + 1;

    let chapterToLoad: GenericChapterInfo | undefined;

    let currentChapterCount = 0;
    for (const volume of data.volumes) {
      if (nextGlobalIdx < currentChapterCount + volume.chapters.length) {
        chapterToLoad = volume.chapters[nextGlobalIdx - currentChapterCount];
        break;
      }
      currentChapterCount += volume.chapters.length;
    }

    if (!chapterToLoad) {
      console.log("End of all chapters.");
      isLoading.val = false;
      return;
    }

    const chapterUrl = await config.resolveChapterUrl(chapterToLoad, data);
    if (!chapterUrl) {
      isLoading.val = false;
      return;
    }

    // Pass the extractor to fetchContent
    const content = await fetchContent(
      chapterUrl,
      config.extractor,
      config.fetchOptions
    );

    if (content && !loadedIds.has(content.id)) {
      loadedIds.add(content.id);
      updateReaderContent(content);

      currentGlobalChapterIdx.val = nextGlobalIdx;
    }

    isLoading.val = false;
  };

  // Scroll Listener - remains the same, but calls internal `loadNext`
  let isThrottled = false;
  window.addEventListener("scroll", () => {
    if (isThrottled || isLoading.val) return;

    const { scrollHeight, scrollTop, clientHeight } = document.documentElement;

    if (scrollHeight - scrollTop - clientHeight < 800) {
      isThrottled = true;
      loadNext();
      setTimeout(() => (isThrottled = false), 1000);
    }
  });

  return { initIndices };
}
