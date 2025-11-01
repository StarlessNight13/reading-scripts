import { Chapters, Novels } from "@/kolnovel/db";

export enum NovelStatus {
  READING = "reading",
  COMPLETED = "completed",
  DROPPED = "dropped",
  PLAN_TO_READ = "planToRead",
}

export interface NovelGroup {
  text: string;
  novels: Novels[];
}

export interface NovelGroups {
  [NovelStatus.READING]: NovelGroup;
  [NovelStatus.COMPLETED]: NovelGroup;
  [NovelStatus.DROPPED]: NovelGroup;
  [NovelStatus.PLAN_TO_READ]: NovelGroup;
}

export interface NovelUpdateResult {
  id: number;
  hasUpdates: boolean;
}

export interface UpdateResults {
  updates: number[];
  noUpdates: number[];
}

export const NovelStatusMap = {
  reading: { text: "أقرا حاليا", value: "reading" },
  completed: { text: "اكملتها", value: "completed" },
  dropped: { text: "مسحوب عليها", value: "dropped" },
  planToRead: { text: "أقرا لاحقا", value: "planToRead" },
} as const;

export type NovelStatusKey = keyof typeof NovelStatusMap;

export interface NovelCardProps {
  novel: Novels;
  onUpdate: () => void;
  hasUpdates?: boolean;
}

export interface ChapterStats {
  totalCount: number;
  readCount: number;
  readPercentage: number;
  unFinishedChapter: Chapters | undefined;
  finishedAllKnownChapters: boolean;
  finishedAllFetchedChapters: boolean;
}
