import van, { State } from "vanjs-core";
import { createChapterController } from "../util/chapterController";

const { div, button, ul, li, a } = van.tags;

interface ChapterInfo {
  id: number;
  title: string;
}

const createScrollListener = (onFetch: () => void) => {
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
};

const ChapterItem = (
  chapter: ChapterInfo,
  isActive: boolean,
  activeItemRef: State<HTMLElement | null>
) => {
  const linkProps: any = {
    href: `https://kolnovel.com/?p=${chapter.id}`,
    class: isActive ? "active" : "",
  };

  if (isActive) {
    linkProps.ref = (dom: HTMLElement) => (activeItemRef.val = dom);
  }

  return li({ class: "van-chapter-item" }, a(linkProps, chapter.title));
};

const scrollToActive = (element: HTMLElement | null) => {
  if (!element) return;

  setTimeout(() => {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 300);
};

export const initChapterNavigation = (
  metaDataState: State<ChapterInfo[] | null>,
  chapterIndex: State<number>
) => {
  const isOpen = van.state(false);
  const activeItemRef = van.state<HTMLElement | null>(null);

  const { navigateToNext } = createChapterController(
    metaDataState,
    chapterIndex
  );

  const togglePanel = () => {
    isOpen.val = !isOpen.val;
    if (isOpen.val) scrollToActive(activeItemRef.val);
  };

  window.addEventListener("scroll", createScrollListener(navigateToNext));

  const chapterList = van.derive(() => {
    const data = metaDataState.val;
    if (!data) return null;

    return div(
      div({ class: "van-volume-header" }, "Chapters"),
      ul(
        { class: "van-chapter-list" },
        data.map((chapter, index) =>
          ChapterItem(chapter, chapterIndex.val === index, activeItemRef)
        )
      )
    );
  });

  const panel = div(
    {
      id: "van-chapter-panel",
      class: van.derive(() => (isOpen.val ? "open" : "")),
    },
    button(
      { class: "van-panel-toggle", onclick: togglePanel },
      van.derive(() => (isOpen.val ? "❮" : "❯"))
    ),
    div({ class: "van-volume-list" }, chapterList.val)
  );

  van.add(document.body, panel);
};
