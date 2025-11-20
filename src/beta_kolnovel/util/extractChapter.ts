import getAndRemoveClasses from "./getClasses";
import sanitizeHtml from "sanitize-html";

interface ChapterData {
  content: string;
  id: number;
}

interface ChapterMetaData {
  title: string;
  id: number;
}

interface ChapterNovelInfo {
  id: number;
  seri: number;
}

function removeEmptyParagraphs(container: HTMLElement): HTMLElement {
  const allParagraphs = container.querySelectorAll("p");

  allParagraphs.forEach((p) => {
    if (
      p.children.length === 0 &&
      (p.textContent === null || p.textContent.trim() === "")
    ) {
      p.remove();
      return;
    }

    if (p.children.length === 1 && p.firstElementChild?.tagName === "SPAN") {
      const spanChild = p.firstElementChild as HTMLSpanElement;
      if (
        spanChild.textContent === null ||
        spanChild.textContent.trim() === ""
      ) {
        p.remove();
        return;
      }
    }

    if (p.innerHTML.trim() === "&nbsp;" || p.innerHTML.trim() === "") {
      p.remove();
      return;
    }
  });

  return container;
}
const extractIdFromString = (input: string): number | null => {
  const match = input.match(/post-(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : null;
};

const extractChapterData = (doc: Document): ChapterData | null => {
  const rawContentElement = doc.querySelector<HTMLDivElement>("#kol_content");
  if (!rawContentElement) return null;

  getAndRemoveClasses(doc);
  const cleanContent = removeEmptyParagraphs(rawContentElement);

  const article = doc.querySelector("article");
  if (!article) {
    console.error("Failed to extract article element");
    return null;
  }

  const id = extractIdFromString(article.id);
  if (!id) {
    console.error("Failed to extract chapter ID");
    return null;
  }

  return {
    content: sanitizeHtml(cleanContent.innerHTML),
    id,
  };
};

const extractChaptersMetaData = (doc: Document): ChapterMetaData[] => {
  const chapterSelector =
    doc.querySelector<HTMLSelectElement>("#menu_chap_bot");
  if (!chapterSelector) return [];

  return Array.from(chapterSelector.options).map(({ text, value }) => ({
    title: text,
    id: Number(value),
  }));
};

const createFormData = (data: Record<string, number>): URLSearchParams => {
  const formData = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) =>
    formData.append(key, String(value))
  );
  return formData;
};

const postRequest = async (
  url: string,
  data: Record<string, number>
): Promise<string> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: createFormData(data),
  });

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  return response.text();
};

const TEMPLATE_URL =
  "https://kolnovel.com/wp-content/themes/lightnovel_1.1.5_current/template-parts/single/list_1.php";

const fetchChapterList = async (
  seriId: number,
  chapterId: number
): Promise<ChapterMetaData[]> => {
  try {
    const htmlContent = await postRequest(TEMPLATE_URL, {
      seri: seriId,
      ID: chapterId,
    });
    const doc = new DOMParser().parseFromString(htmlContent, "text/html");
    return extractChaptersMetaData(doc);
  } catch (error) {
    console.error("Error fetching chapter list:", error);
    throw error;
  }
};

const fetchRedirectUrl = async (
  chapterValue: number
): Promise<string | null> => {
  try {
    const redirectUrl = await postRequest(TEMPLATE_URL, { data: chapterValue });
    return redirectUrl || null;
  } catch (error) {
    console.error("Error fetching redirect URL:", error);
    throw error;
  }
};

const getChapterNovelInfo = (doc: Document): ChapterNovelInfo | null => {
  const script = doc.querySelector("article > script:nth-child(8)");
  if (!script?.textContent) return null;

  const extractValue = (regex: RegExp) =>
    Number(script.textContent!.match(regex)?.[1]);

  return {
    seri: extractValue(/'seri'\s*:\s*(\d+)/),
    id: extractValue(/'ID'\s*:\s*(\d+)/),
  };
};

export {
  fetchRedirectUrl,
  fetchChapterList,
  extractChapterData,
  getChapterNovelInfo,
};
