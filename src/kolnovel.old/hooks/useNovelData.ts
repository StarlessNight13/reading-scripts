// useNovelData.ts - Combined hook for novel chapters and stats
import { useEffect, useMemo, useState } from "react";
import { Chapters, db } from "@/kolnovel.old/db";
import { calculateChapterStats } from "../utils/library";

export const useNovelData = (novelId: number, novelChapterCount: number) => {
  const [chapters, setChapters] = useState<Chapters[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    db.chapters
      .where({ novelId })
      .toArray()
      .then((fetchedChapters) => {
        if (isMounted) {
          setChapters(fetchedChapters || []);
        }
      })
      .catch((err) => {
        console.error(`Failed to fetch chapters for novel ID ${novelId}:`, err);
        if (isMounted) {
          setError("Failed to load chapter details.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [novelId]);

  const stats = useMemo(
    () => calculateChapterStats(chapters, novelChapterCount),
    [chapters, novelChapterCount]
  );

  return { chapters, stats, isLoading, error };
};
