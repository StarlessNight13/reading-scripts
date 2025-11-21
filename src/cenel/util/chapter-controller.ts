import van, { State } from "vanjs-core";
import extractChapterData from "./extract-chapter";
import { updateChapterContent } from "../component/reader";

export interface ChapterMetaData {
  Volumes: VolumeInfo[];
  selectedVolumeId: string | undefined;
}

export interface VolumeInfo {
  id: number;
  title: string;
  chapters: ChapterInfo[];
  selectedChapterIndex: number;
}

export interface ChapterInfo {
  title: string;
  link: string;
  chapterIndex: number;
}

export interface IChapterController {
  volumeIndex: State<number>;
  chapterIndex: State<number>;
  navigateToNext: () => Promise<void>;
}

export function createChapterController(
  metaDataState: State<ChapterMetaData | null>
): IChapterController {
  const volumeIndex = van.state(-1);
  const chapterIndex = van.state(-1);

  van.derive(() => {
    const data = metaDataState.val;
    if (!data || !data.selectedVolumeId) return;

    const vIdx = data.Volumes.findIndex(
      (v) => String(v.id) === data.selectedVolumeId
    );

    if (vIdx !== -1) {
      if (volumeIndex.val !== vIdx) volumeIndex.val = vIdx;
      const cIdx = data.Volumes[vIdx].selectedChapterIndex;
      if (chapterIndex.val !== cIdx) chapterIndex.val = cIdx;
    }
  });

  async function fetchChapterContent(link: string) {
    try {
      const response = await fetch(link, {
        credentials: "include",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.text();
      const doc = new DOMParser().parseFromString(data, "text/html");
      return extractChapterData(doc);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  const navigateToNext = async () => {
    const data = metaDataState.val;
    if (!data) return;

    const currentVolIdx = volumeIndex.val;
    const currentChIdx = chapterIndex.val;

    let nextVolIdx = currentVolIdx;
    let nextChIdx = currentChIdx - 1;
    let targetChapter: ChapterInfo | undefined;

    if (nextChIdx >= 0) {
      targetChapter = data.Volumes[nextVolIdx].chapters[nextChIdx];
    } else {
      nextVolIdx = currentVolIdx - 1;
      if (nextVolIdx >= 0) {
        const nextVolume = data.Volumes[nextVolIdx];
        if (nextVolume.chapters.length > 0) {
          nextChIdx = nextVolume.chapters.length - 1;
          targetChapter = nextVolume.chapters[nextChIdx];
        }
      }
    }

    if (!targetChapter) return;

    const content = await fetchChapterContent(targetChapter.link);
    if (!content) return;

    updateChapterContent(content);
    window.history.pushState(null, "", targetChapter.link);

    const newVolumes = [...data.Volumes];
    const targetVolume = { ...newVolumes[nextVolIdx] };
    targetVolume.selectedChapterIndex = nextChIdx;
    newVolumes[nextVolIdx] = targetVolume;

    metaDataState.val = {
      ...data,
      Volumes: newVolumes,
      selectedVolumeId: String(targetVolume.id),
    };
  };

  return {
    volumeIndex,
    chapterIndex,
    navigateToNext,
  };
}