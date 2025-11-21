import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NovelCard } from "./novel-card";
import { NovelGroup, NovelGroups, NovelStatus } from "@/kolnovel.old/types/library";
import {
    getDefaultTab,
    getNovelCount,
    getStatusColor,
    getStatusIcon,
} from "@/kolnovel.old/utils/library";

interface LibraryTabsProps {
    novelGroups: NovelGroups;
    isUpdating: boolean;
    updatedNovelIds: number[];
    onNovelUpdate: () => void;
}

const STATUS_ORDER = [
    NovelStatus.READING,
    NovelStatus.PLAN_TO_READ,
    NovelStatus.COMPLETED,
    NovelStatus.DROPPED,
];

export function LibraryTabs({
    novelGroups,
    isUpdating,
    updatedNovelIds,
    onNovelUpdate,
}: LibraryTabsProps) {
    const [activeTab, setActiveTab] = useState(getDefaultTab(novelGroups));

    useEffect(() => {
        const currentHasNovels = getNovelCount(novelGroups, activeTab) > 0;
        if (!currentHasNovels) {
            setActiveTab(getDefaultTab(novelGroups));
        }
    }, [novelGroups, activeTab]);

    const sortedEntries: [string, NovelGroup][] = Object.entries(novelGroups).sort(
        ([keyA], [keyB]) => {
            return (
                STATUS_ORDER.indexOf(keyA as NovelStatus) -
                STATUS_ORDER.indexOf(keyB as NovelStatus)
            );
        }
    );

    return (
        <>
            {isUpdating && (
                <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded shadow-sm">
                    <div className="flex items-center">
                        <RefreshCcw size={20} className="animate-spin mr-2" />
                        <p>جاري التحقق من التحديثات الجديدة...</p>
                    </div>
                </div>
            )}

            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as NovelStatus)}
                className="mb-6"
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">المجموعات</h2>
                    <TabsList className="grid grid-cols-4 md:w-auto">
                        {sortedEntries.map(([status, group]) => (
                            <TabsTrigger
                                key={status}
                                value={status}
                                disabled={getNovelCount(novelGroups, status) === 0}
                                className="relative"
                            >
                                <span className="flex items-center gap-1">
                                    {getStatusIcon(status)}
                                    <span className="hidden md:inline">{group.text}</span>
                                </span>
                                {getNovelCount(novelGroups, status) > 0 && (
                                    <Badge variant="outline" className="ml-1 text-xs">
                                        {getNovelCount(novelGroups, status)}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {sortedEntries.map(([status, group]) => (
                    <TabsContent key={status} value={status} className="pt-2">
                        {group.novels.length > 0 ? (
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
                                        {group.novels.map((novel) => (
                                            <NovelCard
                                                key={novel.id}
                                                novel={novel}
                                                onUpdate={onNovelUpdate}
                                                hasUpdates={updatedNovelIds.includes(novel.id)}
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                                    {getStatusIcon(status)}
                                </div>
                                <h3 className="text-xl font-medium mb-2">
                                    No novels in {group.text}
                                </h3>
                                <p>Change a novel's status to {group.text} to see it here</p>
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </>
    );
}