import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

const VolumeComponent = ({
  volume,
  currentVolume,
}: {
  volume: VolumeInfo;
  currentVolume: number;
}) => {
  return (
    <Collapsible
      key={volume.title}
      title={volume.title}
      defaultOpen={volume.id === currentVolume}
      className="group/collapsible "
    >
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel
          asChild
          className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <CollapsibleTrigger>
            {volume.title}{" "}
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent className="mt-1">
            <SidebarMenu dir="rtl">
              {volume.chapters
                .map((chapter, index) => (
                  <SidebarMenuItem key={index + chapter.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={index === volume.selectedChapterIndex}
                    >
                      <a href={chapter.link}>
                        <span>
                          {chapter.chapterIndex} : {chapter.title}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
                .reverse()}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};

export function ReaderSidebar({ volumes, currentVolume }: ReaderSidebarProps) {
  return (
    <Sidebar dir="rtl">
      <SidebarContent className="scrollbar scrollbar-thumb-primary scrollbar-track-background h-full">
        <SidebarGroup>
          {volumes.map((volume) => (
            <VolumeComponent
              key={volume.id}
              volume={volume}
              currentVolume={currentVolume}
            />
          ))}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
