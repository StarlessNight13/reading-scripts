import { Bookmark, BookOpen, Trash } from "lucide-react";
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCardStatusColor } from "@/kolnovel.old/utils/library";
import { NovelStatusMap, NovelStatusKey } from "@/kolnovel.old/types/library";

interface NovelCardFooterProps {
    novelStatus: string;
    novelName: string;
    continueReadingLink: string;
    continueReadingText: string;
    hasUnfinishedChapter: boolean;
    onStatusChange: (value: string) => void;
    onDelete: () => void;
}

export function NovelCardFooter({
    novelStatus,
    novelName,
    continueReadingLink,
    continueReadingText,
    hasUnfinishedChapter,
    onStatusChange,
    onDelete,
}: NovelCardFooterProps) {
    return (
        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
            <div className="flex w-full justify-between gap-2">
                <Select
                    value={novelStatus}
                    onValueChange={onStatusChange}
                    aria-label={`Change status for ${novelName}`}
                >
                    <SelectTrigger
                        className={`flex-1 ${getCardStatusColor(novelStatus)} text-white`}
                    >
                        <SelectValue>
                            {
                                NovelStatusMap[novelStatus as NovelStatusKey]
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

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={onDelete}
                            title={`Delete ${novelName}`}
                        >
                            <Trash size={16} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Delete novel</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <Button variant="secondary" className="w-full" asChild>
                <a href={continueReadingLink}>
                    {hasUnfinishedChapter ? (
                        <BookOpen size={16} />
                    ) : (
                        <Bookmark size={16} />
                    )}
                    {continueReadingText}
                </a>
            </Button>
        </CardFooter>
    );
}