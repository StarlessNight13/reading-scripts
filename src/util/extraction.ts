import {
  ChapterData,
  ChapterIdentifier,
  GenericChapterMetaData,
} from "@/types";

/**
 * Interface for a site-specific chapter extractor.
 * Each site will implement this to provide its own logic for content and metadata.
 */
export interface ChapterExtractor {
  extractChapterData(doc: Document, url?: string): ChapterData | null;
  extractChaptersMetaData(
    doc: Document,
    currentChapterId?: ChapterIdentifier
  ): GenericChapterMetaData | null;
}

/**
 * Cleans up reading content by removing empty or useless paragraphs.
 * This function is generic enough to be reused.
 */
export function cleanContentDOM(container: HTMLElement): HTMLElement {
  container.querySelectorAll("p").forEach((p) => {
    const text = p.textContent?.trim() ?? "";
    const html = p.innerHTML.trim();
    const hasContent = text.length > 0 || (html !== "" && html !== "&nbsp;");

    // Check for empty span inside p (common in some CMS outputs)
    const singleSpan = p.firstElementChild;
    const isEmptySpan =
      p.children.length === 1 &&
      singleSpan?.tagName === "SPAN" &&
      !singleSpan.textContent?.trim();

    if (!hasContent || isEmptySpan) {
      p.remove();
    }
  });
  return container;
}

/**
 * Generic post request utility (could be moved to a shared `fetcher.ts` if it grows)
 */
export async function postRequest(
  url: string,
  data: Record<string, ChapterIdentifier>
): Promise<string> {
  const formData = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) =>
    formData.append(key, String(value))
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    credentials: "include", // Assume include for now, can be part of config later
    body: formData,
  });

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  return response.text();
}
