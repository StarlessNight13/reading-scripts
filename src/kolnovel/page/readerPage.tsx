import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReaderLayoutProps } from "@/kolnovel/types/reader";
import { useReaderController } from "@/kolnovel/hooks/useReaderController";
import { ReaderContent } from "@/kolnovel/components/reader/layout/reader-content";
import { ReaderSidebar } from "@/kolnovel/components/reader/chapter/reader-sidebar";

export default function ReaderLayout({ initialChapterId }: ReaderLayoutProps) {
  const readerState = useReaderController(initialChapterId);
  const { allChaptersMeta, activeChapterForUIDisplay } = readerState;

  return (
    <SidebarProvider defaultOpen={false} dir="ltr">
      <ReaderSidebar
        allChapters={allChaptersMeta}
        currentChapter={activeChapterForUIDisplay?.id ?? initialChapterId}
      />
      <SidebarInset dir="rtl">
        <ReaderContent {...readerState} />
      </SidebarInset>
    </SidebarProvider>
  );
}