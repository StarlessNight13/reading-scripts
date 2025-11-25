// kolnovel
import { State } from "vanjs-core";
import { updateReaderContent } from "./reader";
import { ChapterInfo } from "./types";
import { extractChapterData } from "./util/extraction";
import { fetchRedirectUrl } from "./util/fetcher";

export function createChapterController(
  metaData: State<ChapterInfo[] | null>,
  chapIdx: State<number>,
  isLoading: State<boolean>,
  loadedIds: Set<number>
) {
  const fetchContent = async (url: string) => {
    try {
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Fetch Error: ${res.status}`);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      return extractChapterData(doc, url);
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const loadNext = async () => {
    const data = metaData.val;
    if (!data || isLoading.val) return;

    isLoading.val = true;
    let nextC = chapIdx.val + 1;

    const nextChapter = data[nextC];
    if (!nextChapter) {
      isLoading.val = false;
      return;
    }
    const link = await fetchRedirectUrl(nextChapter.id);
    if (!link) return;
    const content = await fetchContent(link);

    if (content && !loadedIds.has(content.id)) {
      loadedIds.add(content.id);
      updateReaderContent(content);

      // Update State
      chapIdx.val = nextC;
    }

    isLoading.val = false;
  };

  return { loadNext };
}
