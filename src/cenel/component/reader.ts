import van, { State } from "vanjs-core";

const { div, footer, main, article, span } = van.tags;

interface ChapterData {
  content: string;
  id: number;
}

interface ReaderProps {
  initalChapterContent: State<ChapterData>;
  loadingState: State<boolean>;
}

function ReaderCreator({ initalChapterContent, loadingState }: ReaderProps) {
  return main(
    article(
      {
        id: "chpater-container",
        className: "chpater-container",
      },
      div({
        id: "reading-content",
        innerHTML: initalChapterContent.val.content,
        className: "reading-content",
      }),
      div({ class: "sperator" })
    ),
    footer(
      {
        className: "footer-container",
      },
      div(
        {
          class: "loading-indicator",
        },
        span({ className: () => (loadingState.val ? "loader" : "") })
      )
    )
  );
}

function updateChapterContent(chapterData: ChapterData) {
  const readingContent = document.getElementById("chpater-container");
  if (!readingContent) {
    throw new Error("chapter-container element not found");
  }
  van.add(
    readingContent,
    div({
      id: "reading-content",
      innerHTML: chapterData.content,
      className: "reading-content",
    }),
    div({ class: "sperator" })
  );
}

export { ReaderCreator, updateChapterContent };
