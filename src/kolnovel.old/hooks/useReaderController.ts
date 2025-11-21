import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { debounce } from "@/kolnovel.old/lib/utils";
import { db } from "@/kolnovel.old/db";
import { api } from "@/kolnovel.old/lib/api";
import {
  ApiChapterListItem,
  ChapterData,
  NovelData,
  useReaderStates,
} from "@/kolnovel.old/types/reader";

// ============================================================================
// CONSTANTS
// ============================================================================

const CONFIG = {
  URL_UPDATE_DEBOUNCE_MS: 1000,
  URL_UPDATE_INTERVAL_MS: 5000,
  URL_VISIBILITY_THRESHOLD_PERCENT: 30,
  SCROLL_TRIGGER_PERCENTAGE: 90,
  SCROLL_DEBOUNCE_MS: 200,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets all chapter container elements in the DOM
 */
const getVisibleChapters = (
  containerRef: React.RefObject<HTMLDivElement>
): HTMLDivElement[] => {
  return Array.from(
    containerRef.current?.querySelectorAll<HTMLDivElement>(
      ".chapter-container"
    ) || []
  );
};

/**
 * Calculates what percentage of an element is visible in the viewport
 */
const calculateElementVisibility = (element: HTMLElement): number => {
  const rect = element.getBoundingClientRect();
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  const totalVisibleHeight = Math.min(rect.height, window.innerHeight);

  return totalVisibleHeight > 0
    ? (visibleHeight / totalVisibleHeight) * 100
    : 0;
};

/**
 * Finds the most visible chapter element in the viewport
 */
const findMostVisibleChapter = (
  containerRef: React.RefObject<HTMLDivElement>,
  loadedChapters: ChapterData[]
): { element: HTMLElement; data: ChapterData } | null => {
  const chapterElements = getVisibleChapters(containerRef);
  let maxVisibility = 0;
  let mostVisibleElement: HTMLElement | null = null;

  for (const el of chapterElements) {
    const visibility = calculateElementVisibility(el);
    if (visibility > maxVisibility) {
      maxVisibility = visibility;
      mostVisibleElement = el;
    }
  }

  if (
    mostVisibleElement &&
    maxVisibility > CONFIG.URL_VISIBILITY_THRESHOLD_PERCENT
  ) {
    const idAttr = mostVisibleElement.getAttribute("data-chapter-id");
    const chapterId = idAttr ? parseInt(idAttr, 10) : null;

    if (chapterId) {
      const chapterData = loadedChapters.find((ch) => ch.id === chapterId);
      if (chapterData) {
        return { element: mostVisibleElement, data: chapterData };
      }
    }
  }

  return null;
};

/**
 * Updates browser URL and document title
 */
const updateBrowserState = (chapterId: number, title: string): void => {
  const newUrl = `/reader?chapterId=${chapterId}`;
  const currentUrl = window.location.pathname + window.location.search;

  if (currentUrl !== newUrl) {
    history.replaceState({ chapterUrl: chapterId }, "", newUrl);
    document.title = title;
  }
};

/**
 * Marks a chapter as read in the database
 */
const markChapterAsRead = async (chapterId: number): Promise<void> => {
  try {
    await db.chapters.update(chapterId, { readingCompletion: 100 });
  } catch (error) {
    console.error(`Failed to mark chapter ${chapterId} as read:`, error);
  }
};

/**
 * Calculates if user has scrolled near the last chapter
 */
const calculateScrollPercentage = (
  lastChapterRef: React.RefObject<HTMLDivElement>
): number => {
  const lastChapterEl = lastChapterRef.current;
  if (!lastChapterEl) return 0;

  const rect = lastChapterEl.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;

  return rect.bottom <= windowHeight + 300 ? 100 : 0;
};

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useReaderController(initialChapterId: number): useReaderStates {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------

  const [loadedChaptersData, setLoadedChaptersData] = useState<ChapterData[]>(
    []
  );
  const [activeChapterForUIDisplay, setActiveChapterForUIDisplay] =
    useState<ChapterData | null>(null);
  const [novel, setNovel] = useState<NovelData | null>(null);
  const [allChaptersMeta, setAllChaptersMeta] = useState<ApiChapterListItem[]>(
    []
  );
  const [lastLoadedTocIndex, setLastLoadedTocIndex] = useState<number>(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingNext, setIsLoadingNext] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // REFS
  // --------------------------------------------------------------------------

  const outerListRef = useRef<HTMLDivElement>(null);
  const lastChapterRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------------------------------
  // CHAPTER DATA FETCHING
  // --------------------------------------------------------------------------

  /**
   * Fetches a single chapter's data from the API
   */
  const fetchChapterData = useCallback(
    async (
      chapterIdToFetch: number,
      chapterMeta?: ApiChapterListItem
    ): Promise<ChapterData | null> => {
      try {
        const data = await api.getChapter(chapterIdToFetch);
        if (!data) {
          console.error(`Chapter (ID: ${chapterIdToFetch}) not found.`);
          toast.error(`Chapter (ID: ${chapterIdToFetch}) not found.`);
          return null;
        }

        const chapterExistsInDb = await db.chapters.get({ id: data.id });

        return {
          id: data.id,
          title:
            chapterMeta?.title ??
            data.meta_box?.ero_title ??
            data.title.rendered,
          url: data.link,
          apiLink: `/reader?chapterId=${data.id}`,
          index: data.title.rendered,
          read: !!chapterExistsInDb,
          content: data.content.rendered,
        };
      } catch (err) {
        console.error("Failed to fetch chapter data:", err);
        toast.error(`Failed to load chapter (ID: ${chapterIdToFetch}).`);
        return null;
      }
    },
    []
  );

  // --------------------------------------------------------------------------
  // INITIAL DATA LOADING
  // --------------------------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setIsLoadingInitial(true);
      setError(null);

      // Load initial chapter
      const initialChapter = await fetchChapterData(initialChapterId);
      if (!isMounted) return;

      if (!initialChapter) {
        setError("Initial chapter not found or failed to load.");
        setIsLoadingInitial(false);
        return;
      }

      setLoadedChaptersData([initialChapter]);
      setActiveChapterForUIDisplay(initialChapter);
      updateBrowserState(initialChapter.id, initialChapter.title);

      // Load novel and chapter list
      try {
        const novelData = await api.getNovelByChapterId(initialChapterId);
        if (!isMounted || !novelData) return;
        setNovel(novelData);

        const chaptersResult = await api.getChaptersList(
          novelData.slug,
          initialChapterId
        );
        if (!isMounted || !chaptersResult) return;

        setAllChaptersMeta(chaptersResult.data);

        const tocIndex = chaptersResult.data.findIndex(
          (c) => c.id === initialChapterId
        );
        setLastLoadedTocIndex(tocIndex !== -1 ? tocIndex : 0);

        toast.success("Successfully loaded novel data.");
      } catch (novelError) {
        console.error("Failed to load novel details:", novelError);
        toast.error("Failed to load novel details.", {
          description: "Chapter list might be unavailable.",
        });
      } finally {
        if (isMounted) setIsLoadingInitial(false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [initialChapterId, fetchChapterData]);

  // --------------------------------------------------------------------------
  // CHAPTER NAVIGATION
  // --------------------------------------------------------------------------

  /**
   * Loads the next chapter in the sequence
   */
  const loadNextChapter = useCallback(async () => {
    if (
      isLoadingNext ||
      !allChaptersMeta ||
      lastLoadedTocIndex >= allChaptersMeta.length - 1
    ) {
      if (
        allChaptersMeta &&
        lastLoadedTocIndex >= allChaptersMeta.length - 1 &&
        loadedChaptersData.length > 0
      ) {
        toast.info("You've reached the end of the novel.");
      }
      return;
    }

    setIsLoadingNext(true);

    const nextChapterMeta = allChaptersMeta[lastLoadedTocIndex + 1];
    if (!nextChapterMeta) {
      setIsLoadingNext(false);
      return;
    }

    // Mark current chapter as read
    const currentChapter = loadedChaptersData[loadedChaptersData.length - 1];
    if (currentChapter) {
      await markChapterAsRead(currentChapter.id);
    }

    // Load new chapter
    const newChapter = await fetchChapterData(
      nextChapterMeta.id,
      nextChapterMeta
    );

    if (newChapter) {
      setLoadedChaptersData((prev) => [...prev, newChapter]);
      setLastLoadedTocIndex((prev) => prev + 1);
      toast.success(`Loaded: ${newChapter.title}`);
    }

    setIsLoadingNext(false);
  }, [
    isLoadingNext,
    allChaptersMeta,
    lastLoadedTocIndex,
    fetchChapterData,
    loadedChaptersData,
  ]);

  // --------------------------------------------------------------------------
  // ACTIVE CHAPTER TRACKING
  // --------------------------------------------------------------------------

  useEffect(() => {
    const updateActiveChapter = () => {
      const found = findMostVisibleChapter(outerListRef, loadedChaptersData);
      if (!found) return;

      const { data: newActive } = found;

      updateBrowserState(newActive.id, newActive.title);

      setActiveChapterForUIDisplay((prev) => {
        if (prev?.id !== newActive.id) {
          if (prev) {
            markChapterAsRead(prev.id);
          }
          return newActive;
        }
        return prev;
      });
    };

    const debouncedUpdate = debounce(
      updateActiveChapter,
      CONFIG.URL_UPDATE_DEBOUNCE_MS
    );

    const scrollTarget = outerListRef.current || window;
    scrollTarget.addEventListener("scroll", debouncedUpdate);

    const intervalId = setInterval(
      updateActiveChapter,
      CONFIG.URL_UPDATE_INTERVAL_MS
    );

    return () => {
      scrollTarget.removeEventListener("scroll", debouncedUpdate);
      clearInterval(intervalId);
    };
  }, [loadedChaptersData]);

  // --------------------------------------------------------------------------
  // INFINITE SCROLL
  // --------------------------------------------------------------------------

  const debouncedScrollHandler = useMemo(
    () =>
      debounce(() => {
        if (
          isLoadingInitial ||
          isLoadingNext ||
          !loadedChaptersData ||
          lastLoadedTocIndex >= allChaptersMeta.length - 1
        )
          return;

        const scrollPercentage = calculateScrollPercentage(lastChapterRef);
        if (scrollPercentage >= CONFIG.SCROLL_TRIGGER_PERCENTAGE) {
          loadNextChapter();
        }
      }, CONFIG.SCROLL_DEBOUNCE_MS),
    [
      isLoadingInitial,
      isLoadingNext,
      loadedChaptersData,
      lastLoadedTocIndex,
      allChaptersMeta.length,
      loadNextChapter,
    ]
  );

  useEffect(() => {
    window.addEventListener("scroll", debouncedScrollHandler);
    return () => {
      window.removeEventListener("scroll", debouncedScrollHandler);
    };
  }, [debouncedScrollHandler]);

  // --------------------------------------------------------------------------
  // RETURN
  // --------------------------------------------------------------------------

  return {
    loadedChaptersData,
    activeChapterForUIDisplay,
    novel,
    allChaptersMeta,
    isLoadingInitial,
    isLoadingNext,
    error,
    loadNextChapter,
    outerListRef,
    lastChapterRef,
  };
}
