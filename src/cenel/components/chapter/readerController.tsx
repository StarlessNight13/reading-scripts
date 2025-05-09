import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { debounce } from "@/konovel/lib/utils";
import { api } from "@/cenel/api";
import { db } from "@/cenel/db";
// Constants
const URL_UPDATE_DEBOUNCE_MS = 300;
const URL_UPDATE_INTERVAL_MS = 5000;
const URL_VISIBILITY_THRESHOLD_PERCENT = 30;
const SCROLL_TRIGGER_PERCENTAGE = 90;
const SCROLL_DEBOUNCE_MS = 200;

// Types
interface ApiChapterListItem {
  id?: number;
  title: string;
  link: string;
  chapterIndex: number;
}

interface ChapterData {
  id: number;
  title: string;
  url: string;
  apiLink: string;
  index: string;
  read: boolean;
  content: string;
}

interface NovelData {
  id: number;
  slug: string;
  link: string;
  count: number;
  name: string;
}

export function useReaderController(
  allChaptersMeta: ApiChapterListItem[],
  initalChapterIndex: number
) {
  // State
  const [loadedChaptersData, setLoadedChaptersData] = useState<ChapterData[]>(
    []
  );
  const [activeChapterForUIDisplay, setActiveChapterForUIDisplay] =
    useState<ChapterData | null>(null);
  const [novel, setNovel] = useState<NovelData | null>(null);
  const [lastLoadedTocIndex, setLastLoadedTocIndex] = useState<number>(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingNext, setIsLoadingNext] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const outerListRef = useRef<HTMLDivElement>(null);
  const lastChapterRef = useRef<HTMLDivElement>(null);

  // --- CHAPTER DATA FETCHING ---

  /**
   * Fetches a single chapter's data from the API
   */
  const fetchChapterData = useCallback(
    async (
      chapterUrlToFetch: string,
      chapterMeta?: ApiChapterListItem
    ): Promise<ChapterData | null> => {
      try {
        const data = await api.getChapter(chapterUrlToFetch);
        if (!data) {
          toast.error(`Chapter (ID: ${chapterUrlToFetch}) not found.`);
          return null;
        }

        const chapterExistsInDb = await db.chapters.get({ id: data.id });

        return {
          id: data.id,
          title:
            chapterMeta?.title ??
            data.meta_box?.ero_title ??
            data.title.rendered,
          url: data.link, // Permalink
          apiLink: `/reader?chapterId=${data.id}`, // For history state
          index: data.title.rendered,
          read: !!chapterExistsInDb,
          content: data.content.rendered,
        };
      } catch (err) {
        console.error("Failed to fetch chapter data:", err);
        toast.error(`Failed to load chapter (ID: ${chapterUrlToFetch}).`);
        return null;
      }
    },
    []
  );

  // --- INITIAL DATA LOADING ---

  /**
   * Effect for loading the initial chapter and novel data
   */
  useEffect(() => {
    let isMounted = true;
    setIsLoadingInitial(true);
    setError(null);

    const loadInitial = async () => {
      // Step 1: Load the initial chapter
      const initialChapter = await fetchChapterData(initialChapterId);
      if (!isMounted) return;

      if (!initialChapter) {
        setError("Initial chapter not found or failed to load.");
        setIsLoadingInitial(false);
        return;
      }

      setLoadedChaptersData([initialChapter]);
      setActiveChapterForUIDisplay(initialChapter);

      // Update URL if needed
      if (
        window.location.pathname + window.location.search !==
        initialChapter.apiLink
      ) {
        history.replaceState(
          { chapterUrl: initialChapter.apiLink },
          "",
          initialChapter.apiLink
        );
      }

      // Step 2: Load novel and chapter list data
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

        // Find the index of the loaded chapter in the TOC
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

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [initialChapterId, fetchChapterData]);

  // --- CHAPTER NAVIGATION ---

  /**
   * Loads the next chapter in the sequence
   */
  const loadNextChapter = useCallback(async () => {
    console.log("Loading next chapter...");

    // Check if we can load next chapter
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

    // Mark current chapter as read before loading next
    const currentChapterToMark =
      loadedChaptersData[loadedChaptersData.length - 1];
    if (currentChapterToMark) {
      db.chapters
        .update(currentChapterToMark.id, { readingCompletion: 100 })
        .catch(console.error);
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

  // --- URL AND ACTIVE CHAPTER MANAGEMENT ---

  /**
   * Effect to handle URL management and tracking the active chapter based on scroll position
   */
  useEffect(() => {
    /**
     * Gets all chapter container elements in the DOM
     */
    const getVisibleChapters = (): HTMLDivElement[] => {
      return Array.from(
        outerListRef.current?.querySelectorAll<HTMLDivElement>(
          ".chapter-container[data-chapter-id]"
        ) || []
      );
    };

    /**
     * Calculates what percentage of an element is visible in the viewport
     */
    const calculateVisibility = (element: HTMLElement): number => {
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
    const findMostVisibleChapter = (): {
      element: HTMLElement;
      data: ChapterData;
    } | null => {
      const chapterElements = getVisibleChapters();
      let maxVisibility = 0;
      let mostVisibleElement: HTMLElement | null = null;

      for (const el of chapterElements) {
        const visibility = calculateVisibility(el);
        if (visibility > maxVisibility) {
          maxVisibility = visibility;
          mostVisibleElement = el;
        }
      }

      if (
        mostVisibleElement &&
        maxVisibility > URL_VISIBILITY_THRESHOLD_PERCENT
      ) {
        const idAttr = mostVisibleElement.getAttribute("data-chapter-id");
        const chapterId = idAttr ? parseInt(idAttr, 10) : null;
        if (chapterId) {
          const chapterData = loadedChaptersData.find(
            (ch) => ch.id === chapterId
          );
          if (chapterData) {
            return { element: mostVisibleElement, data: chapterData };
          }
        }
      }

      return null;
    };

    /**
     * Updates the active chapter and URL based on scroll position
     */
    const updateActiveChapter = () => {
      const found = findMostVisibleChapter();
      if (!found) return;

      const { data: newActive } = found;
      const newUrl = newActive.apiLink;

      // Update URL if needed
      if (window.location.pathname + window.location.search !== newUrl) {
        history.replaceState({ chapterUrl: newUrl }, "", newUrl);
      }

      // Update active chapter state
      setActiveChapterForUIDisplay((prev) => {
        if (prev?.id !== newActive.id) {
          // Mark previous chapter as read
          if (prev) {
            db.chapters
              .update(prev.id, { readingCompletion: 100 })
              .catch(console.error);
          }
          return newActive;
        }
        return prev;
      });
    };

    // Set up debounced update function
    const debouncedUpdate = debounce(
      updateActiveChapter,
      URL_UPDATE_DEBOUNCE_MS
    );

    // Add event listener
    const scrollTarget = outerListRef.current || window;
    scrollTarget.addEventListener("scroll", debouncedUpdate);

    // Periodically check active chapter
    const intervalId = setInterval(updateActiveChapter, URL_UPDATE_INTERVAL_MS);

    return () => {
      scrollTarget.removeEventListener("scroll", debouncedUpdate);
      clearInterval(intervalId);
    };
  }, [loadedChaptersData]);

  // --- INFINITE SCROLL DETECTION ---

  /**
   * Calculates scroll percentage to determine when to load the next chapter
   */
  const calculateScrollPercentage = useCallback(() => {
    const lastChapterEl = lastChapterRef.current;
    if (!lastChapterEl) return 0;

    const rect = lastChapterEl.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;

    if (rect.bottom <= windowHeight + 300) {
      // Check if bottom of element is near/above viewport bottom
      return 100; // Consider it fully scrolled for triggering next
    }
    return 0;
  }, []);

  /**
   * Debounced scroll handler to trigger loading the next chapter
   */
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

        const scrollPercentage = calculateScrollPercentage();
        if (scrollPercentage >= SCROLL_TRIGGER_PERCENTAGE) {
          loadNextChapter();
        }
      }, SCROLL_DEBOUNCE_MS),
    [
      isLoadingInitial,
      isLoadingNext,
      loadedChaptersData,
      lastLoadedTocIndex,
      calculateScrollPercentage,
      loadNextChapter,
    ]
  );

  /**
   * Effect to attach scroll event listener for infinite scrolling
   */
  useEffect(() => {
    window.addEventListener("scroll", debouncedScrollHandler);
    return () => {
      window.removeEventListener("scroll", debouncedScrollHandler);
    };
  }, [debouncedScrollHandler]);

  // Return values and functions needed by the component
  return {
    // State
    loadedChaptersData,
    activeChapterForUIDisplay,
    novel,
    allChaptersMeta,
    isLoadingInitial,
    isLoadingNext,
    error,

    // Functions
    loadNextChapter,

    // Refs
    outerListRef,
    lastChapterRef,
  };
}
