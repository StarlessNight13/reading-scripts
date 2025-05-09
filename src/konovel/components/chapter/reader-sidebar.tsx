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
    <Sidebar side="right">
      <SidebarContent>
        <SidebarMenu className="h-full">
          <VirtualizedList overscan={5}>
            {allChapters.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild>
                  <a
                    href={`/reader?chapterId=${item.id}`}
                    data-state={
                      item.id === currentChapter ? "checked" : "unchecked"
                    }
                  >
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
