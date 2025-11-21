import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider";
import { urlSearchParams } from "./lib/utils";
import { Toaster } from "sonner";
import { GM_addStyle } from "$";
import { LibraryManager } from "@/kolnovel.old/page/library";
import ChapterReader from "@/kolnovel.old/page/readerPage";
import ErrorPage from "@/kolnovel.old/components/error-page";
import NovelPage from "./page/novel";

type PageType =
  | "user-library"
  | "reader"
  | "page"
  | "chapter"
  | "home";

interface PageConfig {
  className?: string;
  removeStyles?: boolean;
  handler: () => void;
}

export default function (tailwindcss: string) {
  console.clear();
  console.log("kolnovel Initial");
  document.body.setAttribute("host", "kolnovel");

  addLibraryNavLink();
  const currentPage = findCurrentPage();
  document.body.setAttribute("page", currentPage);
  console.log("🚀 ~ currentPage:", currentPage);

  const pageConfigs: Record<PageType, PageConfig> = {
    "user-library": {
      className: "libraryPage",
      removeStyles: true,
      handler: handleLibraryPage,
    },
    reader: {
      className: "readerPage",
      removeStyles: true,
      handler: handleReaderPage,
    },
    page: {
      className: "novelPage",
      handler: handleNovelPage,
    },
    chapter: {
      className: "chapterPage",
      handler: handleChapterPage,
    },
    home: {
      className: "otherPage",
      handler: () => { },
    },
  };

  const config = pageConfigs[currentPage];
  if (config.className) {
    document.body.classList.add(config.className);
  }
  if (config.removeStyles) {
    removeBaseStyles();
    GM_addStyle(tailwindcss);
  }
  config.handler();
}

function addLibraryNavLink() {
  const nav = document.querySelector('[role="navigation"] ul');
  const libraryLink = document.createElement("li");
  libraryLink.innerHTML = `<a href="/user-library">مكتبة شخصية</a>`;
  libraryLink.classList.add(
    "menu-item",
    "menu-item-type-custom",
    "menu-item-object-custom"
  );
  nav?.appendChild(libraryLink);
  document.querySelector("#menu-item-185962")?.remove();
  document.querySelector("#menu-item-185963")?.remove();
}

function findCurrentPage(): PageType {
  if (document.querySelector("#Top_Up")) return "chapter";
  if (location.pathname.includes("/series")) return "page";
  if (location.pathname === "/user-library") return "user-library";
  if (location.pathname === "/reader") return "reader";
  return "home";
}

function createAppContainer(id: string): HTMLElement {
  const app = document.createElement("div");
  app.id = id;
  document.body.innerHTML = "";
  document.body.append(app);
  return app;
}

function createRoot(container: HTMLElement, page: React.ReactNode) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {page}
        <Toaster position="top-left" duration={500} />
      </ThemeProvider>
    </React.StrictMode>
  );
}

function handleLibraryPage() {
  createRoot(createAppContainer("libraryPage"), <LibraryManager />);
}

function handleReaderPage() {
  const chapterIdString = urlSearchParams.getSpecific("chapterId");

  if (!chapterIdString) {
    createRoot(
      createAppContainer("chapter-reader"),
      <ErrorPage modelTitle="خطأ" modelText="المعرف غير موجود" />
    );
    return;
  }

  const chapterId = Number(chapterIdString);

  if (isNaN(chapterId)) {
    createRoot(
      createAppContainer("chapter-reader"),
      <ErrorPage modelTitle="خطأ" modelText="المعرفات غير صحيحة" />
    );
    return;
  }

  createRoot(
    createAppContainer("chapter-reader"),
    <ChapterReader initialChapterId={chapterId} />
  );
}

function handleNovelPage() {
  const sertoinfo =
    document.querySelector<HTMLDivElement>(".sertoinfo") ||
    createAppContainer("chapter-reader");
  const container = document.createElement("div");
  sertoinfo.appendChild(container);
  createRoot(container, <NovelPage />);
}

function handleChapterPage() {
  const article = document.querySelector("article");
  if (!article) return;

  const id = article.id.split("-")[1];
  if (!id || id.trim().length === 0 || isNaN(Number(id))) return;

  const chapterId = Number(id);
  const container =
    document.querySelector<HTMLDivElement>(".socialts") ||
    (() => {
      const app = document.createElement("div");
      app.classList.add("mainholder");
      document.body.append(app);
      return app;
    })();

  createRoot(
    container,
    <a
      href={`/reader?chapterId=${chapterId}`}
      className="primary-btn btn"
      style={{
        padding: "10px",
        textAlign: "center",
        fontSize: "1.5rem",
      }}
    >
      <span>اذهب للقارئ </span>
    </a>
  );
}

function removeBaseStyles() {
  const selectors = [
    "#style-css",
    "#wp-custom-css",
    "head > style:not([type='text/css'])",
  ];

  let stylesCount = 0;
  selectors.forEach((selector) => {
    document.head.querySelectorAll(selector).forEach((e) => {
      e.remove();
      stylesCount++;
    });
  });

  document.head.querySelectorAll("head > style").forEach((e) => {
    const content = e.textContent;
    if (content && !content.includes("KEEP_STYLE")) {
      e.remove();
      stylesCount++;
    }
  });

  cleanupHeadScriptsAndStyles();
  console.log("Removed", stylesCount, "styles");
}

function cleanupHeadScriptsAndStyles(): void {
  const selectorsToRemove = [
    "#bootstrap-css",
    "#bootstrap-js",
    "#jquery-js",
    "#jquery-css",
    "#fontawesome-css",
    "#fontawesome-js",
    "#toastr-js",
    "#toastr-css",
    "#madara-css-css",
    "#child-style-css",
    "#slick-theme-css",
    "#slick-css",
    "#ionicons-css",
    "#madara-icons-css",
    "#loaders-css",
    "#wp-pagenavi-css",
    "#jquery-core-js",
    "#jquery-migrate-js",
    "#wp-custom-css",
  ];

  selectorsToRemove.forEach((selector) => {
    document.head.querySelector(selector)?.remove();
  });
  console.log("Removed legacy scripts and styles.");
}