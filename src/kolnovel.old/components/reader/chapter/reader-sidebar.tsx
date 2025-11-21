import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { VirtualizedList } from "@/components/ui/virtualized";

interface ApiChapterListItem {
  id: number;
  title: string;
  link: string;
  chapterIndex: number;
}

interface ReaderSidebarProps {
  allChapters: ApiChapterListItem[];
  currentChapter: number;
}

export function ReaderSidebar({
  allChapters,
  currentChapter,
}: ReaderSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarMenu className="h-full" dir="rtl">
          <VirtualizedList
            overscan={5}
            className="scrollbar scrollbar-thumb-primary scrollbar-track-background"
          >
            {allChapters.map((item) => (
              <SidebarMenuItem key={item.id} className="m-1">
                <SidebarMenuButton
                  asChild
                  isActive={item.id === currentChapter}
                >
                  <a href={`/reader?chapterId=${item.id}`}>
                    <span>
                      {item.chapterIndex} : {item.title}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </VirtualizedList>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
