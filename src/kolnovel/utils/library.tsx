import { Book, BookMarked, BookOpen, BookX } from "lucide-react";
import { ChapterStats, NovelGroups, NovelStatus } from "../types/library";
import { Chapters } from "../db";

export const initialNovelGroups: NovelGroups = {
  [NovelStatus.READING]: { text: "Reading", novels: [] },
  [NovelStatus.COMPLETED]: { text: "Completed", novels: [] },
  [NovelStatus.DROPPED]: { text: "Dropped", novels: [] },
  [NovelStatus.PLAN_TO_READ]: { text: "Plan to read", novels: [] },
};

export const getNovelCount = (
  novelGroups: NovelGroups,
  status: string
): number => {
  return novelGroups[status as NovelStatus]?.novels.length || 0;
};

export const getDefaultTab = (novelGroups: NovelGroups): NovelStatus => {
  const order = [
    NovelStatus.READING,
    NovelStatus.PLAN_TO_READ,
    NovelStatus.COMPLETED,
    NovelStatus.DROPPED,
  ];

  for (const status of order) {
    if (getNovelCount(novelGroups, status) > 0) {
      return status;
    }
  }
  return NovelStatus.READING;
};

export const getStatusIcon = (status: string, size: number = 18) => {
  switch (status) {
    case NovelStatus.READING:
      return <BookOpen size={size} />;
    case NovelStatus.PLAN_TO_READ:
      return <BookMarked size={size} />;
    case NovelStatus.COMPLETED:
      return <Book size={size} />;
    case NovelStatus.DROPPED:
      return <BookX size={size} />;
    default:
      return <Book size={size} />;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case NovelStatus.READING:
      return "#3b82f6";
    case NovelStatus.PLAN_TO_READ:
      return "#f59e0b";
    case NovelStatus.COMPLETED:
      return "#10b981";
    case NovelStatus.DROPPED:
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

export const getTotalNovels = (novelGroups: NovelGroups): number => {
  return Object.values(novelGroups).reduce(
    (acc, group) => acc + group.novels.length,
    0
  );
};


export const calculateChapterStats = (
  chapters: Chapters[],
  novelChapterCount: number
): ChapterStats => {
  const totalCount = chapters.length;
  const readChapters = chapters.filter((ch) => ch.readingCompletion === 100);
  const readCount = readChapters.length;

  const sortedChapters = [...chapters].sort(
    (a, b) => (a.chapterIndex ?? a.id) - (b.chapterIndex ?? b.id)
  );

  const unFinishedChapter = sortedChapters.find(
    (ch) => ch.readingCompletion < 100
  );

  const readPercentage =
    totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

  return {
    totalCount,
    readCount,
    readPercentage,
    unFinishedChapter,
    finishedAllKnownChapters: readCount === novelChapterCount,
    finishedAllFetchedChapters: readCount === totalCount && totalCount > 0,
  };
};

export const getCardStatusColor = (status: string): string => {
  switch (status) {
    case "reading":
      return "bg-blue-500 hover:bg-blue-600";
    case "completed":
      return "bg-green-500 hover:bg-green-600";
    case "dropped":
      return "bg-red-500 hover:bg-red-600";
    case "planToRead":
      return "bg-amber-500 hover:bg-amber-600";
    default:
      return "bg-gray-500 hover:bg-gray-600";
  }
};

export const getContinueReadingInfo = (stats: ChapterStats) => {
  let text = "ابدأ القراءة";

  if (stats.unFinishedChapter) {
    text = "أكمل القراءة";
  } else if (stats.finishedAllFetchedChapters) {
    text = "عرض الرواية";
  }

  return { text };
};