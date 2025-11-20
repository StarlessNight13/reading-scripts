import van, { State } from "vanjs-core";
import extractChapterData, {
  extractChaptersMetaData,
} from "./util/extract-chapter";
import cleanupHeadScriptsAndStyles from "./util/cleanup";
import { initializeReaderSettings } from "./component/reader-settings";
import { ReaderCreator } from "./component/reader";
import { initChapterNavigation } from "./component/chpaterlist";
import { createChapterController } from "./util/chapter-controller";

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
  const chapterData = van.state(extractChapterData(document));
  const chapterMetaData = van.state(extractChaptersMetaData());

  if (!chapterData.val || !chapterMetaData.val) {
    console.error("Failed to extract chapter data or metadata");
    return;
  }

  document.body.innerHTML = "";
  document.body.className = "text-ui-light";

  const reader = ReaderCreator({ chapterData: chapterData.val });
  const { navigateToNext } = createChapterController(chapterMetaData);

  cleanupHeadScriptsAndStyles();
  initializeReaderSettings();
  initChapterNavigation(chapterMetaData, navigateToNext);

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
