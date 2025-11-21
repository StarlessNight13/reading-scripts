import { MessageSquare, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrawerTrigger } from "@/components/ui/drawer";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function ReaderFooter() {
    return (
        <footer className="fixed bottom-7 right-5 z-30 flex gap-2 flex-col">
            <Button
                variant="outline"
                size="icon"
                onClick={() => window.location.reload()}
            >
                <RefreshCcw />
            </Button>

            <Button asChild size="icon" variant="default">
                <SidebarTrigger />
            </Button>

            <DrawerTrigger asChild>
                <Button size="icon" aria-label="Comments">
                    <MessageSquare />
                    <span className="sr-only">Comments</span>
                </Button>
            </DrawerTrigger>
        </footer>
    );
}