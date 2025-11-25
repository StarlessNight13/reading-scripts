export type ChapterIdentifier = string | number; // New type for IDs

export interface GenericChapterInfo {
  title: string;
  link?: string;
  id: ChapterIdentifier;
  isDefaultSelected?: boolean;
}

export interface GenericVolumeInfo {
  title: string;
  chapters: GenericChapterInfo[];
  id?: ChapterIdentifier;
}

export interface GenericChapterMetaData {
  volumes: GenericVolumeInfo[];
  isGrouped: boolean;
}

export interface ChapterData {
  content: string;
  url: string;
  id: ChapterIdentifier;
  title: string;
}

export interface UserSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  maxWidth: number;
  fontSaturation: number;
}
