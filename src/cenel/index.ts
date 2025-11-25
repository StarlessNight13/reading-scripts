// cenel

import van from "vanjs-core";
import { initSettings } from "./components/settings";
import { ReaderView } from "./reader";
import { initSidebar } from "./components/sidebar";
import { createChapterController } from "./controller";
import {
  extractChapterData,
  extractChaptersMetaData,
} from "./utils/extraction";
import { initVIewTracker } from "./viewTracker";

const { button } = van.tags;

// --- Helper: Toggle Button Injection ---
function injectToggle(enabled: boolean) {
  const target = document.querySelector("#reader-settings");
  if (!target) return;

  van.add(
    target,
    button(
      {
        className: "rs-main-btn",
        onclick: () => {
          localStorage.setItem("readerEnabled", String(!enabled));
          location.reload();
        },
      },
      enabled ? "✖ Close" : "Reader Mode"
    )
  );
}

// --- Main Logic ---
function launchReader() {
  const initData = extractChapterData(document);
  const metaDataRaw = extractChaptersMetaData();

  if (!initData.content || !metaDataRaw) {
    console.error("[Reader] Failed to initialize. Missing data.");
    return;
  }

  // 1. Prep Environment
  document.body.innerHTML = "";
  document.body.className = "text-ui-light"; // Reset classes
  window.scrollTo(0, 0);

  // 2. State
  const chapterData = van.state(initData);
  const metaData = van.state(metaDataRaw);
  const loading = van.state(false);
  const volIdx = van.state(0);
  const chapIdx = van.state(0);
  const seenIds = new Set([initData.id]);

  // 3. Logic & UI
  const controller = createChapterController(
    metaData,
    volIdx,
    chapIdx,
    loading,
    seenIds
  );

  controller.initIndices();

  // 4. Render
  van.add(document.body, ReaderView(chapterData, loading));

  initSettings();
  initVIewTracker();
  initSidebar(metaData, volIdx, chapIdx, controller.loadNext);
}

export default function Main() {
  // Identify context
  document.body.setAttribute("host", "cenel");
  console.clear();

  // Check Flag
  const isEnabled = localStorage.getItem("readerEnabled") === "true";

  if (isEnabled) {
    launchReader();
    // Inject exit button via settings panel (handled in settings.ts) or overlay
  } else {
    injectToggle(false);
  }
}
