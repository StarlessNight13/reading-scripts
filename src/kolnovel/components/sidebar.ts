// kolnovel
import van, { State } from "vanjs-core";
import { ChevronLeft, ChevronRight } from "vanjs-lucide";
import { ChapterInfo } from "../types";

const { div, button, ul, li, a } = van.tags;

function ChapterLink(chapter: ChapterInfo, isActive: State<boolean>) {
  return li(
    { class: () => `van-chapter-item ${isActive.val ? "current" : ""}` },
    a(
      {
        href: `https://kolnovel.com/?p=${chapter.id}`,
        class: () => (isActive.val ? "current" : ""),
      },
      chapter.title
    )
  );
}

export function initSidebar(
  metaData: State<ChapterInfo[] | null>,
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
    return div(
      div({ class: "van-volume-header" }, "Chapters"),
      ul(
        { class: "van-chapter-list" },
        data.map((chap, cIdx) => {
          const active = van.derive(() => currentChap.val === cIdx);
          return ChapterLink(chap, active);
        })
      )
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
