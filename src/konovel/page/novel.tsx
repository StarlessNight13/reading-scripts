import { Button } from "@/components/ui/button";
import { db } from "@/konovel/db";
import { api } from "@/konovel/lib/api";
import { Book, Minus, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";

// Type definitions
interface NovelData {
  id?: number;
  name: string;
  cover: string;
  chaptersCount: number;
  slug: string;
}

enum NovelStatus {
  READING = "reading",
  COMPLETED = "completed",
  DROPPED = "dropped",
  PLAN_TO_READ = "planToRead",
}

enum LibraryAction {
  READING = "reading",
  PLANNING = "planning",
  REMOVE = "remove",
}

interface NovelLibraryButtonsProps {
  novelSlug: string;
  novelId?: number;
  novelName: string;
  novelCover: string;
  novelChaptersCount: number;
}

interface LibraryButtonConfig {
  id: string;
  text: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  action: LibraryAction;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "muted";
}

const LIBRARY_BUTTONS_CONFIG: LibraryButtonConfig[] = [
  {
    id: "reading-btn",
    text: "Add to Library",
    icon: Plus,
    action: LibraryAction.READING,
  },
  {
    id: "planning-btn",
    text: "Planning to read",
    icon: Book,
    action: LibraryAction.PLANNING,
    variant: "muted",
  },
  {
    id: "remove-btn",
    text: "Remove from Library",
    icon: Minus,
    action: LibraryAction.REMOVE,
    variant: "destructive",
  },
];

const useNovelLibrary = (novelData: NovelData | null) => {
  const [isInLibrary, setIsInLibrary] = useState<boolean>(false);

  useEffect(() => {
    const checkLibraryStatus = async () => {
      if (novelData?.id) {
        const novel = await db.novels.where({ id: novelData.id }).first();
        setIsInLibrary(!!novel);
      } else {
        setIsInLibrary(false);
      }
    };

    checkLibraryStatus();
  }, [novelData?.id]);

  const handleLibraryAction = async (action: LibraryAction) => {
    if (!novelData) return;

    if (action === LibraryAction.REMOVE) {
      if (novelData.id) {
        await db.novels.where({ id: novelData.id }).delete();
        setIsInLibrary(false);
        console.log(`Novel "${novelData.name}" removed from library.`);
        // Optionally show notification
      } else {
        console.warn("Novel ID is missing, cannot remove.");
      }
    } else if (
      action === LibraryAction.READING ||
      action === LibraryAction.PLANNING
    ) {
      const status =
        action === LibraryAction.PLANNING
          ? NovelStatus.PLAN_TO_READ
          : NovelStatus.READING;

      const newNovel = {
        id: novelData.id,
        status,
        chaptersCount: novelData.chaptersCount,
        uri: novelData.slug,
        name: novelData.name,
        cover: novelData.cover,
      };

      try {
        await db.novels.add(newNovel);
        setIsInLibrary(true);
        console.log(
          `Novel "${novelData.name}" added to library with status "${status}".`
        );
        // Optionally show notification
      } catch (error) {
        console.error("Error adding novel to library:", error);
        // Handle potential errors like duplicate entries
      }
    }
  };

  return { isInLibrary, handleLibraryAction };
};

const NovelLibraryButtons: React.FC<NovelLibraryButtonsProps> = ({
  novelSlug,
  novelId,
  novelName,
  novelCover,
  novelChaptersCount,
}) => {
  const novelData = React.useMemo(
    () => ({
      id: novelId,
      name: novelName,
      cover: novelCover,
      chaptersCount: novelChaptersCount,
      slug: novelSlug,
    }),
    [novelId, novelName, novelCover, novelChaptersCount, novelSlug]
  );

  const { isInLibrary, handleLibraryAction } = useNovelLibrary(novelData);

  return (
    <div className="flex gap-2">
      {LIBRARY_BUTTONS_CONFIG.map((buttonConfig) => {
        const shouldDisplay =
          (isInLibrary && buttonConfig.action === LibraryAction.REMOVE) ||
          (!isInLibrary && buttonConfig.action !== LibraryAction.REMOVE);

        if (!shouldDisplay) {
          return null;
        }

        return (
          <Button
            key={buttonConfig.id}
            onClick={() => handleLibraryAction(buttonConfig.action)}
          >
            <buttonConfig.icon className="mr-2 h-4 w-4" />
            {buttonConfig.text}
          </Button>
        );
      })}
    </div>
  );
};

export default function NovelPage() {
  const [novelData, setNovelData] = useState<NovelData | null>(null);
  const [missingNovel, setMissingNovel] = useState<boolean>(false);

  useEffect(() => {
    const fetchNovelData = async () => {
      const slug = window.location.pathname.split("/")[2];
      const apiData = await api.getNovelBySlug(slug);
      if (!apiData) {
        console.error("Failed to fetch novel data from API.");
        setMissingNovel(true);
        return;
      }
      const cover = document.querySelector<HTMLImageElement>(
        `article > div.sertobig > div > div.sertothumb > img`
      );

      setNovelData({
        id: apiData.id,
        name: apiData.name,
        cover: cover?.src ?? "",
        chaptersCount: apiData.count,
        slug: apiData.slug,
      });
    };

    fetchNovelData();
  }, []);
  if (!novelData) {
    return <div>Loading...</div>;
  }
  if (missingNovel) {
    return <div>No Novel Found</div>;
  }

  return (
    <NovelLibraryButtons
      novelChaptersCount={novelData.chaptersCount}
      novelCover={novelData.cover}
      novelId={novelData.id}
      novelName={novelData.name}
      novelSlug={novelData.slug}
    />
  );
}
