import extractChapterData from "./extract-chapter";

async function GetNextChapter(link: string) {
  const response = await fetch(link);
  const data = await response.text();
  const doc = new DOMParser().parseFromString(data, "text/html");
  return extractChapterData(doc);
}

export default GetNextChapter;
