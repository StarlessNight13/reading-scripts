import van, { State } from "vanjs-core";
import { initChapterNavigation } from "../component/chapterList";
import { ReaderCreator } from "../component/reader";
import {
  extractChapterData,
  fetchChapterList,
  getChapterNovelInfo,
} from "../util/extractChapter";
import { initializeReaderSettings } from "../component/readerSettings";

const { button , div} = van.tags;

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

  const chapterData = van.state(currentChapter);
  const chapterMetaData = van.state(chapterList);
  const chapterIndex = van.state(
    chapterMetaData.val.findIndex((chapter) => chapter.id === currentChapter.id)
  );

  const reader = ReaderCreator({ chapterData: chapterData.val });

  initChapterNavigation(chapterMetaData, chapterIndex);
  initializeReaderSettings();
  van.add(document.body, reader);
};

const initToggleButton = (state: State<boolean>) => {
  const socialts = document.querySelector<HTMLDivElement>(".socialts");
  if (!socialts) return;

  socialts.innerHTML = "";

  van.add(
    socialts,
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
};

const main = (removeStyles: () => void) => {
  const readerState = van.state(getReaderState());

  if (readerState.val) {
    removeStyles();
    initApp();
  } else {
    initToggleButton(readerState);
  }
};

export default main;
