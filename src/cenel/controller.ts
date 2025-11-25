// cenel

import { State } from "vanjs-core";
import { updateReaderContent } from "./reader";
import { extractChapterData } from "./utils/extraction";
import { ChaptersMetaData } from "./types";

export function createChapterController(
  metaData: State<ChaptersMetaData | null>,
  volIdx: State<number>,
  chapIdx: State<number>,
  isLoading: State<boolean>,
  loadedIds: Set<number>
) {
  // Initialize indices based on the ID found in metadata
  const initIndices = () => {
    const data = metaData.val;
    if (!data?.selectedVolumeId) return;

    const vIdx = data.Volumes.findIndex(
      (v) => String(v.id) === data.selectedVolumeId
    );
    if (vIdx !== -1) {
      volIdx.val = vIdx;
      chapIdx.val = data.Volumes[vIdx].selectedChapterIndex;
    }
  };

  const fetchContent = async (url: string) => {
    try {
      const res = await fetch(url);
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
    let nextV = volIdx.val;
    let nextC = chapIdx.val + 1;

    // Check bounds
    let volume = data.Volumes[nextV];
    if (!volume) return;

    if (nextC >= volume.chapters.length) {
      // End of volume, go to next
      nextV++;
      if (nextV >= data.Volumes.length) {
        console.log("End of all volumes");
        isLoading.val = false;
        return;
      }
      nextC = 0;
      volume = data.Volumes[nextV];
    }

    const nextChapter = volume.chapters[nextC];
    if (!nextChapter) {
      isLoading.val = false;
      return;
    }

    const content = await fetchContent(nextChapter.link);

    if (content && !loadedIds.has(content.id)) {
      loadedIds.add(content.id);
      updateReaderContent(content);

      // Update State
      volIdx.val = nextV;
      chapIdx.val = nextC;
    }

    isLoading.val = false;
  };

  return { initIndices, loadNext };
}
