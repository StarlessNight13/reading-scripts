type ChapterContentProps = {
  fontSize: number;
  fontFamily: string;
  textGap: number;
  textWidth: number;
  textAlign: "left" | "center" | "right";
  chapterData: ChapterData;
  getNextChapter?: () => void;
  hasNextChapter?: boolean;
};

type ChapterData = {
  id: number;
  title: string;
  url: string;
  content: string;
  index: string;
};

function removeBrsInsideParagraphs(element: HTMLElement): void {
  const paragraphElements = element.querySelectorAll("p");

  paragraphElements.forEach((paragraph) => {
    const brElements = paragraph.querySelectorAll("br");
    brElements.forEach((br) => {
      br.remove();
    });
  });
}

export default function ChpaterContent({
  fontSize,
  fontFamily,
  textGap,
  chapterData,
  textWidth,
  textAlign,
}: ChapterContentProps) {
  const element = document.createElement("div");
  element.innerHTML = chapterData.content;
  removeBrsInsideParagraphs(element);
  return (
    <article
      className={`flex flex-col flex-1 prose dark:prose-invert max-w-none ${fontFamily}`}
      style={{
        fontSize: `${fontSize}px`,
        gap: `${textGap}px`,
        paddingInline: `${textWidth}%`,
        textAlign: textAlign,
      }}
      dangerouslySetInnerHTML={{ __html: element.innerHTML }}
    />
  );
}
