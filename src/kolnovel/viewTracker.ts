import van from "vanjs-core";

const CONFIG = {
  URL_VISIBILITY_THRESHOLD_PERCENT: 30,
  SCROLL_DEBOUNCE_MS: 100,
};

const getVisibleChapterElements = (
  containerRef: HTMLDivElement
): HTMLElement[] => {
  return Array.from(
    containerRef.querySelectorAll<HTMLElement>(".reading-content") || []
  );
};

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

const findMostVisibleChapterElement = (
  containerRef: HTMLDivElement
): { element: HTMLElement; id: number } | null => {
  const chapterElements = getVisibleChapterElements(containerRef);
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
    const idAttr = mostVisibleElement.getAttribute("data-id");
    const chapterId = idAttr ? parseInt(idAttr, 10) : null;

    if (chapterId) {
      return { element: mostVisibleElement, id: chapterId };
    }
  }

  return null;
};

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

export function initVIewTracker() {
  const container =
    document.querySelector<HTMLDivElement>("#chapter-container");
  if (!container) {
    console.warn(
      "initVIewTracker: #chapter-container element not found. View tracking will not be initialized."
    );
    return;
  }
  const mostVisibleChapterId = van.state<number | null>(null);

  const updateMostVisibleChapter = () => {
    const found = findMostVisibleChapterElement(container);
    if (found && found.id !== mostVisibleChapterId.val) {
      mostVisibleChapterId.val = found.id;
    }
  };

  window.addEventListener(
    "scroll",
    debounce(updateMostVisibleChapter, CONFIG.SCROLL_DEBOUNCE_MS)
  );

  van.derive(() => {
    const mostVisibleChapter = mostVisibleChapterId.val;
    console.log("mostVisibleChapter", mostVisibleChapter);
    if (mostVisibleChapter) {
      const chapter = document.querySelector<HTMLDivElement>(
        `#chapter-container [data-id="${mostVisibleChapter}"]`
      );
      if (!chapter) return;
      const chapterUrl = chapter.getAttribute("data-redirect");
      if (!chapterUrl) return;
      window.history.replaceState(null, "", chapterUrl);
    }
  });
}
