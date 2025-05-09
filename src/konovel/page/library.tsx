import {
  Book,
  BookMarked,
  BookOpen,
  BookX,
  Library,
  RefreshCcw,
} from "lucide-react"; // Use lucide-react
import { useCallback, useEffect, useState } from "react";

// Assuming these imports are correct and provide the necessary functionalities/types
import { NovelCard } from "@/konovel/components/library/novel-card"; // Assume this is a React component now
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db, Novels } from "@/konovel/db"; // Import db instance and Novels type
import { api } from "@/konovel/lib/api"; // Import the refactored API object
import { toast } from "sonner";

// --- Enums and Types (copied from the class) ---

enum NovelStatus {
  READING = "reading",
  COMPLETED = "completed",
  DROPPED = "dropped",
  PLAN_TO_READ = "planToRead",
}

interface NovelGroup {
  text: string;
  novels: Novels[];
}

interface NovelGroups {
  [NovelStatus.READING]: NovelGroup;
  [NovelStatus.COMPLETED]: NovelGroup;
  [NovelStatus.DROPPED]: NovelGroup;
  [NovelStatus.PLAN_TO_READ]: NovelGroup;
}

const initialNovelGroups: NovelGroups = {
  [NovelStatus.READING]: { text: "Reading", novels: [] },
  [NovelStatus.COMPLETED]: { text: "Completed", novels: [] },
  [NovelStatus.DROPPED]: { text: "Dropped", novels: [] },
  [NovelStatus.PLAN_TO_READ]: { text: "Plan to read", novels: [] },
};

// For tracking update results during sync
interface NovelUpdateResult {
  id: number;
  hasUpdates: boolean;
}
interface UpdateResults {
  updates: number[];
  noUpdates: number[];
}

// --- React Functional Component ---

export function LibraryManager() {
  const [novelGroups, setNovelGroups] =
    useState<NovelGroups>(initialNovelGroups);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial load
  const [isUpdating, setIsUpdating] = useState<boolean>(false); // For sync process
  const [error, setError] = useState<string | null>(null);
  const [updatedNovelIds, setUpdatedNovelIds] = useState<number[]>([]); // Track recently updated novels

  // --- Data Loading and Processing Functions ---

  // Function to load novels from DB and update state
  const loadAndSetNovels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const novels = await db.novels.toArray();
      const newGroups: NovelGroups = { ...initialNovelGroups };
      // Deep copy initial structure to avoid mutation issues if needed
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
          // Optionally add to a default group or ignore
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
  }, []); // useCallback with empty dependency array as it doesn't depend on props/state

  // Initial load on component mount
  useEffect(() => {
    loadAndSetNovels();
    document.title = "User Library";
  }, [loadAndSetNovels]); // Depend on the memoized function
  // Get default active tab (first non-empty category)
  // Get count of novels in each category
  const getNovelCount = (status: string) => {
    return novelGroups[status as NovelStatus]?.novels.length || 0;
  };

  // Get default active tab (first non-empty category)
  const getDefaultTab = () => {
    const order = [
      NovelStatus.READING,
      NovelStatus.PLAN_TO_READ,
      NovelStatus.COMPLETED,
      NovelStatus.DROPPED,
    ];

    for (const status of order) {
      if (getNovelCount(status) > 0) {
        return status;
      }
    }
    return NovelStatus.READING; // Default to reading if all empty
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab());

  // Update active tab when novel groups change
  useEffect(() => {
    const currentHasNovels = getNovelCount(activeTab) > 0;
    if (!currentHasNovels) {
      setActiveTab(getDefaultTab());
    }
  }, [novelGroups]);

  // Get icon for each status category
  const getStatusIcon = (status: string) => {
    switch (status) {
      case NovelStatus.READING:
        return <BookOpen size={18} />;
      case NovelStatus.PLAN_TO_READ:
        return <BookMarked size={18} />;
      case NovelStatus.COMPLETED:
        return <Book size={18} />;
      case NovelStatus.DROPPED:
        return <BookX size={18} />;
      default:
        return <Book size={18} />;
    }
  };

  // Total novel count
  const totalNovels = Object.values(novelGroups).reduce(
    (acc, group) => acc + group.novels.length,
    0
  );
  // --- Update/Sync Functions ---

  const updateNovelChapterCountInDb = async (
    id: number,
    newCount: number
  ): Promise<void> => {
    try {
      await db.novels.update(id, { chaptersCount: newCount });
    } catch (err) {
      console.error(
        `Failed to update chapter count for novel ${id} in DB:`,
        err
      );
      // Optionally notify the user
    }
  };

  const checkNovelForUpdates = async (
    novel: Novels
  ): Promise<NovelUpdateResult> => {
    try {
      // Use the refactored API function
      const latestNovelData = await api.getNovel(Number(novel.id)); // Ensure ID is number if needed
      if (!latestNovelData) {
        console.warn(`Could not fetch latest data for novel ID ${novel.id}`);
        return { id: novel.id, hasUpdates: false };
      }

      const hasUpdates = latestNovelData.count !== novel.chaptersCount;

      if (hasUpdates) {
        await updateNovelChapterCountInDb(novel.id, latestNovelData.count);
        // Show specific update notification immediately
        toast.info(
          `Novel ${novel.name} has new chapters! (Count: ${latestNovelData.count})`
        );
      }
      return { id: novel.id, hasUpdates };
    } catch (error) {
      console.error(`Failed to check updates for novel ID ${novel.id}:`, error);
      // Don't show generic error here, handle summary later
      return { id: novel.id, hasUpdates: false }; // Assume no update on error
    }
  };

  const categorizeNovelUpdates = (
    results: NovelUpdateResult[]
  ): UpdateResults => {
    const updates: number[] = [];
    const noUpdates: number[] = [];
    results.forEach((result) => {
      if (result.hasUpdates) {
        updates.push(result.id);
      } else {
        noUpdates.push(result.id);
      }
    });
    return { updates, noUpdates };
  };

  const handleUpdateNovels = async () => {
    setIsUpdating(true);
    setError(null);
    setUpdatedNovelIds([]); // Clear previous update highlights

    // Only check novels currently in the 'READING' status
    const novelsToCheck = novelGroups[NovelStatus.READING]?.novels ?? [];

    if (novelsToCheck.length === 0) {
      toast.info("No novels in 'Reading' status to check.");
      setIsUpdating(false);
      return;
    }

    toast.info(`Checking ${novelsToCheck.length} novels for updates...`);

    try {
      // Use Promise.allSettled to handle individual check failures without stopping others
      const results = await Promise.allSettled(
        novelsToCheck.map((novel) => checkNovelForUpdates(novel))
      );

      const successfulResults: NovelUpdateResult[] = [];
      let checkFailedCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successfulResults.push(result.value);
        } else {
          checkFailedCount++;
          console.error(
            `Update check promise rejected for novel ${novelsToCheck[index]?.name}:`,
            result.reason
          );
        }
      });

      const { updates, noUpdates } = categorizeNovelUpdates(successfulResults);

      // Display summary notifications
      if (updates.length > 0) {
        toast.success(`Found new chapters for ${updates.length} novel(s).`);
      }
      if (noUpdates.length > 0) {
        toast.info(`No new chapters found for ${noUpdates.length} novel(s).`);
      }
      if (checkFailedCount > 0) {
        toast.error(
          `Failed to check updates for ${checkFailedCount} novel(s). Check console for details.`
        );
      }
      if (
        updates.length === 0 &&
        noUpdates.length === 0 &&
        checkFailedCount === 0 &&
        novelsToCheck.length > 0
      ) {
        // Edge case: all checks succeeded but found no updates, and none failed
        toast.info(
          `All ${novelsToCheck.length} novels checked are up-to-date.`
        );
      }

      // If there were updates, reload the list to reflect new chapter counts
      // and track which novels were updated for potential highlighting
      if (updates.length > 0) {
        setUpdatedNovelIds(updates); // Store IDs that were updated
        await loadAndSetNovels(); // Reload data from DB
      }
    } catch (error) {
      // Catch errors from Promise.allSettled itself (unlikely) or setup
      console.error("Unexpected error during the update process:", error);
      setError("An unexpected error occurred while checking for updates.");
      toast.error("Update process failed unexpectedly.");
    } finally {
      setIsUpdating(false);
      // Clear highlights after a short delay
      setTimeout(() => setUpdatedNovelIds([]), 5000); // Clear after 5 seconds
    }
  };

  // Callback for NovelComponent to trigger a refresh if needed (e.g., status change)
  const handleNovelDataChange = () => {
    loadAndSetNovels();
  };
  function getStatusColor(status: string) {
    switch (status) {
      case NovelStatus.READING:
        return "#3b82f6"; // blue-500
      case NovelStatus.PLAN_TO_READ:
        return "#f59e0b"; // amber-500
      case NovelStatus.COMPLETED:
        return "#10b981"; // emerald-500
      case NovelStatus.DROPPED:
        return "#ef4444"; // red-500
      default:
        return "#6b7280"; // gray-500
    }
  }
  // --- Render Logic ---

  if (
    isLoading &&
    !Object.values(novelGroups).some((g) => g.novels.length > 0)
  ) {
    // Show loading indicator only on initial empty load
    return <div>Loading Library...</div>;
  }

  if (error) {
    // Basic error display
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      <header className="py-2 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">مكتبتي</h1>
            <Button variant="outline" asChild>
              <a href="/">العودة إلى الصفحة الرئيسية</a>
            </Button>
          </div>
        </div>
      </header>
      {/* Hero Header */}
      <div className="  py-8 px-4 mb-6 shadow-md">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold flex items-center">
                <Library className="mr-2" size={30} />
                مكتبتي
              </h1>
              <p className="text-blue-100 mt-2">
                {totalNovels} {totalNovels === 1 ? "novel" : "novels"} in your
                collection
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                onClick={handleUpdateNovels}
                disabled={
                  isUpdating || isLoading || getNovelCount(activeTab) === 0
                }
                variant="secondary"
                className="relative overflow-hidden group"
              >
                <span className="flex items-center gap-2">
                  <RefreshCcw
                    size={18}
                    className={`transition-transform ${
                      isUpdating ? "animate-spin" : "group-hover:rotate-180"
                    }`}
                  />
                  <span className="whitespace-nowrap">
                    {isUpdating ? "جاري التحديث..." : "البحث عن الفصول الجديدة"}
                  </span>
                </span>
                {updatedNovelIds.length > 0 && (
                  <Badge className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-500">
                    {updatedNovelIds.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        {/* Update notification */}
        {isUpdating && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded shadow-sm">
            <div className="flex items-center">
              <RefreshCcw size={20} className="animate-spin mr-2" />
              <p>جاري التحقق من التحديثات الجديدة...</p>
            </div>
          </div>
        )}

        {/* Tabs for Novel Categories */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as NovelStatus)}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">المجموعات</h2>
            <TabsList className="grid grid-cols-4 md:w-auto">
              {Object.entries(novelGroups)
                .sort(([keyA], [keyB]) => {
                  const order = [
                    NovelStatus.READING,
                    NovelStatus.PLAN_TO_READ,
                    NovelStatus.COMPLETED,
                    NovelStatus.DROPPED,
                  ];
                  return (
                    order.indexOf(keyA as NovelStatus) -
                    order.indexOf(keyB as NovelStatus)
                  );
                })
                .map(([status, group]) => (
                  <TabsTrigger
                    key={status}
                    value={status}
                    disabled={getNovelCount(status) === 0}
                    className="relative"
                  >
                    <span className="flex items-center gap-1">
                      {getStatusIcon(status)}
                      <span className="hidden md:inline">{group.text}</span>
                    </span>
                    {getNovelCount(status) > 0 && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        {getNovelCount(status)}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          {Object.entries(novelGroups)
            .sort(([keyA], [keyB]) => {
              const order = [
                NovelStatus.READING,
                NovelStatus.PLAN_TO_READ,
                NovelStatus.COMPLETED,
                NovelStatus.DROPPED,
              ];
              return (
                order.indexOf(keyA as NovelStatus) -
                order.indexOf(keyB as NovelStatus)
              );
            })
            .map(([status, group]) => (
              <TabsContent key={status} value={status} className="pt-2">
                {group.novels.length > 0 ? (
                  <div>
                    <Card
                      className="border-t-4"
                      style={{ borderTopColor: getStatusColor(status) }}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-xl">
                          {getStatusIcon(status)}
                          <span className="ml-2">{group.text}</span>
                          <Badge variant="outline" className="ml-auto">
                            {group.novels.length}{" "}
                            {group.novels.length === 1 ? "novel" : "novels"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>

                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                          {group.novels.map((novel: Novels) => (
                            <NovelCard
                              key={novel.id}
                              novel={novel}
                              onUpdate={handleNovelDataChange}
                              hasUpdates={updatedNovelIds.includes(novel.id)}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                      {getStatusIcon(status)}
                    </div>
                    <h3 className="text-xl font-medium mb-2">
                      No novels in {group.text}
                    </h3>
                    <p>
                      Change a novel's status to {group.text} to see it here
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
        </Tabs>

        {/* Empty Library State */}
        {!isLoading && totalNovels === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
              <Library size={64} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">مكتبتك فارغة</h2>
            <p className="text-gray-500 max-w-md mb-6">
              Start building your collection by adding novels from your favorite
              series.
            </p>
            <Button variant="outline" size="lg" className="px-8" asChild>
              <a href="/">استكشاف الروايات الجديدة</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
