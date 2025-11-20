import { State } from "vanjs-core";
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
  getCurrentChapter: () => ChapterInfo | null;
  getNextChapter: () => ChapterInfo | null;
  navigateToNext: () => void;
  hasNext: () => boolean;
}

export function createChapterController(
  metaDataState: State<ChapterMetaData | null>
): IChapterController {
  const getCurrentState = () => {
    const data = metaDataState.val;
    if (!data || !data.selectedVolumeId) return null;

    const volumeIndex = data.Volumes.findIndex(
      (v) => String(v.id) === data.selectedVolumeId
    );

    if (volumeIndex === -1) return null;

    return {
      data,
      volumeIndex,
      currentVolume: data.Volumes[volumeIndex],
    };
  };

  const getCurrentChapter = (): ChapterInfo | null => {
    const state = getCurrentState();
    if (!state) return null;
    const { currentVolume } = state;
    return currentVolume.chapters[currentVolume.selectedChapterIndex] || null;
  };

  const getNextChapter = (): ChapterInfo | null => {
    const state = getCurrentState();
    if (!state) return null;

    const { data, volumeIndex, currentVolume } = state;


    if (currentVolume.selectedChapterIndex > 0) {
      return currentVolume.chapters[currentVolume.selectedChapterIndex - 1];
    }

    if (volumeIndex < data.Volumes.length - 1) {
      const nextVolume = data.Volumes[volumeIndex + 1];
      if (nextVolume.chapters.length > 0) {
        return nextVolume.chapters[0];
      }
    }

    return null;
  };

  const hasNext = (): boolean => {
    return getNextChapter() !== null;
  };

  async function fetchChapterContent(link: string) {
    try {
      const response = await fetch(link);
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
  }

  const navigateToNext = async () => {
    const nextChapter = getNextChapter();
    if (nextChapter) {
      updateChapterIndexAndVolume();
      const newChapterContent = await fetchChapterContent(nextChapter.link);
      if (!newChapterContent) {
        return;
      }
      updateChapterContent(newChapterContent);
      window.history.pushState(null, "", nextChapter.link);
    } else {
      console.log("No next chapter available.");
    }
  };
  const updateChapterIndexAndVolume = () => {
    const state = getCurrentState();
    if (!state) return;

    const { data, volumeIndex, currentVolume } = state;
    const newData = { ...data };
    const newVolumes = [...newData.Volumes];
    const newCurrentVolume = { ...currentVolume };

    newCurrentVolume.selectedChapterIndex += 1;

    let newVolumeIndex = volumeIndex;
    if (
      newCurrentVolume.selectedChapterIndex >= newCurrentVolume.chapters.length
    ) {
      newCurrentVolume.selectedChapterIndex = 0;
      newVolumeIndex += 1;
      if (newVolumeIndex < newVolumes.length) {
        newData.selectedVolumeId = String(newVolumes[newVolumeIndex].id);
      }
    }

    // Update the volume in the newVolumes array
    newVolumes[volumeIndex] = newCurrentVolume;

    // If we moved to a new volume, the new selected volume would be at newVolumeIndex
    if (newVolumeIndex !== volumeIndex && newVolumeIndex < newVolumes.length) {
      return;
    }

    newData.Volumes = newVolumes;
    metaDataState.val = newData;
  };

  return {
    getCurrentChapter,
    getNextChapter,
    navigateToNext,
    hasNext,
  };
}
