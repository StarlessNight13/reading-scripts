import van, { State } from "vanjs-core";
import { ChevronLeft, ChevronRight } from "vanjs-lucide";
import {
  GenericChapterInfo,
  GenericChapterMetaData,
  GenericVolumeInfo,
} from "@/types";

const { div, button, ul, li, a } = van.tags;

interface SidebarConfig {
  getChapterLink: (chapter: GenericChapterInfo) => string;
}

function ChapterLink(
  chapter: GenericChapterInfo,
  isActive: State<boolean>,
  config: SidebarConfig
) {
  return li(
    { class: () => `van-chapter-item ${isActive.val ? "current" : ""}` },
    a(
      {
        href: config.getChapterLink(chapter),
        class: () => (isActive.val ? "current" : ""),
      },
      chapter.title
    )
  );
}

function VolumeGroup(
  vol: GenericVolumeInfo,
  currentGlobalChapterIdx: State<number>,
  startChapterOffset: number,
  config: SidebarConfig
) {
  return div(
    div({ class: "van-volume-header" }, vol.title),
    ul(
      { class: "van-chapter-list" },
      vol.chapters.map((chap, cIdx) => {
        const globalIndex = startChapterOffset + cIdx;
        const active = van.derive(
          () => currentGlobalChapterIdx.val === globalIndex
        );
        return ChapterLink(chap, active, config);
      })
    )
  );
}

export function initSidebar(
  sidebarData: State<GenericChapterMetaData | null>,
  currentGlobalChapterIdx: State<number>,
  config: SidebarConfig
) {
  // Panel UI
  const isOpen = van.state(false);

  const renderList = () => {
    const data = sidebarData.val;
    if (!data) return null;

    let chapterOffset = 0;

    return data.volumes.map((v) => {
      const groupElement = data.isGrouped
        ? VolumeGroup(v, currentGlobalChapterIdx, chapterOffset, config)
        : ul(
            { class: "van-chapter-list" },
            v.chapters.map((chap, cIdx) => {
              const globalIndex = chapterOffset + cIdx;
              const active = van.derive(
                () => currentGlobalChapterIdx.val === globalIndex
              );
              return ChapterLink(chap, active, config);
            })
          );
      chapterOffset += v.chapters.length;
      return groupElement;
    });
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
