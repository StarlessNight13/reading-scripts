import { Library, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LibraryHeaderProps {
    totalNovels: number;
    isUpdating: boolean;
    isLoading: boolean;
    hasNovels: boolean;
    updatedNovelIds: number[];
    onUpdateClick: () => void;
}

export function LibraryHeader({
    totalNovels,
    isUpdating,
    isLoading,
    hasNovels,
    updatedNovelIds,
    onUpdateClick,
}: LibraryHeaderProps) {
    return (
        <>
            <header className="py-2 px-4">
                <div className="container mx-auto">
                    <div className="flex items-center justify-center">
                        <Button variant="outline" asChild>
                            <a href="/">العودة إلى الصفحة الرئيسية</a>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="py-8 px-4 mb-6 shadow-md">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <h1 className="text-3xl font-bold flex items-center">
                                <Library className="mr-2" size={30} />
                                مكتبتي
                            </h1>
                            <p className="text-blue-100 mt-2">
                                {totalNovels} {totalNovels === 1 ? "novel" : "novels"} in
                                your collection
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <Button
                                onClick={onUpdateClick}
                                disabled={isUpdating || isLoading || !hasNovels}
                                variant="secondary"
                                className="relative overflow-hidden group"
                            >
                                <span className="flex items-center gap-2">
                                    <RefreshCcw
                                        size={18}
                                        className={`transition-transform ${isUpdating ? "animate-spin" : "group-hover:rotate-180"
                                            }`}
                                    />
                                    <span className="whitespace-nowrap">
                                        {isUpdating
                                            ? "جاري التحديث..."
                                            : "البحث عن الفصول الجديدة"}
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
        </>
    );
}