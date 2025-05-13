import { GM_addStyle } from "$";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { BookOpen } from "lucide-react";
import React from "react";
import ReactDOM from "react-dom/client";
import ChapterReader from "./readerPage";
import { extractChaptersMetaData } from "./util/chpaters-extractor";
import extractChapterData from "./util/extract-chapter";
import cleanupHeadScriptsAndStyles from "./util/base-cleanup";

export default function (tailwindcss: string) {
  document.body.setAttribute("host", "cenel");

  const readerEnabled = localStorage.getItem("readerEnabled") === "true";
  const chapterList = extractChaptersMetaData();
  if (!chapterList) {
    console.log("Failed to extract chapter list");
    return;
  }
  if (!readerEnabled) {
    buildReaderButton();
    return;
  }

  const initalChapterData = extractChapterData(document);
  cleanupHeadScriptsAndStyles();
  GM_addStyle(tailwindcss);

  ReactDOM.createRoot(
    (() => {
      const app = document.createElement("div");
      app.id = "chapter-reader";
      document.body.innerHTML = "";
      document.body.append(app);
      return app;
    })()
  ).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ChapterReader
          initalChapterData={initalChapterData}
          volumes={chapterList.Volumes}
          selectVolumeId={Number(chapterList.selectedVolumeId)}
          novel={initalChapterData.novel}
        />
        <Toaster position="top-left" duration={500} />
      </ThemeProvider>
    </React.StrictMode>
  );
}

function buildReaderButton() {
  const readerSettings =
    document.querySelector<HTMLDivElement>("#reader-settings");
  if (!readerSettings) return;
  const readerToggleButton = document.createElement("div");
  readerSettings.appendChild(readerToggleButton);
  readerSettings.style.gap = "10px";
  ReactDOM.createRoot(readerToggleButton).render(
    <button className="open-reader-settings" onClick={() => ToggleReader()}>
      <BookOpen />
    </button>
  );
}

function ToggleReader() {
  const readerEnabled = localStorage.getItem("readerEnabled");
  if (readerEnabled === "true") {
    localStorage.setItem("readerEnabled", "false");
  } else {
    localStorage.setItem("readerEnabled", "true");
  }
  location.reload();
}
