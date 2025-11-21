import { Library } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyLibraryState() {
    return (
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
    );
}