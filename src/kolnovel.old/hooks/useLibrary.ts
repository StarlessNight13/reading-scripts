// useLibrary.ts - Main hook combining library data and updates
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { db, Novels } from "@/kolnovel.old/db";
import { api } from "@/kolnovel.old/lib/api";
import { NovelGroups, NovelStatus, NovelUpdateResult } from "../types/library";
import { initialNovelGroups } from "../utils/library";

export const useLibrary = () => {
  const [novelGroups, setNovelGroups] =
    useState<NovelGroups>(initialNovelGroups);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedNovelIds, setUpdatedNovelIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadNovels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const novels = await db.novels.toArray();
      const newGroups: NovelGroups = { ...initialNovelGroups };

      Object.keys(newGroups).forEach((key) => {
        newGroups[key as NovelStatus] = {
          ...newGroups[key as NovelStatus],
          novels: [],
        };
      });

      novels.forEach((novel: Novels) => {
        const status = novel.status as NovelStatus;
        if (newGroups[status]) {
          newGroups[status].novels.push(novel);
        } else {
          console.warn(`Novel ${novel.id} has unknown status: ${novel.status}`);
        }
      });

      setNovelGroups(newGroups);
    } catch (err) {
      console.error("Failed to load novels from database:", err);
      setError("Failed to load library data.");
      toast.error("Failed to load library data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkNovelForUpdates = async (
    novel: Novels
  ): Promise<NovelUpdateResult> => {
    try {
      const latestNovelData = await api.getNovel(Number(novel.id));
      if (!latestNovelData) {
        console.warn(`Could not fetch latest data for novel ID ${novel.id}`);
        return { id: novel.id, hasUpdates: false };
      }

      const hasUpdates = latestNovelData.count !== novel.chaptersCount;

      if (hasUpdates) {
        await db.novels.update(novel.id, {
          chaptersCount: latestNovelData.count,
        });
        toast.info(
          `Novel ${novel.name} has new chapters! (Count: ${latestNovelData.count})`
        );
      }
      return { id: novel.id, hasUpdates };
    } catch (error) {
      console.error(`Failed to check updates for novel ID ${novel.id}:`, error);
      return { id: novel.id, hasUpdates: false };
    }
  };

  const updateNovels = useCallback(async () => {
    setIsUpdating(true);
    setUpdatedNovelIds([]);

    const novelsToCheck = novelGroups[NovelStatus.READING]?.novels ?? [];

    if (novelsToCheck.length === 0) {
      toast.info("No novels in 'Reading' status to check.");
      setIsUpdating(false);
      return;
    }

    toast.info(`Checking ${novelsToCheck.length} novels for updates...`);

    try {
      const results = await Promise.allSettled(
        novelsToCheck.map((novel) => checkNovelForUpdates(novel))
      );

      const updates: number[] = [];
      const noUpdates: number[] = [];
      let checkFailedCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          if (result.value.hasUpdates) {
            updates.push(result.value.id);
          } else {
            noUpdates.push(result.value.id);
          }
        } else {
          checkFailedCount++;
          console.error(
            `Update check failed for ${novelsToCheck[index]?.name}:`,
            result.reason
          );
        }
      });

      if (updates.length > 0) {
        toast.success(`Found new chapters for ${updates.length} novel(s).`);
      }
      if (noUpdates.length > 0) {
        toast.info(`No new chapters found for ${noUpdates.length} novel(s).`);
      }
      if (checkFailedCount > 0) {
        toast.error(
          `Failed to check updates for ${checkFailedCount} novel(s).`
        );
      }

      if (updates.length > 0) {
        setUpdatedNovelIds(updates);
        await loadNovels();
      }
    } catch (error) {
      console.error("Unexpected error during update process:", error);
      toast.error("Update process failed unexpectedly.");
    } finally {
      setIsUpdating(false);
      setTimeout(() => setUpdatedNovelIds([]), 5000);
    }
  }, [novelGroups, loadNovels]);

  useEffect(() => {
    loadNovels();
    document.title = "User Library";
  }, [loadNovels]);

  return {
    novelGroups,
    isLoading,
    isUpdating,
    updatedNovelIds,
    error,
    reloadNovels: loadNovels,
    updateNovels,
  };
};
