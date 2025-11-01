import { db } from "@/kolnovel/db";
import { api } from "@/kolnovel/lib/api";
import { Book, Loader2, Minus, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import "@/kolnovel/novel-page.css";

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

interface LibraryButtonConfig {
  text: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  action: LibraryAction;
  className?: string;
}

const LIBRARY_BUTTONS: Record<"add" | "planning" | "remove", LibraryButtonConfig> = {
  add: {
    text: "Add to Library",
    icon: Plus,
    action: LibraryAction.READING,
    className: "button-base primary",
  },
  planning: {
    text: "Planning to read",
    icon: Book,
    action: LibraryAction.PLANNING,
    className: "button-base secondary",
  },
  remove: {
    text: "Remove from Library",
    icon: Minus,
    action: LibraryAction.REMOVE,
    className: "button-base destructive",
  },
};

const useNovelLibrary = (novelData: NovelData | null) => {
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkLibraryStatus = async () => {
      if (!novelData?.id) {
        setIsInLibrary(false);
        return;
      }

      const novel = await db.novels.where({ id: novelData.id }).first();
      setIsInLibrary(!!novel);
    };

    checkLibraryStatus();
  }, [novelData?.id]);

  const handleLibraryAction = async (action: LibraryAction) => {
    if (!novelData || isLoading) return;

    setIsLoading(true);
    try {
      if (action === LibraryAction.REMOVE) {
        await handleRemove(novelData);
      } else {
        await handleAdd(novelData, action);
      }
    } catch (error) {
      console.error("Library action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (novel: NovelData) => {
    if (!novel.id) {
      console.warn("Cannot remove novel without ID");
      return;
    }

    await db.novels.where({ id: novel.id }).delete();
    setIsInLibrary(false);
    console.log(`"${novel.name}" removed from library`);
  };

  const handleAdd = async (novel: NovelData, action: LibraryAction) => {
    const status =
      action === LibraryAction.PLANNING
        ? NovelStatus.PLAN_TO_READ
        : NovelStatus.READING;

    await db.novels.add({
      id: novel.id,
      status,
      chaptersCount: novel.chaptersCount,
      uri: novel.slug,
      name: novel.name,
      cover: novel.cover,
    });

    setIsInLibrary(true);
    console.log(`"${novel.name}" added with status "${status}"`);
  };

  return { isInLibrary, isLoading, handleLibraryAction };
};

const NovelLibraryButtons: React.FC<{ novelData: NovelData }> = ({
  novelData,
}) => {
  const { isInLibrary, isLoading, handleLibraryAction } =
    useNovelLibrary(novelData);

  const visibleButtons = isInLibrary
    ? [LIBRARY_BUTTONS.remove]
    : [LIBRARY_BUTTONS.add, LIBRARY_BUTTONS.planning];

  return (
    <div className="library-buttons">
      {visibleButtons.map((config) => {
        const Icon = config.icon;
        return (
          <button
            key={config.action}
            onClick={() => handleLibraryAction(config.action)}
            disabled={isLoading}
            className={config.className}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon className="mr-2 h-4 w-4" />
            )}
            {config.text}
          </button>
        );
      })}
    </div>
  );
};

const useNovelData = () => {
  const [novelData, setNovelData] = useState<NovelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNovelData = async () => {
      try {
        const slug = window.location.pathname.split("/")[2];
        const apiData = await api.getNovelBySlug(slug);

        if (!apiData) {
          setError("Novel not found");
          return;
        }

        const coverImg = document.querySelector<HTMLImageElement>(
          "article > div.sertobig > div > div.sertothumb > img"
        );

        setNovelData({
          id: apiData.id,
          name: apiData.name,
          cover: coverImg?.src ?? "",
          chaptersCount: apiData.count,
          slug: apiData.slug,
        });
      } catch (err) {
        console.error("Failed to fetch novel:", err);
        setError("Failed to load novel data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovelData();
  }, []);

  return { novelData, isLoading, error };
};

export default function NovelPage() {
  const { novelData, isLoading, error } = useNovelData();

  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error || !novelData) {
    return <div className="error-state">{error || "No Novel Found"}</div>;
  }

  return <NovelLibraryButtons novelData={novelData} />;
}