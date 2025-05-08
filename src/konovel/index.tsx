import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider";
import { urlSearchParams } from "./lib/utils";
import { Toaster } from "sonner";
import { GM_addStyle } from "$";
import { LibraryManager } from "@/konovel/page/library";
import ChapterReader from "@/konovel/page/readerPage";
import ErrorPage from "@/konovel/components/error-page";

export default function (tailwindcss: string) {
  console.clear();
  console.log("kolnovel Initial");

  always();
  const currentPage = findCurrentPage();

  if (currentPage === "user-library") {
    document.body.className = "libraryPage";
    document.head.querySelectorAll("#style-css").forEach((e) => e.remove());
    GM_addStyle(tailwindcss);

    createRoot(
      (() => {
        const app = document.createElement("div");
        app.id = "libraryPage";
        document.body.innerHTML = "";
        document.body.append(app);
        return app;
      })(),
      <LibraryManager />
    );
  } else if (currentPage === "reader") {
    document.body.className = "readerPage";
    document.head.querySelectorAll("#style-css").forEach((e) => e.remove());
    document.head.querySelector("head > style:nth-child(73)")?.remove();
    GM_addStyle(tailwindcss);
    const chapterIdString = urlSearchParams.getSpecific("chapterId");
    if (!chapterIdString) {
      createRoot(
        (() => {
          const app = document.createElement("div");
          app.id = "chapter-reader";
          document.body.innerHTML = "";
          document.body.append(app);
          return app;
        })(),
        <ErrorPage modelTitle="خطأ" modelText="المعرف غير موجود" />
      );
      return;
    }

    const chapterId = Number(chapterIdString);

    if (isNaN(chapterId)) {
      createRoot(
        (() => {
          const app = document.createElement("div");
          app.id = "chapter-reader";
          document.body.innerHTML = "";
          document.body.append(app);
          return app;
        })(),
        <ErrorPage modelTitle="خطأ" modelText="المعرفات غير صحيحة" />
      );
      return;
    }

    createRoot(
      (() => {
        const app = document.createElement("div");
        app.id = "chapter-reader";
        document.body.innerHTML = "";
        document.body.append(app);
        return app;
      })(),
      <ChapterReader initialChapterId={chapterId} />
    );
  } else if (currentPage === "page") {
    document.body.classList.add("novelPage");
  } else if (currentPage === "chapter") {
    document.body.classList.add("chapterPage");
    const article = document.querySelector("article");
    if (!article) return;

    const articleID = article.id;
    const id = articleID.split("-")[1];

    if (!id || id.trim().length === 0 || Number.isNaN(Number(id))) {
      return;
    }
    const chapterId = Number(id);

    createRoot(
      (() => {
        const app = document.querySelector<HTMLDivElement>(".socialts");
        if (!app) {
          const app = document.createElement("div");
          app.classList.add("mainholder");
          document.body.append(app);
          return app;
        }
        return app;
      })(),
      <a
        href={"/reader?chapterId=" + chapterId}
        className="primary-btn btn"
        style={{ padding: "10px", textAlign: "center", fontSize: "1.5rem" }}
      >
        <span>اذهب للقارئ </span>
      </a>
    );
  } else {
    document.body.classList.add("otherPage");
  }

  document.body.setAttribute("page", currentPage);
  console.log("🚀 ~ currentPage:", currentPage);
}
function always() {
  const nav = document.querySelector('[role="navigation"] ul');
  const libraryLink = document.createElement("li");
  libraryLink.innerHTML = `<a href="/user-library">مكتبة شخصية</a>`;
  const classesToAdd = [
    "menu-item",
    "menu-item-type-custom",
    "menu-item-object-custom",
  ];
  libraryLink.classList.add(...classesToAdd);
  nav?.appendChild(libraryLink);
  document.querySelector("#menu-item-185962")?.remove();
  document.querySelector("#menu-item-185963")?.remove();
}

function findCurrentPage() {
  if (document.querySelector("#Top_Up")) {
    return "chapter";
  } else if (document.querySelector("article > div.sertobig")) {
    return "page";
  } else if (location.pathname === "/user-library") {
    return "user-library";
  } else if (location.pathname === "/reader") {
    return "reader";
  } else {
    return "home";
  }
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
