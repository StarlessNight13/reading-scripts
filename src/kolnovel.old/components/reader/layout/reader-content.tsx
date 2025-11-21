import { Drawer } from "@/components/ui/drawer";
import { useReaderSettings } from "@/kolnovel.old/hooks/useReaderSettings";
import { ChapterItem } from "../chapter/chapter-item";
import { EmptyState } from "../states/empty-state";
import { ErrorState } from "../states/error-state";
import { LoadingState } from "../states/loading-state";
import { ReaderFooter } from "./reader-footer";
import { ReaderHeader } from "./reader-header";
import { useReaderStates } from "@/kolnovel.old/types/reader";

export function ReaderContent(props: useReaderStates) {
    const {
        loadedChaptersData,
        activeChapterForUIDisplay,
        novel,
        isLoadingInitial,
        error,
        lastChapterRef,
        outerListRef,
    } = props;

    const { settings, updateSetting } = useReaderSettings();

    if (isLoadingInitial && loadedChaptersData.length === 0) {
        return <LoadingState />;
    }

    if (error && loadedChaptersData.length === 0) {
        return <ErrorState error={error} />;
    }

    if (!isLoadingInitial && loadedChaptersData.length === 0 && !error) {
        return <EmptyState />;
    }

    return (
        <>
            <ReaderHeader
                settings={settings}
                updateSetting={updateSetting}
                activeChapter={activeChapterForUIDisplay}
                novelName={novel?.name}
            />

            <main className="flex flex-col flex-1" ref={outerListRef}>
                {loadedChaptersData.map((chapter, index) => (
                    <ChapterItem
                        key={`chapter-${chapter.id}`}
                        chapter={chapter}
                        settings={settings}
                        isLast={index === loadedChaptersData.length - 1}
                        lastChapterRef={lastChapterRef}
                    />
                ))}
            </main>

            <Drawer>
                <ReaderFooter />
            </Drawer>
        </>
    );
}