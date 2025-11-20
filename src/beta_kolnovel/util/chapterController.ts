import van, { State } from "vanjs-core";
import { updateChapterContent } from "../component/reader";
import { extractChapterData, fetchRedirectUrl } from "./extractChapter";

interface ChapterInfo {
  id: number;
  title: string;
}

export interface IChapterController {
  getCurrentChapter: () => State<ChapterInfo | null>;
  getNextChapter: () => ChapterInfo | null;
  navigateToNext: () => void;
  hasNext: () => boolean;
}

const fetchChapterContent = async (link: string) => {
  try {
    const response = await fetch(link);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    return extractChapterData(doc);
  } catch (error) {
    console.error("Failed to fetch chapter content:", error);
    return null;
  }
};

export const createChapterController = (
  metaDataState: State<ChapterInfo[] | null>,
  chapterIndex: State<number>
): IChapterController => {
  const getData = () => metaDataState.val;

  const getCurrentChapter = (): State<ChapterInfo | null> =>
    van.derive(() => getData()?.[chapterIndex.val] || null);

  const getNextChapter = (): ChapterInfo | null => {
    const data = getData();
    if (!data || chapterIndex.val <= 0) return null;
    return data[chapterIndex.val - 1] || null;
  };

  const hasNext = () => getNextChapter() !== null;

  const navigateToNext = async () => {
    const nextChapter = getNextChapter();
    if (!nextChapter) {
      console.log("No next chapter available.");
      return;
    }

    const chapterUrl = await fetchRedirectUrl(nextChapter.id);
    if (!chapterUrl) return;

    chapterIndex.val -= 1;

    const newContent = await fetchChapterContent(chapterUrl);
    if (!newContent) return;

    updateChapterContent(newContent);
    window.history.pushState(null, "", chapterUrl);
  };

  return {
    getCurrentChapter,
    getNextChapter,
    navigateToNext,
    hasNext,
  };
};
