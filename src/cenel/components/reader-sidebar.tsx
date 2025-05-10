import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { ChevronRight } from "lucide-react";

interface ChapterInfo {
  title: string;
  link: string;
  chapterIndex: number;
}
interface VolumeInfo {
  id: number;
  title: string;
  chapters: ChapterInfo[];
  selectedChapterIndex: number;
}
interface ReaderSidebarProps {
  volumes: VolumeInfo[];
  currentChapter: number;
  currentVolume: number;
}

export function ReaderSidebar({
  volumes,
  currentChapter,
  currentVolume,
}: ReaderSidebarProps) {
  return (
    <Sidebar side="right">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>فصول</SidebarGroupLabel>
          <SidebarMenu>
            {volumes.map((volume) => (
              <Collapsible
                key={volume.id}
                asChild
                defaultOpen={currentVolume === volume.id}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={volume.title}>
                      <span>{volume.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="h-full">
                      {volume.chapters?.map((chapter) => (
                        <SidebarMenuItem key={chapter.chapterIndex}>
                          <SidebarMenuButton
                            asChild
                            isActive={currentChapter === chapter.chapterIndex}
                          >
                            <a href={chapter.link}>
                              {chapter.chapterIndex} : {chapter.title}
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
