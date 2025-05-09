import { AlertCircle, Bookmark, BookOpen, Trash } from "lucide-react"; // Import icons from lucide-react

// Assuming these imports are correct and provide the necessary functionalities/types
import { Chapters, db, Novels } from "@/konovel/db"; // Import db instance and types

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Novel status options with text and values
const NovelStatusMap = {
  reading: { text: "أقرا حاليا", value: "reading" }, // Reading Now
  completed: { text: "اكملتها", value: "completed" }, // Completed
  dropped: { text: "مسحوب عليها", value: "dropped" }, // Dropped
  planToRead: { text: "أقرا لاحقا", value: "planToRead" }, // Plan to Read
} as const;

type NovelStatusKey = keyof typeof NovelStatusMap;

interface NovelComponentProps {
  novel: Novels;
  onUpdate: () => void;
  hasUpdates?: boolean;
}

export function NovelCard({
  novel,
  onUpdate,
  hasUpdates = false,
}: NovelComponentProps) {
  const [chapters, setChapters] = useState<Chapters[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState<boolean>(true);
  const [errorChapters, setErrorChapters] = useState<string | null>(null);

  // Fetch chapters for this novel
  useEffect(() => {
    let isMounted = true;
    setIsLoadingChapters(true);
    setErrorChapters(null);

    db.chapters
      .where({ novelId: novel.id })
      .toArray()
      .then((fetchedChapters) => {
        if (isMounted) {
          setChapters(fetchedChapters || []);
        }
      })
      .catch((err) => {
        console.error(
          `Failed to fetch chapters for novel ID ${novel.id}:`,
          err
        );
        if (isMounted) {
          setErrorChapters("Failed to load chapter details.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingChapters(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [novel.id]);

  // Calculate reading statistics
  const chapterStats = useMemo(() => {
    const totalCount = chapters.length;
    const readChapters = chapters.filter((ch) => ch.readingCompletion === 100);
    const readCount = readChapters.length;

    // Sort chapters by index/id
    const sortedChapters = [...chapters].sort(
      (a, b) => (a.chapterIndex ?? a.id) - (b.chapterIndex ?? b.id)
    );

    const unFinishedChapter = sortedChapters.find(
      (ch) => ch.readingCompletion < 100
    );

    // Calculate completion percentages
    const readPercentage =
      totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

    return {
      totalCount,
      readCount,
      readPercentage,
      unFinishedChapter,
      finishedAllKnownChapters: readCount === novel.chaptersCount,
      finishedAllFetchedChapters: readCount === totalCount && totalCount > 0,
    };
  }, [chapters, novel.chaptersCount]);

  // Update novel status handler
  const handleStatusChange = async (value: string) => {
    const newStatusValue = value as NovelStatusKey;

    if (!NovelStatusMap[newStatusValue]) {
      console.error("Invalid status selected:", newStatusValue);
      return;
    }

    try {
      await db.novels.update(novel.id, { status: newStatusValue });
      onUpdate();
    } catch (error) {
      console.error(`Failed to update status for novel ${novel.id}:`, error);
    }
  };

  // Delete novel handler
  const handleDelete = async () => {
    try {
      const novelId = novel.id;
      await db.transaction("rw", db.novels, db.chapters, async () => {
        await db.novels.delete(novelId);
        await db.chapters.where({ novelId }).delete();
      });
      onUpdate();
    } catch (error) {
      console.error(`Failed to delete novel ${novel.id}:`, error);
    }
  };

  // Determine reading link and text
  const continueReadingLink =
    chapterStats.unFinishedChapter?.link ??
    `https://kolbook.xyz/series/${novel.uri}`;

  let continueReadingText = "ابدأ القراءة"; // Start Reading

  if (chapterStats.unFinishedChapter) {
    continueReadingText = "أكمل القراءة"; // Continue Reading
  } else if (chapterStats.finishedAllFetchedChapters) {
    continueReadingText = "عرض الرواية"; // View Novel
  }

  // Get status color based on current status
  const getStatusColor = (status: string) => {
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

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-300 hover:shadow-md relative",
          "flex flex-col h-full"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle
              className="text-lg font-bold truncate"
              title={novel.name}
            >
              {novel.name}
            </CardTitle>

            {hasUpdates && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary">New</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Recently updated</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            <a
              href={`https://kolbook.xyz/series/${novel.uri}`}
              className="block overflow-hidden rounded-md"
            >
              <img
                src={novel.cover || "/placeholder.svg"}
                alt={novel.name}
                className="rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </a>

            {/* Reading stats badge */}
            {!isLoadingChapters && (
              <div className="absolute top-2 right-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-black bg-opacity-75 text-white">
                      {chapterStats.readCount}/{chapterStats.totalCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {chapterStats.readCount} chapters read out of{" "}
                      {chapterStats.totalCount}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Loading/Error indicator */}
            {isLoadingChapters && (
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="animate-pulse">
                  Loading...
                </Badge>
              </div>
            )}

            {errorChapters && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive">
                      <AlertCircle size={14} className="mr-1" />
                      Error
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{errorChapters}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Progress section */}
          <div className="mt-4 space-y-4">
            {!isLoadingChapters && chapterStats.totalCount > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{chapterStats.readPercentage}%</span>
                </div>
                <Progress
                  value={chapterStats.readPercentage}
                  className="h-2"
                  title={`${chapterStats.readCount} / ${chapterStats.totalCount} chapters read`}
                />
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col gap-2 ">
          <div className="flex w-full justify-between gap-2">
            <Select
              value={novel.status}
              onValueChange={handleStatusChange}
              aria-label={`Change status for ${novel.name}`}
            >
              <SelectTrigger
                className={`flex-1 ${getStatusColor(novel.status)} text-white`}
              >
                <SelectValue>
                  {
                    NovelStatusMap[novel.status as keyof typeof NovelStatusMap]
                      ?.text
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NovelStatusMap).map(([key, statusInfo]) => (
                  <SelectItem key={key} value={statusInfo.value}>
                    {statusInfo.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Delete Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  title={`Delete ${novel.name}`}
                >
                  <Trash size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete novel</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Continue Reading Button */}
          <Button variant="secondary" className="w-full" asChild>
            <a href={continueReadingLink}>
              {chapterStats.unFinishedChapter ? (
                <BookOpen size={16} />
              ) : (
                <Bookmark size={16} />
              )}
              {continueReadingText}
            </a>
          </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
