import van from "vanjs-core";

const { div } = van.tags;

interface ChapterData {
  content: string;
  id: number;
}

interface ReaderProps {
  chapterData: ChapterData;
}

function ReaderCreator({ chapterData }: ReaderProps) {
  return div(
    {
      id: "chpater-container",
      className: "chpater-container",
    },
    div({
      id: "reading-content",
      innerHTML: chapterData.content,
      className: "reading-content",
      key: chapterData.id,
      ref: chapterData.id,
    })
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
      key: chapterData.id,
      ref: chapterData.id,
    })
  );
}

export { ReaderCreator, updateChapterContent };
