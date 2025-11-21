import van, { State } from "vanjs-core";
import { initChapterNavigation } from "./component/chpaterlist";
import { ReaderCreator } from "./component/reader";
import { initializeReaderSettings } from "./component/reader-settings";
import { createChapterController } from "./util/chapter-controller";
import cleanupHeadScriptsAndStyles from "./util/cleanup";
import extractChapterData, {
  extractChaptersMetaData,
} from "./util/extract-chapter";

const { button } = van.tags;

function buildReaderButton(state: State<boolean>) {
  return button(
    {
      className: "rs-main-btn",
      onclick: () => {
        state.val = !state.val;
        localStorage.setItem("readerEnabled", String(state.val));
        location.reload();
      },
    },
    van.derive(() => (state.val ? "✖" : "Reader"))
  );
}

function initializeReaderMode() {
  const initalChapterContent = van.state(extractChapterData(document));
  const chapterMetaData = van.state(extractChaptersMetaData());

  if (!initalChapterContent.val || !chapterMetaData.val) {
    console.error("Failed to extract chapter data or metadata");
    return;
  }

  document.body.innerHTML = "";
  document.body.className = "text-ui-light";
  window.scroll({
    top: 0,
    left: 0,
    behavior: "smooth",
  });

  const currentVolumeIndex = van.state(0);
  const currentChapterIndex = van.state(0);
  const loadingState = van.state(false);
  const initalChapterId = initalChapterContent.val.id;
  const appenedChapterSet = new Set<number>([initalChapterId]);

  const reader = ReaderCreator({ initalChapterContent, loadingState });
  const { navigateToNext, initState } = createChapterController(
    chapterMetaData,
    currentVolumeIndex,
    currentChapterIndex,
    loadingState,
    appenedChapterSet
  );

  initState();
  cleanupHeadScriptsAndStyles();
  initializeReaderSettings();
  initChapterNavigation(
    chapterMetaData,
    navigateToNext,
    currentChapterIndex,
    currentVolumeIndex
  );

  van.add(document.body, reader);
}

function initializeToggleMode(enabled: State<boolean>) {
  const readerSettings =
    document.querySelector<HTMLDivElement>("#reader-settings");
  if (readerSettings) {
    van.add(readerSettings, buildReaderButton(enabled));
  }
}

export default function App(readerEnabled: boolean) {
  const enabled = van.state(readerEnabled);

  if (enabled.val) {
    initializeReaderMode();
  } else {
    initializeToggleMode(enabled);
  }
}
