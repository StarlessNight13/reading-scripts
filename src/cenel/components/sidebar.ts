import van, { State } from "vanjs-core";
import { ChevronLeft, ChevronRight } from "vanjs-lucide";
import { ChaptersMetaData, ChapterInfo, VolumeInfo } from "../types";

const { div, button, ul, li, a } = van.tags;

function ChapterLink(chapter: ChapterInfo, isActive: State<boolean>) {
  return li(
    { class: () => `van-chapter-item ${isActive.val ? "current" : ""}` },
    a(
      { href: chapter.link, class: () => (isActive.val ? "current" : "") },
      chapter.title
    )
  );
}

function VolumeGroup(
  vol: VolumeInfo,
  currentVolIdx: State<number>,
  currentChapIdx: State<number>,
  myVolIndex: number
) {
  return div(
    div({ class: "van-volume-header" }, vol.title),
    ul(
      { class: "van-chapter-list" },
      vol.chapters.map((chap, cIdx) => {
        const active = van.derive(
          () => currentVolIdx.val === myVolIndex && currentChapIdx.val === cIdx
        );
        return ChapterLink(chap, active);
      })
    )
  );
}

export function initSidebar(
  metaData: State<ChaptersMetaData | null>,
  currentVol: State<number>,
  currentChap: State<number>,
  onScrollRequest: () => void
) {
  // Scroll Listener for Infinite Loading
  let isThrottled = false;
  window.addEventListener("scroll", () => {
    if (isThrottled) return;
    const { scrollHeight, scrollTop, clientHeight } = document.documentElement;

    // Trigger if within 800px of bottom
    if (scrollHeight - scrollTop - clientHeight < 800) {
      isThrottled = true;
      onScrollRequest();
      setTimeout(() => (isThrottled = false), 1000);
    }
  });

  // Panel UI
  const isOpen = van.state(false);

  const renderList = () => {
    const data = metaData.val;
    if (!data) return null;
    return data.Volumes.map((v, idx) =>
      VolumeGroup(v, currentVol, currentChap, idx)
    );
  };

  const panel = div(
    {
      id: "van-chapter-panel",
      class: () => (isOpen.val ? "open" : ""),
    },
    button(
      {
        class: "van-panel-toggle",
        onclick: () => {
          isOpen.val = !isOpen.val;
          // Auto scroll to active item
          if (isOpen.val) {
            setTimeout(
              () =>
                document
                  .querySelector(".van-chapter-item.current")
                  ?.scrollIntoView({ block: "center" }),
              100
            );
          }
        },
      },
      () => (isOpen.val ? ChevronRight() : ChevronLeft())
    ),
    div({ class: "van-volume-list" }, renderList())
  );

  van.add(document.body, panel);
}
