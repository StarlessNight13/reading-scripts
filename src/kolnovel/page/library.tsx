import { getNovelCount, getTotalNovels } from "../utils/library";
import { NovelStatus } from "../types/library";
import { LibraryHeader } from "../components/library/library-header";
import { LibraryTabs } from "../components/library/library-tabs";
import { EmptyLibraryState } from "../components/library/empty-library-state";
import { useLibrary } from "../hooks/useLibrary";


export function LibraryManager() {
  const { novelGroups, isLoading, error, reloadNovels, isUpdating, updatedNovelIds, updateNovels } = useLibrary();


  const totalNovels = getTotalNovels(novelGroups);
  const hasReadingNovels = getNovelCount(novelGroups, NovelStatus.READING) > 0;

  if (
    isLoading &&
    !Object.values(novelGroups).some((g) => g.novels.length > 0)
  ) {
    return <div>Loading Library...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      <LibraryHeader
        totalNovels={totalNovels}
        isUpdating={isUpdating}
        isLoading={isLoading}
        hasNovels={hasReadingNovels}
        updatedNovelIds={updatedNovelIds}
        onUpdateClick={updateNovels}
      />

      <div className="container mx-auto px-4">
        {totalNovels > 0 ? (
          <LibraryTabs
            novelGroups={novelGroups}
            isUpdating={isUpdating}
            updatedNovelIds={updatedNovelIds}
            onNovelUpdate={reloadNovels}
          />
        ) : (
          !isLoading && <EmptyLibraryState />
        )}
      </div>
    </div>
  );
}