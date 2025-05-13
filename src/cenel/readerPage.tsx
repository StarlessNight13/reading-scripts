import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DiscussionEmbed } from "disqus-react";
import { LogOut, MessageSquare, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ChapterContent from "./components/ChapterContent";
import { ReaderSidebar } from "./components/reader-sidebar";
import {
  useReaderController,
  useReaderStates,
} from "./components/readerController";
import SettingsDialog from "./components/settingsDialog";

type ReaderSettings = {
  fontSize: number;
  fontFamily: string;
  textGap: number;
  textWidth: number;
  textAlign: "left" | "center" | "right";
};

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
type ReaderLayoutProps = {
  selectVolumeId: number;
  volumes: VolumeInfo[];
  initalChapterData: {
    content: string;
    id: number;
  };
  novel: {
    name: string;
    link: string;
    id: number;
    cover: string | undefined;
  };
};

// Custom hook for managing reader settings
function useReaderSettings(): {
  settings: ReaderSettings;
  updateSetting: <K extends keyof ReaderSettings>(
    key: K,
    value: ReaderSettings[K]
  ) => void;
} {
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 16,
    fontFamily: "serif",
    textGap: 0,
    textWidth: 100,
    textAlign: "left",
  });

  useEffect(() => {
    const storedSettings: ReaderSettings = {
      fontSize: Number(localStorage.getItem("fontSize")) || 16,
      fontFamily: localStorage.getItem("fontFamily") || "serif",
      textGap: Number(localStorage.getItem("textGap")) || 0,
      textWidth: Number(localStorage.getItem("textWidth")) || 100, // Default 100 if 0
      textAlign:
        (localStorage.getItem("textAlign") as ReaderSettings["textAlign"]) ||
        "left",
    };
    setSettings(storedSettings);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        localStorage.setItem(key, String(value));
        return newSettings;
      });
    },
    []
  );

  return { settings, updateSetting };
}

function ChapterReader({
  loadedChaptersData,
  activeChapterForUIDisplay,
  novel,
  isLoadingInitial,
  error,
  lastChapterRef,
  outerListRef,
}: useReaderStates) {
  const { settings, updateSetting } = useReaderSettings();

  // Conditional Renders for Loading/Error states
  if (isLoadingInitial && loadedChaptersData.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-3 text-lg">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error && loadedChaptersData.length === 0) {
    return (
      <Card className="mx-auto my-8 max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Chapter Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">
            {error || "Please check the ID and try again."}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" asChild>
            <a href="/">Back to Home</a>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!isLoadingInitial && loadedChaptersData.length === 0 && !error) {
    return (
      <Card className="mx-auto my-8 max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">No Chapter Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">
            Could not load any chapter data.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" asChild>
            <a href="/">Back to Home</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <header className="flex sticky top-0 bg-background/30 backdrop-blur z-50 h-16 shrink-0 items-center justify-between gap-2 border-b p-4 font-rubik text-center">
        {/* Display title of the chapter most in view */}
        {activeChapterForUIDisplay ? (
          <Button variant="link" asChild className="truncate flex-1">
            <a
              href={activeChapterForUIDisplay.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {novel?.name || "Novel"}: {activeChapterForUIDisplay.title}
            </a>
          </Button>
        ) : (
          <div className="w-1/3"></div>
        )}
        <Button
          size="icon"
          variant="destructive"
          onClick={() => {
            localStorage.setItem("readerEnabled", "false");
            window.location.reload();
          }}
        >
          <LogOut />
        </Button>
      </header>
      <main className="flex flex-col flex-grow mt-28" ref={outerListRef}>
        {loadedChaptersData.map((chapter, index) => (
          <div
            key={`chapter-${chapter.id}-${chapter.link}-${chapter.title}`}
            className="chapter-container flex flex-col group mb-20 h-fit"
            data-url={`https://kolbook.xyz/reader?chapterId=${chapter.id}`} // Or use chapter.url
            data-read={chapter.read}
            data-chapter-id={chapter.id}
            id={`chapter-${chapter.id}`} // For direct navigation if needed
            ref={
              index === loadedChaptersData.length - 1 ? lastChapterRef : null
            }
          >
            <div className="flex flex-col gap-4 justify-center items-center my-8 pt-8">
              <a href={chapter.link} target="_blank" rel="noopener noreferrer">
                {chapter.title}
              </a>
              {/* Added pt-8 for spacing from header */}
              <h1
                className="text-3xl md:text-5xl font-bold text-center data-[read='true']:text-primary px-4"
                data-read={chapter.read}
              >
                {chapter.title}
              </h1>
              <span className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {chapter.chapterIndex}
              </span>
            </div>

            <ChapterContent
              fontSize={settings.fontSize}
              fontFamily={settings.fontFamily}
              textGap={settings.textGap}
              textWidth={settings.textWidth}
              textAlign={settings.textAlign}
              chapterData={chapter}
            />

            {index < loadedChaptersData.length - 1 && (
              <hr className="my-12 border-t-2 w-1/2 mx-auto" />
            )}
          </div>
        ))}
      </main>
      <Drawer>
        <footer className="fixed bottom-5 right-5 z-30 flex gap-2 flex-col">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
          <SettingsDialog
            fontSize={settings.fontSize}
            setFontSize={(val) => updateSetting("fontSize", val)}
            fontFamily={settings.fontFamily}
            setFontFamily={(val) => updateSetting("fontFamily", val)}
            textGap={settings.textGap}
            setTextGap={(val) => updateSetting("textGap", val)}
            textWidth={settings.textWidth}
            setTextWidth={(val) => updateSetting("textWidth", val)}
            textAlign={settings.textAlign}
            setTextAlign={(val) => updateSetting("textAlign", val)}
          />
          <Button asChild size="icon" variant="default">
            <SidebarTrigger />
          </Button>

          {/* Comments Drawer - uses activeChapterForUIDisplay */}
          <DrawerTrigger asChild>
            <Button size="icon" aria-label="Comments">
              <MessageSquare className="h-5 w-5" />
              <span className="sr-only">Comments</span>
            </Button>
          </DrawerTrigger>
        </footer>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {activeChapterForUIDisplay?.title ?? "Comments"}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Comments section
            </DrawerDescription>
          </DrawerHeader>
          {activeChapterForUIDisplay && (
            <div className="flex flex-col px-6 pb-6">
              <DiscussionEmbed
                shortname="kolnovel-com" // Replace with your Disqus shortname
                config={{
                  url: activeChapterForUIDisplay.link, // Use permalink for Disqus
                  identifier: activeChapterForUIDisplay.id.toString(),
                  title: activeChapterForUIDisplay.title,
                }}
              />
            </div>
          )}
          {!activeChapterForUIDisplay && (
            <p className="text-center py-4">
              Scroll to a chapter to view comments.
            </p>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
export default function Layout({
  selectVolumeId,
  volumes,
  initalChapterData,
  novel,
}: ReaderLayoutProps) {
  const {
    loadedChaptersData,
    activeChapterForUIDisplay,
    isLoadingInitial,
    error,
    lastChapterRef,
    isLoadingNext,
    outerListRef,
    allChaptersMeta,
    currentChapterIndex,
  } = useReaderController({
    volumes,
    selectVolumeId,
    initalChapterData,
    novel,
  });

  return (
    <SidebarProvider defaultOpen={false} dir="ltr">
      <ReaderSidebar
        volumes={volumes ?? []}
        currentVolume={selectVolumeId ?? 0}
        currentChapter={currentChapterIndex ?? 0}
      />
      <SidebarInset dir="rtl">
        <ChapterReader
          loadedChaptersData={loadedChaptersData}
          activeChapterForUIDisplay={activeChapterForUIDisplay}
          novel={novel}
          isLoadingInitial={isLoadingInitial}
          error={error}
          lastChapterRef={lastChapterRef}
          allChaptersMeta={allChaptersMeta ?? []}
          isLoadingNext={isLoadingNext}
          outerListRef={outerListRef}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
