import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { db } from "@/kolnovel/db";
import { useNovelData } from "@/kolnovel/hooks/useNovelData";
import { NovelCardProps, NovelStatusKey, NovelStatusMap } from "@/kolnovel/types/library";
import { getContinueReadingInfo } from "@/kolnovel/utils/library";
import { cn } from "@/lib/utils";
import { NovelCardCover } from "./novel-card-cover";
import { NovelCardFooter } from "./novel-card-footer";
import { NovelCardHeader } from "./novel-card-header";
import { NovelCardProgress } from "./novel-card-progress";

export function NovelCard({
    novel,
    onUpdate,
    hasUpdates = false,
}: NovelCardProps) {
    const { isLoading, error, stats } = useNovelData(novel.id, novel.chaptersCount);

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

    const continueReadingLink =
        stats.unFinishedChapter?.link ??
        `https://kolnovel.com/series/${novel.uri}`;

    const { text: continueReadingText } = getContinueReadingInfo(stats);

    return (
        <TooltipProvider>
            <Card
                className={cn(
                    "group overflow-hidden transition-all duration-300 hover:shadow-md relative",
                    "flex flex-col h-full"
                )}
            >
                <NovelCardHeader name={novel.name} hasUpdates={hasUpdates} />

                <CardContent className="pt-0">
                    <NovelCardCover
                        cover={novel.cover}
                        name={novel.name}
                        uri={novel.uri}
                        readCount={stats.readCount}
                        totalCount={stats.totalCount}
                        isLoading={isLoading}
                        error={error}
                    />

                    <NovelCardProgress
                        readPercentage={stats.readPercentage}
                        readCount={stats.readCount}
                        totalCount={stats.totalCount}
                        isLoading={isLoading}
                    />
                </CardContent>

                <NovelCardFooter
                    novelStatus={novel.status}
                    novelName={novel.name}
                    continueReadingLink={continueReadingLink}
                    continueReadingText={continueReadingText}
                    hasUnfinishedChapter={!!stats.unFinishedChapter}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                />
            </Card>
        </TooltipProvider>
    );
}