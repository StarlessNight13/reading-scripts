export type ReaderSettings = {
  fontSize: number;
  fontFamily: string;
  textGap: number;
  textWidth: number;
  textAlign: "left" | "center" | "right";
};

export type ReaderLayoutProps = {
  initialChapterId: number;
};

export interface ApiChapterListItem {
  id: number;
  title: string;
  link: string;
  chapterIndex: number;
}

export interface ChapterData {
  id: number;
  title: string;
  url: string;
  apiLink: string;
  index: string;
  read: boolean;
  content: string;
}

export interface NovelData {
  id: number;
  slug: string;
  link: string;
  count: number;
  name: string;
}

export interface useReaderStates {
  loadedChaptersData: ChapterData[];
  activeChapterForUIDisplay: ChapterData | null;
  novel: NovelData | null;
  isLoadingInitial: boolean;
  error: string | null;
  lastChapterRef: React.RefObject<HTMLDivElement>;
  allChaptersMeta: ApiChapterListItem[];
  isLoadingNext: boolean;
  loadNextChapter: () => void;
  outerListRef: React.RefObject<HTMLDivElement>;
}
