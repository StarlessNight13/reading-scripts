import van, { State } from "vanjs-core";
import {
  ChapterInfo,
  ChaptersMetaData,
  VolumeInfo,
} from "../util/extract-chapter";

const { div, button, ul, li, a } = van.tags;

function createScrollListener(onFetch: () => void) {
  let fetchTriggered = false;

  return () => {
    const { scrollHeight, scrollTop } = document.documentElement;
    const { innerHeight } = window;

    if (!fetchTriggered && scrollHeight - scrollTop - innerHeight < 200) {
      fetchTriggered = true;
      onFetch();
      setTimeout(() => (fetchTriggered = false), 2000);
    }
  };
}

function ChapterItem(chapter: ChapterInfo, isActive: State<boolean>) {
  return li(
    { class: () => `van-chapter-item ${isActive.val ? "active" : ""}` },
    a(
      {
        href: chapter.link,
        class: isActive.val ? "active" : "",
      },
      chapter.title
    )
  );
}

function VolumeSection(
  volume: VolumeInfo,
  isSelected: boolean,
  selectedChapterIndex: State<number>
) {
  return div(
    div({ class: "van-volume-header" }, volume.title),
    ul(
      { class: "van-chapter-list" },
      volume.chapters.map((chapter, idx) => {
        const isActive = van.derive(
          () => isSelected && idx === selectedChapterIndex.val
        );
        return ChapterItem(chapter, isActive);
      })
    )
  );
}

export function initChapterNavigation(
  metaDataState: State<ChaptersMetaData | null>,
  onFetchNextChapter: () => void,
  chapterIndex: State<number>,
  volumeIndex: State<number>
) {
  const isOpen = van.state(false);
  const togglePanel = () => {
    isOpen.val = !isOpen.val;
    const activeItem = document.querySelector(".van-chapter-item.active");
    if (isOpen.val && activeItem) {
      setTimeout(() => {
        activeItem.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  };

  window.addEventListener("scroll", createScrollListener(onFetchNextChapter));

  const volumeList = van.derive(() => {
    const data = metaDataState.val;
    if (!data?.Volumes) return null;

    return data.Volumes.map((volume, idx) => {
      const isSelected = volumeIndex.val !== -1 && idx === volumeIndex.val;
      return VolumeSection(volume, !!isSelected, chapterIndex);
    });
  });

  const panel = div(
    {
      id: "van-chapter-panel",
      class: van.derive(() => (isOpen.val ? "open" : "")),
    },
    button(
      {
        class: "van-panel-toggle",
        onclick: togglePanel,
      },
      van.derive(() => (isOpen.val ? "❮" : "❯"))
    ),
    div({ class: "van-volume-list" }, volumeList.val)
  );

  van.add(document.body, panel);
}
