import { State } from "vanjs-core";
import { updateChapterContent } from "../component/reader";
import extractChapterData, { ChaptersMetaData } from "./extract-chapter";

export function createChapterController(
  metaDataState: State<ChaptersMetaData | null>,
  currentVolumeIndex: State<number>,
  currentChapterIndex: State<number>,
  loadingState: State<boolean>,
  chapterSet: Set<number>
) {
  const initState = () => {
    const data = metaDataState.val;
    if (!data?.selectedVolumeId) return;

    const volumeIndex = data.Volumes.findIndex(
      (v) => String(v.id) === data.selectedVolumeId
    );
    if (volumeIndex > data.Volumes.length) return;

    currentVolumeIndex.val = volumeIndex;
    currentChapterIndex.val = data.Volumes[volumeIndex].selectedChapterIndex;

  };

  const fetchChapterContent = async (link: string) => {
    try {
      const response = await fetch(link, {
        credentials: "include",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      const doc = new DOMParser().parseFromString(data, "text/html");
      return extractChapterData(doc);
    } catch (error) {
      console.error("Failed to fetch chapter content:", error);
      return null;
    }
  };

  const navigateToNext = async () => {
    const data = metaDataState.val;
    if (!data) return;
    loadingState.val = true;

    let nextVolumeIndex = currentVolumeIndex.val;
    let nextChapterIndex = currentChapterIndex.val + 1;

    let currentVolume = data.Volumes[nextVolumeIndex];
    if (!currentVolume) return;

    // Check if there's a next chapter in the current volume
    if (nextChapterIndex < currentVolume.chapters.length) {
      currentChapterIndex.val = nextChapterIndex;
    } else {
      // Move to the next volume
      nextVolumeIndex++;
      // If there are no more volumes, we're at the end
      if (nextVolumeIndex >= data.Volumes.length) {
        console.log("Reached the last chapter of the last volume.");
        return;
      }

      const nextVolume = data.Volumes[nextVolumeIndex];
      if (!nextVolume || !nextVolume.chapters.length) {
        console.warn("Next volume or its chapters not found.");
        return;
      }

      nextChapterIndex = 0;
      currentVolumeIndex.val = nextVolumeIndex;
      currentChapterIndex.val = nextChapterIndex;
      currentVolume = nextVolume;
    }

    const nextChapter = currentVolume.chapters[currentChapterIndex.val];
    if (!nextChapter) {
      console.warn("Next chapter not found after navigation logic.");
      return;
    }

    if (!nextChapter) return;

    try {
      const newChapterContent = await fetchChapterContent(nextChapter.link);
      if (!newChapterContent) return;
      if (chapterSet.has(newChapterContent.id)) return;
      chapterSet.add(newChapterContent.id);

      updateChapterContent(newChapterContent);
      window.history.pushState(null, "", nextChapter.link);
      loadingState.val = false;
    } catch (error) {
      console.error(error);
      loadingState.val = false;
    }
  };

  return {
    navigateToNext,
    initState,
  };
}
