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

interface NovelData {
  id: number;
  name: string;
  link: string;
  cover: string | undefined;
}

export interface useReaderStates {
  loadedChaptersData: ChapterData[];
  activeChapterForUIDisplay: ChapterData | null;
  novel: NovelData | null;
  isLoadingInitial: boolean;
  error: string | null;
  lastChapterRef: React.RefObject<HTMLDivElement>;
  allChaptersMeta: ChapterInfo[];
  isLoadingNext: boolean;
  outerListRef: React.RefObject<HTMLDivElement>;
}

interface ChapterInfo {
  title: string;
  link: string;
  chapterIndex: number;
}
interface ChapterData extends ChapterInfo {
  id: number;
  content: string;
  read: boolean;
}

interface VolumeInfo {
  id: number;
  title: string;
  chapters: ChapterInfo[];
  selectedChapterIndex: number;
}

type ChapterReaderProps = {
  selectVolumeId: number;
  volumes: VolumeInfo[];
  initalChapterData: {
    content: string;
    id: number;
  };
  novel: {
    name: string;
    link: string;
    id: number;
    cover: string | undefined;
  };
};
export function useReaderController({
  volumes,
  selectVolumeId,
  initalChapterData,
  novel,
}: ChapterReaderProps) {
  // State
  const [loadedChaptersData, setLoadedChaptersData] = useState<ChapterData[]>(
    []
  );
  const [activeChapterForUIDisplay, setActiveChapterForUIDisplay] =
    useState<ChapterData | null>(null);
  const [lastLoadedTocIndex, setLastLoadedTocIndex] = useState<number>(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingNext, setIsLoadingNext] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVolumeId, setCurrentVolumeId] =
    useState<number>(selectVolumeId);

  // Refs
  const outerListRef = useRef<HTMLDivElement>(null);
  const lastChapterRef = useRef<HTMLDivElement>(null);

  // useMemo

  const currentVolume = useMemo(
    () => volumes.find((v) => v.id === currentVolumeId),
    [volumes, currentVolumeId]
  );

  // --- CHAPTER DATA FETCHING ---

  /**
   * Fetches a single chapter's data from the API
   */
  const fetchChapterData = useCallback(
    async (chapterToFetch: ChapterInfo): Promise<ChapterData | null> => {
      try {
        const data = await api.getChapter(chapterToFetch.link);
        if (!data) {
          toast.error(`Chapter (LINK: ${chapterToFetch.link}) not found.`);
          return null;
        }

        const chapterExistsInDb = await db.chapters.get({ id: data.id });

        const novelExistsInDb = await db.novels.get({ id: novel.id });
        if (!novelExistsInDb) {
          await db.novels.add({
            id: novel.id,
            name: novel.name,
            link: novel.link,
            status: "none",
            cover: novel.cover ?? "",
          });
        }

        return {
          ...chapterToFetch,
          id: data.id, // Use the chapter ID from the API
          content: data.content,
          read: !!chapterExistsInDb, // Mark as read if it exists in the DB
        };
      } catch (err) {
        console.error("Failed to fetch chapter data:", err);
        toast.error(`Failed to load chapter (ID: ${chapterToFetch.link}).`);
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
      if (!currentVolume) return;
      const currentChapter =
        currentVolume.chapters[currentVolume.selectedChapterIndex];

      if (!currentChapter) {
        setError("Initial chapter not found or failed to load.");
        setIsLoadingInitial(false);
        return;
      }

      const chapterExistsInDb = await db.chapters.get({
        id: initalChapterData.id,
      });

      const initialChapter = {
        ...currentChapter,
        id: initalChapterData.id,
        content: initalChapterData.content,
        read: !!chapterExistsInDb,
      };
      if (!isMounted) return;

      if (!initialChapter) {
        setError("Initial chapter not found or failed to load.");
        setIsLoadingInitial(false);
        return;
      }

      setLoadedChaptersData([initialChapter]);
      setActiveChapterForUIDisplay(initialChapter);

      // Update URL if needed
      if (window.location.href !== initialChapter.link) {
        history.replaceState(
          { chapterUrl: initialChapter.link },
          "",
          initialChapter.link
        );
      }

      // Step 2: Load novel and chapter list data
      setIsLoadingInitial(false);
    };

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [fetchChapterData]);

  // --- CHAPTER NAVIGATION ---

  /**
   * Loads the next chapter in the sequence
   */
  const loadNextChapter = useCallback(async () => {
    console.log("Loading next chapter...");
    if (!currentVolume) return;
    console.log("currentVolume", currentVolume);

    // Check if we can load next chapter
    if (
      isLoadingNext ||
      lastLoadedTocIndex < 0 ||
      (lastLoadedTocIndex >= currentVolume.chapters.length - 1 &&
        loadedChaptersData.length > 0)
    ) {
      const nextVolume = volumes.findIndex((v) => v.id === currentVolumeId) + 1;
      if (nextVolume < volumes.length) {
        setCurrentVolumeId(volumes[nextVolume].id);
        setLastLoadedTocIndex(0);
        toast.info("Loading next volume...");
        return;
      }
      toast.info("You've reached the end of the novel.");
      return;
    }

    setIsLoadingNext(true);

    const nextChapterMeta = currentVolume.chapters[lastLoadedTocIndex - 1];
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
    const newChapter = await fetchChapterData(nextChapterMeta);

    if (newChapter) {
      setLoadedChaptersData((prev) => [...prev, newChapter]);
      setLastLoadedTocIndex((prev) => prev + 1);
      toast.success(`Loaded: ${newChapter.title}`);
    }

    setIsLoadingNext(false);
  }, [isLoadingNext, lastLoadedTocIndex, fetchChapterData, loadedChaptersData]);

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
      const newUrl = newActive.link;

      // Update URL if needed
      if (window.location.href !== newUrl) {
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

  console.log({
    isLoadingInitial,
    isLoadingNext,
    loadedChaptersData,
    currentVolume,
  });
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
          (currentVolume &&
            lastLoadedTocIndex >= currentVolume?.chapters.length - 1)
        )
          return;

        const scrollPercentage = calculateScrollPercentage();
        console.log("🚀 ~ debounce ~ scrollPercentage:", scrollPercentage);
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
    isLoadingInitial,
    isLoadingNext,
    error,
    chapters: currentVolume?.chapters,
    // Functions
    loadNextChapter,

    // Refs
    outerListRef,
    lastChapterRef,
  };
}
