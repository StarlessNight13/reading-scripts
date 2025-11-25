// cenel

export interface ChapterInfo {
  title: string;
  link: string;
  isDefaultSelected: boolean;
}

export interface VolumeInfo {
  id: number;
  title: string;
  chapters: ChapterInfo[];
  selectedChapterIndex: number;
  isDefaultSelected: boolean;
}

export interface ChaptersMetaData {
  Volumes: VolumeInfo[];
  selectedVolumeId: string | undefined;
}

export interface ChapterData {
  content: string;
  url: string;
  id: number;
}

export interface UserSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  maxWidth: number;
  backgroundColor: string;
  textColor: string;
  fontSaturation: number;
}