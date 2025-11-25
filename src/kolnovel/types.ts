// kolnovel
export interface ChapterData {
  content: string;
  id: number; // chapterID
  url: string;
}

export interface ChapterInfo {
  title: string;
  id: number; // chapterID
  isDefaultSelected: boolean;
}

export interface ChapterNovelInfo {
  id: number; // chapterID
  seri: number;
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
