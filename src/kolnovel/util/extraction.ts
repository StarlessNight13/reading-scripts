// kolnovel
import { ChapterData, ChapterNovelInfo } from "@/kolnovel/types";
import sanitizeHtml from "sanitize-html";

const extractClassNamesFromStyle = (doc: Document): string[] => {
  const styleElement = doc.querySelector("article > style:nth-child(2)");
  if (!styleElement?.textContent) {
    return [];
  }

  const classNames = new Set<string>();
  const regex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(styleElement.textContent)) !== null) {
    classNames.add(match[1]);
  }

  return Array.from(classNames);
};

const removeClassesFromElements = (doc: Document): boolean => {
  const classesToRemove = extractClassNamesFromStyle(doc);
  if (!classesToRemove.length) {
    return false;
  }

  classesToRemove.forEach((className) => {
    doc.querySelectorAll<HTMLElement>(`.${className}`).forEach((element) => {
      element.classList.remove(className);
    });
  });

  return true;
};

const removeEmptyParagraphs = (container: HTMLElement): HTMLElement => {
  container.querySelectorAll("p").forEach((paragraph) => {
    const isEmptyText =
      paragraph.textContent === null || paragraph.textContent.trim() === "";
    const isEmptyHtml =
      paragraph.innerHTML.trim() === "&nbsp;" ||
      paragraph.innerHTML.trim() === "";

    if (
      (paragraph.children.length === 0 && isEmptyText) ||
      isEmptyHtml ||
      (paragraph.children.length === 1 &&
        paragraph.firstElementChild?.tagName === "SPAN" &&
        ((paragraph.firstElementChild as HTMLSpanElement).textContent ===
          null ||
          (
            paragraph.firstElementChild as HTMLSpanElement
          ).textContent?.trim() === ""))
    ) {
      paragraph.remove();
    }
  });
  return container;
};

const parseChapterIdFromArticleId = (articleId: string): number | null => {
  const match = articleId.match(/post-(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : null;
};

const extractChapterData = (
  doc: Document,
  url?: string
): ChapterData | null => {
  const rawContentElement = doc.querySelector<HTMLDivElement>("#kol_content");
  if (!rawContentElement) {
    return null;
  }

  removeClassesFromElements(doc);
  const cleanContentElement = removeEmptyParagraphs(rawContentElement);

  const articleElement = doc.querySelector("article");
  if (!articleElement) {
    console.error("Failed to extract article element");
    return null;
  }

  const chapterId = parseChapterIdFromArticleId(articleElement.id);
  if (chapterId === null) {
    console.error("Failed to extract chapter ID");
    return null;
  }

  return {
    content: sanitizeHtml(cleanContentElement.innerHTML),
    id: chapterId,
    url: url ?? location.href,
  };
};

const getChapterNovelInfo = (doc: Document): ChapterNovelInfo | null => {
  const scriptElement = doc.querySelector("article > script:nth-child(8)");
  if (!scriptElement?.textContent) {
    return null;
  }

  const getNumberFromScript = (regex: RegExp): number =>
    Number(scriptElement.textContent!.match(regex)?.[1]);

  return {
    seri: getNumberFromScript(/'seri'\s*:\s*(\d+)/),
    id: getNumberFromScript(/'ID'\s*:\s*(\d+)/),
  };
};

export { extractChapterData, getChapterNovelInfo };
