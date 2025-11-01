import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface NovelCardHeaderProps {
    name: string;
    hasUpdates: boolean;
}

export function NovelCardHeader({ name, hasUpdates }: NovelCardHeaderProps) {
    return (
        <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold truncate" title={name}>
                    {name}
                </CardTitle>

                {hasUpdates && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="secondary">New</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Recently updated</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </CardHeader>
    );
}