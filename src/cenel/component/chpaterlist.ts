import van, { State } from "vanjs-core";

const { div, button, ul, li, a } = van.tags;

interface ChapterMetaData {
  Volumes: VolumeInfo[];
  selectedVolumeId: string | undefined;
}

interface VolumeInfo {
  id: number;
  title: string;
  chapters: ChapterInfo[];
  selectedChapterIndex: number;
}

interface ChapterInfo {
  title: string;
  link: string;
  chapterIndex: number;
}

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

function ChapterItem(
  chapter: ChapterInfo,
  isActive: boolean,
  activeItemRef: State<HTMLElement | null>
) {
  const linkProps: any = {
    href: chapter.link,
    class: isActive ? "active" : "",
  };

  if (isActive) {
    linkProps.ref = (dom: HTMLElement) => (activeItemRef.val = dom);
  }

  return li({ class: "van-chapter-item" }, a(linkProps, chapter.title));
}

function VolumeSection(
  volume: VolumeInfo,
  isSelected: boolean,
  selectedChapterIndex: number,
  activeItemRef: State<HTMLElement | null>
) {
  const reversedChapterIndex =
    volume.chapters.length - 1 - selectedChapterIndex;
  return div(
    div({ class: "van-volume-header" }, volume.title),
    ul(
      { class: "van-chapter-list" },
      volume.chapters.reverse().map((chapter, idx) => {
        const isActive = isSelected && idx === reversedChapterIndex;
        return ChapterItem(chapter, isActive, activeItemRef);
      })
    )
  );
}

export function initChapterNavigation(
  metaDataState: State<ChapterMetaData | null>,
  onFetchNextChapter: () => void,
  chapterIndex: State<number>,
  volumeIndex: State<number>
) {
  const isOpen = van.state(false);
  const activeItemRef = van.state<HTMLElement | null>(null);

  const togglePanel = () => {
    isOpen.val = !isOpen.val;
    if (isOpen.val && activeItemRef.val) {
      setTimeout(() => {
        activeItemRef.val?.scrollIntoView({
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
      return VolumeSection(
        volume,
        !!isSelected,
        chapterIndex.val,
        activeItemRef
      );
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
