// kolnovel

import van, { State } from "vanjs-core";
import { initSettings } from "./components/settings";
import { initSidebar } from "./components/sidebar";
import { createChapterController } from "./controller";
import { ReaderView } from "./reader";
import { extractChapterData, getChapterNovelInfo } from "./util/extraction";
import { fetchChapterList } from "./util/fetcher";
import { initVIewTracker } from "./viewTracker";

const { button, div } = van.tags;

const STORAGE_KEY = "CustomReader";
const getReaderState = () =>
  window.localStorage.getItem(STORAGE_KEY) === "true";

const setReaderState = (enabled: boolean) =>
  window.localStorage.setItem(STORAGE_KEY, String(enabled));

const initApp = async () => {
  const novelData = getChapterNovelInfo(document);
  if (!novelData) {
    console.error("Failed to extract novel data");
    return;
  }

  const [chapterList, currentChapter] = await Promise.all([
    fetchChapterList(novelData.seri, novelData.id),
    Promise.resolve(extractChapterData(document)),
  ]);

  if (!currentChapter || !chapterList) {
    console.error("Failed to extract chapter data or metadata");
    return;
  }

  document.body.innerHTML = "";
  document.body.className = "darkmode";
  window.scrollTo(0, 0);

  const chapterData = van.state(currentChapter);
  const chapterMetaData = van.state(chapterList);
  const chapterIndex = van.state(
    chapterMetaData.val.findIndex((chapter) => chapter.isDefaultSelected)
  );
  const loading = van.state(false);
  const seenIds = new Set([currentChapter.id]);

  const controller = createChapterController(
    chapterMetaData,
    chapterIndex,
    loading,
    seenIds
  );
  van.add(document.body, ReaderView(chapterData, loading));

  initSettings();
  initVIewTracker();
  initSidebar(chapterMetaData, chapterIndex, controller.loadNext);
};

function injectToggle(state: State<boolean>) {
  const target = document.querySelector(".socialts");
  if (!target) return;
  target.innerHTML = "";

  van.add(
    target,
    div(
      {
        style: "display: flex; justify-content: center; align-items: center;",
      },
      button(
        {
          className: "vbtn md default",
          onclick: () => {
            state.val = !state.val;
            setReaderState(state.val);
            location.reload();
          },
        },
        van.derive(() => (state.val ? "Disable Reader" : "Enable Reader"))
      )
    )
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
}

export default function main() {
  console.clear();
  document.body.setAttribute("host", "kolnovel");
  const readerState = van.state(getReaderState());
  if (document.querySelector("#Top_Up")) {
    if (readerState.val) {
      removeBaseStyles();
      initApp();
    } else {
      injectToggle(readerState);
    }
  }
}
