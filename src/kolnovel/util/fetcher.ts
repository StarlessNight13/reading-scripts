// kolnovel

import { ChapterInfo } from "../types";

const TEMPLATE_URL =
  "https://kolnovel.com/wp-content/themes/lightnovel_1.1.5_current/template-parts/single/list_1.php";

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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    credentials: "include",
    body: createFormData(data),
  });

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  return response.text();
};

const extractChaptersMetaData = (
  doc: Document,
  chapterId: number
): ChapterInfo[] => {
  const chapterSelector =
    doc.querySelector<HTMLSelectElement>("#menu_chap_bot");
  if (!chapterSelector) return [];

  return Array.from(chapterSelector.options)
    .reverse()
    .map(({ text, value }) => ({
      title: text,
      id: Number(value),
      isDefaultSelected: value === String(chapterId),
    }));
};

const fetchChapterList = async (
  seriId: number,
  chapterId: number
): Promise<ChapterInfo[]> => {
  try {
    const htmlContent = await postRequest(TEMPLATE_URL, {
      seri: seriId,
      ID: chapterId,
    });
    const doc = new DOMParser().parseFromString(htmlContent, "text/html");
    return extractChaptersMetaData(doc, chapterId);
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

export { fetchChapterList, fetchRedirectUrl };
