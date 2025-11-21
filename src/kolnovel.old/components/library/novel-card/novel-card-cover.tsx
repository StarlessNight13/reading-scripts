import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface NovelCardCoverProps {
    cover: string;
    name: string;
    uri: string;
    readCount: number;
    totalCount: number;
    isLoading: boolean;
    error: string | null;
}

export function NovelCardCover({
    cover,
    name,
    uri,
    readCount,
    totalCount,
    isLoading,
    error,
}: NovelCardCoverProps) {
    return (
        <div className="relative">
            <a
                href={`https://kolnovel.com/series/${uri}`}
                className="block overflow-hidden rounded-md"
            >
                <img
                    src={cover || "/placeholder.svg"}
                    alt={name}
                    className="rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                />
            </a>

            {!isLoading && !error && (
                <div className="absolute top-2 right-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge className="bg-black bg-opacity-75 text-white">
                                {readCount}/{totalCount}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {readCount} chapters read out of {totalCount}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            )}

            {isLoading && (
                <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="animate-pulse">
                        Loading...
                    </Badge>
                </div>
            )}

            {error && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="absolute top-2 right-2">
                            <Badge variant="destructive">
                                <AlertCircle size={14} className="mr-1" />
                                Error
                            </Badge>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{error}</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}