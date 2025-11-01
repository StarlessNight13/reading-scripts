import { Progress } from "@/components/ui/progress";

interface NovelCardProgressProps {
    readPercentage: number;
    readCount: number;
    totalCount: number;
    isLoading: boolean;
}

export function NovelCardProgress({
    readPercentage,
    readCount,
    totalCount,
    isLoading,
}: NovelCardProgressProps) {
    if (isLoading || totalCount === 0) {
        return null;
    }

    return (
        <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{readPercentage}%</span>
            </div>
            <Progress
                value={readPercentage}
                className="h-2"
                title={`${readCount} / ${totalCount} chapters read`}
            />
        </div>
    );
}