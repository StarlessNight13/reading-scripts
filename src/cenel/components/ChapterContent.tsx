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
interface ChapterInfo {
  title: string;
  link: string;
  chapterIndex: number;
}
interface ChapterData extends ChapterInfo {
  id: number;
  content: string;
  read: boolean;
}

function removeBrsInsideParagraphs(element: HTMLElement): void {
  const paragraphElements = element.querySelectorAll("p");

  paragraphElements.forEach((paragraph) => {
    const brElements = paragraph.querySelectorAll("br");
    brElements.forEach((br) => {
      br.remove();
    });
  });
}

function processHTMLString(htmlString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const body = doc.body;

  const allElements = Array.from(body.querySelectorAll("*"));
  allElements.forEach((element) => {
    if (element.hasAttribute("style")) {
      element.removeAttribute("style");
    }
  });
  const divsToProcess = Array.from(body.querySelectorAll("div"));

  divsToProcess.forEach((divElement) => {
    const paragraphsToMove = Array.from(divElement.children).filter(
      (child) => child.tagName.toLowerCase() === "p"
    );

    // Insert the paragraphs before the div
    paragraphsToMove.forEach((p) => {
      divElement.parentNode?.insertBefore(p, divElement);
    });

    // Remove the original div
    divElement.remove();
  });
  const pTags = body.querySelectorAll("p");
  pTags.forEach((pTag) => {
    if (!pTag.textContent || !pTag.textContent.trim()) {
      pTag.remove();
    }
  });
  return body.innerHTML;
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
  element.innerHTML = processHTMLString(chapterData.content);
  removeBrsInsideParagraphs(element);

  return (
    <article
      className={`flex flex-col flex-1 prose dark:prose-invert max-w-none prose-p:mt-0 prose-p:mb-0 ${fontFamily}`}
      style={{
        gap: `${textGap}px`,
        paddingInline: `${textWidth > 30 ? 30 : textWidth}%`,
        textAlign: textAlign,
        fontSize: `${fontSize}px`,
      }}
      dangerouslySetInnerHTML={{ __html: element.innerHTML }}
    />
  );
}
